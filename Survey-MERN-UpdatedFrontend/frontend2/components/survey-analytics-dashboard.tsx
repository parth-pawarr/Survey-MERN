"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminApiService } from "@/lib/admin-api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Treemap,
} from "recharts";
import {
  Loader2, TrendingUp, CheckCircle, Heart,
  Users, GraduationCap, Briefcase, Activity,
  RefreshCw, Shield, BarChart3, Download,
} from "lucide-react";

// ─── color palette ───────────────────────────────────────────────────────────
const COLORS = {
  teal: "#0d9488", emerald: "#10b981", amber: "#f59e0b",
  coral: "#f43f5e", blue: "#3b82f6", violet: "#8b5cf6",
  orange: "#f97316", slate: "#64748b", lime: "#84cc16",
  pink: "#ec4899",
};
const PIE_COLORS = Object.values(COLORS);

// ─── helpers ─────────────────────────────────────────────────────────────────
const pct = (n: number, total: number) =>
  total > 0 ? `${Math.round((n / total) * 100)}%` : "0%";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function KpiCard({
  icon: Icon, label, value, sub, color = "teal",
}: { icon: any; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-md">
      <div
        className="absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(circle at 80% 20%, ${COLORS[color as keyof typeof COLORS]}, transparent)` }}
      />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color: COLORS[color as keyof typeof COLORS] }}>
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div
            className="rounded-xl p-2"
            style={{ background: `${COLORS[color as keyof typeof COLORS]}18` }}
          >
            <Icon className="h-5 w-5" style={{ color: COLORS[color as keyof typeof COLORS] }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">{children}</CardContent>
    </Card>
  );
}

// ─── types ───────────────────────────────────────────────────────────────────
interface DashStats { overview: any; surveyStatus: any; villageCoverage: any; recentActivity: any; topSurveyors: any[]; monthlyTrends: any[] }
interface Analytics { completionTrends: any[]; villageDistribution: any[]; healthStats: any[]; educationStats: any[]; employmentStats: any[]; ayushmanStats: any[] }
interface PerfData { performanceMetrics: any[]; villageCoverage: any[]; performanceTrends: any[] }

// ─── main component ───────────────────────────────────────────────────────────
interface Props { onClose: () => void }

