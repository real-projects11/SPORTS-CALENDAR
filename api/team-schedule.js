// /api/team-schedule.js
//
// Generic version of the old /api/fever-schedule.js — works for any
// team in any ESPN-covered league, not just Indiana Fever.
//
// Usage: /api/team-schedule?sport=football&league=nfl&team=BUF
//   sport, league -> match ESPN's own URL slugs (see teams.js)
//   team          -> the team's official abbreviation (e.g. BUF, KC, IND)
//
// How it works:
//   1) Fetch that league's full team list from ESPN, find the team
//      whose abbreviation matches, and read its numeric ESPN id.
//      (We resolve by abbreviation instead of hardcoding ids so we
//      don't have to look up/guess a numeric id per team by hand.)
//   2) Fetch that team's schedule using the resolved id.
//   3) Reshape events into the {games, standings} format the
//      frontend (team.html) expects — same shape as before, just
//      generic instead of Fever-only.
//
// Reliability note: this is ESPN's public but undocumented/unofficial
// API. No SLA, can change without notice. If it breaks, team.html
// falls back to showing an empty/"couldn't load" state rather than
// crashing — see team.html's refreshLiveData().

export default async function handler(req, res) {
  const { sport, league, team } = req.query;

  if (!sport || !league || !team) {
    res.status(400).json({
      error: "missing_params",
      detail: "Query params required: sport, league, team (abbreviation)",
    });
    return;
  }

  try {
    // 1) Resolve abbreviation -> ESPN numeric team id
    const teamsUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams`;
    const teamsRes = await fetch(teamsUrl);
    if (!teamsRes.ok) {
      throw new Error(`teams lookup failed (${teamsRes.status})`);
    }
    const teamsData = await teamsRes.json();
    const allTeams =
      (teamsData.sports &&
        teamsData.sports[0] &&
        teamsData.sports[0].leagues &&
        teamsData.sports[0].leagues[0] &&
        teamsData.sports[0].leagues[0].teams) ||
      [];

    const match = allTeams.find(
      (t) => t.team && t.team.abbreviation && t.team.abbreviation.toUpperCase() === String(team).toUpperCase()
    );
    if (!match) {
      throw new Error(`team abbreviation "${team}" not found in ${sport}/${league}`);
    }
    const teamId = match.team.id;

    // 2) Fetch that team's schedule
    const scheduleUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/schedule`;
    const scheduleRes = await fetch(scheduleUrl);
    if (!scheduleRes.ok) {
      throw new Error(`schedule fetch failed (${scheduleRes.status})`);
    }
    const data = await scheduleRes.json();

    const games = (data.events || [])
      .map((ev) => {
        const comp = ev.competitions && ev.competitions[0];
        if (!comp) return null;

        const home = comp.competitors.find((c) => c.homeAway === "home");
        const away = comp.competitors.find((c) => c.homeAway === "away");
        if (!home || !away) return null;

        const isHome = home.team.id === teamId;
        const us = isHome ? home : away;
        const opp = isHome ? away : home;

        // ESPN's status.type.state: "pre" | "in" | "post"
        const state = comp.status && comp.status.type && comp.status.type.state;
        const status = state === "in" ? "live" : state === "post" ? "final" : "upcoming";

        const tv = (comp.broadcasts || []).flatMap((b) => b.names || []);
        const address = comp.venue && comp.venue.address;

        return {
          date: comp.date,
          opp: opp.team.displayName,
          oppAbbr: opp.team.abbreviation,
          away: !isHome,
          venue: (comp.venue && comp.venue.fullName) || "TBD",
          city: address ? [address.city, address.state].filter(Boolean).join(", ") : "",
          tv: tv.length ? tv : ["Check local listings"],
          status,
          usScore: status === "upcoming" ? undefined : Number(us.score),
          oppScore: status === "upcoming" ? undefined : Number(opp.score),
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const finals = games.filter((g) => g.status === "final");
    const wins = finals.filter((g) => g.usScore > g.oppScore).length;
    const losses = finals.length - wins;

    // Cache at Vercel's edge for 45s (stale-while-revalidate 30s) so
    // concurrent visitors polling this team don't each hit ESPN.
    res.setHeader("Cache-Control", "s-maxage=45, stale-while-revalidate=30");
    res.status(200).json({
      team: {
        id: teamId,
        name: match.team.displayName,
        abbreviation: match.team.abbreviation,
      },
      games,
      standings: { wins, losses },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(502).json({
      error: "espn_fetch_failed",
      detail: String(err && err.message ? err.message : err),
    });
  }
}
