import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { teamsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CitySelect } from '@/components/CitySelect';
import { useFilters } from '@/hooks/useFilters';
import { Users, Plus, MapPin, Search, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function Teams() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const { filters, updateFilter, clearFilters, apiParams, hasActiveFilters } = useFilters({
    includeSearch: true,
    includeCity: true,
    debounceMs: 300,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['teams', apiParams],
    queryFn: () => teamsApi.getAll(apiParams as any),
  });

  const teams = data?.data.data || [];

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-6 page-section">
      <Breadcrumbs items={[{ label: t("teams.title") }]} className="mb-6" />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("teams.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("teams.subtitle")}</p>
        </div>
        {user && (
          <Link to="/teams/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("teams.createTeam")}
            </Button>
          </Link>
        )}
      </div>

      <Card className="mb-8 card-elevated">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("teams.searchTeams")}
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  className="pl-9"
                />
              </div>
              <CitySelect
                value={filters.city}
                onChange={(value) => updateFilter("city", value)}
                placeholder={t("teams.filterByCity")}
                allowEmpty={true}
              />
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  {t("common.clearFilters")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="card-elevated">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-2 h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title={t("teams.noTeamsFound")}
          description={t("teams.noTeamsDesc")}
          action={
            user
              ? {
                  label: t("teams.createTeam"),
                  href: '/teams/create',
                }
              : {
                  label: t("teams.loginToCreate"),
                  href: '/auth/login',
                }
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: any) => (
            <Card key={team.id} className="card-elevated overflow-hidden">
              {team.logoUrl && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
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
                <CardTitle className="flex items-center justify-between">
                  {team.name}
                  {team.preferredPitch && (
                    <Badge variant="outline" className="text-xs">
                      {t("teams.preferred")}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {team.city}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{team.memberCount || 0} {t("teams.members")}</span>
                </div>
                {team.captain && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("teams.captain")}: {team.captain.name}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Link to={`/teams/${team.id}`} className="w-full">
                  <Button className="w-full" variant="outline">
                    {t("teams.viewTeam")}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

