import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useAuthStore } from '@/store/authStore';
import { MapPin, Users, Crown, User, Trash2, UserCog, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useLocaleStore } from '@/store/localeStore';
import { ManagePlayers } from '@/components/ManagePlayers';
import { SquadTab } from '@/components/SquadTab';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function TeamDetail() {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [managePlayersOpen, setManagePlayersOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getById(id!),
    enabled: !!id,
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      teamsApi.removeMember(teamId, userId),
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("teams.memberRemovedSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      setRemoveConfirmOpen(false);
      setMemberToRemove(null);
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("teams.removeMemberError"),
        variant: 'destructive',
      });
    },
  });

  const handleRemoveClick = (member: { user?: { id: string; name: string } }) => {
    if (!member.user) return;
    setMemberToRemove({ id: member.user.id, name: member.user.name });
    setRemoveConfirmOpen(true);
  };

  const handleConfirmRemove = () => {
    if (!memberToRemove || !id) return;
    removeMemberMutation.mutate({
      teamId: id,
      userId: memberToRemove.id,
    });
  };

  const team = data?.data.data;
  // Check if user is owner (captainId or has OWNER/ADMIN role)
  const isOwner = user && team && (
    team.captain?.id === user.id ||
    team.members?.some((m: any) => 
      m.user?.id === user.id && (m.role === 'OWNER' || m.role === 'ADMIN' || m.role === 'CAPTAIN')
    )
  );

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-[1200px] px-4 py-6">
        <Skeleton className="mb-6 h-6 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto max-w-[1200px] px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t("teams.teamNotFound")}</p>
            <Button onClick={() => navigate('/teams')} className="mt-4">
              {t("teams.backToTeams")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-6 page-section">
      <Breadcrumbs
        items={[
          { label: t("teams.title"), href: '/teams' },
          { label: team.name },
        ]}
        className="mb-6"
      />

      {/* Team Header */}
      <Card className="card-elevated mb-6">
        {team.logoUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
            <img
              src={team.logoUrl}
              alt={team.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{team.name}</CardTitle>
              <CardDescription className="mt-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {team.city}
              </CardDescription>
            </div>
            {isOwner && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                {t("teams.owner")}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">{t("teams.overview")}</TabsTrigger>
          <TabsTrigger value="players">{t("teams.players")}</TabsTrigger>
          <TabsTrigger value="squad">{t("teams.squadTab")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("teams.overview")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {team.preferredPitch && (
                <div>
                  <p className="text-sm font-medium">{t("teams.preferredPitch")}</p>
                  <p className="text-sm text-muted-foreground">
                    {team.preferredPitch.name}
                  </p>
                </div>
              )}
              {team.captain && (
                <div>
                  <p className="text-sm font-medium">{t("teams.captain")}</p>
                  <p className="text-sm text-muted-foreground">{team.captain.name}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{t("teams.members")}</p>
                <p className="text-sm text-muted-foreground">
                  {team.members?.length || 0} {t("teams.members")}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Players Tab */}
        <TabsContent value="players" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t("teams.teamRoster")}
                  </CardTitle>
                  <CardDescription>
                    {team.members?.length || 0} {t("teams.members")}
                  </CardDescription>
                </div>
                {isOwner && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setManagePlayersOpen(true)}
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    {t("teams.managePlayers")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {team.members?.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{member.user?.name || 'Unknown'}</p>
                      <div className="flex items-center gap-2">
                        {(member.role === 'OWNER' || member.role === 'CAPTAIN') && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="mr-1 h-3 w-3" />
                            {t("teams.owner")}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {t("teams.joined")} {format(new Date(member.joinedAt), 'MMM yyyy', { locale: enUS })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isOwner &&
                    member.role !== 'OWNER' &&
                    member.role !== 'CAPTAIN' &&
                    member.user?.id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveClick(member)}
                        disabled={removeMemberMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Squad Tab */}
        <TabsContent value="squad" className="mt-6">
          {team && (
            <SquadTab
              teamId={id!}
              members={team.members || []}
              captainId={team.captainId}
              currentUserId={user?.id || null}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Manage Players Drawer */}
      {team && (
        <ManagePlayers
          teamId={id!}
          open={managePlayersOpen}
          onOpenChange={setManagePlayersOpen}
          currentMembers={team.members || []}
        />
      )}

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('teams.removeMemberConfirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('teams.removeMemberConfirm', { name: memberToRemove?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveConfirmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.confirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

