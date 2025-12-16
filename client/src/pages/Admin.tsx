import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function Admin() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Link to="/admin/pitches">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Manage Pitches</CardTitle>
              <CardDescription>Create, edit, and manage football pitches</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>Go to Pitches Management</Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/bookings">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>View Bookings</CardTitle>
              <CardDescription>View and manage all bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>Go to Bookings</Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

