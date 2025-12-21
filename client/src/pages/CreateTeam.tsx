import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teamsApi, pitchesApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CitySelect } from '@/components/CitySelect';
import { useAuthStore } from '@/store/authStore';

export function CreateTeam() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    city: user?.city || '',
    logoUrl: '',
    preferredPitchId: '',
  });

  const { data: pitchesData } = useQuery({
    queryKey: ['pitches'],
    queryFn: () => pitchesApi.getAll(),
  });

  const pitches = pitchesData?.data.data || [];

  const createMutation = useMutation({
    mutationFn: teamsApi.create,
    onSuccess: (response) => {
      // Invalidate teams queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      
      toast({
        title: t('teams.teamCreatedSuccess'),
        description: t('teams.teamCreatedSuccessDesc'),
      });
      
      // Navigate to the team detail page
      // The response structure is { data: { team: {...}, captain: {...}, preferredPitch: {...} } }
      const teamId = response.data.data?.team?.id;
      if (teamId) {
        navigate(`/teams/${teamId}`);
      } else {
        // Fallback: navigate to teams list if ID is missing
        console.error('Team ID not found in response:', response.data);
        navigate('/teams');
      }
    },
    onError: (error: any) => {
      console.error('Create team error:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('teams.teamCreateError'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.city) {
      toast({
        title: t('teams.validationError'),
        description: t('teams.fillRequiredFields'),
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate({
      name: formData.name,
      city: formData.city,
      logoUrl: formData.logoUrl || undefined,
      preferredPitchId: formData.preferredPitchId || undefined,
    });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 page-section">
      <Breadcrumbs
        items={[
          { label: t('teams.title'), href: '/teams' },
          { label: t('teams.createTeam') },
        ]}
        className="mb-6"
      />

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>{t('teams.createNewTeam')}</CardTitle>
          <CardDescription>{t('teams.createTeamSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('teams.teamName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('teams.teamNamePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">{t('teams.city')} *</Label>
              <CitySelect
                value={formData.city}
                onChange={(value) => setFormData({ ...formData, city: value })}
                placeholder={t('teams.cityPlaceholder')}
                required
                allowEmpty={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">{t('teams.logoUrl')}</Label>
              <Input
                id="logoUrl"
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder={t('teams.logoUrlPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredPitch">{t('teams.preferredPitch')}</Label>
              <Select
                value={formData.preferredPitchId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, preferredPitchId: value === 'none' ? '' : value })}
              >
                <SelectTrigger id="preferredPitch">
                  <SelectValue placeholder={t('teams.selectPitch')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('teams.none')}</SelectItem>
                  {pitches.map((pitch: any) => (
                    <SelectItem key={pitch.id} value={pitch.id}>
                      {pitch.name} - {pitch.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/teams')}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                {createMutation.isPending ? t('teams.creating') : t('teams.createTeam')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

