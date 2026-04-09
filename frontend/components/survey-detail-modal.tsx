"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SurveyorApiService } from "@/lib/surveyor-api";
import {
  X,
  Loader2,
  User,
  Phone,
  MapPin,
  Users,
  Heart,
  GraduationCap,
  Briefcase,
  Shield,
  Calendar,
  Hash,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HealthMember {
  _id?: string;
  patientName: string;
  age: number;
  gender: string;
  healthIssueType: string[];
  otherHealthIssue?: string;
  hasAdditionalMorbidity: string[];
  additionalMorbidityDetails?: string;
}

interface EducationChild {
  _id?: string;
  Name: string;
  age: number;
  gender: string;
  educationLevel: string;
  educationalIssues?: string[];
  otherEducationalIssue?: string;
}

interface UnemployedMember {
  _id?: string;
  name: string;
  age: number;
  gender: string;
  employmentStatus: string;
  highestEducation: string;
  skillsKnown?: string[];
  otherSkills?: string;
  unemploymentReason?: string;
  otherReason?: string;
}

interface FullSurvey {
  _id: string;
  representativeName: string;
  mobileNumber: string;
  isWhatsAppNumber: string;
  representativeAge: number;
  representativeGender: string;
  totalFamilyMembers: number;
  ayushmanCardStatus: string;
  ayushmanMembersCount?: number;
  hasHealthIssues: string;
  healthMembers?: HealthMember[];
  hasSchoolChildren: string;
  educationChildren?: EducationChild[];
  hasEmployedMembers: string;
  hasUnEmployedMembers: string;
  unemployedMembers?: UnemployedMember[];
  surveyorId: string;
  village: string;
  status: "Draft" | "Submitted" | "Verified" | "Rejected";
  createdAt: string;
  updatedAt?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  latitude?: number;
  longitude?: number;
}

interface SurveyDetailModalProps {
  surveyId: string;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { icon: React.ReactNode; cls: string }> = {
    Draft: {
      icon: <Clock className="h-3 w-3" />,
      cls: "bg-muted text-muted-foreground border-border",
    },
    Submitted: {
      icon: <CheckCircle2 className="h-3 w-3" />,
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    },
    Verified: {
      icon: <CheckCircle2 className="h-3 w-3" />,
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    Rejected: {
      icon: <XCircle className="h-3 w-3" />,
      cls: "bg-red-50 text-red-700 border-red-200",
    },
  };
  const { icon, cls } = cfg[status] ?? cfg.Draft;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cls}`}
    >
      {icon}
      {status}
    </span>
  );
}

function SectionHeader({
  icon,
  title,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-2 pb-1.5 border-b mb-3`}>
      <div className={`p-1 rounded-md ${color} text-white`}>{icon}</div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-2 py-1 text-xs border-b border-muted/50 last:border-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right break-all">{value ?? "—"}</span>
    </div>
  );
}

