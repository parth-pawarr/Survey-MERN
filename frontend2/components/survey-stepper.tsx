"use client";

import { useState, useCallback, useMemo } from "react";
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
  type SurveyData,
  type HealthMember,
  type EducationMember,
  type UnemploymentMember,
  HEALTH_ISSUES,
  MORBIDITY_OPTIONS,
  EDUCATION_LEVELS,
  EDUCATION_ISSUES,
  UNEMPLOYMENT_EDUCATION,
  SKILLS,
  UNEMPLOYMENT_REASONS,
  GENDERS,
  checkDuplicate,
  saveSurvey,
} from "@/lib/store";
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertTriangle } from "lucide-react";

interface SurveyStepperProps {
  surveyorId: string;
  village: string;
  onComplete: () => void;
  onCancel: () => void;
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

  // Step 1
  const [repName, setRepName] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [totalMembers, setTotalMembers] = useState("");
  const [ayushmanStatus, setAyushmanStatus] = useState("");
  const [ayushmanCount, setAyushmanCount] = useState("");
  const [isWhatsApp, setIsWhatsApp] = useState("");

  // Step 2
  const [hasHealthIssue, setHasHealthIssue] = useState("");
  const [healthMembers, setHealthMembers] = useState<HealthMember[]>([]);
  const [healthIdx, setHealthIdx] = useState(0);
  const [healthDir, setHealthDir] = useState(1);

  // Step 3
  const [hasEduIssue, setHasEduIssue] = useState("");
  const [eduMembers, setEduMembers] = useState<EducationMember[]>([]);
  const [eduIdx, setEduIdx] = useState(0);
  const [eduDir, setEduDir] = useState(1);

  // Step 4
  const [hasUnemployment, setHasUnemployment] = useState("");
  const [unempMembers, setUnempMembers] = useState<UnemploymentMember[]>([]);
  const [unempIdx, setUnempIdx] = useState(0);
  const [unempDir, setUnempDir] = useState(1);

  // Compute total unique member count (representative counts as 1)
  const totalMemberLimit = Number(totalMembers) || 0;

