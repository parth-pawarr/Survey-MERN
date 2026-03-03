"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { AdminApiService, type Surveyor, type Village } from "@/lib/admin-api";
import { SurveyAnalyticsDashboard } from "./survey-analytics-dashboard";
import { LogOut, X, Loader2, Users, MapPin, BarChart3, TrendingUp } from "lucide-react";

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { logout } = useAuth();
  const [surveyors, setSurveyors] = useState<Surveyor[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [surveyorsResponse, villagesResponse] = await Promise.all([
        AdminApiService.getSurveyors(),
        AdminApiService.getVillages()
      ]);
      
      setSurveyors(surveyorsResponse.surveyors);
      setVillages(villagesResponse.villages);
    } catch (error: any) {
      setError(error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

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

  if (showAnalytics) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h1 className="text-lg font-semibold text-foreground">Analytics</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowAnalytics(false)}>
            <LogOut className="size-4" />
          </Button>
        </header>
        <main className="mx-auto max-w-6xl p-4">
          <SurveyAnalyticsDashboard onClose={() => setShowAnalytics(false)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAnalytics(true)}
            className="text-xs"
          >
            <TrendingUp className="size-4 mr-1" />
            Analytics
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg border border-destructive/50 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <main className="mx-auto max-w-4xl p-4 flex flex-col gap-4">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Surveyors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{surveyors.length}</div>
              <p className="text-xs text-muted-foreground">Total registered</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Villages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{villages.length}</div>
              <p className="text-xs text-muted-foreground">Total villages</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Active Surveyors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {surveyors.filter(s => s.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
        </div>

        {/* A. Add Surveyor Form */}
        <AddSurveyorSection onSurveyorAdded={loadInitialData} villages={villages} />

        {/* B. Add Village Form */}
        <AddVillageSection onVillageAdded={loadInitialData} />

        {/* C. Surveyor List with Village Assignment */}
        <SurveyorListSection surveyors={surveyors} villages={villages} onUpdated={loadInitialData} />

        {/* D. Village Management */}
        <VillageManagementSection villages={villages} surveyors={surveyors} onUpdated={loadInitialData} />
      </main>
    </div>
  );
}

// --- A. Add Surveyor Form ---
function AddSurveyorSection({ onSurveyorAdded, villages }: { onSurveyorAdded: () => void; villages: Village[] }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedVillages, setSelectedVillages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setMobile(digits);
    if (digits.length > 0 && digits.length !== 10) {
      setError("Mobile number must be exactly 10 digits");
    } else {
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!name || !mobile || !username || !password) return;
    if (mobile.length !== 10) {
      setError("Mobile number must be exactly 10 digits");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      await AdminApiService.createSurveyor({
        username,
        password,
        email: `${username}@survey.com`,
        mobile,
        assignedVillages: selectedVillages
      });
      
      setName("");
      setMobile("");
      setUsername("");
      setPassword("");
      setSelectedVillages([]);
      onSurveyorAdded();
    } catch (error: any) {
      setError(error.message || 'Failed to create surveyor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Add Surveyor</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Name</Label>
            <Input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Mobile</Label>
            <Input
              placeholder="10-digit mobile"
              value={mobile}
              onChange={(e) => handleMobileChange(e.target.value)}
              className="h-8"
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Username</Label>
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-8"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Password</Label>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-8"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs">Assign Villages</Label>
          <div className="max-h-24 overflow-y-auto border rounded-md p-2">
            {villages.map((village) => (
              <div key={village._id} className="flex items-center space-x-2">
                <Checkbox
                  id={`village-${village._id}`}
                  checked={selectedVillages.includes(village.name)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedVillages([...selectedVillages, village.name]);
                    } else {
                      setSelectedVillages(selectedVillages.filter(v => v !== village.name));
                    }
                  }}
                  disabled={isLoading}
                />
                <Label htmlFor={`village-${village._id}`} className="text-xs">
                  {village.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        
        <Button onClick={handleSubmit} disabled={isLoading} className="h-8">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Create Surveyor
        </Button>
      </CardContent>
    </Card>
  );
}

// --- B. Add Village Form ---
function AddVillageSection({ onVillageAdded }: { onVillageAdded: () => void }) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name) {
      setError("Please enter a village name");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      await AdminApiService.createVillage({
        name,
        assignedSurveyors: []
      });
      
      setName("");
      onVillageAdded();
    } catch (error: any) {
      setError(error.message || 'Failed to create village');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Add Village</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="v-name" className="text-xs">Village Name</Label>
          <Input 
            id="v-name" 
            placeholder="Enter village name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="h-9"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        
        <Button onClick={handleSubmit} disabled={isLoading || !name} className="h-8">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Add Village
        </Button>
      </CardContent>
    </Card>
  );
}

// --- C. Surveyor List Section ---
function SurveyorListSection({ surveyors, villages, onUpdated }: { 
  surveyors: Surveyor[]; 
  villages: Village[]; 
  onUpdated: () => void; 
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleStatus = async (surveyorId: string, currentStatus: boolean) => {
    try {
      setError(null);
      setLoadingId(surveyorId);
      // Toggle the status: if currently active (true), make inactive (false), and vice versa
      await AdminApiService.toggleSurveyorStatus(surveyorId, !currentStatus);
      onUpdated();
    } catch (error: any) {
      setError(error.message || 'Failed to toggle status');
      console.error('Failed to toggle status:', error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Surveyors ({surveyors.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {error && (
          <div className="p-2 rounded-lg border border-destructive/50 bg-destructive/10">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}
        {surveyors.map((surveyor) => (
          <div key={surveyor._id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{surveyor.username}</p>
                <p className="text-xs text-muted-foreground">{surveyor.mobile}</p>
                <div className="flex gap-1 mt-1">
                  {surveyor.assignedVillages.map((village: string) => (
                    <Badge key={village} variant="secondary" className="text-xs">
                      {village}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={surveyor.isActive ? "default" : "secondary"}>
                  {surveyor.isActive ? "Active" : "Inactive"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleStatus(surveyor._id, surveyor.isActive)}
                  disabled={loadingId === surveyor._id}
                  className="h-6 text-xs"
                >
                  {loadingId === surveyor._id ? (
                    <>
                      <Loader2 className="size-3 animate-spin mr-1" />
                      Loading...
                    </>
                  ) : (
                    surveyor.isActive ? "Deactivate" : "Activate"
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// --- D. Village Management Section ---
function VillageManagementSection({ villages, surveyors, onUpdated }: { 
  villages: Village[]; 
  surveyors: Surveyor[]; 
  onUpdated: () => void; 
}) {
  const [expandedVillage, setExpandedVillage] = useState<string | null>(null);
  const [loadingVillage, setLoadingVillage] = useState<string | null>(null);

  const handleAssignSurveyor = async (villageId: string, surveyorIds: string[]) => {
    try {
      setLoadingVillage(villageId);
      await AdminApiService.assignVillageSurveyors(villageId, surveyorIds);
      onUpdated();
    } catch (error: any) {
      console.error('Failed to assign surveyors:', error);
    } finally {
      setLoadingVillage(null);
    }
  };

  if (villages.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Villages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">No villages created yet. Add one above!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Villages ({villages.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {villages.map((village) => (
          <div key={village._id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{village.name}</p>
                <div className="flex gap-1 mt-1">
                  {village.assignedSurveyors.slice(0, 3).map((surveyorId: string) => {
                    const surveyor = surveyors.find((s: Surveyor) => s._id === surveyorId);
                    return surveyor ? (
                      <Badge key={surveyorId} variant="outline" className="text-xs">
                        {surveyor.username}
                      </Badge>
                    ) : null;
                  })}
                  {village.assignedSurveyors.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{village.assignedSurveyors.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpandedVillage(expandedVillage === village._id ? null : village._id)}
                className="h-7 text-xs"
                disabled={loadingVillage === village._id}
              >
                {loadingVillage === village._id ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  "Assign"
                )}
              </Button>
            </div>

            {/* Dropdown for assigning surveyors */}
            {expandedVillage === village._id && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-medium mb-2">Surveyors assigned to {village.name}:</p>
                <div className="flex flex-col gap-2">
                  {surveyors.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No surveyors available</p>
                  ) : (
                    <>
                      <select
                        multiple
                        value={village.assignedSurveyors || []}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          handleAssignSurveyor(village._id, selected);
                        }}
                        disabled={loadingVillage === village._id}
                        className="border rounded p-2 text-xs bg-white max-h-40"
                      >
                        {surveyors.map((surveyor) => (
                          <option key={surveyor._id} value={surveyor._id}>
                            {surveyor.username}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        (Hold Ctrl/Cmd to select multiple)
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
