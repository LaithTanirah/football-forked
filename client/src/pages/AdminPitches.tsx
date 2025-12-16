import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pitchesApi, adminApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminPitches() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    indoor: false,
    description: '',
    pricePerHour: '',
    images: '',
  });

  const { data } = useQuery({
    queryKey: ['pitches'],
    queryFn: () => pitchesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createPitch,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Pitch created successfully!' });
      queryClient.invalidateQueries({ queryKey: ['pitches'] });
      setIsCreating(false);
      setFormData({
        name: '',
        city: '',
        address: '',
        indoor: false,
        description: '',
        pricePerHour: '',
        images: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create pitch',
        variant: 'destructive',
      });
    },
  });

  const pitches = data?.data.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      pricePerHour: parseInt(formData.pricePerHour),
      images: formData.images ? formData.images.split(',').map((url) => url.trim()) : [],
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Pitches</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : 'Create New Pitch'}
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Pitch</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price per Hour (JOD)</Label>
                  <Input
                    type="number"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Indoor</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={formData.indoor.toString()}
                    onChange={(e) => setFormData({ ...formData, indoor: e.target.value === 'true' })}
                  >
                    <option value="false">Outdoor</option>
                    <option value="true">Indoor</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Image URLs (comma-separated)</Label>
                  <Input
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  />
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Pitch'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pitches.map((pitch: any) => (
          <Card key={pitch.id}>
            <CardHeader>
              <CardTitle>{pitch.name}</CardTitle>
              <CardDescription>{pitch.city}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{pitch.pricePerHour} JOD/hour</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

