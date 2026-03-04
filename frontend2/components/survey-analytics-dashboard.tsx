"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminApiService, type DashboardStats } from "@/lib/admin-api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Loader2, TrendingUp, CheckCircle, AlertCircle, BarChart3 } from "lucide-react";

interface SurveyAnalyticsDashboardProps {
  onClose: () => void;
}

export function SurveyAnalyticsDashboard({ onClose }: SurveyAnalyticsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await AdminApiService.getDashboardStats();
      setStats(data);
    } catch (error: any) {
      setError(error.message || "Failed to load analytics");
      console.error("Error loading stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error || "Failed to load analytics"}</p>
        </div>
        <Button onClick={loadDashboardStats} variant="outline" size="sm" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const surveyStatusData = [
    { name: "Draft", value: stats.surveyStatus.draft, fill: "#94a3b8" },
    { name: "Submitted", value: stats.surveyStatus.submitted, fill: "#f59e0b" },
    { name: "Verified", value: stats.surveyStatus.verified, fill: "#10b981" },
    { name: "Rejected", value: stats.surveyStatus.rejected, fill: "#ef4444" },
  ];

  const monthlyData = stats.monthlyTrends.map(trend => ({
    month: `${trend._id.month}/${trend._id.year}`,
    total: trend.total,
    verified: trend.verified,
  }));

  return (
    <div className="space-y-4">
      {/* Close Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Survey Analytics Dashboard
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Surveys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalSurveys}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Verified Surveys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.overview.verifiedSurveys}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.overview.verifiedSurveys / stats.overview.totalSurveys) * 100) || 0}% Verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Surveyors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.activeSurveyors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {stats.overview.totalSurveyors} Total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Coverage Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.overview.coverageRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.villageCoverage.surveyedHouseholds}/{stats.villageCoverage.totalHouseholds} Households
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Survey Status</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="performers">Top Surveyors</TabsTrigger>
        </TabsList>

        {/* Survey Status Distribution */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Survey Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pie Chart */}
                <div className="flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={surveyStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {surveyStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Details */}
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Draft</span>
                      <span className="text-lg font-bold">{stats.surveyStatus.draft}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full mt-2">
                      <div
                        className="h-full bg-gray-400 rounded-full"
                        style={{
                          width: `${(stats.surveyStatus.draft / stats.overview.totalSurveys) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border bg-amber-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Submitted</span>
                      <span className="text-lg font-bold">{stats.surveyStatus.submitted}</span>
                    </div>
                    <div className="h-2 bg-amber-200 rounded-full mt-2">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${(stats.surveyStatus.submitted / stats.overview.totalSurveys) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border bg-green-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Verified</span>
                      <span className="text-lg font-bold">{stats.surveyStatus.verified}</span>
                    </div>
                    <div className="h-2 bg-green-200 rounded-full mt-2">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${(stats.surveyStatus.verified / stats.overview.totalSurveys) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border bg-red-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Rejected</span>
                      <span className="text-lg font-bold">{stats.surveyStatus.rejected}</span>
                    </div>
                    <div className="h-2 bg-red-200 rounded-full mt-2">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{
                          width: `${(stats.surveyStatus.rejected / stats.overview.totalSurveys) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Survey Submissions & Verifications (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    name="Total Submitted"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="verified"
                    stroke="#10b981"
                    name="Verified"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Performers */}
        <TabsContent value="performers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Surveyors (Last 30 Days)</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Based on verified surveys</p>
            </CardHeader>
            <CardContent>
              {stats.topSurveyors.length > 0 ? (
                <div className="space-y-3">
                  {stats.topSurveyors.map((surveyor, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-muted-foreground">#{idx + 1}</div>
                        <div>
                          <p className="font-medium text-sm">{surveyor.username}</p>
                        </div>
                      </div>
                      <Badge variant="default">
                        {surveyor.verifiedCount} Verified
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No verified surveys yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-muted-foreground">New Surveys</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.recentActivity.recentSurveys}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-muted-foreground">Newly Verified</p>
                  <p className="text-2xl font-bold text-green-600">{stats.recentActivity.recentVerifications}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
