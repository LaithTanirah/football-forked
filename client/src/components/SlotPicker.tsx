import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { pitchesApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isTomorrow, addDays } from "date-fns";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";
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

  // Generate next 7 days for quick selection
  const quickDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return t("common.today", "Today");
    if (isTomorrow(date)) return t("common.tomorrow", "Tomorrow");
    return format(date, "EEE, MMM d");
  };

  return (
    <div className="space-y-6">
      {/* Quick Date Selection */}
      <div>
        <label className="mb-3 block text-sm font-semibold text-foreground">
          <Calendar className="mr-2 inline h-4 w-4" />
          {t("pitchDetail.selectDate", "Select Date")}
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {quickDates.map((date) => {
            const isSelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
            return (
              <button
                key={format(date, "yyyy-MM-dd")}
                onClick={() => {
                  onDateChange(date);
                  onTimeSelect("");
                }}
                className={cn(
                  "flex min-w-[100px] flex-col items-center gap-1 rounded-xl border-2 px-4 py-3 transition-all",
                  "hover:scale-105 hover:shadow-md",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-md"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                <span className="text-xs font-medium opacity-70">
                  {format(date, "EEE")}
                </span>
                <span className="text-lg font-bold">
                  {format(date, "d")}
                </span>
                <span className="text-xs font-medium opacity-70">
                  {format(date, "MMM")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Date Input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">
          {t("pitchDetail.orSelectCustomDate", "Or select a custom date")}
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
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <label className="mb-3 block text-sm font-semibold text-foreground">
            <Clock className="mr-2 inline h-4 w-4" />
            {t("pitchDetail.selectTime", "Select Time")}
            {selectedDate && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({getDateLabel(selectedDate)})
              </span>
            )}
          </label>
          
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-muted bg-muted/30 p-8 text-center">
              <Clock className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                {t("pitchDetail.noSlotsAvailable")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {t("pitchDetail.tryAnotherDate", "Try selecting another date")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {availableSlots.map((slot) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => onTimeSelect(slot)}
                      className={cn(
                        "group relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 py-3 transition-all",
                        "hover:scale-105 hover:shadow-lg",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20"
                          : "border-border bg-card hover:border-primary/50 hover:bg-accent"
                      )}
                    >
                      {isSelected && (
                        <CheckCircle2 className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-primary text-primary-foreground" />
                      )}
                      <span className="text-lg font-bold">{slot}</span>
                      <span className="text-xs opacity-70">
                        {t("pitchDetail.hour", "hour")}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {availableSlots.length} {t("pitchDetail.slotsAvailable", "slots available")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
