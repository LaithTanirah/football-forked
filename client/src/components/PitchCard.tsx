import { Link } from 'react-router-dom';
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
  return (
    <Card className="overflow-hidden">
      {pitch.images && pitch.images.length > 0 && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
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
      <CardHeader>
        <CardTitle>{pitch.name}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {pitch.city} • {pitch.indoor ? 'Indoor' : 'Outdoor'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">{pitch.description}</p>
        <div className="mt-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <span className="font-semibold">{pitch.pricePerHour} JOD/hour</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link to={`/pitches/${pitch.id}`} className="w-full">
          <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

