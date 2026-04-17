"use client";

import { useEffect, useState } from "react";
import { LoginPage } from "@/components/login-page";
import { AdminDashboard } from "@/components/admin-dashboard";
import { SurveyorDashboard } from "@/components/surveyor-dashboard";
import { SurveyStepper } from "@/components/survey-stepper-complete";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

type AppScreen =
  | { type: "login" }
  | { type: "admin" }
  | { type: "surveyor"; surveyor: any; initialVillage?: string }
  | { type: "survey"; surveyorId: string; village: string; surveyor: any; surveyId?: string; mode?: 'new' | 'update' };

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
        surveyId={screen.surveyId}
        mode={screen.mode || 'new'}
        onComplete={() => {
          toast.custom((t) => (
            <div className="relative flex w-[356px] max-w-full flex-col rounded-lg border border-[#a5d6a7] bg-[#e8f5e9] p-4 shadow-lg overflow-hidden">
              <style>{`
                @keyframes toast-progress {
                  from { width: 100%; }
                  to { width: 0%; }
                }
              `}</style>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-[#1b5e20] text-base">Success</h3>
                  <p className="mt-1 text-sm text-[#2e7d32]">Survey submitted successfully.</p>
                </div>
                <button
                  onClick={() => toast.dismiss(t)}
                  className="rounded-md p-1 text-[#2e7d32] hover:bg-[#c8e6c9] focus:outline-none transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[#c8e6c9]">
                <div
                  className="h-full bg-[#388e3c]"
                  style={{ animation: 'toast-progress 4s linear forwards' }}
                />
              </div>
            </div>
          ), { position: "top-center", duration: 4000 });
          setScreen({ type: "surveyor", surveyor: screen.surveyor, initialVillage: screen.village });
        }}
        onCancel={() => setScreen({ type: "surveyor", surveyor: screen.surveyor, initialVillage: screen.village })}
      />
    );
  }

  if (screen.type === "surveyor") {
    return (
      <SurveyorDashboard
        surveyor={screen.surveyor}
        initialVillage={screen.initialVillage}
        onLogout={() => setScreen({ type: "login" })}
        onStartSurvey={(surveyorId, village, surveyId, mode) =>
          setScreen({ type: "survey", surveyorId, village, surveyor: screen.surveyor, surveyId, mode })
        }
      />
    );
  }

  return null;
}
