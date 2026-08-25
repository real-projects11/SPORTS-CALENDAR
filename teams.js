// /teams.js
// Shared team directory for the fan-hub network.
// Used by:
//   - index.html (hub homepage)   -> renders the team picker grid
//   - team.html (team page)       -> looks up the selected team's
//                                     ESPN sport/league/abbreviation
//                                     and brand colors via ?team=slug
//
// sport/league values follow ESPN's own URL slugs
// (site.api.espn.com/apis/site/v2/sports/{sport}/{league}/...),
// so don't rename these without checking ESPN's pattern still matches.
//
// abbr must match the team's official abbreviation as ESPN reports it
// (used to resolve the numeric team id server-side, see
// /api/team-schedule.js).

window.TEAMS = [
  // ---- Tier S ----
  {
    slug: "buffalo-bills",
    name: "Buffalo Bills",
    shortName: "Bills",
    tier: "S",
    sport: "football",
    league: "nfl",
    leagueLabel: "NFL",
    abbr: "BUF",
    city: "Buffalo, NY",
    colorPrimary: "#00338D",
    colorAlt: "#C60C30"
  },
  {
    slug: "kansas-city-chiefs",
    name: "Kansas City Chiefs",
    shortName: "Chiefs",
    tier: "S",
    sport: "football",
    league: "nfl",
    leagueLabel: "NFL",
    abbr: "KC",
    city: "Kansas City, MO",
    colorPrimary: "#E31837",
    colorAlt: "#FFB81C"
  },
  {
    slug: "green-bay-packers",
    name: "Green Bay Packers",
    shortName: "Packers",
    tier: "S",
    sport: "football",
    league: "nfl",
    leagueLabel: "NFL",
    abbr: "GB",
    city: "Green Bay, WI",
    colorPrimary: "#203731",
    colorAlt: "#FFB612"
  },
  {
    slug: "philadelphia-eagles",
    name: "Philadelphia Eagles",
    shortName: "Eagles",
    tier: "S",
    sport: "football",
    league: "nfl",
    leagueLabel: "NFL",
    abbr: "PHI",
    city: "Philadelphia, PA",
    colorPrimary: "#004C54",
    colorAlt: "#A5ACAF"
  },
  {
    slug: "alabama-crimson-tide",
    name: "Alabama Crimson Tide",
    shortName: "Alabama",
    tier: "S",
    sport: "football",
    league: "college-football",
    leagueLabel: "NCAAF",
    abbr: "ALA",
    city: "Tuscaloosa, AL",
    colorPrimary: "#9E1B32",
    colorAlt: "#828A8F"
  },
  {
    slug: "georgia-bulldogs",
    name: "Georgia Bulldogs",
    shortName: "Georgia",
    tier: "S",
    sport: "football",
    league: "college-football",
    leagueLabel: "NCAAF",
    abbr: "UGA",
    city: "Athens, GA",
    colorPrimary: "#BA0C2F",
    colorAlt: "#000000"
  },
  {
    slug: "ohio-state-buckeyes",
    name: "Ohio State Buckeyes",
    shortName: "Ohio State",
    tier: "S",
    sport: "football",
    league: "college-football",
    leagueLabel: "NCAAF",
    abbr: "OSU",
    city: "Columbus, OH",
    colorPrimary: "#BB0000",
    colorAlt: "#666666"
  },

  // ---- Already built / launched ----
  {
    slug: "indiana-fever",
    name: "Indiana Fever",
    shortName: "Fever",
    tier: "LAUNCHED",
    sport: "basketball",
    league: "wnba",
    leagueLabel: "WNBA",
    abbr: "IND",
    city: "Indianapolis, IN",
    colorPrimary: "#ff5a36",
    colorAlt: "#ffc24b"
  }
];
