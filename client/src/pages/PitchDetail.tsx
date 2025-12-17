import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { pitchesApi, bookingsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/use-toast";
import { SlotPicker } from "@/components/SlotPicker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { format } from "date-fns";
import { MapPin, DollarSign, Clock, Home } from "lucide-react";

export function PitchDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["pitch", id],
    queryFn: () => pitchesApi.getById(id!),
    enabled: !!id,
  });

  const bookingMutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("pitchDetail.bookingSuccess"),
      });
      navigate("/me/bookings");
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message || t("pitchDetail.bookingError"),
        variant: "destructive",
      });
    },
  });

  const pitch = data?.data.data;

  const handleBook = () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    if (!selectedDate || !selectedTime || !id) {
      toast({
        title: t("common.error"),
        description: t("pitchDetail.selectDateAndTimeError"),
        variant: "destructive",
      });
      return;
    }

    bookingMutation.mutate({
      pitchId: id,
      date: format(selectedDate, "yyyy-MM-dd"),
      startTime: selectedTime,
      durationMinutes: 60,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-6 h-6 w-48" />
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!pitch) {
    return (
      <div className="container mx-auto max-w-[1200px] px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {t("pitchDetail.pitchNotFound")}
            </p>
            <Button onClick={() => navigate("/pitches")} className="mt-4">
              {t("pitchDetail.backToPitches")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-6 page-section">
      <Breadcrumbs
        items={[
          { label: t("nav.pitches"), href: "/pitches" },
          { label: pitch.name },
        ]}
        className="mb-6"
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          {pitch.images && pitch.images.length > 0 ? (
            <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg bg-muted card-elevated">
              <img
                src={pitch.images[0]}
                alt={pitch.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/800x450?text=Football+Pitch";
                }}
              />
            </div>
          ) : (
            <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg bg-muted card-elevated flex items-center justify-center">
              <Home className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}

          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-2xl">{pitch.name}</CardTitle>
                <Badge variant={pitch.indoor ? "secondary" : "outline"}>
                  {pitch.indoor ? t("pitches.indoor") : t("pitches.outdoor")}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4" />
                {pitch.address}, {pitch.city}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pitch.description && (
                <p className="text-muted-foreground">{pitch.description}</p>
              )}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">
                    {pitch.pricePerHour} JOD/hour
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {pitch.openTime} - {pitch.closeTime}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>{t("pitchDetail.bookThisPitch")}</CardTitle>
            </CardHeader>
            <CardContent>
              <SlotPicker
                pitchId={id!}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateChange={setSelectedDate}
                onTimeSelect={setSelectedTime}
              />
            </CardContent>
          </Card>

          {selectedDate && selectedTime && (
            <Card className="mt-4 card-elevated">
              <CardHeader>
                <CardTitle>{t("pitchDetail.bookingSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("pitchDetail.date")}
                    </span>
                    <span className="font-semibold">
                      {format(selectedDate, "PPP")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("pitchDetail.availableTimes")}
                    </span>
                    <span className="font-semibold">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("pitchDetail.duration")}
                    </span>
                    <span className="font-semibold">
                      1 {t("pitchDetail.hour")}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">
                        {t("pitchDetail.total")}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {pitch.pricePerHour} JOD
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBook}
                  disabled={bookingMutation.isPending}
                >
                  {bookingMutation.isPending
                    ? t("pitchDetail.booking")
                    : t("pitchDetail.confirmBooking")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
