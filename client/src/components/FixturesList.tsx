import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchesApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import { format } from 'date-fns';

interface Match {
  id: string;
  homeTeam: any;
  awayTeam: any;
  scheduledDate: string | null;
  scheduledTime: string | null;
  status: string;
  round: number;
  result: {
    homeScore: number;
    awayScore: number;
  } | null;
}

interface FixturesListProps {
  matches: Match[];
  leagueId: string;
  isLeagueOwner: boolean;
  userTeamIds: string[];
}

export function FixturesList({ matches, leagueId, isLeagueOwner, userTeamIds }: FixturesListProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [resultForm, setResultForm] = useState({ homeScore: '', awayScore: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const recordResultMutation = useMutation({
    mutationFn: ({ matchId, homeScore, awayScore }: { matchId: string; homeScore: number; awayScore: number }) =>
      matchesApi.recordResult(matchId, { homeScore, awayScore }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Result recorded successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['league', leagueId] });
      setIsDialogOpen(false);
      setSelectedMatch(null);
      setResultForm({ homeScore: '', awayScore: '' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to record result',
        variant: 'destructive',
      });
    },
  });

  const canRecordResult = (match: Match) => {
    if (isLeagueOwner) return true;
    const isHomeTeam = userTeamIds.includes(match.homeTeam?.id);
    const isAwayTeam = userTeamIds.includes(match.awayTeam?.id);
    return isHomeTeam || isAwayTeam;
  };

  const handleRecordResult = (match: Match) => {
    setSelectedMatch(match);
    if (match.result) {
      setResultForm({
        homeScore: match.result.homeScore.toString(),
        awayScore: match.result.awayScore.toString(),
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmitResult = () => {
    if (!selectedMatch) return;
    const homeScore = parseInt(resultForm.homeScore);
    const awayScore = parseInt(resultForm.awayScore);

    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter valid scores',
        variant: 'destructive',
      });
      return;
    }

    recordResultMutation.mutate({
      matchId: selectedMatch.id,
      homeScore,
      awayScore,
    });
  };

  const groupedByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedByRound)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([round, roundMatches]) => (
            <div key={round}>
              <h3 className="mb-4 text-lg font-semibold">Round {round}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {roundMatches.map((match) => (
                  <Card key={match.id} className="card-elevated">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {match.homeTeam?.name || 'TBD'} vs {match.awayTeam?.name || 'TBD'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        {match.scheduledDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(match.scheduledDate), 'MMM dd, yyyy')}
                          </span>
                        )}
                        {match.scheduledTime && <span>{match.scheduledTime}</span>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {match.result ? (
                        <div className="flex items-center justify-center gap-4 text-2xl font-bold">
                          <span>{match.result.homeScore}</span>
                          <span className="text-muted-foreground">-</span>
                          <span>{match.result.awayScore}</span>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">Not played</div>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant={match.status === 'PLAYED' ? 'success' : 'outline'}>
                          {match.status}
                        </Badge>
                        {canRecordResult(match) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRecordResult(match)}
                          >
                            {match.result ? 'Update Result' : 'Record Result'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Match Result</DialogTitle>
            <DialogDescription>
              {selectedMatch && (
                <>
                  {selectedMatch.homeTeam?.name} vs {selectedMatch.awayTeam?.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {selectedMatch?.homeTeam?.name} Score
              </label>
              <Input
                type="number"
                min="0"
                value={resultForm.homeScore}
                onChange={(e) => setResultForm({ ...resultForm, homeScore: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {selectedMatch?.awayTeam?.name} Score
              </label>
              <Input
                type="number"
                min="0"
                value={resultForm.awayScore}
                onChange={(e) => setResultForm({ ...resultForm, awayScore: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitResult} disabled={recordResultMutation.isPending}>
              {recordResultMutation.isPending ? 'Recording...' : 'Record Result'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

