"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { AdminApiService, type Surveyor, type Village } from "@/lib/admin-api";
import { SurveyAnalyticsDashboard } from "./survey-analytics-dashboard";
import { LogOut, Loader2, Users, MapPin, BarChart3, TrendingUp, ChevronDown, ChevronUp, CheckCircle2, Search, ChevronLeft, ChevronRight, Key } from "lucide-react";

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { logout } = useAuth();
  const [surveyors, setSurveyors] = useState<Surveyor[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [totalSurveyors, setTotalSurveyors] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      // Fetch 1st page of surveyors + villages
      const [surveyorsResponse, villagesResponse] = await Promise.all([
        AdminApiService.getSurveyors(1, 10),
        AdminApiService.getVillages(1, 1000), // Get all villages for assignment dropdowns
      ]);
      setSurveyors(surveyorsResponse.surveyors);
      setTotalSurveyors(surveyorsResponse.pagination.total);

      // Calculate active count manually from surveyors page 1 or fetch from stats
      // Simplified: use recruiters count or backend logic. For now, we use surveyorsResponse total as active count isn't in paged resp.
      // Better: fetch actual active count from surveyorsResponse if we fetch status 'active' separately, 
      // but let's just use the current logic if we fetched all surveyors.
      // Since surveyorsResponse is only page 1, we can't get active count for all pages.
      // I'll calculate it from surveyors if they are all fetched, or if not, default to total.
      const active = surveyorsResponse.surveyors.filter(s => s.isActive).length;
      setActiveCount(active);

      setVillages(villagesResponse.villages);
    } catch (error: any) {
      toast.error(error.message || "Failed to load data");
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
              <div className="text-2xl font-bold">{totalSurveyors}</div>
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
                Page 1 Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeCount}
              </div>
              <p className="text-xs text-muted-foreground">Currently in view</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <Tabs defaultValue="surveyors">
          <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/60 p-1 rounded-xl">
            {[
              { v: "surveyors", label: "👥 Surveyor" },
              { v: "add-surveyor", label: "➕ Add Surveyor" },
              { v: "add-village", label: "🏘️ Add Village" },
            ].map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Surveyor List Tab */}
          <TabsContent value="surveyors" className="mt-4">
            <SurveyorListSection
              villages={villages}
              onUpdated={loadInitialData}
            />
          </TabsContent>

          {/* Add Surveyor Tab */}
          <TabsContent value="add-surveyor" className="mt-4">
            <AddSurveyorSection onSurveyorAdded={loadInitialData} />
          </TabsContent>

          {/* Add Village Tab */}
          <TabsContent value="add-village" className="mt-4">
            <AddVillageSection onVillageAdded={loadInitialData} />
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// A. Add Surveyor — basic info ONLY (no villages during creation)
// ─────────────────────────────────────────────────────────────────────────────
function AddSurveyorSection({ onSurveyorAdded }: { onSurveyorAdded: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const all = uppercase + lowercase + numbers;

    let genPassword = "";
    // Ensure at least one of each
    genPassword += uppercase[Math.floor(Math.random() * uppercase.length)];
    genPassword += lowercase[Math.floor(Math.random() * lowercase.length)];
    genPassword += numbers[Math.floor(Math.random() * numbers.length)];

    // Fill the rest to reach 8 characters
    for (let i = 0; i < 5; i++) {
      genPassword += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle the password
    const shuffled = genPassword.split('').sort(() => 0.5 - Math.random()).join('');
    setPassword(shuffled);
  };

  const handleMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(digits);
    if (digits.length > 0 && digits.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
    }
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName || !mobileNumber || !password) {
      toast.error("All fields are required");
      return;
    }
    if (mobileNumber.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }

    try {
      setIsLoading(true);
      await AdminApiService.createSurveyor({
        username: mobileNumber, // username is same as mobile
        firstName,
        lastName,
        password,
        email: `${mobileNumber}@survey.com`,
        mobileNumber,
        assignedVillages: [],   // villages assigned separately
      });
      setFirstName("");
      setLastName("");
      setMobileNumber("");
      setPassword("");
      toast.success("Surveyor created! Assign villages from the Surveyors list below.");
      onSurveyorAdded();
    } catch (error: any) {
      toast.error(error.message || "Failed to create surveyor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Add Surveyor</CardTitle>
        <p className="text-xs text-muted-foreground">
          Create the surveyor account first, then assign villages from the list below.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">First Name</Label>
            <Input
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-8"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Last Name</Label>
            <Input
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-8"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Mobile Number</Label>
            <Input
              placeholder="10-digit mobile"
              value={mobileNumber}
              onChange={(e) => handleMobileChange(e.target.value)}
              className="h-8"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Password</Label>
            <div className="flex gap-1">
              <Input
                type="text"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-8 flex-1"
                disabled={isLoading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={generatePassword}
                className="h-8 px-2 text-[10px] gap-1"
                type="button"
                disabled={isLoading}
              >
                <Key className="size-3" />
                Generate
              </Button>
            </div>
          </div>
        </div>


        <Button
          onClick={handleSubmit}
          disabled={isLoading || !firstName || !lastName || !mobileNumber || !password}
          className="h-8"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Create Surveyor
        </Button>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// B. Add Village
// ─────────────────────────────────────────────────────────────────────────────
function AddVillageSection({ onVillageAdded }: { onVillageAdded: () => void }) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name) {
      toast.error("Please enter a village name");
      return;
    }
    try {
      setIsLoading(true);
      await AdminApiService.createVillage({ name, assignedSurveyors: [] });
      setName("");
      toast.success("Village added successfully!");
      onVillageAdded();
    } catch (error: any) {
      toast.error(error.message || "Failed to create village");
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
        <Button onClick={handleSubmit} disabled={isLoading || !name} className="h-8">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Add Village
        </Button>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// C. Surveyor List — with inline "Assign Villages" panel per surveyor
// ─────────────────────────────────────────────────────────────────────────────
function SurveyorListSection({
  villages,
  onUpdated,
}: {
  villages: Village[];
  onUpdated: () => void;
}) {
  const [surveyors, setSurveyors] = useState<Surveyor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    limit: 10
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [loadingToggleId, setLoadingToggleId] = useState<string | null>(null);

  useEffect(() => {
    fetchSurveyors();
  }, [currentPage, searchQuery]);

  const fetchSurveyors = async () => {
    try {
      setIsLoadingList(true);
      const response = await AdminApiService.getSurveyors(currentPage, 10, searchQuery);
      setSurveyors(response.surveyors);
      setPagination(response.pagination);
    } catch (err: any) {
      toast.error(err.message || "Failed to load surveyors");
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchQuery(searchInput);
  };

  const toggleStatus = async (surveyorId: string, currentStatus: boolean) => {
    try {
      setLoadingToggleId(surveyorId);
      await AdminApiService.toggleSurveyorStatus(surveyorId, !currentStatus);
      fetchSurveyors(); // update local list
      onUpdated(); // update parent stats
      toast.success(`Surveyor ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle status");
    } finally {
      setLoadingToggleId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3">
          <CardTitle className="text-base">Surveyors ({pagination.total})</CardTitle>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by username or mobile..."
                className="pl-8 h-9 text-xs"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" className="h-9 px-3 text-xs">
              Search
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 min-h-[300px]">

        {isLoadingList ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading surveyors...</p>
          </div>
        ) : surveyors.length === 0 ? (
          <div className="text-center py-12 flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "No surveyors found matching your search." : "No surveyors yet."}
            </p>
            {searchQuery && (
              <Button
                variant="link"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                }}
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {surveyors.map((surveyor) => (
              <div key={surveyor._id} className="border rounded-lg overflow-hidden">
                {/* Row */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {surveyor.firstName} {surveyor.lastName}
                      <span className="text-xs text-muted-foreground ml-1 font-normal">({surveyor.username})</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{surveyor.mobileNumber}</p>
                    {/* Current villages as small badges */}
                    {surveyor.assignedVillages.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {surveyor.assignedVillages.map((v) => (
                          <Badge key={v} variant="secondary" className="text-xs px-1.5 py-0">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 italic">No villages assigned</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    <Badge variant={surveyor.isActive ? "default" : "secondary"} className="text-xs">
                      {surveyor.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleStatus(surveyor._id, surveyor.isActive)}
                      disabled={loadingToggleId === surveyor._id}
                      className="h-6 text-xs px-2"
                    >
                      {loadingToggleId === surveyor._id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : surveyor.isActive ? (
                        "Deactivate"
                      ) : (
                        "Activate"
                      )}
                    </Button>
                    {/* Assign Villages toggle */}
                    <Button
                      size="sm"
                      variant={openId === surveyor._id ? "default" : "outline"}
                      className="h-6 text-xs px-2 gap-1"
                      onClick={() => setOpenId(openId === surveyor._id ? null : surveyor._id)}
                    >
                      <MapPin className="size-3" />
                      Assign
                      {openId === surveyor._id ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Inline Assign Villages Panel */}
                {openId === surveyor._id && (
                  <AssignVillagesPanel
                    surveyor={surveyor}
                    villages={villages}
                    onSaved={() => {
                      setOpenId(null);
                      fetchSurveyors();
                      onUpdated();
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="mt-4 pt-2 border-t flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1 || isLoadingList}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="h-8 px-2 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(p => {
                  if (pagination.pages <= 5) return true;
                  return Math.abs(p - currentPage) <= 1 || p === 1 || p === pagination.pages;
                })
                .map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <span className="text-xs text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={currentPage === p ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(p)}
                      className={`h-7 w-7 p-0 text-xs ${currentPage === p ? "pointer-events-none" : ""}`}
                    >
                      {p}
                    </Button>
                  </React.Fragment>
                ))
              }
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === pagination.pages || isLoadingList}
              onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
              className="h-8 px-2 text-xs gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Assign Villages Panel — inline inside SurveyorListSection
// ─────────────────────────────────────────────────────────────────────────────
function AssignVillagesPanel({
  surveyor,
  villages,
  onSaved,
}: {
  surveyor: Surveyor;
  villages: Village[];
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(surveyor.assignedVillages);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggle = (villageName: string) => {
    setSelected((prev) =>
      prev.includes(villageName)
        ? prev.filter((v) => v !== villageName)
        : [...prev, villageName]
    );
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSuccess(false);
      await AdminApiService.updateSurveyorVillages(surveyor._id, selected);
      setSuccess(true);
      toast.success("Villages assigned successfully!");
      setTimeout(onSaved, 800);   // short delay so user sees the ✓
    } catch (err: any) {
      toast.error(err.message || "Failed to save village assignment");
    } finally {
      setIsSaving(false);
    }
  };

  if (villages.length === 0) {
    return (
      <div className="border-t bg-muted/30 px-3 py-3">
        <p className="text-xs text-muted-foreground">No villages available. Add a village first.</p>
      </div>
    );
  }

  return (
    <div className="border-t bg-muted/30 px-3 py-3 flex flex-col gap-2">
      <p className="text-xs font-medium text-foreground">
        Select villages for <span className="font-semibold">{surveyor.username}</span>:
      </p>
      <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
        {villages.map((village) => {
          const checked = selected.includes(village.name);
          return (
            <label
              key={village._id}
              className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors select-none
                ${checked ? "bg-primary/10 border-primary/40" : "bg-background border-border hover:bg-muted/50"}`}
            >
              <Checkbox
                id={`av-${surveyor._id}-${village._id}`}
                checked={checked}
                onCheckedChange={() => toggle(village.name)}
                disabled={isSaving}
                className="h-3.5 w-3.5"
              />
              <span className="truncate">{village.name}</span>
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {selected.length} village{selected.length !== 1 ? "s" : ""} selected
        </p>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="h-7 text-xs gap-1"
        >
          {isSaving ? (
            <Loader2 className="size-3 animate-spin" />
          ) : success ? (
            <CheckCircle2 className="size-3 text-green-400" />
          ) : (
            <MapPin className="size-3" />
          )}
          {isSaving ? "Saving…" : success ? "Saved!" : "Save Villages"}
        </Button>
      </div>
    </div>
  );
}

