"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/progress-indicator";
import {
  CompactInput,
  PhoneInput,
  CompactRadioGroup,
  CompactDropdown,
  CompactCheckboxGroup,
  AgeGenderRow,
} from "@/components/compact-fields";
import {
  HEALTH_ISSUES,
  MORBIDITY_OPTIONS,
  EDUCATION_LEVELS,
  EDUCATION_ISSUES,
  UNEMPLOYMENT_EDUCATION,
  SKILLS,
  UNEMPLOYMENT_REASONS,
  GENDERS,
} from "@/lib/store";
import { SurveyApiService, type SurveyFormData } from "@/lib/survey-api";
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface SurveyStepperProps {
  surveyorId: string;
  village: string;
  onComplete: () => void;
  onCancel: () => void;
}

// Member interfaces
interface HealthMember {
  patient: string;
  patientName?: string;
  age?: number;
  gender?: string;
  hasAadhar: string;
  hasAyushman: string;
  healthIssue: string;
  healthIssueOther?: string;
  morbidity: string;
  morbidityOther?: string;
  medicines: string[];
  hospitalVisits: string;
  treatments: string[];
}

interface EducationMember {
  person: string;
  name?: string;
  age?: number;
  gender?: string;
  hasAadhar: string;
  educationLevel: string;
  schoolType: string;
  medium: string;
  scholarship: string;
  dropoutReason?: string;
  currentClass?: string;
  schoolName?: string;
  educationalIssues: string[];
}

interface EmploymentMember {
  person: string;
  name?: string;
  age?: number;
  gender?: string;
  hasAadhar: string;
  employmentType: string;
  employmentStatus: string;
  businessType?: string;
  businessSector?: string;
  monthlyIncome?: string;
  workLocation?: string;
  unemploymentReason?: string;
  skills: string[];
  skillOther?: string;
  highestEducation: string;
}

const swipeVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const memberSwipeVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 250 : -250,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir < 0 ? 250 : -250,
    opacity: 0,
  }),
};

function MemberCarouselNav({ total, activeIdx, onSelect }: { total: number; activeIdx: number; onSelect: (i: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`size-2 rounded-full transition-colors ${
            i === activeIdx ? "bg-primary" : "bg-border"
          }`}
          aria-label={`Go to member ${i + 1}`}
        />
      ))}
    </div>
  );
}

function MemberLimitWarning() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-2">
      <AlertTriangle className="size-3.5 text-destructive shrink-0" />
      <p className="text-xs text-destructive font-medium">
        Number of members cannot exceed total family members.
      </p>
    </div>
  );
}

