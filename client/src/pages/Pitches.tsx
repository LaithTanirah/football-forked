import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { pitchesApi } from "@/lib/api";
import { PitchCard } from "@/components/PitchCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Search, Home } from "lucide-react";

export function Pitches() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    city: "",
    indoor: "",
    minPrice: "",
    maxPrice: "",
    search: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["pitches", filters],
    queryFn: () =>
      pitchesApi.getAll({
        city: filters.city || undefined,
        indoor: filters.indoor || undefined,
        minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
        search: filters.search || undefined,
      }),
  });

  const pitches = data?.data.data || [];

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-6 page-section">
      <Breadcrumbs items={[{ label: t("nav.pitches") }]} className="mb-6" />

      <h1 className="mb-8 text-3xl font-bold">{t("pitches.title")}</h1>

      <Card className="mb-8 card-elevated">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("pitches.searchPlaceholder")}
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-9"
              />
            </div>
            <Input
              placeholder={t("pitches.cityPlaceholder")}
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            />
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.indoor}
              onChange={(e) =>
                setFilters({ ...filters, indoor: e.target.value })
              }
            >
              <option value="">{t("pitches.allTypes")}</option>
              <option value="true">{t("pitches.indoor")}</option>
              <option value="false">{t("pitches.outdoor")}</option>
            </select>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={t("pitches.minPrice")}
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters({ ...filters, minPrice: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder={t("pitches.maxPrice")}
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters({ ...filters, maxPrice: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="card-elevated">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pitches.length === 0 ? (
        <EmptyState
          icon={<Home className="h-12 w-12" />}
          title={t("pitches.noPitchesFound")}
          description={t("pitches.noPitchesDesc")}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pitches.map((pitch) => (
            <PitchCard key={pitch.id} pitch={pitch} />
          ))}
        </div>
      )}
    </div>
  );
}
