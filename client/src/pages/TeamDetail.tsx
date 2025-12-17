import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useAuthStore } from '@/store/authStore';
import { MapPin, Users, Crown, User, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useLocaleStore } from '@/store/localeStore';

export function TeamDetail() {
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getById(id!),
    enabled: !!id,
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      teamsApi.removeMember(teamId, memberId),
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("teams.memberRemovedSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ['team', id] });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("teams.removeMemberError"),
        variant: 'destructive',
      });
    },
  });

  const team = data?.data.data;
  const isCaptain = user && team && team.captain?.id === user.id;

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

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
                {isCaptain && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    {t("teams.captain")}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {team.preferredPitch && (
                <div className="mb-4">
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
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("teams.teamRoster")}
              </CardTitle>
              <CardDescription>
                {team.members?.length || 0} {t("teams.members")}
              </CardDescription>
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
                        {member.role === 'CAPTAIN' && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="mr-1 h-3 w-3" />
                            {t("teams.captain")}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {t("teams.joined")} {format(new Date(member.joinedAt), 'MMM yyyy', { locale: enUS })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isCaptain &&
                    member.role !== 'CAPTAIN' &&
                    member.user?.id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(t("teams.removeMemberConfirm"))) {
                            removeMemberMutation.mutate({
                              teamId: id!,
                              memberId: member.id,
                            });
                          }
                        }}
                        disabled={removeMemberMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

