import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaguesApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CitySelect } from '@/components/CitySelect';
import { useAuthStore } from '@/store/authStore';

export function CreateLeague() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
      const leagueId = response.data.data.league.id;
      
      // Invalidate league queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['leagues'] });
      queryClient.invalidateQueries({ queryKey: ['league', leagueId] });
      queryClient.invalidateQueries({ queryKey: ['standings', leagueId] });
      
      toast({
        title: t('common.success'),
        description: t('leagues.leagueCreated'),
      });
      navigate(`/leagues/${leagueId}`);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('leagues.leagueCreateError'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.city) {
      toast({
        title: t('leagues.validationError'),
        description: t('leagues.fillRequiredFields'),
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
          { label: t('nav.leagues'), href: '/leagues' },
          { label: t('leagues.createLeague') },
        ]}
        className="mb-6"
      />

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>{t('leagues.createNewLeague')}</CardTitle>
          <CardDescription>{t('leagues.createLeagueSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t('leagues.leagueName')} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('leagues.leagueNamePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">
                {t('common.city')} *
              </Label>
              <CitySelect
                value={formData.city}
                onChange={(value) => setFormData({ ...formData, city: value })}
                placeholder={t('admin.selectCity')}
                required
                allowEmpty={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="season">{t('leagues.seasonOptional')}</Label>
              <Input
                id="season"
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                placeholder={t('leagues.seasonPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">{t('leagues.startDateOptional')}</Label>
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
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                {createMutation.isPending ? t('common.creating') : t('leagues.createLeague')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

