/**
 * Calculate league standings from matches and results
 */

export interface TeamStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface MatchResult {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
}

export function calculateStandings(
  teamIds: string[],
  teamNames: Record<string, string>,
  results: MatchResult[]
): TeamStanding[] {
  // Initialize standings for all teams
  const standings: Record<string, TeamStanding> = {};

  teamIds.forEach(teamId => {
    standings[teamId] = {
      teamId,
      teamName: teamNames[teamId] || 'Unknown',
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  });

  // Process results
  results.forEach(result => {
    if (result.homeScore === null || result.awayScore === null) {
      return; // Skip matches without results
    }

    const home = standings[result.homeTeamId];
    const away = standings[result.awayTeamId];

    if (!home || !away) return;

    // Update played
    home.played++;
    away.played++;

    // Update goals
    home.goalsFor += result.homeScore;
    home.goalsAgainst += result.awayScore;
    away.goalsFor += result.awayScore;
    away.goalsAgainst += result.homeScore;

    // Update goal difference
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    // Update points and win/draw/loss
    if (result.homeScore > result.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (result.homeScore < result.awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      home.points += 1;
      away.drawn++;
      away.points += 1;
    }
  });

  // Convert to array and sort
  const standingsArray = Object.values(standings);

  standingsArray.sort((a, b) => {
    // Sort by points (descending)
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // Then by goal difference (descending)
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    // Then by goals for (descending)
    return b.goalsFor - a.goalsFor;
  });

  return standingsArray;
}

