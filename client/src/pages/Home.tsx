import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, Users, Calendar } from "lucide-react";

export function Home() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-12 page-section">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-6 text-5xl font-bold">{t("home.title")}</h1>
        <p className="mb-8 text-xl text-muted-foreground">
          {t("home.subtitle")}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/pitches">
            <Button size="lg">{t("home.browsePitches")}</Button>
          </Link>
          <Link to="/teams">
            <Button size="lg" variant="outline">
              {t("home.findTeams")}
            </Button>
          </Link>
          <Link to="/leagues">
            <Button size="lg" variant="outline">
              {t("home.joinLeagues")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
        <Card className="card-elevated">
          <CardHeader>
            <Calendar className="mb-2 h-8 w-8 text-primary" />
            <CardTitle>{t("home.bookPitches")}</CardTitle>
            <CardDescription>{t("home.bookPitchesDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/pitches">
              <Button variant="outline" className="w-full">
                {t("home.browsePitches")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <Users className="mb-2 h-8 w-8 text-primary" />
            <CardTitle>{t("home.createTeams")}</CardTitle>
            <CardDescription>{t("home.createTeamsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/teams">
              <Button variant="outline" className="w-full">
                {t("home.findTeams")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <Trophy className="mb-2 h-8 w-8 text-primary" />
            <CardTitle>{t("home.joinLeagues")}</CardTitle>
            <CardDescription>{t("home.joinLeaguesDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/leagues">
              <Button variant="outline" className="w-full">
                {t("home.joinLeagues")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
