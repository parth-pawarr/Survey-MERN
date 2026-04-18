"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import {
  LogOut,
  MapPin,
  Award,
  FileText,
  CalendarDays,
  Home,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Search,
  X,
} from "lucide-react";
import {
  SurveyorApiService,
  type Village,
  type SurveyorStats,
  type Survey,
} from "@/lib/surveyor-api";

// ─── Types ───────────────────────────────────────────────────────────────────

type DetailView = "villages" | "all-surveys" | "today-surveys" | null;

interface SurveyorProfileProps {
  stats: SurveyorStats;
  villages: Village[];
  surveyorName: string;
  onBack: () => void;
  onLogout: () => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getTodayCount(stats: SurveyorStats): number {
  if (!stats.recentActivity?.length) return 0;
  const today = new Date();
  const entry = stats.recentActivity.find((a) => {
    const d = a._id;
    return (
      d.year === today.getFullYear() &&
      d.month === today.getMonth() + 1 &&
      d.day === today.getDate()
    );
  });
  return entry ? entry.created + entry.submitted : 0;
}

function getBadges(stats: SurveyorStats) {
  const total = stats.overview.totalSurveys;
  const milestones = [
    { emoji: "🥉", label: "Beginner", requiredSurveys: 10 },
    { emoji: "🥈", label: "Active Contributor", requiredSurveys: 50 },
    { emoji: "🥇", label: "Top Performer", requiredSurveys: 100 },
  ] as const;

  return milestones.map((badge) => ({
    ...badge,
    unlocked: total >= badge.requiredSurveys,
  }));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  color,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`
        relative flex flex-col gap-2 sm:gap-3 rounded-2xl border bg-card p-2.5 sm:p-4
        shadow-sm transition-all duration-200
        ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]" : ""}
        ${active ? "ring-2 ring-primary ring-offset-1" : ""}
      `}
      style={{ minHeight: "90px" }}
    >
      <div
        className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl ${color}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-xl sm:text-3xl font-bold leading-none tracking-tight text-foreground">
          {value}
        </div>
        <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{label}</p>
      </div>
      {onClick && (
        <ChevronRight
          className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
            active ? "text-primary" : "text-muted-foreground/50"
          }`}
        />
      )}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function VillagesPanel({ villages }: { villages: Village[] }) {
  if (villages.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No villages assigned yet.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2 pb-12">
      {villages.map((v) => (
        <div
          key={v._id}
          className="flex items-center justify-between rounded-xl border bg-card p-3"
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            <div>
              <p className="text-sm font-medium">{v.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {v.surveyStats?.totalSurveys ?? 0} surveys
              </p>
            </div>
          </div>
          {v.totalHouseholds != null ? (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {v.totalHouseholds} households
            </Badge>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SurveysPanel({
  surveys,
  loading,
  emptyMessage,
}: {
  surveys: Survey[];
  loading: boolean;
  emptyMessage: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }
  if (surveys.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2 pb-12">
      {surveys.map((s) => (
        <div
          key={s._id}
          className="rounded-xl border bg-card p-3 flex items-center justify-between gap-2"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{s.representativeName}</p>
            <p className="text-[11px] text-muted-foreground">
              {s.village} · {formatDate(s.createdAt)}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              ID: {s._id.slice(-6).toUpperCase()}
            </p>
          </div>
          {s.status !== "Verified" && s.status !== "Submitted" && (
            <Badge
              className="h-5 text-[10px] px-1.5 shrink-0"
              variant={
                s.status === "Rejected"
                  ? "destructive"
                  : "outline"
              }
            >
              {s.status}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SurveyorProfile({
  stats,
  villages,
  surveyorName,
  onBack,
  onLogout,
}: SurveyorProfileProps) {
  const todayCount = getTodayCount(stats);
  const badges = getBadges(stats);

  // Which detail panel is open
  const [activeView, setActiveView] = useState<DetailView>(null);

  // Surveys state for the detail panels
  const [allSurveys, setAllSurveys] = useState<Survey[]>([]);
  const [todaySurveys, setTodaySurveys] = useState<Survey[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingToday, setLoadingToday] = useState(false);
  const [villagesPage, setVillagesPage] = useState(1);
  const [todayPage, setTodayPage] = useState(1);
  const [allSearchInput, setAllSearchInput] = useState("");
  const [allSearchQuery, setAllSearchQuery] = useState("");
  const [allPage, setAllPage] = useState(1);
  const [allPagination, setAllPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const todayLimit = 10;
  const villagesLimit = 10;
  const villagesPages = Math.max(1, Math.ceil(villages.length / villagesLimit));
  const pagedVillages = villages.slice(
    (villagesPage - 1) * villagesLimit,
    villagesPage * villagesLimit
  );
  const todayPages = Math.max(1, Math.ceil(todaySurveys.length / todayLimit));
  const pagedTodaySurveys = todaySurveys.slice(
    (todayPage - 1) * todayLimit,
    todayPage * todayLimit
  );

  // Toggle: clicking same card again closes panel
  const handleCardClick = useCallback(
    (view: DetailView) => {
      setActiveView((prev) => (prev === view ? null : view));
    },
    []
  );

  // Fetch all surveys with pagination and search
  useEffect(() => {
    if (activeView === "all-surveys") {
      setLoadingAll(true);
      SurveyorApiService.getSurveys(undefined, allPage, 10, allSearchQuery)
        .then((res) => {
          setAllSurveys(res.surveys);
          setAllPagination(res.pagination);
        })
        .catch(console.error)
        .finally(() => setLoadingAll(false));
    }
  }, [activeView, allPage, allSearchQuery]);

  // Fetch today's surveys when panel first opened
  useEffect(() => {
    if (activeView === "today-surveys" && todaySurveys.length === 0) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;

      setLoadingToday(true);
      // Fetch all recent surveys (limit 200) and filter client-side by date
      SurveyorApiService.getSurveys(undefined, 1, 200)
        .then((res) => {
          const filtered = res.surveys.filter((s) =>
            s.createdAt.startsWith(todayStr)
          );
          setTodaySurveys(filtered);
        })
        .catch(console.error)
        .finally(() => setLoadingToday(false));
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === "villages") {
      setVillagesPage(1);
    }
    if (activeView === "today-surveys") {
      setTodayPage(1);
    }
  }, [activeView]);

  useEffect(() => {
    setVillagesPage((prev) => Math.min(prev, villagesPages));
  }, [villagesPages]);

  useEffect(() => {
    setTodayPage((prev) => Math.min(prev, todayPages));
  }, [todayPages]);

  const detailTitle: Record<NonNullable<DetailView>, string> = {
    villages: "Assigned Villages",
    "all-surveys": "All Surveys",
    "today-surveys": "Today's Surveys",
  };

  const handleAllSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAllPage(1);
    setAllSearchQuery(allSearchInput.trim());
  };

  const clearAllSearch = () => {
    setAllSearchInput("");
    setAllSearchQuery("");
    setAllPage(1);
  };

  const renderPaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
    loading,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    loading: boolean;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="sticky bottom-0 mt-4 pt-2 bg-card border-t flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === 1 || loading}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="h-8 px-2 text-xs gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 100) }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPages <= 5) return true;
              return Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages;
            })
            .map((p, i, arr) => (
              <React.Fragment key={p}>
                {i > 0 && arr[i - 1] !== p - 1 && (
                  <span className="text-xs text-muted-foreground">...</span>
                )}
                <Button
                  variant={currentPage === p ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onPageChange(p)}
                  className={`h-7 w-7 p-0 text-xs ${currentPage === p ? "pointer-events-none" : ""}`}
                >
                  {p}
                </Button>
              </React.Fragment>
            ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === totalPages || loading}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="h-8 px-2 text-xs gap-1"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <h1 className="text-base font-semibold text-foreground">My Profile</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-7 px-2 text-xs">
            ← Back
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout} className="h-7 px-2 text-xs">
            <LogOut className="mr-1 size-3.5" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5 flex flex-col gap-5">

        {/* ── Surveyor Avatar ── */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg uppercase select-none transition-transform duration-200 ease-out hover:scale-[1.04]">
            {surveyorName?.[0] ?? "S"}
          </div>
          <div>
            <p className="font-semibold text-foreground">{surveyorName}</p>
            <p className="text-xs text-muted-foreground">Surveyor</p>
          </div>
        </div>

        {/* ── Achievements ── */}
         {/* Achievements Section */}
          <section className="space-y-4 py-4 px-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Achievements</h2>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {stats?.overview.totalSurveys || 0} Surveys
              </span>
            </div>
            
            <div className="relative flex justify-between items-start px-4">
              {/* Progress Track Background */}
              <div className="absolute top-5 left-10 right-10 h-[2px] bg-muted -z-0" />
              
              {/* Active Progress Track */}
              {(() => {
                const total = stats?.overview.totalSurveys || 0;
                const progress = total >= 100 ? 100 : total < 10 ? (total/10)*0 : total < 50 ? 0 + ((total-10)/40)*50 : 50 + ((total-50)/50)*50;
                // Simplified progress for visual
                const visualProgress = Math.min(100, (total / 100) * 100);
                return (
                  <div 
                    className="absolute top-5 left-10 h-[2px] bg-primary transition-all duration-1000 -z-0" 
                    style={{ width: `calc(${visualProgress}% - ${visualProgress > 0 ? '20px' : '0px'})`, maxWidth: 'calc(100% - 80px)' }}
                  />
                );
              })()}

              {[
                { label: "Starter", threshold: 10, emoji: "🥉" },
                { label: "Field Worker", threshold: 50, emoji: "🥈" },
                { label: "Survey Champion", threshold: 100, emoji: "🥇" }
              ].map((m) => {
                const total = stats?.overview.totalSurveys || 0;
                const isUnlocked = total >= m.threshold;
                
                return (
                  <div key={m.label} className="relative z-10 flex flex-col items-center gap-2 group">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 shadow-sm ${
                        isUnlocked 
                        ? "bg-white border-2 border-primary scale-110 active:scale-125" 
                        : "bg-muted border border-transparent grayscale opacity-70 scale-100"
                      }`}
                      title={`${m.label} (${m.threshold} surveys)`}
                    >
                      {m.emoji}
                      {isUnlocked && (
                        <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5 shadow-md animate-in fade-in zoom-in duration-300">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center text-center max-w-[60px]">
                      <span className={`text-[9px] font-bold leading-tight transition-colors ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                        {m.label}
                      </span>
                      <span className="text-[8px] text-muted-foreground/60 font-mono">
                         {m.threshold}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        {/* ── Performance Stat Cards ── */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Performance</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <StatCard
              icon={<Home className="h-4 w-4" />}
              value={villages.length}
              label="Assigned Villages"
              color="bg-slate-100 text-slate-600"
              active={activeView === "villages"}
              onClick={() => handleCardClick("villages")}
            />
            <StatCard
              icon={<FileText className="h-4 w-4" />}
              value={stats.overview.totalSurveys}
              label="Total Surveys"
              color="bg-slate-100 text-slate-600"
              active={activeView === "all-surveys"}
              onClick={() => handleCardClick("all-surveys")}
            />
            <StatCard
              icon={<CalendarDays className="h-4 w-4" />}
              value={todayCount}
              label="Today's Surveys"
              color="bg-slate-100 text-slate-600"
              active={activeView === "today-surveys"}
              onClick={() => handleCardClick("today-surveys")}
            />
          </div>
        </section>

        {/* ── Inline Detail Panel ── */}
        {activeView && (
          <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                {detailTitle[activeView]}
              </h3>
              <button
                onClick={() => setActiveView(null)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Panel body */}
            <div className="max-h-[420px] overflow-y-auto px-3 pt-3 pb-0 custom-scrollbar">
              {activeView === "villages" && (
                <div className="flex flex-col gap-3">
                  <VillagesPanel villages={pagedVillages} />
                  {renderPaginationControls({
                    currentPage: villagesPage,
                    totalPages: villagesPages,
                    onPageChange: setVillagesPage,
                    loading: false,
                  })}
                </div>
              )}
              {activeView === "all-surveys" && (
                <div className="flex flex-col gap-3">
                  <form onSubmit={handleAllSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search surveys..."
                        className="pl-8 h-9 text-xs"
                        value={allSearchInput}
                        onChange={(e) => setAllSearchInput(e.target.value)}
                      />
                    </div>
                    <Button type="submit" size="sm" className="h-9 px-3 text-xs">
                      Search
                    </Button>
                    {allSearchQuery && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 text-xs"
                        onClick={clearAllSearch}
                      >
                        Clear
                      </Button>
                    )}
                  </form>

                  <SurveysPanel
                    surveys={allSurveys}
                    loading={loadingAll}
                    emptyMessage="No surveys found."
                  />

                  {renderPaginationControls({
                    currentPage: allPagination.page,
                    totalPages: allPagination.pages,
                    onPageChange: setAllPage,
                    loading: loadingAll,
                  })}
                </div>
              )}
              {activeView === "today-surveys" && (
                <div className="flex flex-col gap-3">
                  <SurveysPanel
                    surveys={pagedTodaySurveys}
                    loading={loadingToday}
                    emptyMessage="No surveys found."
                  />

                  {renderPaginationControls({
                    currentPage: todayPage,
                    totalPages: todayPages,
                    onPageChange: setTodayPage,
                    loading: loadingToday,
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
