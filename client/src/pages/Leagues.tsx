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
import { Trophy, Plus, MapPin, Search, Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function Leagues() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    city: "",
    status: "",
    search: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["leagues", filters],
    queryFn: () =>
      leaguesApi.getAll({
        city: filters.city || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
      }),
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("leagues.searchLeagues")}
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-9"
              />
            </div>
            <Input
              placeholder={t("leagues.filterByCity")}
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            />
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">{t("leagues.allStatus")}</option>
              <option value="DRAFT">{t("leagues.draft")}</option>
              <option value="ACTIVE">{t("leagues.active")}</option>
              <option value="COMPLETED">{t("leagues.completed")}</option>
            </select>
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
            <Card key={league.id} className="card-elevated">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex-1">{league.name}</CardTitle>
                  {getStatusBadge(league.status)}
                </div>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {league.city}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {league.season && (
                    <p className="text-sm text-muted-foreground">
                      {t("leagues.season")}: {league.season}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
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
              <CardFooter>
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