  const uniqueMemberNames = useMemo(() => {
    const names = new Set<string>();
    // Representative always counts
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

  // Cross-section name propagation
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

  // Build dropdown options for each section
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
      if (val.length >= 10) {
        setIsDuplicate(checkDuplicate(village, val));
      } else {
        setIsDuplicate(false);
      }
    },
    [village]
  );

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 4));
  };
  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  // Health members
  const addHealthMember = () => {
    if (!canAddMember) return;
    setHealthMembers((prev) => {
      const next = [...prev, { patient: "", healthIssue: "", morbidity: "" }];
      setHealthIdx(next.length - 1);
      setHealthDir(1);
      return next;
    });
  };

  const updateHealthMember = (idx: number, field: keyof HealthMember, val: string | number) => {
    setHealthMembers((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const removeHealthMember = (idx: number) => {
    setHealthMembers((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (healthIdx >= next.length) setHealthIdx(Math.max(0, next.length - 1));
      return next;
    });
  };

  // Education members
  const addEduMember = () => {
    if (!canAddMember) return;
    setEduMembers((prev) => {
      const next = [...prev, { person: "", educationLevel: "", educationalIssues: [] as string[] }];
      setEduIdx(next.length - 1);
      setEduDir(1);
      return next;
    });
  };

  const updateEduMember = (idx: number, field: keyof EducationMember, val: string | number | string[]) => {
    setEduMembers((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const removeEduMember = (idx: number) => {
    setEduMembers((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (eduIdx >= next.length) setEduIdx(Math.max(0, next.length - 1));
      return next;
    });
  };

  // Unemployment members
  const addUnempMember = () => {
    if (!canAddMember) return;
    setUnempMembers((prev) => {
      const next = [...prev, { person: "", highestEducation: "", skills: [], unemploymentReason: "" }];
      setUnempIdx(next.length - 1);
      setUnempDir(1);
      return next;
    });
  };

  const updateUnempMember = (
    idx: number,
    field: keyof UnemploymentMember,
    val: string | number | string[]
  ) => {
    setUnempMembers((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const removeUnempMember = (idx: number) => {
    setUnempMembers((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (unempIdx >= next.length) setUnempIdx(Math.max(0, next.length - 1));
      return next;
    });
  };

  const handleSubmit = () => {
    const survey: SurveyData = {
      surveyorId,
      village,
      householdData: {
        representativeName: repName,
        mobile,
        age: Number(age),
        gender,
        totalFamilyMembers: Number(totalMembers),
        ayushmanStatus,
        ayushmanMembersCount:
          ayushmanStatus === "Some Members Have" ? Number(ayushmanCount) : undefined,
        isWhatsApp,
      },
      healthcare: hasHealthIssue === "Yes" ? healthMembers : [],
      education: hasEduIssue === "Yes" ? eduMembers : [],
      unemployment: hasUnemployment === "Yes" ? unempMembers : [],
      timestamp: new Date().toISOString(),
    };
    saveSurvey(survey);
    onComplete();
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
                  onClick={onCancel}
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

      <header className="sticky top-0 z-10 border-b bg-card px-4 py-3">
        <div className="mx-auto max-w-[420px]">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-sm font-semibold text-foreground">Household Survey</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="text-xs h-7"
            >
              Cancel
            </Button>
          </div>
          <ProgressIndicator current={step} total={4} />
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center p-4">
        <div className="w-full max-w-[420px] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={swipeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "tween", duration: 0.25 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_e, info) => {
                if (info.offset.x < -80 && step < 4) goNext();
                if (info.offset.x > 80 && step > 1) goBack();
              }}
            >
              {step === 1 && (
                <StepOne
                  repName={repName}
                  setRepName={setRepName}
                  mobile={mobile}
                  setMobile={handleMobileChange}
                  age={age}
                  setAge={setAge}
                  gender={gender}
                  setGender={setGender}
                  totalMembers={totalMembers}
                  setTotalMembers={setTotalMembers}
                  ayushmanStatus={ayushmanStatus}
                  setAyushmanStatus={setAyushmanStatus}
                  ayushmanCount={ayushmanCount}
                  setAyushmanCount={setAyushmanCount}
                  isDuplicate={isDuplicate}
                  isWhatsApp={isWhatsApp}
                  setIsWhatsApp={setIsWhatsApp}
                />
              )}
              {step === 2 && (
                <StepTwo
                  repName={repName}
                  hasHealthIssue={hasHealthIssue}
                  setHasHealthIssue={setHasHealthIssue}
                  members={healthMembers}
                  onAdd={addHealthMember}
                  onUpdate={updateHealthMember}
                  onRemove={removeHealthMember}
                  activeIdx={healthIdx}
                  setActiveIdx={(i: number) => { setHealthDir(i > healthIdx ? 1 : -1); setHealthIdx(i); }}
                  memberDir={healthDir}
                  canAddMember={canAddMember}
                  totalMemberLimit={totalMemberLimit}
                  currentMemberCount={currentMemberCount}
                />
              )}
              {step === 3 && (
                <StepThree
                  repName={repName}
                  hasEduIssue={hasEduIssue}
                  setHasEduIssue={setHasEduIssue}
                  members={eduMembers}
                  onAdd={addEduMember}
                  onUpdate={updateEduMember}
                  onRemove={removeEduMember}
                  activeIdx={eduIdx}
                  setActiveIdx={(i: number) => { setEduDir(i > eduIdx ? 1 : -1); setEduIdx(i); }}
                  memberDir={eduDir}
                  canAddMember={canAddMember}
                  totalMemberLimit={totalMemberLimit}
                  currentMemberCount={currentMemberCount}
                  personOptions={eduPersonOptions}
                />
              )}
              {step === 4 && (
                <StepFour
                  repName={repName}
                  hasUnemployment={hasUnemployment}
                  setHasUnemployment={setHasUnemployment}
                  members={unempMembers}
                  onAdd={addUnempMember}
                  onUpdate={updateUnempMember}
                  onRemove={removeUnempMember}
                  activeIdx={unempIdx}
                  setActiveIdx={(i: number) => { setUnempDir(i > unempIdx ? 1 : -1); setUnempIdx(i); }}
                  memberDir={unempDir}
                  canAddMember={canAddMember}
                  totalMemberLimit={totalMemberLimit}
                  currentMemberCount={currentMemberCount}
                  personOptions={unempPersonOptions}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="sticky bottom-0 border-t bg-card px-4 py-3">
        <div className="mx-auto flex max-w-[420px] gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={goBack} className="flex-1 gap-1">
              <ChevronLeft className="size-4" />
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button
              onClick={goNext}
              className="flex-1 gap-1"
              disabled={isDuplicate || (step === 1 && (!mobile || mobile.length !== 10))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isDuplicate || !mobile || mobile.length !== 10}
            >
              Submit Survey
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

// --- Member Carousel Navigation ---
function MemberCarouselNav({
  total,
  activeIdx,
  onSelect,
}: {
  total: number;
  activeIdx: number;
  onSelect: (i: number) => void;
}) {
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

// --- Step 1 ---
function StepOne({
  repName,
  setRepName,
  mobile,
  setMobile,
  age,
  setAge,
  gender,
  setGender,
  totalMembers,
  setTotalMembers,
  ayushmanStatus,
  setAyushmanStatus,
  ayushmanCount,
  setAyushmanCount,
  isDuplicate,
  isWhatsApp,
  setIsWhatsApp,
}: {
  repName: string;
  setRepName: (v: string) => void;
  mobile: string;
  setMobile: (v: string) => void;
  age: string;
  setAge: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  totalMembers: string;
  setTotalMembers: (v: string) => void;
  ayushmanStatus: string;
  setAyushmanStatus: (v: string) => void;
  ayushmanCount: string;
  setAyushmanCount: (v: string) => void;
  isDuplicate: boolean;
  isWhatsApp: string;
  setIsWhatsApp: (v: string) => void;
}) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Household Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isDuplicate && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <AlertTriangle className="size-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive font-medium">
              This household survey is already completed.
            </p>
          </div>
        )}
        <CompactInput
          label="Representative Full Name"
          id="rep-name"
          value={repName}
          onChange={setRepName}
          placeholder="Enter full name"
        />
        <PhoneInput
          label="Mobile Number"
          id="mobile"
          value={mobile}
          onChange={setMobile}
          required
        />
        <CompactRadioGroup
          label="Is this WhatsApp number?"
          value={isWhatsApp}
          onChange={setIsWhatsApp}
          options={["Yes", "No"]}
        />
        <AgeGenderRow
          age={age}
          onAgeChange={setAge}
          gender={gender}
          onGenderChange={setGender}
          ageId="rep-age"
          genderOptions={GENDERS}
        />
        <CompactInput
          label="Total Family Members"
          id="total-members"
          value={totalMembers}
          onChange={setTotalMembers}
          type="number"
          placeholder="Enter count"
        />
        <CompactRadioGroup
          label="Ayushman Bharat Card Status"
          value={ayushmanStatus}
          onChange={setAyushmanStatus}
          options={["All Members Have", "Some Members Have", "None Have"]}
        />
        {ayushmanStatus === "Some Members Have" && (
          <CompactInput
            label="Number of members having card"
            id="ayushman-count"
            value={ayushmanCount}
            onChange={setAyushmanCount}
            type="number"
            placeholder="Enter count"
          />
        )}
      </CardContent>
    </Card>
  );
}

// --- Step 2 ---
function StepTwo({
  repName,
  hasHealthIssue,
  setHasHealthIssue,
  members,
  onAdd,
  onUpdate,
  onRemove,
  activeIdx,
  setActiveIdx,
  memberDir,
  canAddMember,
  totalMemberLimit,
  currentMemberCount,
}: {
  repName: string;
  hasHealthIssue: string;
  setHasHealthIssue: (v: string) => void;
  members: HealthMember[];
  onAdd: () => void;
  onUpdate: (idx: number, field: keyof HealthMember, val: string | number) => void;
  onRemove: (idx: number) => void;
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  memberDir: number;
  canAddMember: boolean;
  totalMemberLimit: number;
  currentMemberCount: number;
}) {
  const m = members[activeIdx];

  return (
    <Card className="rounded-xl">
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
            if (v === "Yes" && members.length === 0) onAdd();
          }}
          options={["Yes", "No"]}
        />
        {hasHealthIssue === "Yes" && members.length > 0 && m && (
          <div className="flex flex-col gap-3">
            <MemberCarouselNav
              total={members.length}
              activeIdx={activeIdx}
              onSelect={setActiveIdx}
            />
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={memberDir}>
                <motion.div
                  key={activeIdx}
                  custom={memberDir}
                  variants={memberSwipeVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "tween", duration: 0.2 }}
                  className="rounded-lg border bg-secondary/30 p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">
                      Member {activeIdx + 1} of {members.length}
                    </span>
                    {members.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5"
                        onClick={() => onRemove(activeIdx)}
                      >
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <CompactDropdown
                    label="Select Patient"
                    value={m.patient}
                    onChange={(v) => onUpdate(activeIdx, "patient", v)}
                    options={[repName || "Representative Name", "Other"]}
                    placeholder="Select patient"
                  />
                  {m.patient === "Other" && (
                    <>
                      <CompactInput
                        label="Patient Name"
                        id={`h-name-${activeIdx}`}
                        value={m.patientName || ""}
                        onChange={(v) => onUpdate(activeIdx, "patientName", v)}
                        placeholder="Enter name"
                      />
                      <AgeGenderRow
                        age={m.age || ""}
                        onAgeChange={(v) => onUpdate(activeIdx, "age", Number(v))}
                        gender={m.gender || ""}
                        onGenderChange={(v) => onUpdate(activeIdx, "gender", v)}
                        ageId={`h-age-${activeIdx}`}
                        genderOptions={GENDERS}
                      />
                    </>
                  )}
                  <CompactDropdown
                    label="Type of Health Issue"
                    value={m.healthIssue}
                    onChange={(v) => onUpdate(activeIdx, "healthIssue", v)}
                    options={HEALTH_ISSUES}
                    placeholder="Select issue"
                  />
                  {m.healthIssue === "Other" && (
                    <CompactInput
                      label="Specify Health Issue"
                      id={`h-other-${activeIdx}`}
                      value={m.healthIssueOther || ""}
                      onChange={(v) => onUpdate(activeIdx, "healthIssueOther", v)}
                      placeholder="Describe issue"
                    />
                  )}
                  <CompactDropdown
                    label="Morbidity / Other Health Problems"
                    value={m.morbidity}
                    onChange={(v) => onUpdate(activeIdx, "morbidity", v)}
                    options={MORBIDITY_OPTIONS}
                    placeholder="Select morbidity"
                  />
                  {m.morbidity === "Other" && (
                    <CompactInput
                      label="Specify Morbidity"
                      id={`h-morb-other-${activeIdx}`}
                      value={m.morbidityOther || ""}
                      onChange={(v) => onUpdate(activeIdx, "morbidityOther", v)}
                      placeholder="Describe condition"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            {!canAddMember && <MemberLimitWarning />}
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
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
  );
}

// --- Step 3 ---
function StepThree({
  repName,
  hasEduIssue,
  setHasEduIssue,
  members,
  onAdd,
  onUpdate,
  onRemove,
  activeIdx,
  setActiveIdx,
  memberDir,
  canAddMember,
  totalMemberLimit,
  currentMemberCount,
  personOptions,
}: {
  repName: string;
  hasEduIssue: string;
  setHasEduIssue: (v: string) => void;
  members: EducationMember[];
  onAdd: () => void;
  onUpdate: (idx: number, field: keyof EducationMember, val: string | number | string[]) => void;
  onRemove: (idx: number) => void;
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  memberDir: number;
  canAddMember: boolean;
  totalMemberLimit: number;
  currentMemberCount: number;
  personOptions: string[];
}) {
  const m = members[activeIdx];

  return (
    <Card className="rounded-xl">
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
            if (v === "Yes" && members.length === 0) onAdd();
          }}
          options={["Yes", "No"]}
        />
        {hasEduIssue === "Yes" && members.length > 0 && m && (
          <div className="flex flex-col gap-3">
            <MemberCarouselNav
              total={members.length}
              activeIdx={activeIdx}
              onSelect={setActiveIdx}
            />
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={memberDir}>
                <motion.div
                  key={activeIdx}
                  custom={memberDir}
                  variants={memberSwipeVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "tween", duration: 0.2 }}
                  className="rounded-lg border bg-secondary/30 p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">
                      Person {activeIdx + 1} of {members.length}
                    </span>
                    {members.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5"
                        onClick={() => onRemove(activeIdx)}
                      >
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <CompactDropdown
                    label="Select Person"
                    value={m.person}
                    onChange={(v) => onUpdate(activeIdx, "person", v)}
                    options={personOptions}
                    placeholder="Select person"
                  />
                  {m.person === "Other" && (
                    <>
                      <CompactInput
                        label="Name"
                        id={`e-name-${activeIdx}`}
                        value={m.name || ""}
                        onChange={(v) => onUpdate(activeIdx, "name", v)}
                        placeholder="Enter name"
                      />
                      <AgeGenderRow
                        age={m.age || ""}
                        onAgeChange={(v) => onUpdate(activeIdx, "age", Number(v))}
                        gender={m.gender || ""}
                        onGenderChange={(v) => onUpdate(activeIdx, "gender", v)}
                        ageId={`e-age-${activeIdx}`}
                        genderOptions={GENDERS}
                      />
                    </>
                  )}
                  <CompactDropdown
                    label="Current Education Level"
                    value={m.educationLevel}
                    onChange={(v) => onUpdate(activeIdx, "educationLevel", v)}
                    options={EDUCATION_LEVELS}
                    placeholder="Select level"
                  />
                  <CompactCheckboxGroup
                    label="Type of Educational Issue"
                    selected={m.educationalIssues || []}
                    onChange={(v) => onUpdate(activeIdx, "educationalIssues", v)}
                    options={EDUCATION_ISSUES}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            {!canAddMember && <MemberLimitWarning />}
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
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
  );
}

// --- Step 4 ---
function StepFour({
  repName,
  hasUnemployment,
  setHasUnemployment,
  members,
  onAdd,
  onUpdate,
  onRemove,
  activeIdx,
  setActiveIdx,
  memberDir,
  canAddMember,
  totalMemberLimit,
  currentMemberCount,
  personOptions,
}: {
  repName: string;
  hasUnemployment: string;
  setHasUnemployment: (v: string) => void;
  members: UnemploymentMember[];
  onAdd: () => void;
  onUpdate: (idx: number, field: keyof UnemploymentMember, val: string | number | string[]) => void;
  onRemove: (idx: number) => void;
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  memberDir: number;
  canAddMember: boolean;
  totalMemberLimit: number;
  currentMemberCount: number;
  personOptions: string[];
}) {
  const m = members[activeIdx];

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Unemployment Section</CardTitle>
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
            if (v === "Yes" && members.length === 0) onAdd();
          }}
          options={["Yes", "No"]}
        />
        {hasUnemployment === "Yes" && members.length > 0 && m && (
          <div className="flex flex-col gap-3">
            <MemberCarouselNav
              total={members.length}
              activeIdx={activeIdx}
              onSelect={setActiveIdx}
            />
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={memberDir}>
                <motion.div
                  key={activeIdx}
                  custom={memberDir}
                  variants={memberSwipeVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "tween", duration: 0.2 }}
                  className="rounded-lg border bg-secondary/30 p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">
                      Person {activeIdx + 1} of {members.length}
                    </span>
                    {members.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5"
                        onClick={() => onRemove(activeIdx)}
                      >
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <CompactDropdown
                    label="Select Person"
                    value={m.person}
                    onChange={(v) => onUpdate(activeIdx, "person", v)}
                    options={personOptions}
                    placeholder="Select person"
                  />
                  {m.person === "Other" && (
                    <>
                      <CompactInput
                        label="Name"
                        id={`u-name-${activeIdx}`}
                        value={m.name || ""}
                        onChange={(v) => onUpdate(activeIdx, "name", v)}
                        placeholder="Enter name"
                      />
                      <AgeGenderRow
                        age={m.age || ""}
                        onAgeChange={(v) => onUpdate(activeIdx, "age", Number(v))}
                        gender={m.gender || ""}
                        onGenderChange={(v) => onUpdate(activeIdx, "gender", v)}
                        ageId={`u-age-${activeIdx}`}
                        genderOptions={GENDERS}
                      />
                    </>
                  )}
                  <CompactDropdown
                    label="Highest Education Level"
                    value={m.highestEducation}
                    onChange={(v) => onUpdate(activeIdx, "highestEducation", v)}
                    options={UNEMPLOYMENT_EDUCATION}
                    placeholder="Select level"
                  />
                  <CompactCheckboxGroup
                    label="Skills Known"
                    selected={m.skills}
                    onChange={(v) => onUpdate(activeIdx, "skills", v)}
                    options={SKILLS}
                  />
                  {m.skills.includes("Other") && (
                    <CompactInput
                      label="Specify Other Skill"
                      id={`u-skill-other-${activeIdx}`}
                      value={m.skillOther || ""}
                      onChange={(v) => onUpdate(activeIdx, "skillOther", v)}
                      placeholder="Describe skill"
                    />
                  )}
                  <CompactDropdown
                    label="Main Reason for Unemployment"
                    value={m.unemploymentReason}
                    onChange={(v) => onUpdate(activeIdx, "unemploymentReason", v)}
                    options={UNEMPLOYMENT_REASONS}
                    placeholder="Select reason"
                  />
                  {m.unemploymentReason === "Other" && (
                    <CompactInput
                      label="Specify Reason"
                      id={`u-reason-other-${activeIdx}`}
                      value={m.unemploymentReasonOther || ""}
                      onChange={(v) => onUpdate(activeIdx, "unemploymentReasonOther", v)}
                      placeholder="Describe reason"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            {!canAddMember && <MemberLimitWarning />}
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
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
  );
}
