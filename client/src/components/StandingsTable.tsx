import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Standing {
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

interface StandingsTableProps {
  standings: Standing[];
}

export function StandingsTable({ standings }: StandingsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-background">Pos</TableHead>
            <TableHead className="sticky left-12 z-10 bg-background min-w-[200px]">Team</TableHead>
            <TableHead className="text-center">P</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">GF</TableHead>
            <TableHead className="text-center">GA</TableHead>
            <TableHead className="text-center">GD</TableHead>
            <TableHead className="text-center font-bold">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((standing, index) => (
            <TableRow
              key={standing.teamId}
              className={index < 3 ? 'bg-muted/50' : ''}
            >
              <TableCell className="sticky left-0 z-10 bg-background font-medium">
                {index === 0 && <Badge variant="success" className="mr-2">1st</Badge>}
                {index === 1 && <Badge variant="secondary" className="mr-2">2nd</Badge>}
                {index === 2 && <Badge variant="outline" className="mr-2">3rd</Badge>}
                {index > 2 && <span className="ml-8">{index + 1}</span>}
              </TableCell>
              <TableCell className="sticky left-12 z-10 bg-background font-medium">
                {standing.teamName}
              </TableCell>
              <TableCell className="text-center">{standing.played}</TableCell>
              <TableCell className="text-center">{standing.won}</TableCell>
              <TableCell className="text-center">{standing.drawn}</TableCell>
              <TableCell className="text-center">{standing.lost}</TableCell>
              <TableCell className="text-center">{standing.goalsFor}</TableCell>
              <TableCell className="text-center">{standing.goalsAgainst}</TableCell>
              <TableCell className="text-center">
                {standing.goalDifference > 0 ? '+' : ''}
                {standing.goalDifference}
              </TableCell>
              <TableCell className="text-center font-bold">{standing.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

