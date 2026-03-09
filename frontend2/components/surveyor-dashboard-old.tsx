"use client";

import { useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { SurveyorApiService, type Village, type Survey, type SurveyorStats } from "@/lib/surveyor-api";
import { LogOut, MapPin, Award, Loader2, FileText, Users } from "lucide-react";

interface SurveyorDashboardProps {
  surveyor: any;
  onLogout: () => void;
  onStartSurvey: (surveyorId: string, village: string) => void;
}

export function SurveyorDashboard({ surveyor, onLogout, onStartSurvey }: SurveyorDashboardProps) {
  const { logout } = useAuth();
  const [selectedVillage, setSelectedVillage] = useState<string>("");
  const [villages, setVillages] = useState<Village[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState<SurveyorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPerformance, setShowPerformance] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [villagesResponse, statsResponse] = await Promise.all([
        SurveyorApiService.getAssignedVillages(),
        SurveyorApiService.getSurveyorStats()
      ]);
      
      setVillages(villagesResponse);
      setStats(statsResponse);
    } catch (error: any) {
      setError(error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load surveys when village is selected
  useEffect(() => {
    if (selectedVillage) {
      loadSurveys(selectedVillage);
    }
  }, [selectedVillage]);

  const loadSurveys = async (village: string) => {
    try {
      const surveysResponse = await SurveyorApiService.getSurveys(village);
      setSurveys(surveysResponse);
    } catch (error: any) {
      console.error('Failed to load surveys:', error);
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const handleStartSurvey = () => {
    if (selectedVillage) {
      onStartSurvey(surveyor.id, selectedVillage);
    }
  };

  if (showPerformance && stats) {
    return (
      <SurveyorPerformance
        stats={stats}
        villages={villages}
        onBack={() => setShowPerformance(false)}
        onLogout={handleLogout}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!selectedVillage) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
          <h1 className="text-base font-semibold text-foreground">{surveyor.username}</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowPerformance(true)} className="text-xs h-7 px-2">
              <Award className="size-3.5 mr-1" />
              Stats
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs h-7 px-2">
              <LogOut className="size-3.5 mr-1" />
              Logout
            </Button>
          </div>
        </header>

        {error && (
          <div className="mx-4 mt-4 p-3 rounded-lg border border-destructive/50 bg-destructive/10">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <main className="mx-auto max-w-lg p-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Select Village
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Select value={selectedVillage} onValueChange={setSelectedVillage}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a village to start survey" />
                </SelectTrigger>
                <SelectContent>
                  {villages.map((village) => (
                    <SelectItem key={village._id} value={village.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{village.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {village.surveyStats?.totalSurveys || 0} surveys
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{villages.length}</div>
                  <p className="text-xs text-muted-foreground">Assigned Villages</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.overview.totalSurveys || 0}</div>
                  <p className="text-xs text-muted-foreground">Total Surveys</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Village List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your Villages</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {villages.map((village) => (
                <div key={village._id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{village.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {village.surveyStats?.totalSurveys || 0} surveys completed
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {village.surveyStats?.verifiedSurveys || 0} verified
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <h1 className="text-base font-semibold text-foreground">{selectedVillage}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setSelectedVillage("")} className="text-xs h-7 px-2">
            ← Back
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowPerformance(true)} className="text-xs h-7 px-2">
            <Award className="size-3.5 mr-1" />
            Stats
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs h-7 px-2">
            <LogOut className="size-3.5 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4 flex flex-col gap-4">
        {/* Action Button */}
        <Button onClick={handleStartSurvey} className="w-full">
          Start New Survey
        </Button>

        {/* Survey List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Recent Surveys ({surveys.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {surveys.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No surveys yet</p>
            ) : (
              surveys.map((survey) => (
                <div key={survey._id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{survey.representativeName}</p>
                      <p className="text-xs text-muted-foreground">{survey.mobileNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {survey.totalFamilyMembers} family members
                      </p>
                    </div>
                    <Badge 
                      variant={
                        survey.status === 'Verified' ? 'default' :
                        survey.status === 'Submitted' ? 'secondary' :
                        survey.status === 'Rejected' ? 'destructive' : 'outline'
                      }
                    >
                      {survey.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Performance View Component
function SurveyorPerformance({ 
  stats, 
  villages, 
  onBack, 
  onLogout 
}: { 
  stats: SurveyorStats; 
  villages: Village[]; 
  onBack: () => void; 
  onLogout: () => void; 
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          <h1 className="text-base font-semibold text-foreground">Performance Stats</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-xs h-7 px-2">
            ← Back
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-xs h-7 px-2">
            <LogOut className="size-3.5 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4 flex flex-col gap-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.overview.totalSurveys}</div>
                <p className="text-xs text-muted-foreground">Total Surveys</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.overview.verificationRate}%</div>
                <p className="text-xs text-muted-foreground">Verification Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Survey Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Draft</span>
              <Badge variant="outline">{stats.overview.draftSurveys}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Submitted</span>
              <Badge variant="secondary">{stats.overview.submittedSurveys}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Verified</span>
              <Badge variant="default">{stats.overview.verifiedSurveys}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Rejected</span>
              <Badge variant="destructive">{stats.overview.rejectedSurveys}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Village Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Village Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.villageStats.map((villageStat) => {
              const village = villages.find(v => v.name === villageStat._id);
              return (
                <div key={villageStat._id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{villageStat._id}</p>
                      <p className="text-xs text-muted-foreground">
                        {villageStat.total} total surveys
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {villageStat.verified} verified
                    </Badge>
                  </div>
                </div>
              );
            })}
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
