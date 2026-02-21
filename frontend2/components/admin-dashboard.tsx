"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type Surveyor,
  VILLAGES,
  getSurveyors,
  saveSurveyors,
  getSurveys,
} from "@/lib/store";
import { LogOut, X } from "lucide-react";

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [surveyors, setSurveyors] = useState<Surveyor[]>(getSurveyors());

  const refreshSurveyors = () => {
    setSurveyors(getSurveyors());
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
        <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut className="size-4" />
          <span className="sr-only">Logout</span>
        </Button>
      </header>

      <main className="mx-auto max-w-lg p-4 flex flex-col gap-4">
        {/* A. Add Surveyor Form */}
        <AddSurveyorSection onAdded={refreshSurveyors} />

        {/* B. Surveyor List with Village Assignment */}
        <SurveyorListSection surveyors={surveyors} onUpdated={refreshSurveyors} />

        {/* C. Analytics Section */}
        <AnalyticsSection />
      </main>
    </div>
  );
}

// --- A. Add Surveyor Form ---
function AddSurveyorSection({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mobileError, setMobileError] = useState("");

  const handleMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setMobile(digits);
    if (digits.length > 0 && digits.length !== 10) {
      setMobileError("Mobile number must be exactly 10 digits");
    } else {
      setMobileError("");
    }
  };

  const handleSubmit = () => {
    if (!name || !mobile || !username || !password) return;
    if (mobile.length !== 10) {
      setMobileError("Mobile number must be exactly 10 digits");
      return;
    }
    const surveyors = getSurveyors();
    const newSurveyor: Surveyor = {
      id: Date.now().toString(),
      name,
      mobile,
      username,
      password,
      villages: [],
    };
    surveyors.push(newSurveyor);
    saveSurveyors(surveyors);
    setName("");
    setMobile("");
    setUsername("");
    setPassword("");
    setMobileError("");
    onAdded();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Add Surveyor</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-name" className="text-xs">Surveyor Name</Label>
          <Input id="s-name" placeholder="Enter name" value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-mobile" className="text-xs">Mobile Number</Label>
          <Input
            id="s-mobile"
            placeholder="Enter 10-digit mobile number"
            value={mobile}
            onChange={(e) => handleMobileChange(e.target.value)}
            className="h-9"
            type="tel"
            inputMode="numeric"
            maxLength={10}
          />
          {mobileError && <p className="text-xs text-destructive">{mobileError}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-user" className="text-xs">Username</Label>
          <Input id="s-user" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-pass" className="text-xs">Password</Label>
          <Input id="s-pass" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-9" />
        </div>
        <Button onClick={handleSubmit} className="mt-1" disabled={!name || !mobile || mobile.length !== 10 || !username || !password}>
          Add Surveyor
        </Button>
      </CardContent>
    </Card>
  );
}

// --- B. Surveyor List with Village Assignment ---
function SurveyorListSection({
  surveyors,
  onUpdated,
}: {
  surveyors: Surveyor[];
  onUpdated: () => void;
}) {
  const toggleVillage = (surveyorId: string, village: string) => {
    const all = getSurveyors();
    const idx = all.findIndex((s) => s.id === surveyorId);
    if (idx === -1) return;
    const current = all[idx].villages;
    if (current.includes(village)) {
      all[idx].villages = current.filter((v) => v !== village);
    } else {
      if (current.length >= 5) return;
      all[idx].villages = [...current, village];
    }
    saveSurveyors(all);
    onUpdated();
  };

  if (surveyors.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No surveyors added yet. Add a surveyor first.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">Surveyor List & Village Assignment</h2>
      {surveyors.map((surveyor) => (
        <Card key={surveyor.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">{surveyor.name}</CardTitle>
                <p className="text-xs text-muted-foreground">@{surveyor.username}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {surveyor.villages.length}/5 villages
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {surveyor.villages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {surveyor.villages.map((v) => (
                  <Badge key={v} variant="secondary" className="gap-1 text-xs">
                    {v}
                    <button
                      onClick={() => toggleVillage(surveyor.id, v)}
                      className="ml-0.5"
                      aria-label={`Remove ${v}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {VILLAGES.filter((v) => !surveyor.villages.includes(v)).map((village) => (
                <label
                  key={village}
                  className="flex items-center gap-2 text-xs cursor-pointer rounded-md border p-2"
                >
                  <Checkbox
                    checked={false}
                    disabled={surveyor.villages.length >= 5}
                    onCheckedChange={() => toggleVillage(surveyor.id, village)}
                  />
                  {village}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- C. Analytics Section ---
function AnalyticsSection() {
  const surveys = getSurveys();
  const totalSurveys = surveys.length;

  const perVillage: Record<string, number> = {};
  const perSurveyor: Record<string, number> = {};
  const surveyors = getSurveyors();

  surveys.forEach((s) => {
    perVillage[s.village] = (perVillage[s.village] || 0) + 1;
    const surveyorName = surveyors.find((sv) => sv.id === s.surveyorId)?.name || s.surveyorId;
    perSurveyor[surveyorName] = (perSurveyor[surveyorName] || 0) + 1;
  });

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">Analytics</h2>

      <Card>
        <CardContent className="py-4 text-center">
          <p className="text-3xl font-bold text-primary">{totalSurveys}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Surveys Done</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Surveys per Village</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(perVillage).length === 0 ? (
            <p className="text-xs text-muted-foreground">No data yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Surveys per Surveyor</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(perSurveyor).length === 0 ? (
            <p className="text-xs text-muted-foreground">No data yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {Object.entries(perSurveyor).map(([name, count]) => (
                <div key={name} className="flex items-center justify-between rounded-md border p-2">
                  <span className="text-xs text-foreground">{name}</span>
                  <span className="text-sm font-semibold text-primary">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