function TagList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <span className="text-xs text-muted-foreground">None</span>;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map((item, i) => (
        <span
          key={i}
          className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function SurveyDetailModal({ surveyId, onClose }: SurveyDetailModalProps) {
  const [survey, setSurvey] = useState<FullSurvey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    SurveyorApiService.getSurvey(surveyId)
      .then((data) => setSurvey(data as unknown as FullSurvey))
      .catch((err) => setError(err.message || "Failed to load survey"))
      .finally(() => setLoading(false));
  }, [surveyId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDownload = () => window.print();

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Panel */}
      <div className="relative w-full sm:max-w-2xl bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Survey Details</h2>
            {survey && (
              <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                {survey._id.slice(-8).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-7 px-2 text-xs print:hidden"
              title="Download PDF"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 px-2 text-xs print:hidden"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5 custom-scrollbar">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading survey...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {survey && (
            <>
              {/* ── Status Banner ── */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40 border">
                <StatusBadge status={survey.status} />
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {fmtDate(survey.createdAt)}
                </span>
              </div>

              {/* ── Personal Details ── */}
              <section>
                <SectionHeader
                  icon={<User className="h-3.5 w-3.5" />}
                  title="Personal Details"
                  color="bg-blue-500"
                />
                <div className="space-y-0">
                  <InfoRow label="Full Name" value={survey.representativeName} />
                  <InfoRow
                    label="Mobile Number"
                    value={
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {survey.mobileNumber}
                        {survey.isWhatsAppNumber === "Yes" && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded-full">
                            WhatsApp
                          </span>
                        )}
                      </span>
                    }
                  />
                  <InfoRow label="Age" value={`${survey.representativeAge} years`} />
                  <InfoRow label="Gender" value={survey.representativeGender} />
                  <InfoRow label="Total Family Members" value={survey.totalFamilyMembers} />
                </div>
              </section>

              {/* ── Location & Assignment ── */}
              <section>
                <SectionHeader
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  title="Village & Assignment"
                  color="bg-violet-500"
                />
                <div className="space-y-0">
                  <InfoRow label="Village" value={<span className="uppercase">{survey.village}</span>} />
                  {survey.latitude && survey.longitude && (
                    <InfoRow
                      label="GPS Coordinates"
                      value={`${survey.latitude.toFixed(5)}, ${survey.longitude.toFixed(5)}`}
                    />
                  )}
                  {survey.verifiedAt && (
                    <InfoRow label="Verified At" value={fmtDate(survey.verifiedAt)} />
                  )}
                  {survey.verificationNotes && (
                    <InfoRow label="Verification Notes" value={survey.verificationNotes} />
                  )}
                  {survey.rejectedAt && (
                    <InfoRow label="Rejected At" value={fmtDate(survey.rejectedAt)} />
                  )}
                  {survey.rejectionReason && (
                    <InfoRow
                      label="Rejection Reason"
                      value={
                        <span className="text-destructive">{survey.rejectionReason}</span>
                      }
                    />
                  )}
                </div>
              </section>

              {/* ── Ayushman Card ── */}
              <section>
                <SectionHeader
                  icon={<Shield className="h-3.5 w-3.5" />}
                  title="Ayushman Card"
                  color="bg-amber-500"
                />
                <div className="space-y-0">
                  <InfoRow label="Coverage Status" value={survey.ayushmanCardStatus} />
                  {survey.ayushmanCardStatus === "Some Members Have" && (
                    <InfoRow
                      label="Members with Card"
                      value={survey.ayushmanMembersCount ?? "—"}
                    />
                  )}
                </div>
              </section>

              {/* ── Health ── */}
              <section>
                <SectionHeader
                  icon={<Heart className="h-3.5 w-3.5" />}
                  title="Health"
                  color="bg-rose-500"
                />
                <InfoRow label="Has Health Issues?" value={survey.hasHealthIssues} />
                {survey.healthMembers && survey.healthMembers.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {survey.healthMembers.map((m, i) => (
                      <div key={m._id ?? i} className="rounded-xl border bg-muted/20 p-3">
                        <p className="text-xs font-semibold mb-2">
                          {i + 1}. {m.patientName}
                        </p>
                        <div className="space-y-0">
                          <InfoRow label="Age / Gender" value={`${m.age} yrs · ${m.gender}`} />
                          <InfoRow
                            label="Health Issues"
                            value={
                              <div className="text-right">
                                <TagList items={m.healthIssueType} />
                                {m.otherHealthIssue && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Other: {m.otherHealthIssue}
                                  </p>
                                )}
                              </div>
                            }
                          />
                          {m.hasAdditionalMorbidity && m.hasAdditionalMorbidity.length > 0 && (
                            <InfoRow
                              label="Morbidity"
                              value={
                                <div className="text-right">
                                  <TagList items={m.hasAdditionalMorbidity} />
                                  {m.additionalMorbidityDetails && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {m.additionalMorbidityDetails}
                                    </p>
                                  )}
                                </div>
                              }
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Education ── */}
              <section>
                <SectionHeader
                  icon={<GraduationCap className="h-3.5 w-3.5" />}
                  title="Education"
                  color="bg-sky-500"
                />
                <InfoRow label="Has School Children?" value={survey.hasSchoolChildren} />
                {survey.educationChildren && survey.educationChildren.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {survey.educationChildren.map((c, i) => (
                      <div key={c._id ?? i} className="rounded-xl border bg-muted/20 p-3">
                        <p className="text-xs font-semibold mb-2">
                          {i + 1}. {c.Name}
                        </p>
                        <div className="space-y-0">
                          <InfoRow label="Age / Gender" value={`${c.age} yrs · ${c.gender}`} />
                          <InfoRow label="Education Level" value={c.educationLevel} />
                          {c.educationalIssues && c.educationalIssues.length > 0 && (
                            <InfoRow
                              label="Issues"
                              value={
                                <div className="text-right">
                                  <TagList items={c.educationalIssues} />
                                  {c.otherEducationalIssue && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      Other: {c.otherEducationalIssue}
                                    </p>
                                  )}
                                </div>
                              }
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Employment ── */}
              <section>
                <SectionHeader
                  icon={<Briefcase className="h-3.5 w-3.5" />}
                  title="Employment"
                  color="bg-emerald-500"
                />
                <div className="space-y-0">
                  <InfoRow label="Has Employed Members?" value={survey.hasEmployedMembers} />
                  <InfoRow label="Has Unemployed Members?" value={survey.hasUnEmployedMembers} />
                </div>
                {survey.unemployedMembers && survey.unemployedMembers.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {survey.unemployedMembers.map((m, i) => (
                      <div key={m._id ?? i} className="rounded-xl border bg-muted/20 p-3">
                        <p className="text-xs font-semibold mb-2">
                          {i + 1}. {m.name}
                        </p>
                        <div className="space-y-0">
                          <InfoRow label="Age / Gender" value={`${m.age} yrs · ${m.gender}`} />
                          <InfoRow label="Status" value={m.employmentStatus} />
                          <InfoRow label="Highest Education" value={m.highestEducation} />
                          {m.skillsKnown && m.skillsKnown.length > 0 && (
                            <InfoRow
                              label="Skills"
                              value={
                                <div className="text-right">
                                  <TagList items={m.skillsKnown} />
                                  {m.otherSkills && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      Other: {m.otherSkills}
                                    </p>
                                  )}
                                </div>
                              }
                            />
                          )}
                          {m.unemploymentReason && (
                            <InfoRow label="Unemployment Reason" value={m.unemploymentReason} />
                          )}
                          {m.otherReason && (
                            <InfoRow label="Other Reason" value={m.otherReason} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Meta ── */}
              <section>
                <SectionHeader
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  title="Submission Info"
                  color="bg-slate-500"
                />
                <div className="space-y-0">
                  <InfoRow label="Survey ID" value={<span className="font-mono">{survey._id}</span>} />
                  <InfoRow label="Submitted On" value={fmtDate(survey.createdAt)} />
                  {survey.updatedAt && survey.updatedAt !== survey.createdAt && (
                    <InfoRow label="Last Updated" value={fmtDate(survey.updatedAt)} />
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t px-4 py-3 flex justify-end shrink-0 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
