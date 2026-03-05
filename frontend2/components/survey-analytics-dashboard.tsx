"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminApiService } from "@/lib/admin-api";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2, Heart, Users, GraduationCap, Briefcase,
  Activity, RefreshCw, Shield, BarChart3, Download,
} from "lucide-react";

// ─── colour palette ────────────────────────────────────────────────────────────
const C = {
  teal: "#0d9488", emerald: "#10b981", amber: "#f59e0b",
  coral: "#f43f5e", blue: "#3b82f6", violet: "#8b5cf6",
  orange: "#f97316", slate: "#64748b", lime: "#84cc16",
  pink: "#ec4899", sky: "#0ea5e9", rose: "#e11d48",
};
const PIE_PALETTE = Object.values(C);

// ─── seed category lists (used to normalise API data) ─────────────────────────
// Exact enum values matching HouseholdSurvey.js model
const HEALTH_CATS = ["Diabetes", "Hypertension", "Heart Disease", "Asthma", "Tuberculosis", "Cancer", "Kidney Disease", "Disability", "Mental Health Issues", "Malnutrition", "Pregnancy-related complications", "Other"];
const EDU_LEVELS = ["Not Enrolled", "Anganwadi", "Primary", "Secondary", "Higher Secondary", "ITI/Diploma", "College", "Dropout"];
// Must match educationChildren.educationalIssues enum in HouseholdSurvey.js exactly
const EDU_PROBLEMS = ["Financial problem", "Transportation issue", "Poor academic performance", "Dropped out", "Lack of digital access", "Lack of books/material", "Health issue", "Family responsibility", "Other"];
const SKILLS_LIST = ["Farming", "Mason", "Plumbing", "Electrician", "Driving", "Computer skills", "Mobile repair", "Handicrafts", "Cooking", "Hardware", "Sutar (Carpenter)", "Lohar (Blacksmith)", "Kumbhar (Potter)", "Nhavi (Barber)", "Parit (Washerman)", "Other"];
const UNEMP_REASONS = ["No skills", "Low education", "Health issue", "No job opportunities", "Financial problems", "Family responsibilities", "Migration issue", "Other"];
// Morbidity sub-conditions from hasAdditionalMorbidity enum in HouseholdSurvey.js
const MORBIDITY_CATS = ["Knee Pain", "Back Pain", "Leg Pain", "Joint Pain", "Paralysis", "Other"];

// ─── helpers ───────────────────────────────────────────────────────────────────
const pct = (n: number, total: number) =>
  total > 0 ? `${Math.round((n / total) * 100)}%` : "0%";

/**
 * Merges API data (array of {_id, count}) with a seed list so every category
 * always appears in the chart (count = 0 if not in API response).
 */
function mergeWithSeeds(apiArr: any[], seeds: string[], idKey = "_id"): { name: string; count: number }[] {
  const map: Record<string, number> = {};
  seeds.forEach((s) => (map[s] = 0));
  (apiArr || []).forEach((item) => {
    const key = item[idKey] || "";
    // fuzzy match: if key contains a seed name or vice versa
    const matched = seeds.find(
      (s) => s.toLowerCase() === key.toLowerCase() || key.toLowerCase().includes(s.toLowerCase())
    );
    if (matched) map[matched] = (map[matched] || 0) + (item.count || 0);
    else if (key) map[key] = (map[key] || 0) + (item[idKey] === null ? 0 : (item.count || 0)); // keep unknown keys, handle null _id
  });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
}

