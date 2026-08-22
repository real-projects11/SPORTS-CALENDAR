// /api/fever-schedule.js
//
// Vercel serverless function. Pulls Indiana Fever's live schedule and
// scores from ESPN's public (unofficial, undocumented) API and reshapes
// it into the same format the frontend already uses for GAMES.
//
// This is deliberately kept dependency-free (plain fetch, Node's built-in
// runtime) so it works with zero config as soon as this file exists under
// /api on a Vercel project.
//
// Note on reliability: ESPN does not officially document or support this
// endpoint. It can change or go away without notice. If that happens,
// the frontend keeps working off its last-known/fallback data — this
// function just stops updating it. Worth checking on it occasionally.

const TEAM_ID = "5"; // Indiana Fever (ESPN's internal WNBA team id)
const SCHEDULE_URL = `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams/${TEAM_ID}/schedule`;

export default async function handler(req, res) {
  try {
    const espnRes = await fetch(SCHEDULE_URL);
    if (!espnRes.ok) {
      throw new Error(`ESPN responded with ${espnRes.status}`);
    }
    const data = await espnRes.json();

    const games = (data.events || [])
      .map((ev) => {
        const comp = ev.competitions && ev.competitions[0];
        if (!comp) return null;

        const home = comp.competitors.find((c) => c.homeAway === "home");
        const away = comp.competitors.find((c) => c.homeAway === "away");
        if (!home || !away) return null;

        const indianaIsHome = home.team.id === TEAM_ID;
        const us = indianaIsHome ? home : away;
        const opp = indianaIsHome ? away : home;

        // ESPN's status.type.state: "pre" | "in" | "post"
        const state = comp.status && comp.status.type && comp.status.type.state;
        const status = state === "in" ? "live" : state === "post" ? "final" : "upcoming";

        const tv = (comp.broadcasts || []).flatMap((b) => b.names || []);
        const address = comp.venue && comp.venue.address;

        return {
          date: comp.date,
          opp: opp.team.displayName,
          oppAbbr: opp.team.abbreviation,
          away: !indianaIsHome,
          venue: (comp.venue && comp.venue.fullName) || "TBD",
          city: address ? [address.city, address.state].filter(Boolean).join(", ") : "",
          tv: tv.length ? tv : ["Check local listings"],
          status,
          indScore: status === "upcoming" ? undefined : Number(us.score),
          oppScore: status === "upcoming" ? undefined : Number(opp.score),
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const finals = games.filter((g) => g.status === "final");
    const wins = finals.filter((g) => g.indScore > g.oppScore).length;
    const losses = finals.length - wins;

    // Cache at Vercel's edge for 45s (with a 30s stale-while-revalidate
    // window) so bursts of visitors don't each trigger their own call to
    // ESPN — this endpoint gets hit by every visitor's poll cycle.
    res.setHeader("Cache-Control", "s-maxage=45, stale-while-revalidate=30");
    res.status(200).json({
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
