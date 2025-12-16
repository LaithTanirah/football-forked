import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export function MyBookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingsApi.getMyBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: bookingsApi.cancel,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Booking cancelled successfully' });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel booking',
        variant: 'destructive',
      });
    },
  });

  const bookings = data?.data.data || [];

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">My Bookings</h1>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No bookings yet. <a href="/pitches" className="text-primary hover:underline">Browse pitches</a>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking: any) => (
            <Card key={booking.id}>
              <CardHeader>
                <CardTitle>{booking.pitch?.name}</CardTitle>
                <CardDescription>
                  {booking.pitch?.city} • {booking.pitch?.indoor ? 'Indoor' : 'Outdoor'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">Date:</span> {format(new Date(booking.date), 'PPP')}
                  </p>
                  <p>
                    <span className="font-semibold">Time:</span> {booking.startTime} ({booking.durationMinutes} min)
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{' '}
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : booking.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </p>
                  {booking.status === 'CONFIRMED' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => cancelMutation.mutate(booking.id)}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

