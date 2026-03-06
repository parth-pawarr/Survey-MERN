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
import { LogOut, MapPin, Award, Loader2, FileText, Edit, AlertTriangle } from "lucide-react";

interface SurveyorDashboardProps {
  surveyor: any;
  onLogout: () => void;
  onStartSurvey: (surveyorId: string, village: string, surveyId?: string, mode?: 'new' | 'update') => void;
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
      onStartSurvey(surveyor.id, selectedVillage, undefined, 'new');
    }
  };


  const handleUpdateSurvey = (surveyId: string) => {
    if (selectedVillage) {
      onStartSurvey(surveyor.id, selectedVillage, surveyId, 'update');
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

        {villages.length === 0 && !error && (
          <div className="mx-4 mt-4 p-4 rounded-lg border border-muted bg-muted/30">
            <p className="text-sm text-muted-foreground text-center">
              No villages assigned yet. Please contact your admin to assign villages to your account.
            </p>
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
                  {villages.map((village, index) => (
                    <SelectItem key={`${village._id}-${index}`} value={village.name}>
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
              {villages.map((village, index) => (
                <div
                  key={`${village._id}-${index}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedVillage(village.name)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedVillage(village.name)}
                  className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                >
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
                  <div className="flex items-center justify-between mb-2">
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

                  {/* Action Buttons — Update available for Draft / Submitted / Rejected */}
                  {survey.status !== 'Verified' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateSurvey(survey._id)}
                        className="flex-1 gap-1 h-7 text-xs"
                      >
                        <Edit className="size-3" />
                        Update
                      </Button>
                    </div>
                  )}
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