// ─── sub-components ────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color = "teal" }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) {
  const hex = C[color as keyof typeof C] || C.teal;
  return (
    <Card className="relative overflow-hidden border-0 shadow-md">
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 80% 20%, ${hex}, transparent)` }} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color: hex }}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="rounded-xl p-2" style={{ background: `${hex}18` }}>
            <Icon className="h-5 w-5" style={{ color: hex }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, icon: Icon, color, children }: {
  title: string; icon: any; color: string; children: React.ReactNode;
}) {
  const hex = C[color as keyof typeof C] || C.teal;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-1 border-b">
        <div className="rounded-lg p-1.5" style={{ background: `${hex}18` }}>
          <Icon className="h-4 w-4" style={{ color: hex }} />
        </div>
        <h3 className="text-sm font-bold" style={{ color: hex }}>{title}</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">{children}</CardContent>
    </Card>
  );
}

function NoData({ msg = "No data available" }: { msg?: string }) {
  return <p className="text-xs text-center text-muted-foreground py-10">{msg}</p>;
}

// Custom label renderer for pie/donut charts
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── types ─────────────────────────────────────────────────────────────────────
interface DashStats { overview: any; surveyStatus: any; villageCoverage: any; recentActivity: any; topSurveyors: any[]; monthlyTrends: any[] }
interface Analytics { completionTrends: any[]; villageDistribution: any[]; healthStats: any[]; morbidityStats: any[]; educationStats: any[]; employmentStats: any[]; ayushmanStats: any[]; eduIssueStats?: any[]; skillStats?: any[]; unempReasonStats?: any[] }
interface PerfData { performanceMetrics: any[]; villageCoverage: any[]; performanceTrends: any[] }

interface Props { onClose: () => void }

// ─── main component ────────────────────────────────────────────────────────────
export function SurveyAnalyticsDashboard({ onClose }: Props) {
  const [dash, setDash] = useState<DashStats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [perf, setPerf] = useState<PerfData | null>(null);
  const [morbidityProblems, setMorbidityProblems] = useState<{ _id: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("healthcare");

  const exportCSV = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem("auth_token");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiBase}/admin/export/surveys?format=csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `survey_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const [d, a, p] = await Promise.all([
        AdminApiService.getDashboardStats(),
        AdminApiService.getSurveyAnalytics(),
        AdminApiService.getSurveyorPerformance(),
      ]);
      setDash(d as any);
      setAnalytics(a as any);
      setPerf(p as any);
      setLastRefresh(new Date());
    } catch (e: any) {
      setErr(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      </div>
    );

  if (err || !dash || !analytics || !perf)
    return (
      <div className="p-6 space-y-3">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err || "Failed to load analytics"}
        </div>
        <Button onClick={load} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );

  // ── KPI derived ─────────────────────────────────────────────────────────────
  const totalSurveys = dash.overview.totalSurveys || 0;

  const ayushmanRaw = analytics.ayushmanStats || [];
  const ayushmanAll = ayushmanRaw.find((a: any) => (a._id || "").includes("All"))?.count || 0;
  const ayushmanSome = ayushmanRaw.find((a: any) => (a._id || "").includes("Some"))?.count || 0;
  const ayushmanNone = ayushmanRaw.find((a: any) => (a._id || "").includes("None"))?.count || 0;
  const totalAyushman = ayushmanAll + ayushmanSome + ayushmanNone;
  const ayushmanFullPct = totalAyushman > 0 ? Math.round((ayushmanAll / totalAyushman) * 100) : 0;

  // ── HEALTHCARE derived ───────────────────────────────────────────────────────
  // 1. Health issue bar chart — merge with seed categories
  const healthBarData = mergeWithSeeds(analytics.healthStats || [], HEALTH_CATS);
  const totalHealthCases = healthBarData.reduce((s, d) => s + d.count, 0);

  // 2. Ayushman donut — Yes / No
  // "Yes" = families where at least one member has card (All + Some); "No" = None have
  const ayushmanDonutData = [
    { name: "Yes — All Members", value: ayushmanAll, fill: C.emerald },
    { name: "Yes — Some Members", value: ayushmanSome, fill: C.amber },
    { name: "No Coverage", value: ayushmanNone, fill: C.coral },
  ].filter((d) => d.value > 0);

  // 3. Morbidity Problems (HC-3) — from backend morbidityStats aggregation
  //    (healthMembers[].hasAdditionalMorbidity — the '+ Add Problem' section)
  const morbProbData = mergeWithSeeds(analytics.morbidityStats || [], MORBIDITY_CATS);
  const totalMorbProblems = morbProbData.reduce((s, d) => s + d.count, 0);

  // ── EDUCATION derived ────────────────────────────────────────────────────────
  // 1. Education level bar chart
  const eduLevelData = mergeWithSeeds(analytics.educationStats || [], EDU_LEVELS);
  const totalEduRecords = eduLevelData.reduce((s, d) => s + d.count, 0);

  // 2. Education problems horizontal bar
  const eduProbData = mergeWithSeeds(analytics.eduIssueStats || [], EDU_PROBLEMS);

  // 3. Enrollment status donut
  const enrolled = eduLevelData.filter((d) => !["Not Enrolled", "Dropout"].includes(d.name)).reduce((s, d) => s + d.count, 0);
  const notEnrolled = eduLevelData.find((d) => d.name === "Not Enrolled")?.count || 0;
  const dropout = eduLevelData.find((d) => d.name === "Dropout")?.count || 0;
  const enrollmentDonut = [
    { name: "Enrolled", value: enrolled, fill: C.emerald },
    { name: "Not Enrolled", value: notEnrolled, fill: C.coral },
    { name: "Dropout", value: dropout, fill: C.amber },
  ].filter((d) => d.value >= 0);
  const totalEnrollment = enrolled + notEnrolled + dropout;

  // ── EMPLOYMENT derived ───────────────────────────────────────────────────────
  // 1. Employment status donut
  const empRaw = analytics.employmentStats || [];
  const employed = empRaw.find((e: any) => (e._id || "").toLowerCase().includes("employ") && !(e._id || "").toLowerCase().includes("unemp"))?.count || 0;
  const unemployed = empRaw.find((e: any) => (e._id || "").toLowerCase().includes("unemp"))?.count || 0;
  const empDonutData = [
    { name: "Employed", value: employed, fill: C.emerald },
    { name: "Unemployed", value: unemployed, fill: C.coral },
  ].filter((d) => d.value > 0);
  const totalEmp = employed + unemployed;

  // 2. Skills bar chart
  const skillsData = mergeWithSeeds(analytics.skillStats || [], SKILLS_LIST);

  // 3. Unemployment reasons horizontal bar
  const unempReasonData = mergeWithSeeds(analytics.unempReasonStats || [], UNEMP_REASONS);

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-bold">Community Analytics Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            onClick={exportCSV}
            variant="outline" size="sm"
            className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            disabled={exporting}
          >
            {exporting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
            Export CSV
          </Button>
          <Button onClick={load} variant="outline" size="sm" className="h-7 text-xs" disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs">Close</Button>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={BarChart3} label="Total Surveys" value={totalSurveys} sub="All time" color="blue" />
        <KpiCard icon={Users} label="Surveyors" value={`${dash.overview.activeSurveyors}/${dash.overview.totalSurveyors}`} sub="Active / Total" color="teal" />
        <KpiCard icon={Heart} label="Health Cases" value={totalHealthCases} sub={`${healthBarData.filter(d => d.count > 0).length} conditions tracked`} color="coral" />
        <KpiCard icon={Shield} label="Ayushman (Full)" value={`${ayushmanFullPct}%`} sub={`${ayushmanAll} of ${totalAyushman} families`} color="amber" />
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/60 p-1 rounded-xl">
          {[
            { v: "healthcare", label: "🏥 Healthcare" },
            { v: "education", label: "🎓 Education" },
            { v: "employment", label: "💼 Employment" },
          ].map((t) => (
            <TabsTrigger
              key={t.v} value={t.v}
              className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ════════════════════ HEALTHCARE TAB ════════════════════ */}
        <TabsContent value="healthcare" className="space-y-6 mt-4">
          <SectionCard title="Healthcare Analytics" icon={Heart} color="coral">

            {/* HC-1 ─ Health Issues Horizontal Bar Chart */}
            <ChartCard title="Health Issue Distribution by Condition">
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={healthBarData}
                    layout="vertical"
                    margin={{ left: 10, right: 40, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickFormatter={(v) => Number.isInteger(v) ? String(v) : ""}
                      tick={{ fontSize: 10 }}
                      label={{ value: "Number of Cases", position: "insideBottom", fontSize: 10, offset: -2 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 9 }}
                      width={130}
                    />
                    <Tooltip
                      formatter={(v: any) => [
                        `${v} (${totalHealthCases > 0 ? Math.round((v / totalHealthCases) * 100) : 0}%)`,
                        "Cases",
                      ]}
                      cursor={{ fill: "#f1f5f920" }}
                    />
                    <Bar dataKey="count" name="Cases" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {healthBarData.map((_, i) => (
                        <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Summary table */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-2 border-t pt-2">
                  {healthBarData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: PIE_PALETTE[i % PIE_PALETTE.length] }}
                        />
                        <span className="truncate text-muted-foreground" title={d.name}>{d.name}</span>
                      </div>
                      <span className="font-semibold shrink-0 ml-2 tabular-nums">
                        {d.count}
                        {d.count > 0 && totalHealthCases > 0 && (
                          <span className="text-muted-foreground font-normal ml-1">
                            ({Math.round((d.count / totalHealthCases) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {totalHealthCases === 0 && (
                  <p className="text-xs text-center text-muted-foreground py-4">
                    No health issue data available
                  </p>
                )}
              </div>
            </ChartCard>

            {/* HC-2 ─ Ayushman Card Donut */}
            <ChartCard title="Ayushman Card Coverage">
              {totalAyushman > 0 ? (
                <div className="space-y-3">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={ayushmanDonutData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={85}
                        dataKey="value" paddingAngle={3}
                        labelLine={false}
                        label={renderPieLabel}
                      >
                        {ayushmanDonutData.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [v, n]} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-1 text-center border-t pt-2">
                    {[
                      { label: "All Covered", value: ayushmanAll, color: C.emerald },
                      { label: "Partial", value: ayushmanSome, color: C.amber },
                      { label: "No Coverage", value: ayushmanNone, color: C.coral },
                    ].map((r) => (
                      <div key={r.label}>
                        <p className="text-xs text-muted-foreground">{r.label}</p>
                        <p className="text-base font-bold" style={{ color: r.color }}>{r.value}</p>
                        <p className="text-xs text-muted-foreground">{pct(r.value, totalAyushman)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <NoData msg="No Ayushman data available" />
              )}
            </ChartCard>

            {/* HC-3 ─ Morbidity Problems Reported (Horizontal Bar) */}
            <ChartCard title="Morbidity Problems Reported">
              <div className="space-y-3">
                {/* Responsive horizontal bar chart */}
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={morbProbData}
                    layout="vertical"
                    margin={{ left: 10, right: 40, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickFormatter={(v) => Number.isInteger(v) ? String(v) : ""}
                      tick={{ fontSize: 10 }}
                      label={{ value: "Number of Cases", position: "insideBottom", fontSize: 10, offset: -2 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 10 }}
                      width={85}
                    />
                    <Tooltip
                      formatter={(v: any) => [
                        `${v} (${totalMorbProblems > 0 ? Math.round((v / totalMorbProblems) * 100) : 0}%)`,
                        "Cases",
                      ]}
                      cursor={{ fill: "#f1f5f920" }}
                    />
                    <Bar dataKey="count" name="Cases" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {morbProbData.map((_, i) => (
                        <Cell key={i} fill={PIE_PALETTE[(i + 4) % PIE_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Summary table below chart */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-2 border-t pt-2">
                  {morbProbData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: PIE_PALETTE[(i + 4) % PIE_PALETTE.length] }}
                        />
                        <span className="truncate text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-semibold shrink-0 ml-2 tabular-nums">
                        {d.count}
                        {d.count > 0 && totalMorbProblems > 0 && (
                          <span className="text-muted-foreground font-normal ml-1">
                            ({Math.round((d.count / totalMorbProblems) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {totalMorbProblems === 0 && (
                  <p className="text-xs text-center text-muted-foreground py-4">
                    No morbidity problems reported yet
                  </p>
                )}
              </div>
            </ChartCard>

          </SectionCard>
        </TabsContent>

        {/* ════════════════════ EDUCATION TAB ════════════════════ */}
        <TabsContent value="education" className="space-y-6 mt-4">
          <SectionCard title="Education Analytics" icon={GraduationCap} color="blue">

            {/* ED-1 ─ Education Level Bar Chart */}
            <ChartCard title="Education Level Distribution">
              {totalEduRecords > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eduLevelData} margin={{ left: 0, right: 10, top: 5, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-35} textAnchor="end" height={60} interval={0} />
                    <YAxis allowDecimals={false} tickFormatter={(v) => Number.isInteger(v) ? String(v) : ""} tick={{ fontSize: 10 }} label={{ value: "Members", angle: -90, position: "insideLeft", fontSize: 10, offset: 10 }} />
                    <Tooltip formatter={(v: any) => [v, "Members"]} />
                    <Bar dataKey="count" name="Members" radius={[4, 4, 0, 0]}>
                      {eduLevelData.map((_, i) => (
                        <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData msg="No education level data available" />
              )}
            </ChartCard>

            {/* ED-2 ─ Education Problems Horizontal Bar */}
            <ChartCard title="Educational Problems Faced">
              {eduProbData.some((d) => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eduProbData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} tickFormatter={(v) => Number.isInteger(v) ? String(v) : ""} tick={{ fontSize: 10 }} label={{ value: "Cases", position: "insideBottom", fontSize: 10, offset: -2 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={110} />
                    <Tooltip formatter={(v: any) => [v, "Cases"]} />
                    <Bar dataKey="count" name="Cases" radius={[0, 4, 4, 0]}>
                      {eduProbData.map((_, i) => (
                        <Cell key={i} fill={PIE_PALETTE[(i + 3) % PIE_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData msg="No educational problem data available" />
              )}
            </ChartCard>

            {/* ED-3 ─ Enrollment Status Donut */}
            <ChartCard title="Enrollment Status Distribution">
              {totalEnrollment > 0 ? (
                <div className="space-y-3">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={enrollmentDonut}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={85}
                        dataKey="value" paddingAngle={3}
                        labelLine={false}
                        label={renderPieLabel}
                      >
                        {enrollmentDonut.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [v, n]} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-1 text-center border-t pt-2">
                    {[
                      { label: "Enrolled", value: enrolled, color: C.emerald },
                      { label: "Not Enrolled", value: notEnrolled, color: C.coral },
                      { label: "Dropout", value: dropout, color: C.amber },
                    ].map((r) => (
                      <div key={r.label}>
                        <p className="text-xs text-muted-foreground">{r.label}</p>
                        <p className="text-base font-bold" style={{ color: r.color }}>{r.value}</p>
                        <p className="text-xs text-muted-foreground">{pct(r.value, totalEnrollment)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <NoData msg="No enrollment data available" />
              )}
            </ChartCard>

          </SectionCard>
        </TabsContent>

        {/* ════════════════════ EMPLOYMENT TAB ════════════════════ */}
        <TabsContent value="employment" className="space-y-6 mt-4">
          <SectionCard title="Employment Analytics" icon={Briefcase} color="violet">

            {/* EM-1 ─ Employment Status Donut */}
            <ChartCard title="Employment Status Distribution">
              {totalEmp > 0 ? (
                <div className="space-y-3">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={empDonutData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={85}
                        dataKey="value" paddingAngle={3}
                        labelLine={false}
                        label={renderPieLabel}
                      >
                        {empDonutData.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [v, n]} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 text-center border-t pt-2">
                    {[
                      { label: "Employed", value: employed, color: C.emerald },
                      { label: "Unemployed", value: unemployed, color: C.coral },
                    ].map((r) => (
                      <div key={r.label}>
                        <p className="text-xs text-muted-foreground">{r.label}</p>
                        <p className="text-xl font-bold" style={{ color: r.color }}>{r.value}</p>
                        <p className="text-xs text-muted-foreground">{pct(r.value, totalEmp)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <NoData msg="No employment data available" />
              )}
            </ChartCard>

            {/* EM-2 ─ Skills Bar Chart */}
            <ChartCard title="Skills Distribution Among Members">
              {skillsData.some((d) => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={skillsData} margin={{ left: 0, right: 10, top: 5, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-35} textAnchor="end" height={60} interval={0} />
                    <YAxis allowDecimals={false} tickFormatter={(v) => Number.isInteger(v) ? String(v) : ""} tick={{ fontSize: 10 }} label={{ value: "Members", angle: -90, position: "insideLeft", fontSize: 10, offset: 10 }} />
                    <Tooltip formatter={(v: any) => [v, "Members"]} />
                    <Bar dataKey="count" name="Members" radius={[4, 4, 0, 0]}>
                      {skillsData.map((_, i) => (
                        <Cell key={i} fill={PIE_PALETTE[(i + 2) % PIE_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData msg="No skills data available" />
              )}
            </ChartCard>

            {/* EM-3 ─ Unemployment Reasons Horizontal Bar */}
            <ChartCard title="Reasons for Unemployment">
              {unempReasonData.some((d) => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={unempReasonData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} tickFormatter={(v) => Number.isInteger(v) ? String(v) : ""} tick={{ fontSize: 10 }} label={{ value: "Cases", position: "insideBottom", fontSize: 10, offset: -2 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={120} />
                    <Tooltip formatter={(v: any) => [v, "Cases"]} />
                    <Bar dataKey="count" name="Cases" radius={[0, 4, 4, 0]}>
                      {unempReasonData.map((_, i) => (
                        <Cell key={i} fill={PIE_PALETTE[(i + 5) % PIE_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData msg="No unemployment reason data available" />
              )}
            </ChartCard>

          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
        <span>Data from {totalSurveys} surveys across {dash.overview.totalVillages} villages</span>
        <span>{lastRefresh.toLocaleDateString()} {lastRefresh.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}