export function SurveyStepper({
  surveyorId,
  village,
  onComplete,
  onCancel,
}: SurveyStepperProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load draft on mount
  useEffect(() => {
    const draft = SurveyApiService.loadDraft();
    if (draft) {
      // TODO: Load draft data into form state
      console.log('Draft found:', draft);
    }
  }, []);

  // Step 1
  const [repName, setRepName] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [totalMembers, setTotalMembers] = useState("");
  const [ayushmanStatus, setAyushmanStatus] = useState("");
  const [ayushmanCount, setAyushmanCount] = useState("");
  const [isWhatsApp, setIsWhatsApp] = useState("");

  // Step 2 - Health
  const [hasHealthIssue, setHasHealthIssue] = useState("");
  const [healthMembers, setHealthMembers] = useState<HealthMember[]>([]);
  const [healthIdx, setHealthIdx] = useState(0);
  const [healthDir, setHealthDir] = useState(1);

  // Step 3 - Education
  const [hasEduIssue, setHasEduIssue] = useState("");
  const [eduMembers, setEduMembers] = useState<EducationMember[]>([]);
  const [eduIdx, setEduIdx] = useState(0);
  const [eduDir, setEduDir] = useState(1);

  // Step 4 - Employment
  const [hasUnemployment, setHasUnemployment] = useState("");
  const [unempMembers, setUnempMembers] = useState<EmploymentMember[]>([]);
  const [unempIdx, setUnempIdx] = useState(0);
  const [unempDir, setUnempDir] = useState(1);

  // Compute total unique member count
  const totalMemberLimit = Number(totalMembers) || 0;

  const uniqueMemberNames = useMemo(() => {
    const names = new Set<string>();
    if (repName) names.add(repName.toLowerCase().trim());
    
    healthMembers.forEach((m) => {
      if (m.patient === "Other" && m.patientName) {
        names.add(m.patientName.toLowerCase().trim());
      } else if (m.patient && m.patient !== "Other") {
        names.add(m.patient.toLowerCase().trim());
      }
    });
    eduMembers.forEach((m) => {
      if (m.person === "Other" && m.name) {
        names.add(m.name.toLowerCase().trim());
      } else if (m.person && m.person !== "Other") {
        names.add(m.person.toLowerCase().trim());
      }
    });
    unempMembers.forEach((m) => {
      if (m.person === "Other" && m.name) {
        names.add(m.name.toLowerCase().trim());
      } else if (m.person && m.person !== "Other") {
        names.add(m.person.toLowerCase().trim());
      }
    });
    return names;
  }, [repName, healthMembers, eduMembers, unempMembers]);

  const currentMemberCount = uniqueMemberNames.size;
  const canAddMember = totalMemberLimit === 0 || currentMemberCount < totalMemberLimit;

  // Build dropdown options
  const healthMemberNames = useMemo(() => {
    const names: string[] = [];
    healthMembers.forEach((m) => {
      if (m.patient === "Other" && m.patientName) {
        names.push(m.patientName);
      } else if (m.patient && m.patient !== "Other") {
        names.push(m.patient);
      }
    });
    return names;
  }, [healthMembers]);

  const eduMemberNames = useMemo(() => {
    const names: string[] = [];
    eduMembers.forEach((m) => {
      if (m.person === "Other" && m.name) {
        names.push(m.name);
      } else if (m.person && m.person !== "Other") {
        names.push(m.person);
      }
    });
    return names;
  }, [eduMembers]);

  const eduPersonOptions = useMemo(() => {
    const opts = new Set<string>();
    if (repName) opts.add(repName);
    healthMemberNames.forEach((n) => opts.add(n));
    opts.add("Other");
    return Array.from(opts);
  }, [repName, healthMemberNames]);

  const unempPersonOptions = useMemo(() => {
    const opts = new Set<string>();
    if (repName) opts.add(repName);
    healthMemberNames.forEach((n) => opts.add(n));
    eduMemberNames.forEach((n) => opts.add(n));
    opts.add("Other");
    return Array.from(opts);
  }, [repName, healthMemberNames, eduMemberNames]);

  const handleMobileChange = useCallback(
    (val: string) => {
      setMobile(val);
      // TODO: Check for duplicates via API
      setIsDuplicate(false);
    },
    [village]
  );

  // Health member management
  const addHealthMember = () => {
    if (canAddMember) {
      setHealthMembers([...healthMembers, {
        patient: "",
        hasAadhar: "",
        hasAyushman: "",
        healthIssue: "",
        morbidity: "",
        medicines: [],
        hospitalVisits: "",
        treatments: [],
      }]);
    }
  };

  const updateHealthMember = (idx: number, field: keyof HealthMember, val: any) => {
    setHealthMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };

  const removeHealthMember = (idx: number) => {
    setHealthMembers(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (healthIdx >= next.length) setHealthIdx(Math.max(0, next.length - 1));
      return next;
    });
  };

  // Education member management
  const addEduMember = () => {
    if (canAddMember) {
      setEduMembers([...eduMembers, {
        person: "",
        hasAadhar: "",
        educationLevel: "",
        schoolType: "",
        medium: "",
        scholarship: "",
        educationalIssues: [],
      }]);
    }
  };

  const updateEduMember = (idx: number, field: keyof EducationMember, val: any) => {
    setEduMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };

  const removeEduMember = (idx: number) => {
    setEduMembers(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (eduIdx >= next.length) setEduIdx(Math.max(0, next.length - 1));
      return next;
    });
  };

  // Employment member management
  const addUnempMember = () => {
    if (canAddMember) {
      setUnempMembers([...unempMembers, {
        person: "",
        hasAadhar: "",
        employmentType: "",
        employmentStatus: "",
        highestEducation: "",
        skills: [],
      }]);
    }
  };

  const updateUnempMember = (idx: number, field: keyof EmploymentMember, val: any) => {
    setUnempMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };

  const removeUnempMember = (idx: number) => {
    setUnempMembers(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (unempIdx >= next.length) setUnempIdx(Math.max(0, next.length - 1));
      return next;
    });
  };

  // Get current form data
  const getCurrentFormData = useCallback((): SurveyFormData => {
    return {
      household: {
        representativeName: repName,
        mobileNumber: mobile,
        representativeAge: Number(age),
        representativeGender: gender,
        totalFamilyMembers: Number(totalMembers),
        ayushmanCardStatus: ayushmanStatus,
        ayushmanMembersCount: ayushmanStatus === "Some Members Have" ? Number(ayushmanCount) : undefined,
      },
      health: {
        hasHealthIssues: hasHealthIssue,
        members: hasHealthIssue === "Yes" ? healthMembers : [],
      },
      education: {
        hasSchoolChildren: hasEduIssue,
        members: hasEduIssue === "Yes" ? eduMembers : [],
      },
      employment: {
        hasEmployedMembers: hasUnemployment,
        members: hasUnemployment === "Yes" ? unempMembers : [],
      },
    };
  }, [
    repName, mobile, age, gender, totalMembers, ayushmanStatus, ayushmanCount,
    hasHealthIssue, healthMembers, hasEduIssue, eduMembers, hasUnemployment, unempMembers
  ]);

  // Auto-save draft
  useEffect(() => {
    const formData = getCurrentFormData();
    SurveyApiService.saveDraft(formData, village);
  }, [getCurrentFormData, village]);

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const formData = getCurrentFormData();
      const requestData = SurveyApiService.formDataToRequest(formData, village);

      // Create or update survey
      if (!SurveyApiService.getCurrentSurveyId()) {
        await SurveyApiService.createSurvey(requestData);
      } else {
        await SurveyApiService.updateSurvey(requestData);
      }

      // Submit the survey
      await SurveyApiService.submitSurvey();
      
      // Clear draft
      SurveyApiService.clearDraft();
      SurveyApiService.clearCurrentSurvey();
      
      onComplete();
    } catch (error: any) {
      setError(error.message || 'Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    SurveyApiService.clearDraft();
    SurveyApiService.clearCurrentSurvey();
    onCancel();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <Card className="w-full max-w-xs">
            <CardContent className="py-6 flex flex-col items-center gap-4">
              <AlertTriangle className="size-8 text-destructive" />
              <p className="text-sm font-medium text-foreground text-center">
                Do you really want to cancel the form?
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCancel}
                >
                  Yes
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelModal(false)}
                >
                  No
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg border border-destructive/50 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={step > 1 ? goBack : () => setShowCancelModal(true)}
            className="text-xs h-7 px-2"
          >
            <ChevronLeft className="size-3.5 mr-1" />
            {step > 1 ? "Back" : "Cancel"}
          </Button>
          <div className="text-sm font-medium text-foreground">
            Step {step} of 4
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{village}</div>
      </header>

      {/* Progress */}
      <div className="px-4 py-3">
        <ProgressIndicator current={step} total={4} />
      </div>

      {/* Form Content */}
      <main className="flex-1 px-4 pb-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={swipeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full"
          >
            {step === 1 && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Household Information</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <CompactInput
                    label="Representative Name"
                    id="rep-name"
                    placeholder="Enter name"
                    value={repName}
                    onChange={setRepName}
                    required
                  />
                  <PhoneInput
                    label="Mobile Number"
                    id="mobile"
                    value={mobile}
                    onChange={handleMobileChange}
                    required
                  />
                  {isDuplicate && (
                    <p className="text-xs text-destructive">This number already exists</p>
                  )}
                  <AgeGenderRow
                    age={age}
                    gender={gender}
                    onAgeChange={setAge}
                    onGenderChange={setGender}
                    ageId="rep-age"
                    genderOptions={GENDERS}
                  />
                  <CompactInput
                    label="Total Family Members"
                    id="total-members"
                    placeholder="Number of family members"
                    value={totalMembers}
                    onChange={setTotalMembers}
                    type="number"
                    required
                  />
                  <CompactRadioGroup
                    label="Ayushman Card Status"
                    options={["All Members Have", "Some Members Have", "None Have"]}
                    value={ayushmanStatus}
                    onChange={setAyushmanStatus}
                  />
                  {ayushmanStatus === "Some Members Have" && (
                    <CompactInput
                      label="How many members have Ayushman card?"
                      id="ayushman-count"
                      placeholder="Enter count"
                      value={ayushmanCount}
                      onChange={setAyushmanCount}
                      type="number"
                      required
                    />
                  )}
                  <CompactRadioGroup
                    label="Is this WhatsApp number?"
                    options={["Yes", "No"]}
                    value={isWhatsApp}
                    onChange={setIsWhatsApp}
                  />
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Healthcare Section</CardTitle>
                  {totalMemberLimit > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Members: {currentMemberCount}/{totalMemberLimit}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <CompactRadioGroup
                    label="Is anyone in the household currently facing any health issues?"
                    value={hasHealthIssue}
                    onChange={(v) => {
                      setHasHealthIssue(v);
                      if (v === "Yes" && healthMembers.length === 0) addHealthMember();
                    }}
                    options={["Yes", "No"]}
                  />
                  {hasHealthIssue === "Yes" && healthMembers.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <MemberCarouselNav
                        total={healthMembers.length}
                        activeIdx={healthIdx}
                        onSelect={setHealthIdx}
                      />
                      <div className="overflow-hidden">
                        <AnimatePresence mode="wait" custom={healthDir}>
                          <motion.div
                            key={healthIdx}
                            custom={healthDir}
                            variants={memberSwipeVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "tween", duration: 0.2 }}
                            className="rounded-lg border bg-secondary/30 p-3 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground">
                                Member {healthIdx + 1} of {healthMembers.length}
                              </span>
                              {healthMembers.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5"
                                  onClick={() => removeHealthMember(healthIdx)}
                                >
                                  <Trash2 className="size-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                            <CompactDropdown
                              label="Select Patient"
                              value={healthMembers[healthIdx]?.patient || ""}
                              onChange={(v) => updateHealthMember(healthIdx, "patient", v)}
                              options={[repName || "Representative Name", "Other"]}
                              placeholder="Select patient"
                            />
                            {healthMembers[healthIdx]?.patient === "Other" && (
                              <>
                                <CompactInput
                                  label="Patient Name"
                                  id={`h-name-${healthIdx}`}
                                  value={healthMembers[healthIdx]?.patientName || ""}
                                  onChange={(v) => updateHealthMember(healthIdx, "patientName", v)}
                                  placeholder="Enter name"
                                />
                                <AgeGenderRow
                                  age={healthMembers[healthIdx]?.age || ""}
                                  onAgeChange={(v) => updateHealthMember(healthIdx, "age", Number(v))}
                                  gender={healthMembers[healthIdx]?.gender || ""}
                                  onGenderChange={(v) => updateHealthMember(healthIdx, "gender", v)}
                                  ageId={`h-age-${healthIdx}`}
                                  genderOptions={GENDERS}
                                />
                              </>
                            )}
                            <CompactRadioGroup
                              label="Has Aadhar Card?"
                              value={healthMembers[healthIdx]?.hasAadhar || ""}
                              onChange={(v) => updateHealthMember(healthIdx, "hasAadhar", v)}
                              options={["Yes", "No"]}
                            />
                            <CompactRadioGroup
                              label="Has Ayushman Card?"
                              value={healthMembers[healthIdx]?.hasAyushman || ""}
                              onChange={(v) => updateHealthMember(healthIdx, "hasAyushman", v)}
                              options={["Yes", "No"]}
                            />
                            <CompactDropdown
                              label="Type of Health Issue"
                              value={healthMembers[healthIdx]?.healthIssue || ""}
                              onChange={(v) => updateHealthMember(healthIdx, "healthIssue", v)}
                              options={HEALTH_ISSUES}
                              placeholder="Select issue"
                            />
                            <CompactDropdown
                              label="Morbidity / Other Health Problems"
                              value={healthMembers[healthIdx]?.morbidity || ""}
                              onChange={(v) => updateHealthMember(healthIdx, "morbidity", v)}
                              options={MORBIDITY_OPTIONS}
                              placeholder="Select morbidity"
                            />
                            <CompactInput
                              label="Hospital Visits in Last Year"
                              id={`h-visits-${healthIdx}`}
                              value={healthMembers[healthIdx]?.hospitalVisits || ""}
                              onChange={(v) => updateHealthMember(healthIdx, "hospitalVisits", v)}
                              type="number"
                              placeholder="Number of visits"
                            />
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      {!canAddMember && <MemberLimitWarning />}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addHealthMember}
                        className="gap-1 text-xs"
                        disabled={!canAddMember}
                      >
                        <Plus className="size-3" />
                        Add Another Member
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Education Section</CardTitle>
                  {totalMemberLimit > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Members: {currentMemberCount}/{totalMemberLimit}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <CompactRadioGroup
                    label="Does anyone in the household have any problem in education?"
                    value={hasEduIssue}
                    onChange={(v) => {
                      setHasEduIssue(v);
                      if (v === "Yes" && eduMembers.length === 0) addEduMember();
                    }}
                    options={["Yes", "No"]}
                  />
                  {hasEduIssue === "Yes" && eduMembers.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <MemberCarouselNav
                        total={eduMembers.length}
                        activeIdx={eduIdx}
                        onSelect={setEduIdx}
                      />
                      <div className="overflow-hidden">
                        <AnimatePresence mode="wait" custom={eduDir}>
                          <motion.div
                            key={eduIdx}
                            custom={eduDir}
                            variants={memberSwipeVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "tween", duration: 0.2 }}
                            className="rounded-lg border bg-secondary/30 p-3 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground">
                                Person {eduIdx + 1} of {eduMembers.length}
                              </span>
                              {eduMembers.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5"
                                  onClick={() => removeEduMember(eduIdx)}
                                >
                                  <Trash2 className="size-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                            <CompactDropdown
                              label="Select Person"
                              value={eduMembers[eduIdx]?.person || ""}
                              onChange={(v) => updateEduMember(eduIdx, "person", v)}
                              options={eduPersonOptions}
                              placeholder="Select person"
                            />
                            {eduMembers[eduIdx]?.person === "Other" && (
                              <>
                                <CompactInput
                                  label="Name"
                                  id={`e-name-${eduIdx}`}
                                  value={eduMembers[eduIdx]?.name || ""}
                                  onChange={(v) => updateEduMember(eduIdx, "name", v)}
                                  placeholder="Enter name"
                                />
                                <AgeGenderRow
                                  age={eduMembers[eduIdx]?.age || ""}
                                  onAgeChange={(v) => updateEduMember(eduIdx, "age", Number(v))}
                                  gender={eduMembers[eduIdx]?.gender || ""}
                                  onGenderChange={(v) => updateEduMember(eduIdx, "gender", v)}
                                  ageId={`e-age-${eduIdx}`}
                                  genderOptions={GENDERS}
                                />
                              </>
                            )}
                            <CompactRadioGroup
                              label="Has Aadhar Card?"
                              value={eduMembers[eduIdx]?.hasAadhar || ""}
                              onChange={(v) => updateEduMember(eduIdx, "hasAadhar", v)}
                              options={["Yes", "No"]}
                            />
                            <CompactDropdown
                              label="Current Education Level"
                              value={eduMembers[eduIdx]?.educationLevel || ""}
                              onChange={(v) => updateEduMember(eduIdx, "educationLevel", v)}
                              options={EDUCATION_LEVELS}
                              placeholder="Select level"
                            />
                            <CompactDropdown
                              label="Type of School"
                              value={eduMembers[eduIdx]?.schoolType || ""}
                              onChange={(v) => updateEduMember(eduIdx, "schoolType", v)}
                              options={["Government", "Private", "Other"]}
                              placeholder="Select school type"
                            />
                            <CompactDropdown
                              label="Medium of Instruction"
                              value={eduMembers[eduIdx]?.medium || ""}
                              onChange={(v) => updateEduMember(eduIdx, "medium", v)}
                              options={["Hindi", "English", "Regional Language", "Other"]}
                              placeholder="Select medium"
                            />
                            <CompactRadioGroup
                              label="Has Scholarship?"
                              value={eduMembers[eduIdx]?.scholarship || ""}
                              onChange={(v) => updateEduMember(eduIdx, "scholarship", v)}
                              options={["Yes", "No"]}
                            />
                            <CompactCheckboxGroup
                              label="Type of Educational Issue"
                              selected={eduMembers[eduIdx]?.educationalIssues || []}
                              onChange={(v) => updateEduMember(eduIdx, "educationalIssues", v)}
                              options={EDUCATION_ISSUES}
                            />
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      {!canAddMember && <MemberLimitWarning />}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addEduMember}
                        className="gap-1 text-xs"
                        disabled={!canAddMember}
                      >
                        <Plus className="size-3" />
                        Add Another Member
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Employment Section</CardTitle>
                  {totalMemberLimit > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Members: {currentMemberCount}/{totalMemberLimit}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <CompactRadioGroup
                    label="Is anyone currently unemployed or facing employment-related problems?"
                    value={hasUnemployment}
                    onChange={(v) => {
                      setHasUnemployment(v);
                      if (v === "Yes" && unempMembers.length === 0) addUnempMember();
                    }}
                    options={["Yes", "No"]}
                  />
                  {hasUnemployment === "Yes" && unempMembers.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <MemberCarouselNav
                        total={unempMembers.length}
                        activeIdx={unempIdx}
                        onSelect={setUnempIdx}
                      />
                      <div className="overflow-hidden">
                        <AnimatePresence mode="wait" custom={unempDir}>
                          <motion.div
                            key={unempIdx}
                            custom={unempDir}
                            variants={memberSwipeVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "tween", duration: 0.2 }}
                            className="rounded-lg border bg-secondary/30 p-3 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground">
                                Person {unempIdx + 1} of {unempMembers.length}
                              </span>
                              {unempMembers.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5"
                                  onClick={() => removeUnempMember(unempIdx)}
                                >
                                  <Trash2 className="size-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                            <CompactDropdown
                              label="Select Person"
                              value={unempMembers[unempIdx]?.person || ""}
                              onChange={(v) => updateUnempMember(unempIdx, "person", v)}
                              options={unempPersonOptions}
                              placeholder="Select person"
                            />
                            {unempMembers[unempIdx]?.person === "Other" && (
                              <>
                                <CompactInput
                                  label="Name"
                                  id={`u-name-${unempIdx}`}
                                  value={unempMembers[unempIdx]?.name || ""}
                                  onChange={(v) => updateUnempMember(unempIdx, "name", v)}
                                  placeholder="Enter name"
                                />
                                <AgeGenderRow
                                  age={unempMembers[unempIdx]?.age || ""}
                                  onAgeChange={(v) => updateUnempMember(unempIdx, "age", Number(v))}
                                  gender={unempMembers[unempIdx]?.gender || ""}
                                  onGenderChange={(v) => updateUnempMember(unempIdx, "gender", v)}
                                  ageId={`u-age-${unempIdx}`}
                                  genderOptions={GENDERS}
                                />
                              </>
                            )}
                            <CompactRadioGroup
                              label="Has Aadhar Card?"
                              value={unempMembers[unempIdx]?.hasAadhar || ""}
                              onChange={(v) => updateUnempMember(unempIdx, "hasAadhar", v)}
                              options={["Yes", "No"]}
                            />
                            <CompactDropdown
                              label="Employment Type"
                              value={unempMembers[unempIdx]?.employmentType || ""}
                              onChange={(v) => updateUnempMember(unempIdx, "employmentType", v)}
                              options={["Salaried", "Self-Employed", "Daily Wage", "Unemployed", "Other"]}
                              placeholder="Select type"
                            />
                            <CompactDropdown
                              label="Employment Status"
                              value={unempMembers[unempIdx]?.employmentStatus || ""}
                              onChange={(v) => updateUnempMember(unempIdx, "employmentStatus", v)}
                              options={["Employed", "Unemployed", "Underemployed"]}
                              placeholder="Select status"
                            />
                            <CompactDropdown
                              label="Highest Education Level"
                              value={unempMembers[unempIdx]?.highestEducation || ""}
                              onChange={(v) => updateUnempMember(unempIdx, "highestEducation", v)}
                              options={UNEMPLOYMENT_EDUCATION}
                              placeholder="Select level"
                            />
                            <CompactCheckboxGroup
                              label="Skills Known"
                              selected={unempMembers[unempIdx]?.skills || []}
                              onChange={(v) => updateUnempMember(unempIdx, "skills", v)}
                              options={SKILLS}
                            />
                            <CompactDropdown
                              label="Main Reason for Unemployment"
                              value={unempMembers[unempIdx]?.unemploymentReason || ""}
                              onChange={(v) => updateUnempMember(unempIdx, "unemploymentReason", v)}
                              options={UNEMPLOYMENT_REASONS}
                              placeholder="Select reason"
                            />
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      {!canAddMember && <MemberLimitWarning />}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addUnempMember}
                        className="gap-1 text-xs"
                        disabled={!canAddMember}
                      >
                        <Plus className="size-3" />
                        Add Another Member
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Footer */}
      <footer className="sticky bottom-0 border-t bg-card px-4 py-3">
        <div className="flex gap-2">
          {step < 4 ? (
            <>
              <Button
                variant="outline"
                onClick={step > 1 ? goBack : () => setShowCancelModal(true)}
                className="flex-1"
              >
                {step > 1 ? "Back" : "Cancel"}
              </Button>
              <Button
                onClick={goNext}
                className="flex-1"
                disabled={
                  (step === 1 && (!repName || !mobile || !age || !gender || !totalMembers || !ayushmanStatus || !isWhatsApp)) ||
                  (step === 2 && !hasHealthIssue) ||
                  (step === 3 && !hasEduIssue) ||
                  (step === 4 && !hasUnemployment)
                }
              >
                Next
                <ChevronRight className="size-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={goBack}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={isSubmitting || !hasUnemployment}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Survey"
                )}
              </Button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
