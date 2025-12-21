import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { leaguesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CitySelect } from "@/components/CitySelect";
import { useFilters } from "@/hooks/useFilters";
import { Trophy, Plus, MapPin, Search, Users, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Leagues() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>("");
  
  const { filters, updateFilter, clearFilters, apiParams, hasActiveFilters } = useFilters({
    includeSearch: true,
    includeCity: true,
    debounceMs: 300,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["leagues", apiParams, statusFilter],
    queryFn: () =>
      leaguesApi.getAll({
        ...apiParams,
        status: statusFilter || undefined,
      } as any),
  });

  const leagues = data?.data.data || [];

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

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-6 page-section">
      <Breadcrumbs items={[{ label: t("nav.leagues") }]} className="mb-6" />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("leagues.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("leagues.subtitle")}</p>
        </div>
        {user && (
          <Link to="/leagues/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("leagues.createLeague")}
            </Button>
          </Link>
        )}
      </div>

      <Card className="mb-8 card-elevated">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("leagues.searchLeagues")}
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  className="pl-9"
                />
              </div>
              <CitySelect
                value={filters.city}
                onChange={(value) => updateFilter("city", value)}
                placeholder={t("leagues.filterByCity")}
                allowEmpty={true}
              />
              <Select
                value={statusFilter || "__ALL_STATUS__"}
                onValueChange={(val) => setStatusFilter(val === "__ALL_STATUS__" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("leagues.allStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL_STATUS__">{t("leagues.allStatus")}</SelectItem>
                  <SelectItem value="DRAFT">{t("leagues.draft")}</SelectItem>
                  <SelectItem value="ACTIVE">{t("leagues.active")}</SelectItem>
                  <SelectItem value="COMPLETED">{t("leagues.completed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearFilters();
                    setStatusFilter("");
                  }}
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
      ) : leagues.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-12 w-12" />}
          title={t("leagues.noLeaguesFound")}
          description={t("leagues.noLeaguesDesc")}
          action={
            user
              ? {
                  label: t("leagues.createLeague"),
                  href: "/leagues/create",
                }
              : {
                  label: t("leagues.loginToCreate"),
                  href: "/auth/login",
                }
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league: any) => (
            <Card key={league.id} className="card-elevated overflow-hidden h-full flex flex-col">
              {/* Header Section - Fixed */}
              <CardHeader className="flex-shrink-0 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex-1 line-clamp-2 min-h-[3rem]">{league.name}</CardTitle>
                  {getStatusBadge(league.status)}
                </div>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="line-clamp-1">{league.city}</span>
                </CardDescription>
              </CardHeader>
              
              {/* Content Section - Flexible, grows to fill space */}
              <CardContent className="flex-grow flex flex-col min-h-0">
                <div className="space-y-2 flex-shrink-0">
                  {league.season && (
                    <p className="text-sm text-muted-foreground">
                      {t("leagues.season")}: {league.season}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {league.teamCount || 0} {t("leagues.teams")}
                    </span>
                  </div>
                  {league.owner && (
                    <p className="text-sm text-muted-foreground">
                      {t("leagues.owner")}: {league.owner.name}
                    </p>
                  )}
                </div>
              </CardContent>
              
              {/* Footer Section - Fixed at bottom */}
              <CardFooter className="flex-shrink-0 pt-0 pb-4 px-6">
                <Link to={`/leagues/${league.id}`} className="w-full">
                  <Button className="w-full" variant="outline">
                    {t("leagues.viewLeague")}
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
