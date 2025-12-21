import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { pitchesApi, bookingsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/use-toast";
import { SlotPicker } from "@/components/SlotPicker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { format } from "date-fns";
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Home, 
  Calendar,
  CheckCircle2,
  Star,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <Skeleton className="mb-6 h-6 w-48" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-[16/9] w-full rounded-3xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-[600px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!pitch) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="container mx-auto max-w-[1200px] px-4 py-6">
          <Card className="rounded-3xl border-0 shadow-2xl">
            <CardContent className="py-16 text-center">
              <Home className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
              <p className="mb-6 text-lg text-muted-foreground">
                {t("pitchDetail.pitchNotFound")}
              </p>
              <Button onClick={() => navigate("/pitches")} size="lg" className="rounded-xl">
                {t("pitchDetail.backToPitches")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-6 lg:py-10">
        {/* Breadcrumb */}
        <Breadcrumbs
          items={[
            { label: t("nav.pitches"), href: "/pitches" },
            { label: pitch.name },
          ]}
          className="mb-6"
        />

        {/* Hero Section */}
        <div className="mb-8">
          {/* Image Hero */}
          {pitch.images && pitch.images.length > 0 ? (
            <div className="group relative mb-6 aspect-[21/9] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
              <img
                src={pitch.images[0]}
                alt={pitch.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/1600x600?text=Pitch";
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 z-20 p-8">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge 
                    variant={pitch.typeKey === 'indoor' ? "secondary" : "default"}
                    className="text-sm px-4 py-2 rounded-full"
                  >
                    {pitch.type || (pitch.indoor ? t("pitches.indoor") : t("pitches.outdoor"))}
                  </Badge>
                  <div className="flex items-center gap-2 text-white/90">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{pitch.city}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 aspect-[21/9] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-2xl">
              <Home className="h-24 w-24 text-muted-foreground/30" />
            </div>
          )}

          {/* Title Section */}
          <div className="mb-6">
            <h1 className="mb-3 text-4xl font-bold tracking-tight lg:text-5xl">
              {pitch.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{pitch.address}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{pitch.openTime} - {pitch.closeTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Info Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Price Card */}
              <Card className="rounded-2xl border-0 bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-sm font-medium text-muted-foreground">
                        {t("pitches.pricePerHour")}
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {pitch.pricePerHour}
                        <span className="ml-1 text-lg text-muted-foreground">
                          {t("common.currency")}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-full bg-primary/20 p-3">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hours Card */}
              <Card className="rounded-2xl border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-sm font-medium text-muted-foreground">
                        {t("pitchDetail.openingHours")}
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {pitch.openTime} - {pitch.closeTime}
                      </p>
                    </div>
                    <div className="rounded-full bg-blue-500/20 p-3">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description Card */}
            {pitch.description && (
              <Card className="rounded-2xl border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    {t("common.description")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-foreground">
                    {pitch.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Booking Panel */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            <Card className="rounded-3xl border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Calendar className="h-6 w-6 text-primary" />
                  {t("pitchDetail.bookThisPitch")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <SlotPicker
                  pitchId={id!}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onDateChange={setSelectedDate}
                  onTimeSelect={setSelectedTime}
                />
              </CardContent>
            </Card>

            {/* Booking Summary */}
            {selectedDate && selectedTime && (
              <Card className="mt-6 rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    {t("pitchDetail.bookingSummary")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-3 rounded-xl bg-background/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t("pitchDetail.date")}
                      </span>
                      <span className="font-semibold text-foreground">
                        {format(selectedDate, "PPP")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t("pitchDetail.availableTimes")}
                      </span>
                      <span className="font-semibold text-foreground">{selectedTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t("pitchDetail.duration")}
                      </span>
                      <span className="font-semibold text-foreground">
                        1 {t("pitchDetail.hour")}
                      </span>
                    </div>
                  </div>
                  
                  <div className="rounded-xl border-2 border-primary/30 bg-primary/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-foreground">
                        {t("pitchDetail.total")}
                      </span>
                      <span className="text-3xl font-bold text-primary">
                        {pitch.pricePerHour} {t("common.currency")}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-14 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                    onClick={handleBook}
                    disabled={bookingMutation.isPending}
                  >
                    {bookingMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Clock className="h-5 w-5 animate-spin" />
                        {t("pitchDetail.booking")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {t("pitchDetail.confirmBooking")}
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
