import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaguesApi, matchesApi, teamsApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StandingsTable } from "@/components/StandingsTable";
import { FixturesList } from "@/components/FixturesList";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import {
  Trophy,
  MapPin,
  Users,
  Calendar,
  Lock,
  Play,
  Plus,
} from "lucide-react";
import { format } from "date-fns";

export function LeagueDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [addTeamDialogOpen, setAddTeamDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const { data: leagueData, isLoading: leagueLoading } = useQuery({
    queryKey: ["league", id],
    queryFn: () => leaguesApi.getById(id!),
    enabled: !!id,
  });

  const { data: standingsData } = useQuery({
    queryKey: ["standings", id],
    queryFn: () => leaguesApi.getStandings(id!),
    enabled: !!id,
  });

  const { data: matchesData } = useQuery({
    queryKey: ["matches", id],
    queryFn: () => matchesApi.getLeagueMatches(id!),
    enabled: !!id,
  });

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ["teams", "all"],
    queryFn: () => teamsApi.getAll(),
    enabled: !!id && user !== null && addTeamDialogOpen,
  });

  const league = leagueData?.data.data;
  const standings = standingsData?.data.data || [];
  const matches = matchesData?.data.data || [];

  const isLeagueOwner = user && league && league.owner?.id === user.id;

  // Get user's team IDs from league teams
  const userTeamIds =
    user && league
      ? league.teams
          ?.filter((lt: any) =>
            lt.team?.members?.some((m: any) => m.user?.id === user.id)
          )
          .map((lt: any) => lt.team.id) || []
      : [];

  const lockMutation = useMutation({
    mutationFn: () => leaguesApi.lock(id!),
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("leagueDetail.lockLeagueSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message || t("leagueDetail.lockLeagueError"),
        variant: "destructive",
      });
    },
  });

  const generateScheduleMutation = useMutation({
    mutationFn: () => matchesApi.generateSchedule(id!),
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("leagueDetail.generateScheduleSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["matches", id] });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message ||
          t("leagueDetail.generateScheduleError"),
        variant: "destructive",
      });
    },
  });

  const addTeamMutation = useMutation({
    mutationFn: ({ teamId }: { teamId: string }) =>
      leaguesApi.addTeam(id!, { teamId }),
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("leagueDetail.addTeamSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
      setAddTeamDialogOpen(false);
      setSelectedTeamId("");
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message || t("leagueDetail.addTeamError"),
        variant: "destructive",
      });
    },
  });

  if (leagueLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-6 h-6 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-32" />
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">League not found</p>
            <Button onClick={() => navigate("/leagues")} className="mt-4">
              Back to Leagues
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline">{t("leagues.draft")}</Badge>;
      case "ACTIVE":
        return <Badge variant="success">{t("leagues.active")}</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary">{t("leagues.completed")}</Badge>;
      default:
        return null;
    }
  };

  const hasSchedule = matches.length > 0;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 page-section">
      <Breadcrumbs
        items={[
          { label: t("nav.leagues"), href: "/leagues" },
          { label: league.name },
        ]}
        className="mb-6"
      />

      <Card className="card-elevated mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                {league.name}
              </CardTitle>
              <CardDescription className="mt-2 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {league.city}
                </span>
                {league.season && <span>Season: {league.season}</span>}
                {league.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(league.startDate), "MMM dd, yyyy")}
                  </span>
                )}
              </CardDescription>
            </div>
            {getStatusBadge(league.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{league.teams?.length || 0} teams</span>
            </div>
            {league.owner && (
              <div className="text-sm text-muted-foreground">
                Owner: {league.owner.name}
              </div>
            )}
            {isLeagueOwner && league.status === "DRAFT" && (
              <div className="ml-auto flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddTeamDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("leagueDetail.addTeam")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => lockMutation.mutate()}
                  disabled={
                    lockMutation.isPending || (league.teams?.length || 0) < 2
                  }
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {t("leagueDetail.lockLeague")}
                </Button>
              </div>
            )}
            {isLeagueOwner && league.status === "ACTIVE" && !hasSchedule && (
              <Button
                className="ml-auto"
                onClick={() => generateScheduleMutation.mutate()}
                disabled={generateScheduleMutation.isPending}
              >
                <Play className="mr-2 h-4 w-4" />
                {generateScheduleMutation.isPending
                  ? t("leagueDetail.generating")
                  : t("leagueDetail.generateSchedule")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            {t("leagueDetail.overview")}
          </TabsTrigger>
          <TabsTrigger value="teams">{t("leagueDetail.teams")}</TabsTrigger>
          <TabsTrigger value="fixtures">
            {t("leagueDetail.fixtures")}
          </TabsTrigger>
          <TabsTrigger value="standings">
            {t("leagueDetail.standings")}
          </TabsTrigger>
          <TabsTrigger value="results">{t("leagueDetail.results")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>{t("leagueDetail.leagueOverview")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">
                  {t("leagueDetail.status")}
                </p>
                <p className="text-sm text-muted-foreground">{league.status}</p>
              </div>
              {league.season && (
                <div>
                  <p className="text-sm font-medium">{t("leagues.season")}</p>
                  <p className="text-sm text-muted-foreground">
                    {league.season}
                  </p>
                </div>
              )}
              {league.startDate && (
                <div>
                  <p className="text-sm font-medium">
                    {t("leagueDetail.startDate")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(league.startDate), "MMMM dd, yyyy")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{t("leagueDetail.teams")}</p>
                <p className="text-sm text-muted-foreground">
                  {league.teams?.length || 0}{" "}
                  {t("leagueDetail.teamsRegistered")}
                </p>
              </div>
              {hasSchedule && (
                <div>
                  <p className="text-sm font-medium">Matches</p>
                  <p className="text-sm text-muted-foreground">
                    {matches.length} {t("leagueDetail.matchesScheduled")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {league.teams?.map((leagueTeam: any) => (
              <Card key={leagueTeam.team.id} className="card-elevated">
                <CardHeader>
                  <CardTitle>{leagueTeam.team.name}</CardTitle>
                  <CardDescription>{leagueTeam.team.city}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={`/teams/${leagueTeam.team.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      {t("teams.viewTeam")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fixtures" className="mt-6">
          {hasSchedule ? (
            <FixturesList
              matches={matches}
              leagueId={id!}
              isLeagueOwner={isLeagueOwner || false}
              userTeamIds={userTeamIds}
            />
          ) : (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {league.status === "DRAFT"
                    ? "Lock the league and generate schedule to see fixtures"
                    : "Schedule not generated yet"}
                </p>
                {isLeagueOwner && league.status === "ACTIVE" && (
                  <Button
                    className="mt-4"
                    onClick={() => generateScheduleMutation.mutate()}
                    disabled={generateScheduleMutation.isPending}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Generate Schedule
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="standings" className="mt-6">
          {standings.length > 0 ? (
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>{t("leagueDetail.standings")}</CardTitle>
              </CardHeader>
              <CardContent>
                <StandingsTable standings={standings} />
              </CardContent>
            </Card>
          ) : (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {t("leagueDetail.noStandingsAvailable")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          {hasSchedule ? (
            <FixturesList
              matches={matches.filter((m: any) => m.result)}
              leagueId={id!}
              isLeagueOwner={isLeagueOwner || false}
              userTeamIds={userTeamIds}
            />
          ) : (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {t("leagueDetail.noResultsYet")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={addTeamDialogOpen} onOpenChange={setAddTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("leagueDetail.addTeamToLeague")}</DialogTitle>
            <DialogDescription>
              {t("leagueDetail.selectTeam")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {teamsLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading teams...
              </div>
            ) : (
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const allTeams = teamsData?.data.data || [];
                    // Filter: show teams where user is captain OR all teams if user is league owner
                    const availableTeams = isLeagueOwner
                      ? allTeams.filter(
                          (team: any) =>
                            !league.teams?.some(
                              (lt: any) => lt.team.id === team.id
                            )
                        )
                      : allTeams.filter(
                          (team: any) =>
                            (team.captain?.id === user?.id ||
                              team.members?.some(
                                (m: any) => m.user?.id === user?.id
                              )) &&
                            !league.teams?.some(
                              (lt: any) => lt.team.id === team.id
                            )
                        );

                    if (availableTeams.length === 0) {
                      return (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          {isLeagueOwner
                            ? t("leagueDetail.noTeamsAvailable")
                            : t("leagueDetail.needToBeCaptain")}
                        </div>
                      );
                    }

                    return availableTeams.map((team: any) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} - {team.city}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddTeamDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (selectedTeamId) {
                  addTeamMutation.mutate({ teamId: selectedTeamId });
                }
              }}
              disabled={!selectedTeamId || addTeamMutation.isPending}
            >
              {addTeamMutation.isPending
                ? t("leagueDetail.adding")
                : t("leagueDetail.addTeam")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
