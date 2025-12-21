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
    type?: string; // Localized type (e.g., "داخلي" or "Indoor")
    indoor?: boolean; // Legacy field for backward compatibility
    description?: string;
    pricePerHour: number;
    images?: string[];
  };
}

export function PitchCard({ pitch }: PitchCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="card-elevated overflow-hidden h-full flex flex-col">
      {/* Image Section - Fixed Height */}
      {pitch.images && pitch.images.length > 0 && (
        <div className="h-48 w-full overflow-hidden bg-muted flex-shrink-0">
          <img
            src={pitch.images[0]}
            alt={pitch.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450?text=Pitch';
            }}
          />
        </div>
      )}
      
      {/* Header Section - Fixed */}
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="line-clamp-2 min-h-[3rem]">{pitch.name}</CardTitle>
        <CardDescription className="flex items-center gap-2 mt-2">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {pitch.city} • {pitch.type || (pitch.indoor ? t("pitches.indoor") : t("pitches.outdoor"))}
          </span>
        </CardDescription>
      </CardHeader>
      
      {/* Content Section - Flexible, grows to fill space */}
      <CardContent className="flex-grow flex flex-col min-h-0">
        {pitch.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-shrink-0">{pitch.description}</p>
        )}
        {/* Price Section - Pushed to bottom of content area */}
        <div className="flex items-center gap-2 mt-auto pt-2 flex-shrink-0">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">
            {pitch.pricePerHour} {t("pitches.pricePerHour")}
          </span>
        </div>
      </CardContent>
      
      {/* Footer Section - Fixed at bottom */}
      <CardFooter className="flex-shrink-0 pt-0 pb-4 px-6">
        <Link to={`/pitches/${pitch.id}`} className="w-full">
          <Button className="w-full">{t("pitches.viewDetails")}</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

