import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { pitchesApi, bookingsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/use-toast';
import { SlotPicker } from '@/components/SlotPicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { MapPin, DollarSign, Clock } from 'lucide-react';

export function PitchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pitch', id],
    queryFn: () => pitchesApi.getById(id!),
    enabled: !!id,
  });

  const bookingMutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Booking created successfully!' });
      navigate('/me/bookings');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create booking',
        variant: 'destructive',
      });
    },
  });

  const pitch = data?.data.data;

  const handleBook = () => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    if (!selectedDate || !selectedTime || !id) {
      toast({
        title: 'Error',
        description: 'Please select a date and time',
        variant: 'destructive',
      });
      return;
    }

    bookingMutation.mutate({
      pitchId: id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: selectedTime,
      durationMinutes: 60,
    });
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!pitch) {
    return <div className="container mx-auto px-4 py-8">Pitch not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          {pitch.images && pitch.images.length > 0 && (
            <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <img
                src={pitch.images[0]}
                alt={pitch.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450?text=Football+Pitch';
                }}
              />
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{pitch.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {pitch.address}, {pitch.city}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{pitch.description}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold">{pitch.pricePerHour} JOD/hour</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{pitch.indoor ? 'Indoor' : 'Outdoor'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <SlotPicker
            pitchId={id!}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateChange={setSelectedDate}
            onTimeSelect={setSelectedTime}
          />

          {selectedDate && selectedTime && (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Selected Date</p>
                    <p className="font-semibold">{format(selectedDate, 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Selected Time</p>
                    <p className="font-semibold">{selectedTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-semibold">{pitch.pricePerHour} JOD</p>
                  </div>
                  <Button className="w-full" onClick={handleBook} disabled={bookingMutation.isPending}>
                    {bookingMutation.isPending ? 'Booking...' : 'Book Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

