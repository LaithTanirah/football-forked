import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CitySelect } from "@/components/CitySelect";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    city: "",
  });

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (response) => {
      setUser(response.data.data.user);
      toast({
        title: t("common.success"),
        description: t("auth.registerSuccess"),
      });
      navigate("/pitches");
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("auth.registerError"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-[1200px] px-4 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-12rem)]">
          {/* Brand Section - Left (Desktop) / Top (Mobile) */}
          <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-6 py-8 lg:py-0">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">⚽</span>
              <span className="text-3xl font-bold">6-a-Side</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
              {t("home.brandHeadline")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              {t("home.brandSubtitle")}
            </p>
            <div 
              className="hidden lg:block w-full h-64 rounded-2xl mt-8"
              style={{
                background: `linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--primary)/0.05))`
              }}
            />
          </div>

          {/* Form Section - Right (Desktop) / Bottom (Mobile) */}
          <div className="flex justify-center lg:justify-end w-full">
            <Card className="w-full max-w-[420px] card-elevated">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">{t("auth.register")}</CardTitle>
                <CardDescription className="text-base">
                  {t("auth.registerSubtitle")}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      {t("auth.name")}
                    </Label>
                    <Input
                      id="name"
                      placeholder={t("auth.name")}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="h-[52px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      {t("auth.username")}
                    </Label>
                    <Input
                      id="username"
                      placeholder={t("auth.username")}
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                      className="h-[52px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      {t("auth.email")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("auth.email")}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="h-[52px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      {t("auth.password")}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t("auth.password")}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      minLength={6}
                      className="h-[52px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      {t("auth.phone")}
                    </Label>
                    <Input
                      id="phone"
                      placeholder={t("auth.phone")}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="h-[52px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">
                      {t("auth.city")}
                    </Label>
                    <CitySelect
                      value={formData.city}
                      onChange={(value) =>
                        setFormData({ ...formData, city: value })
                      }
                      placeholder={t("auth.city")}
                      allowEmpty={true}
                      className="h-[52px]"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? t("common.loading") : t("auth.register")}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    {t("auth.alreadyHaveAccount")}{" "}
                    <Link
                      to="/auth/login"
                      className="text-primary hover:underline font-medium"
                    >
                      {t("auth.login")}
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
