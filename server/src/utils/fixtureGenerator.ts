/**
 * Round-robin tournament fixture generator
 * Generates fixtures where each team plays every other team once
 */

export interface Fixture {
  homeTeamId: string;
  awayTeamId: string;
  round: number;
}

export function generateRoundRobinFixtures(teamIds: string[]): Fixture[] {
  if (teamIds.length < 2) {
    return [];
  }

  const fixtures: Fixture[] = [];
  const numTeams = teamIds.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = Math.floor(numTeams / 2);

  // If odd number of teams, add a "bye" team (null)
  const teams = numTeams % 2 === 0 ? [...teamIds] : [...teamIds, 'BYE'];

  for (let round = 1; round <= numRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const homeIndex = match;
      const awayIndex = numTeams - 1 - match;

      const homeTeamId = teams[homeIndex];
      const awayTeamId = teams[awayIndex];

      // Skip if either team is BYE
      if (homeTeamId === 'BYE' || awayTeamId === 'BYE') {
        continue;
      }

      // Alternate home/away for fairness
      if (round % 2 === 0) {
        fixtures.push({
          homeTeamId: awayTeamId,
          awayTeamId: homeTeamId,
          round,
        });
      } else {
        fixtures.push({
          homeTeamId,
          awayTeamId,
          round,
        });
      }
    }

    // Rotate teams (keep first team fixed, rotate the rest)
    const lastTeam = teams.pop()!;
    teams.splice(1, 0, lastTeam);
  }

  return fixtures;
}

