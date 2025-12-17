import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign } from 'lucide-react';

interface PitchCardProps {
  pitch: {
    id: string;
    name: string;
    city: string;
    address: string;
    indoor: boolean;
    description?: string;
    pricePerHour: number;
    images?: string[];
  };
}

export function PitchCard({ pitch }: PitchCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="card-elevated overflow-hidden h-full flex flex-col">
      {pitch.images && pitch.images.length > 0 && (
        <div className="h-48 w-full overflow-hidden bg-muted flex-shrink-0">
          <img
            src={pitch.images[0]}
            alt={pitch.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450?text=Football+Pitch';
            }}
          />
        </div>
      )}
      <CardHeader className="flex-shrink-0">
        <CardTitle className="line-clamp-2">{pitch.name}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {pitch.city} • {pitch.indoor ? t("pitches.indoor") : t("pitches.outdoor")}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {pitch.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{pitch.description}</p>
        )}
        <div className="flex items-center gap-2 mt-auto">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">
            {pitch.pricePerHour} {t("pitches.pricePerHour")}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex-shrink-0 pt-4">
        <Link to={`/pitches/${pitch.id}`} className="w-full">
          <Button className="w-full">{t("pitches.viewDetails")}</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

