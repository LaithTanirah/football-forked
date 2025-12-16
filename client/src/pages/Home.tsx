import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-6 text-5xl font-bold">Book Your 6-a-Side Football Pitch</h1>
        <p className="mb-8 text-xl text-muted-foreground">
          Find and book the perfect football pitch across Jordan. Amman, Irbid, Zarqa, Aqaba and more.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/pitches">
            <Button size="lg">Browse Pitches</Button>
          </Link>
          <Link to="/auth/register">
            <Button size="lg" variant="outline">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

