import { useState, useEffect } from 'react';
import { pitchesApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface SlotPickerProps {
  pitchId: string;
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateChange: (date: Date) => void;
  onTimeSelect: (time: string) => void;
}

export function SlotPicker({ pitchId, selectedDate, selectedTime, onDateChange, onTimeSelect }: SlotPickerProps) {
  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['availability', pitchId, dateString],
    queryFn: () => pitchesApi.getAvailability(pitchId, dateString!),
    enabled: !!dateString,
  });

  useEffect(() => {
    if (dateString) {
      refetch();
    }
  }, [dateString, refetch]);

  const availableSlots = data?.data.data.availableSlots || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Date & Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Date</label>
          <input
            type="date"
            min={format(new Date(), 'yyyy-MM-dd')}
            value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => {
              if (e.target.value) {
                onDateChange(new Date(e.target.value));
                onTimeSelect('');
              }
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          />
        </div>

        {selectedDate && (
          <div>
            <label className="mb-2 block text-sm font-medium">Available Times</label>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : availableSlots.length === 0 ? (
              <div className="text-sm text-muted-foreground">No available slots for this date</div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedTime === slot ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onTimeSelect(slot)}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

