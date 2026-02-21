"use client";

import { useState } from "react";
import { LoginPage } from "@/components/login-page";
import { AdminDashboard } from "@/components/admin-dashboard";
import { SurveyorDashboard } from "@/components/surveyor-dashboard";
import { SurveyStepper } from "@/components/survey-stepper";
import type { Surveyor } from "@/lib/store";

type AppScreen =
  | { type: "login" }
  | { type: "admin" }
  | { type: "surveyor"; surveyor: Surveyor }
  | { type: "survey"; surveyorId: string; village: string; surveyor: Surveyor };

export default function Page() {
  const [screen, setScreen] = useState<AppScreen>({ type: "login" });

  if (screen.type === "login") {
    return (
      <LoginPage
        onAdminLogin={() => setScreen({ type: "admin" })}
        onSurveyorLogin={(surveyor) => setScreen({ type: "surveyor", surveyor })}
      />
    );
  }

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
