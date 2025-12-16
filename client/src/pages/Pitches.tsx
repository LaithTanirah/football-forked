import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pitchesApi } from '@/lib/api';
import { PitchCard } from '@/components/PitchCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function Pitches() {
  const [filters, setFilters] = useState({
    city: '',
    indoor: '',
    minPrice: '',
    maxPrice: '',
    search: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['pitches', filters],
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Football Pitches</h1>

      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <Input
              placeholder="City"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            />
            <select
              className="rounded-md border border-input bg-background px-3 py-2"
              value={filters.indoor}
              onChange={(e) => setFilters({ ...filters, indoor: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="true">Indoor</option>
              <option value="false">Outdoor</option>
            </select>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : pitches.length === 0 ? (
        <div className="text-center text-muted-foreground">No pitches found</div>
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

