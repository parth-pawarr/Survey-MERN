"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Surveyor,
  getSurveysBySurveyor,
  getBadge,
} from "@/lib/store";
import { LogOut, MapPin, Award } from "lucide-react";

interface SurveyorDashboardProps {
  surveyor: Surveyor;
  onLogout: () => void;
  onStartSurvey: (surveyorId: string, village: string) => void;
}

export function SurveyorDashboard({ surveyor, onLogout, onStartSurvey }: SurveyorDashboardProps) {
  const [selectedVillage, setSelectedVillage] = useState<string>("");
  const [showPerformance, setShowPerformance] = useState(false);

  if (showPerformance) {
    return (
      <SurveyorPerformance
        surveyor={surveyor}
        onBack={() => setShowPerformance(false)}
        onLogout={onLogout}
      />
    );
  }

  if (!selectedVillage) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">{surveyor.name}</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowPerformance(true)} className="text-xs h-7 px-2">
              <Award className="size-3.5 mr-1" />
              Stats
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="size-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-sm p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4 text-primary" />
                Select Village
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Choose a village to begin surveying households
              </p>
            </CardHeader>
            <CardContent>
              {surveyor.villages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  No villages assigned. Ask admin to assign villages.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <Select onValueChange={setSelectedVillage}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a village" />
                    </SelectTrigger>
                    <SelectContent>
                      {surveyor.villages.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
        <div>
          <h1 className="text-base font-semibold text-foreground">{surveyor.name}</h1>
          <p className="text-xs text-muted-foreground">{selectedVillage}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowPerformance(true)} className="text-xs h-7 px-2">
            <Award className="size-3.5 mr-1" />
            Stats
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="size-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-sm p-4">
        <Card>
          <CardContent className="py-6 flex flex-col items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="size-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Active Village: {selectedVillage}</p>
              <p className="text-xs text-muted-foreground mt-1">
                All surveys in this session will be recorded for this village
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => onStartSurvey(surveyor.id, selectedVillage)}
            >
              Start New Household Survey
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedVillage("")}
              className="text-xs"
            >
              Change Village
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// --- Surveyor Performance & Badges ---
function SurveyorPerformance({
  surveyor,
  onBack,
  onLogout,
}: {
  surveyor: Surveyor;
  onBack: () => void;
  onLogout: () => void;
}) {
  const mySurveys = getSurveysBySurveyor(surveyor.id);
  const totalCount = mySurveys.length;
  const badge = getBadge(totalCount);

  const perVillage: Record<string, number> = {};
  surveyor.villages.forEach((v) => { perVillage[v] = 0; });
  mySurveys.forEach((s) => {
    perVillage[s.village] = (perVillage[s.village] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
        <h1 className="text-base font-semibold text-foreground">My Performance</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-xs h-7 px-2">
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="size-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-sm p-4 flex flex-col gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-primary">{totalCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Houses Surveyed</p>
            {badge && (
              <div className="mt-3">
                <Badge className={`${badge.color} text-xs px-3 py-1`}>
                  {badge.label} Badge
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Badge Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                { count: 10, label: "Bronze", earned: totalCount >= 10 },
                { count: 25, label: "Silver", earned: totalCount >= 25 },
                { count: 50, label: "Gold", earned: totalCount >= 50 },
                { count: 100, label: "Platinum", earned: totalCount >= 100 },
              ].map((b) => (
                <div
                  key={b.label}
                  className={`rounded-lg border p-2 text-center ${
                    b.earned ? "border-primary bg-primary/5" : "opacity-50"
                  }`}
                >
                  <p className="text-xs font-medium text-foreground">{b.label}</p>
                  <p className="text-xs text-muted-foreground">{b.count}+ surveys</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Surveys per Village</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(perVillage).length === 0 ? (
              <p className="text-xs text-muted-foreground">No villages assigned</p>
            ) : (
              <div className="flex flex-col gap-2">
                {Object.entries(perVillage).map(([village, count]) => (
                  <div key={village} className="flex items-center justify-between rounded-md border p-2">
                    <span className="text-xs text-foreground">{village}</span>
                    <span className="text-sm font-semibold text-primary">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