export function SurveyAnalyticsDashboard({ onClose }: Props) {
  const [dash, setDash] = useState<DashStats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [perf, setPerf] = useState<PerfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("overview");

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

  // ── derived data ──────────────────────────────────────────────────────────
  const totalSurveys = dash.overview.totalSurveys || 0;

  // Backend sets surveyStatus["Draft"], ["Submitted"] etc. (capitalized, from MongoDB _id),
  // while the pre-initialized object uses lowercase keys. Read both cases.
  const sv = dash.surveyStatus as any;
  const getSv = (cap: string, low: string) => sv[cap] ?? sv[low] ?? 0;

  const draftCount = getSv("Draft", "draft");
  const submittedCount = getSv("Submitted", "submitted");
  const verifiedCount = getSv("Verified", "verified");
  const rejectedCount = getSv("Rejected", "rejected");
  const statusTotal = draftCount + submittedCount + verifiedCount + rejectedCount;

  const statusData = [
    { name: "Draft", value: draftCount, fill: COLORS.slate },
    { name: "Submitted", value: submittedCount, fill: COLORS.amber },
    { name: "Verified", value: verifiedCount, fill: COLORS.emerald },
    { name: "Rejected", value: rejectedCount, fill: COLORS.coral },
  ];

  const monthlyData = (dash.monthlyTrends || []).map((t: any) => ({
    name: `${MONTHS[t._id.month - 1]} ${t._id.year}`,
    total: t.total, verified: t.verified,
  }));

  const healthData = (analytics.healthStats || []).map((h: any) => ({
    name: h._id?.length > 12 ? h._id.substring(0, 12) + "…" : h._id,
    fullName: h._id,
    count: h.count,
  }));

  const eduData = (analytics.educationStats || []).map((e: any) => ({
    name: e._id,
    count: e.count,
  }));

  const ayushmanData = (analytics.ayushmanStats || []).map((a: any) => ({
    name: a._id,
    value: a.count,
  }));

  const villageData = (analytics.villageDistribution || []).map((v: any) => ({
    name: v._id?.length > 10 ? v._id.substring(0, 10) + "…" : v._id,
    fullName: v._id,
    total: v.total,
    verified: v.verified,
    pending: v.total - v.verified,
  }));

  const trendData = (analytics.completionTrends || []).map((t: any) => ({
    name: `${t._id.day}/${t._id.month}`,
    total: t.total,
    verified: t.verified,
    rejected: t.rejected,
  }));

  const surveyorData = (perf.performanceMetrics || []).slice(0, 8).map((s: any) => ({
    name: s.surveyor?.username || s._id,
    total: s.totalSurveys,
    verified: s.verifiedSurveys,
    rejected: s.rejectedSurveys,
    pending: s.pendingSurveys,
    rate: Math.round(s.verificationRate || 0),
  }));

  const totalHealthCases = healthData.reduce((a, b) => a + b.count, 0);
  const totalAyushman = ayushmanData.reduce((a, b) => a + b.value, 0);
  const allCoverage = ayushmanData.find((a) => a.name === "All Members Have")?.value || 0;
  const someCoverage = ayushmanData.find((a) => a.name === "Some Members Have")?.value || 0;
  const noCoverage = ayushmanData.find((a) => a.name === "None Have")?.value || 0;
  // Full coverage = families where ALL members have card
  const ayushmanFullPct = totalAyushman > 0 ? Math.round((allCoverage / totalAyushman) * 100) : 0;
  // Any coverage = families with at least some members having card
  const ayushmanAnyPct = totalAyushman > 0 ? Math.round(((allCoverage + someCoverage) / totalAyushman) * 100) : 0;

  // Radar for education
  const eduRadar = eduData.map((e) => ({ subject: e.name, A: e.count }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-bold">Analytics Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            onClick={exportCSV}
            variant="outline"
            size="sm"
            className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            disabled={exporting}
          >
            {exporting
              ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              : <Download className="h-3 w-3 mr-1" />}
            Export CSV
          </Button>
          <Button onClick={load} variant="outline" size="sm" className="h-7 text-xs" disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs">
            Close
          </Button>
        </div>
      </div>

      {/* KPI Row — 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={BarChart3} label="Total Surveys" value={dash.overview.totalSurveys} sub="All time" color="blue" />
        <KpiCard icon={CheckCircle} label="Verified" value={dash.overview.verifiedSurveys} sub={pct(dash.overview.verifiedSurveys, totalSurveys) + " of total"} color="emerald" />
        <KpiCard icon={Users} label="Surveyors" value={`${dash.overview.activeSurveyors}/${dash.overview.totalSurveyors}`} sub="Active / Total" color="teal" />
        <KpiCard icon={Shield} label="Ayushman (Full)" value={`${ayushmanFullPct}%`} sub={`${allCoverage} of ${totalAyushman} families`} color="amber" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/60 p-1 rounded-xl">
          {[
            { v: "overview", label: "Overview" },
            { v: "health", label: "Health" },
            { v: "geography", label: "Geography" },
            { v: "employment", label: "Employment" },
            { v: "trends", label: "Trends" },
            { v: "surveyors", label: "Surveyors" },
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

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Survey Status Donut */}
            <ChartCard title="Survey Status Distribution">
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [v, "Surveys"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {statusData.map((s) => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.fill }} />
                        <span className="text-muted-foreground">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{s.value}</span>
                        <span className="text-muted-foreground">{pct(s.value, statusTotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            {/* Monthly Trends */}
            <ChartCard title="Monthly Survey Trends (6 Months)">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="gtotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gverified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="total" stroke={COLORS.blue} fill="url(#gtotal)" name="Total" strokeWidth={2} />
                  <Area type="monotone" dataKey="verified" stroke={COLORS.emerald} fill="url(#gverified)" name="Verified" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Ayushman Coverage */}
            <ChartCard title="Ayushman Card Coverage">
              {totalAyushman > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ResponsiveContainer width="50%" height={160}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "All Members", value: allCoverage },
                            { name: "Some Members", value: someCoverage },
                            { name: "None", value: noCoverage },
                          ]}
                          cx="50%" cy="50%" outerRadius={65} dataKey="value" paddingAngle={3}
                        >
                          <Cell fill={COLORS.emerald} />
                          <Cell fill={COLORS.amber} />
                          <Cell fill={COLORS.coral} />
                        </Pie>
                        <Tooltip formatter={(v: any, n: any) => [v, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2 text-xs">
                      {[
                        { label: "All Members", value: allCoverage, color: COLORS.emerald },
                        { label: "Some Members", value: someCoverage, color: COLORS.amber },
                        { label: "None", value: noCoverage, color: COLORS.coral },
                      ].map((row) => (
                        <div key={row.label}>
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                              <span className="text-muted-foreground">{row.label}</span>
                            </div>
                            <span className="font-semibold">{row.value} <span className="text-muted-foreground font-normal">({pct(row.value, totalAyushman)})</span></span>
                          </div>
                          <div className="h-1 bg-muted rounded-full overflow-hidden ml-3.5">
                            <div className="h-full rounded-full" style={{ width: pct(row.value, totalAyushman), background: row.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Summary stats */}
                  <div className="grid grid-cols-2 gap-2 border-t pt-2">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Full Coverage</p>
                      <p className="text-lg font-bold" style={{ color: COLORS.emerald }}>{ayushmanFullPct}%</p>
                      <p className="text-xs text-muted-foreground">All members covered</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Any Coverage</p>
                      <p className="text-lg font-bold" style={{ color: COLORS.amber }}>{ayushmanAnyPct}%</p>
                      <p className="text-xs text-muted-foreground">At least 1 member</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground py-10">No Ayushman data available</p>
              )}
            </ChartCard>


            {/* Top Surveyors */}
            <ChartCard title="Top Surveyors (Verified Surveys)">
              {dash.topSurveyors.length > 0 ? (
                <div className="space-y-2 px-2">
                  {dash.topSurveyors.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 text-xs font-bold text-muted-foreground">#{i + 1}</span>
                      <span className="flex-1 text-xs font-medium truncate">{s.username}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            background: COLORS.teal,
                            width: `${Math.min(100, (s.verifiedCount / (dash.topSurveyors[0]?.verifiedCount || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">{s.verifiedCount}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">No verified surveys yet</p>
              )}
            </ChartCard>
          </div>
        </TabsContent>

        {/* ── HEALTH TAB ── */}
        <TabsContent value="health" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Health Issue Types — Top Conditions">
              {healthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={healthData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={90} />
                    <Tooltip
                      formatter={(v: any) => [v, "Cases"]}
                      labelFormatter={(l) => healthData.find((h) => h.name === l)?.fullName || l}
                    />
                    <Bar dataKey="count" name="Cases" radius={[0, 4, 4, 0]}>
                      {healthData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-center text-muted-foreground py-10">No health data available</p>
              )}
            </ChartCard>

            <ChartCard title="Health Issue Distribution (Pie)">
              {healthData.length > 0 ? (
                <div className="space-y-1">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={healthData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                        {healthData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any, p: any) => [v, p.payload.fullName || n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-1 px-2">
                    {healthData.slice(0, 6).map((h, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="truncate text-muted-foreground" title={h.fullName}>{h.fullName}</span>
                        <span className="font-semibold ml-auto shrink-0">{h.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground py-10">No health data available</p>
              )}
            </ChartCard>

            {/* Health KPIs */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Health Cases", value: totalHealthCases, color: COLORS.coral },
                { label: "Unique Conditions", value: healthData.length, color: COLORS.violet },
                { label: "Top Condition", value: healthData[0]?.fullName || "–", color: COLORS.orange },
                { label: "Families with Issues", value: dash.surveyStatus?.draft !== undefined ? "See Trends" : "–", color: COLORS.teal },
              ].map((kpi, i) => (
                <div key={i} className="rounded-xl border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                  <p className="text-base font-bold truncate" style={{ color: kpi.color }} title={String(kpi.value)}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── GEOGRAPHY TAB ── */}
        <TabsContent value="geography" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Village-wise Survey Distribution">
              {villageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={villageData} margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      labelFormatter={(l) => villageData.find((v) => v.name === l)?.fullName || l}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="verified" name="Verified" fill={COLORS.emerald} stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill={COLORS.amber} stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-center text-muted-foreground py-10">No village data</p>
              )}
            </ChartCard>

            <ChartCard title="Village Stats Summary">
              <div className="space-y-2 px-2 max-h-72 overflow-y-auto">
                {villageData.map((v, i) => (
                  <div key={i} className="border rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold" title={v.fullName}>{v.fullName}</span>
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-xs py-0">{v.total} total</Badge>
                        <Badge className="text-xs py-0 bg-emerald-100 text-emerald-700 border-0">{v.verified} ✓</Badge>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                        style={{ width: pct(v.verified, v.total) }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{pct(v.verified, v.total)} verified</p>
                  </div>
                ))}
                {villageData.length === 0 && (
                  <p className="text-xs text-center text-muted-foreground py-8">No village data available</p>
                )}
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        {/* ── EMPLOYMENT/EDUCATION TAB ── */}
        <TabsContent value="employment" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Education Level Distribution">
              {eduData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={eduRadar}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                    <Radar name="Students" dataKey="A" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.25} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-center text-muted-foreground py-10">No education data</p>
              )}
            </ChartCard>

            <ChartCard title="Education Level Breakdown">
              {eduData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={eduData} margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                      {eduData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-center text-muted-foreground py-10">No education data</p>
              )}
            </ChartCard>

            {/* Employment quick stats */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Families w/ Employed", value: "–", icon: Briefcase, color: COLORS.teal },
                { label: "Families w/ School Children", value: "–", icon: GraduationCap, color: COLORS.blue },
                { label: "Education Records", value: eduData.reduce((s, e) => s + e.count, 0), icon: GraduationCap, color: COLORS.violet },
                { label: "Education Levels Tracked", value: eduData.length, icon: BarChart3, color: COLORS.amber },
              ].map((s, i) => (
                <div key={i} className="rounded-xl border p-3 flex items-center gap-3">
                  <div className="rounded-lg p-2" style={{ background: `${s.color}18` }}>
                    <s.icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                    <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── TRENDS TAB ── */}
        <TabsContent value="trends" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            <ChartCard title="Daily Survey Activity — Completion Trends">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData} margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="total" stroke={COLORS.blue} strokeWidth={2} name="Total" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="verified" stroke={COLORS.emerald} strokeWidth={2} name="Verified" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="rejected" stroke={COLORS.coral} strokeWidth={2} name="Rejected" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-center text-muted-foreground py-10">No trend data available</p>
              )}
            </ChartCard>

            {/* Recent activity */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "New (Last 7d)", value: dash.recentActivity.recentSurveys, color: COLORS.blue },
                { label: "Verified (Last 7d)", value: dash.recentActivity.recentVerifications, color: COLORS.emerald },
                { label: "Villages Covered", value: dash.overview.totalVillages, color: COLORS.violet },
                { label: "Survey Momentum", value: trendData.length > 0 ? `${trendData[trendData.length - 1]?.total || 0}/day` : "–", color: COLORS.amber },
              ].map((s, i) => (
                <div key={i} className="rounded-xl border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── SURVEYORS TAB ── */}
        <TabsContent value="surveyors" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Surveyor Performance — Survey Counts">
              {surveyorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={surveyorData} margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="verified" name="Verified" fill={COLORS.emerald} stackId="a" />
                    <Bar dataKey="pending" name="Pending" fill={COLORS.amber} stackId="a" />
                    <Bar dataKey="rejected" name="Rejected" fill={COLORS.coral} stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-center text-muted-foreground py-10">No surveyor data</p>
              )}
            </ChartCard>

            <ChartCard title="Verification Rate by Surveyor">
              {surveyorData.length > 0 ? (
                <div className="space-y-3 px-2 max-h-72 overflow-y-auto">
                  {surveyorData.map((s, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{s.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{s.total} surveys</span>
                          <Badge
                            className="text-xs py-0"
                            style={{
                              background: s.rate >= 70 ? `${COLORS.emerald}20` : s.rate >= 40 ? `${COLORS.amber}20` : `${COLORS.coral}20`,
                              color: s.rate >= 70 ? COLORS.emerald : s.rate >= 40 ? COLORS.amber : COLORS.coral,
                              border: "none",
                            }}
                          >
                            {s.rate}%
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${s.rate}%`,
                            background: s.rate >= 70 ? COLORS.emerald : s.rate >= 40 ? COLORS.amber : COLORS.coral,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground py-10">No surveyor data</p>
              )}
            </ChartCard>
          </div>

          {/* Village coverage table */}
          <ChartCard title="Surveyor Village Coverage">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Surveyor</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Villages</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Verification %</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total Surveys</th>
                  </tr>
                </thead>
                <tbody>
                  {surveyorData.map((s, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 font-medium">{s.name}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="outline" className="text-xs">{perf.villageCoverage.find((v: any) => v.username === s.name)?.villageCount || "–"}</Badge>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge className="text-xs" style={{ background: COLORS.emerald + "20", color: COLORS.emerald, border: "none" }}>
                          Active
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-center font-semibold" style={{ color: s.rate >= 70 ? COLORS.emerald : s.rate >= 40 ? COLORS.amber : COLORS.coral }}>
                        {s.rate}%
                      </td>
                      <td className="py-2 px-3 text-right font-bold">{s.total}</td>
                    </tr>
                  ))}
                  {surveyorData.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
        <span>Data sourced from {totalSurveys} survey records across {dash.overview.totalVillages} villages</span>
        <span>{lastRefresh.toLocaleDateString()} {lastRefresh.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
