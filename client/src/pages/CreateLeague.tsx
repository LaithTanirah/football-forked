import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { leaguesApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useAuthStore } from '@/store/authStore';

export function CreateLeague() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    city: user?.city || '',
    season: '',
    startDate: '',
  });

  const createMutation = useMutation({
    mutationFn: leaguesApi.create,
    onSuccess: (response) => {
      toast({
        title: 'Success',
        description: 'League created successfully!',
      });
      navigate(`/leagues/${response.data.data.league.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create league',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.city) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate({
      name: formData.name,
      city: formData.city,
      season: formData.season || undefined,
      startDate: formData.startDate || undefined,
    });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 page-section">
      <Breadcrumbs
        items={[
          { label: 'Leagues', href: '/leagues' },
          { label: 'Create League' },
        ]}
        className="mb-6"
      />

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Create New League</CardTitle>
          <CardDescription>Start a new competitive 6-a-side league</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">League Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter league name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Enter city"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="season">Season (Optional)</Label>
              <Input
                id="season"
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                placeholder="e.g., Spring 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date (Optional)</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/leagues')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                {createMutation.isPending ? 'Creating...' : 'Create League'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

