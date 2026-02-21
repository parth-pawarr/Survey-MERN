"use client";

import { useEffect, useState } from "react";
import { LoginPage } from "@/components/login-page";
import { AdminDashboard } from "@/components/admin-dashboard";
import { SurveyorDashboard } from "@/components/surveyor-dashboard";
import { SurveyStepper } from "@/components/survey-stepper-complete";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type AppScreen =
  | { type: "login" }
  | { type: "admin" }
  | { type: "surveyor"; surveyor: any }
  | { type: "survey"; surveyorId: string; village: string; surveyor: any };

export default function Page() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [screen, setScreen] = useState<AppScreen>({ type: "login" });

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        setScreen({ type: "admin" });
      } else if (user.role === 'surveyor') {
        setScreen({ type: "surveyor", surveyor: user });
      }
    } else {
      setScreen({ type: "login" });
    }
  }, [isAuthenticated, user]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginPage
        onAdminLogin={() => setScreen({ type: "admin" })}
        onSurveyorLogin={(surveyor) => setScreen({ type: "surveyor", surveyor })}
      />
    );
  }

  // Show appropriate screen based on user role
  if (screen.type === "admin") {
    return <AdminDashboard onLogout={() => setScreen({ type: "login" })} />;
  }

  if (screen.type === "survey") {
    return (
      <SurveyStepper
        surveyorId={screen.surveyorId}
        village={screen.village}
        onComplete={() => setScreen({ type: "surveyor", surveyor: screen.surveyor })}
        onCancel={() => setScreen({ type: "surveyor", surveyor: screen.surveyor })}
      />
    );
  }

  if (screen.type === "surveyor") {
    return (
      <SurveyorDashboard
        surveyor={screen.surveyor}
        onLogout={() => setScreen({ type: "login" })}
        onStartSurvey={(surveyorId, village) =>
          setScreen({ type: "survey", surveyorId, village, surveyor: screen.surveyor })
        }
      />
    );
  }

  return null;
}
