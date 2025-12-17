import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { pitchesApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlotPickerProps {
  pitchId: string;
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateChange: (date: Date) => void;
  onTimeSelect: (time: string) => void;
}

export function SlotPicker({
  pitchId,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeSelect,
}: SlotPickerProps) {
  const { t } = useTranslation();
  const dateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["availability", pitchId, dateString],
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
        <CardTitle>{t("pitchDetail.selectDateAndTime")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            {t("pitchDetail.date")}
          </label>
          <input
            type="date"
            min={format(new Date(), "yyyy-MM-dd")}
            value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
            onChange={(e) => {
              if (e.target.value) {
                onDateChange(new Date(e.target.value));
                onTimeSelect("");
              }
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          />
        </div>

        {selectedDate && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("pitchDetail.availableTimes")}
            </label>
            {isLoading ? (
              <div className="grid grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
                {t("pitchDetail.noSlotsAvailable")}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedTime === slot ? "default" : "outline"}
                    size="sm"
                    onClick={() => onTimeSelect(slot)}
                    className={cn(
                      "transition-all",
                      selectedTime === slot && "ring-2 ring-ring ring-offset-2"
                    )}
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
