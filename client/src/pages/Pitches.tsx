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
import { CitySelect } from "@/components/CitySelect";
import { useFilters } from "@/hooks/useFilters";
import { Search, Home, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Pitches() {
  const { t } = useTranslation();
  
  const { filters, updateFilter, clearFilters, apiParams, priceError, hasActiveFilters } = useFilters({
    includeSearch: true,
    includeCity: true,
    includeType: true,
    includePrice: true,
    debounceMs: 300,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["pitches", apiParams],
    queryFn: () =>
      pitchesApi.getAll({
        ...apiParams,
        type: filters.type || undefined,
      } as any),
  });

  const pitches = data?.data.data || [];

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-6 page-section">
      <Breadcrumbs items={[{ label: t("nav.pitches") }]} className="mb-6" />

      <h1 className="mb-8 text-3xl font-bold">{t("pitches.title")}</h1>

      <Card className="mb-8 card-elevated">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("pitches.searchPlaceholder")}
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  className="pl-9"
                />
              </div>
              <CitySelect
                value={filters.city}
                onChange={(value) => updateFilter("city", value)}
                placeholder={t("pitches.cityPlaceholder")}
                allowEmpty={true}
              />
              <Select
                value={filters.type || "__ALL_TYPES__"}
                onValueChange={(val) => updateFilter("type", val === "__ALL_TYPES__" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("pitches.allTypes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL_TYPES__">{t("pitches.allTypes")}</SelectItem>
                  <SelectItem value="indoor">{t("pitches.indoor")}</SelectItem>
                  <SelectItem value="outdoor">{t("pitches.outdoor")}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={t("common.minPrice")}
                  value={filters.minPrice}
                  onChange={(e) => updateFilter("minPrice", e.target.value)}
                  className={priceError ? "border-destructive" : ""}
                />
                <Input
                  type="number"
                  placeholder={t("common.maxPrice")}
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter("maxPrice", e.target.value)}
                  className={priceError ? "border-destructive" : ""}
                />
              </div>
            </div>
            {priceError && (
              <p className="text-sm text-destructive">{t("common.invalidPriceRange")}</p>
            )}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearFilters();
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
