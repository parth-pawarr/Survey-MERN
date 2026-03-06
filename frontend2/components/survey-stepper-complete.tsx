"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import { SurveyorApiService } from "@/lib/surveyor-api";
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertTriangle, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface SurveyStepperProps {
  surveyorId: string;
  village: string;
  surveyId?: string;           // provided when mode is 'update'
  mode?: 'new' | 'continue' | 'update';
  onComplete: () => void;
  onCancel: () => void;
}

// Member interfaces
interface HealthMember {
  patient: string;
  patientName?: string;
  age?: number;
  gender?: string;
  hasAyushman: string;
  healthIssue: string[];
  healthIssueOther?: string;
  morbidity: string[];
  morbidityOther?: string;
}

interface EducationMember {
  person: string;
  name?: string;
  age?: number;
  gender?: string;
  educationLevel: string;
  dropoutReason?: string;
  // currentClass?: string;
  educationalIssues: string[];
}

interface EmploymentMember {
  person: string;
  name?: string;
  age?: number;
  gender?: string;
  // employmentType: string;
  employmentStatus: string;
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
          className={`size-2 rounded-full transition-colors ${i === activeIdx ? "bg-primary" : "bg-border"
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
  surveyId,
  mode = 'new',
  onComplete,
  onCancel,
}: SurveyStepperProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(mode === 'update');
  const [error, setError] = useState<string | null>(null);

  // Mobile validation state
  const [isValidatingMobile, setIsValidatingMobile] = useState(false);
  // null = not validated yet, true = available, false = duplicate found
  const [mobileValidated, setMobileValidated] = useState<boolean | null>(null);

  // Load draft on mount (new mode only) OR pre-fill from DB (update mode)
  useEffect(() => {
    if (mode === 'update' && surveyId) {
      // Fetch existing survey and pre-fill all form fields
      SurveyorApiService.getSurvey(surveyId).then((s: any) => {
        const repN = s.representativeName || '';
        const repG = s.representativeGender || '';
        const repA = String(s.representativeAge || '');

        // Step 1 — Household
        setRepName(repN);
        setMobile(s.mobileNumber || '');
        setIsWhatsApp(s.isWhatsAppNumber || '');
        setAge(repA);
        setGender(repG);
        setTotalMembers(String(s.totalFamilyMembers || ''));
        setAyushmanStatus(s.ayushmanCardStatus || '');
        const ac = s.ayushmanMembersCount;
        setAyushmanCount(ac != null && ac !== 0 ? String(ac) : '');

        // Step 2 — Health
        setHasHealthIssue(s.hasHealthIssues || '');
        if (Array.isArray(s.healthMembers) && s.healthMembers.length > 0) {
          setHealthMembers(s.healthMembers.map((m: any) => {
            const isRep = (m.patientName || '').toLowerCase().trim() === repN.toLowerCase().trim();
            return {
              patient: isRep ? repN : 'Other',
              patientName: isRep ? '' : (m.patientName || ''),
              age: m.age,
              gender: m.gender || '',
              hasAyushman: '',
              healthIssue: Array.isArray(m.healthIssueType) ? m.healthIssueType : [],
              healthIssueOther: m.otherHealthIssue || '',
              morbidity: Array.isArray(m.hasAdditionalMorbidity) ? m.hasAdditionalMorbidity : [],
              morbidityOther: m.additionalMorbidityDetails || '',
            };
          }));
        }

        // Step 3 — Education
        setHasEduIssue(s.hasSchoolChildren || '');
        if (Array.isArray(s.educationChildren) && s.educationChildren.length > 0) {
          setEduMembers(s.educationChildren.map((c: any) => {
            const isRep = (c.Name || '').toLowerCase().trim() === repN.toLowerCase().trim();
            return {
              person: isRep ? repN : 'Other',
              name: isRep ? '' : (c.Name || ''),
              age: c.age,
              gender: c.gender || '',
              educationLevel: c.educationLevel || '',
              educationalIssues: Array.isArray(c.educationalIssues) ? c.educationalIssues : [],
            };
          }));
        }

        // Step 4 — Employment
        setHasUnemployment(s.hasUnEmployedMembers || '');
        if (Array.isArray(s.unemployedMembers) && s.unemployedMembers.length > 0) {
          setUnempMembers(s.unemployedMembers.map((u: any) => {
            const isRep = (u.name || '').toLowerCase().trim() === repN.toLowerCase().trim();
            return {
              person: isRep ? repN : 'Other',
              name: isRep ? '' : (u.name || ''),
              age: u.age,
              gender: u.gender || '',
              // employmentType: '',
              // employmentStatus: 'Unemployed',
              employmentStatus: 'Unemployed',
              highestEducation: u.highestEducation || '',
              unemploymentReason: u.unemploymentReason || '',
              skills: Array.isArray(u.skillsKnown) ? u.skillsKnown : [],
              skillOther: u.otherSkills || '',
            };
          }));
        }
      }).catch((err: any) => {
        console.error('Failed to load survey for update:', err);
        setError('Failed to load survey data. Please go back and try again.');
      }).finally(() => {
        setIsPrefilling(false);
      });
    } else if (mode !== 'update') {
      const draft = SurveyApiService.loadDraft();
      if (draft) {
        console.log('Draft found:', draft);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId, mode]);

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

  // Swipe-to-navigate for member carousels
  // One ref per section tracks the X position where the touch started.
  const healthTouchX = useRef<number | null>(null);
  const eduTouchX = useRef<number | null>(null);
  const unempTouchX = useRef<number | null>(null);

  const SWIPE_THRESHOLD = 50; // px — minimum horizontal distance to count as a swipe

  /**
   * Returns { onTouchStart, onTouchEnd } props for a carousel container.
   * `touchAction: 'pan-y'` lets the browser keep handling vertical page
   * scroll while we intercept horizontal swipes only.
   */
  const makeSwipeHandlers = (
    touchRef: React.MutableRefObject<number | null>,
    idx: number,
    total: number,
    setIdx: (i: number) => void,
    setDir: (d: number) => void
  ) => ({
    style: { touchAction: 'pan-y' } as React.CSSProperties,
    onTouchStart: (e: React.TouchEvent) => {
      touchRef.current = e.touches[0].clientX;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchRef.current === null) return;
      const delta = touchRef.current - e.changedTouches[0].clientX;
      touchRef.current = null;
      if (Math.abs(delta) < SWIPE_THRESHOLD) return;
      if (delta > 0 && idx < total - 1) {
        // Swiped left → show next member
        setDir(1);
        setIdx(idx + 1);
      } else if (delta < 0 && idx > 0) {
        // Swiped right → show previous member
        setDir(-1);
        setIdx(idx - 1);
      }
    },
  });


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
      setIsDuplicate(false);
      // Reset validation status whenever the user edits the number
      setMobileValidated(null);
    },
    []
  );

  const handleValidateMobile = useCallback(async () => {
    if (!mobile || mobile.length < 10) return;
    setIsValidatingMobile(true);
    setMobileValidated(null);
    try {
      const result = await SurveyorApiService.checkMobileNumber(
        mobile,
        mode === 'update' ? surveyId : undefined
      );
      if (result.exists) {
        setIsDuplicate(true);
        setMobileValidated(false);
      } else {
        setIsDuplicate(false);
        setMobileValidated(true);
      }
    } catch {
      // If the check fails, we silently allow the user to continue
      setMobileValidated(null);
    } finally {
      setIsValidatingMobile(false);
    }
  }, [mobile, mode, surveyId]);

  // Helper: Get person's gender based on their name from previous sections
  const getPersonGender = useCallback((personName: string): string => {
    if (!personName || personName === "Other") return "";

    // Check if it's the representative
    if (personName.toLowerCase().trim() === repName.toLowerCase().trim()) {
      return gender;
    }

    // Check health members
    const healthMatch = healthMembers.find((m) => {
      const name = m.patient === "Other" ? m.patientName : m.patient;
      return name && name.toLowerCase().trim() === personName.toLowerCase().trim();
    });
    if (healthMatch) return healthMatch.gender || "";

    // Check education members (for employment section)
    const eduMatch = eduMembers.find((m) => {
      const name = m.person === "Other" ? m.name : m.person;
      return name && name.toLowerCase().trim() === personName.toLowerCase().trim();
    });
    if (eduMatch) return eduMatch.gender || "";

    return "";
  }, [repName, gender, healthMembers, eduMembers]);

  // Health member management
  const addHealthMember = () => {
    if (canAddMember) {
      const newIdx = healthMembers.length;
      setHealthMembers([...healthMembers, {
        patient: "",
        patientName: "",
        age: undefined,
        gender: "",
        hasAyushman: "",
        healthIssue: [],
        morbidity: [],
      }]);
      // Auto-navigate to the newly added member
      setHealthDir(1);
      setHealthIdx(newIdx);
    }
  };

  const updateHealthMember = (idx: number, field: keyof HealthMember, val: any) => {
    setHealthMembers(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };

      // Auto-fill gender and age if patient field changed and it's not "Other"
      if (field === "patient" && val && val !== "Other") {
        // If patient is the representative, auto-fill their gender and age
        if (val.toLowerCase().trim() === repName.toLowerCase().trim()) {
          updated[idx].gender = gender;
          const parsedAge = Number(age);
          if (!isNaN(parsedAge) && parsedAge > 0) {
            updated[idx].age = parsedAge;
          }
        }
      }

      return updated;
    });
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
      const newIdx = eduMembers.length;
      setEduMembers([...eduMembers, {
        person: "",
        name: "",
        age: undefined,
        gender: "",
        educationLevel: "",
        educationalIssues: [],
      }]);
      // Auto-navigate to the newly added member
      setEduDir(1);
      setEduIdx(newIdx);
    }
  };

  const updateEduMember = (idx: number, field: keyof EducationMember, val: any) => {
    setEduMembers(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };

      // Auto-fill gender, age and name if person field changed and it's not "Other"
      if (field === "person" && val && val !== "Other") {
        const autoGender = getPersonGender(val);
        // Always set the auto-filled gender (will be empty if not found, which will trigger validation)
        updated[idx].gender = autoGender;

        // Also try to auto-fill age if available from health members
        const healthMatch = healthMembers.find((m) => {
          const name = m.patient === "Other" ? m.patientName : m.patient;
          return name && name.toLowerCase().trim() === val.toLowerCase().trim();
        });
        if (healthMatch && healthMatch.age) {
          updated[idx].age = healthMatch.age;
        }
      }

      return updated;
    });
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
      const newIdx = unempMembers.length;
      setUnempMembers([...unempMembers, {
        person: "",
        name: "",
        age: undefined,
        gender: "",
        // employmentType: "",
        employmentStatus: "",
        highestEducation: "",
        skills: [],
      }]);
      // Auto-navigate to the newly added member
      setUnempDir(1);
      setUnempIdx(newIdx);
    }
  };

  const updateUnempMember = (idx: number, field: keyof EmploymentMember, val: any) => {
    setUnempMembers(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };

      // Auto-fill gender, age and name if person field changed and it's not "Other"
      if (field === "person" && val && val !== "Other") {
        const autoGender = getPersonGender(val);
        // Always set the auto-filled gender (will be empty if not found, which will trigger validation)
        updated[idx].gender = autoGender;

        // Also try to auto-fill age from health or education members
        const healthMatch = healthMembers.find((m) => {
          const name = m.patient === "Other" ? m.patientName : m.patient;
          return name && name.toLowerCase().trim() === val.toLowerCase().trim();
        });
        if (healthMatch && healthMatch.age) {
          updated[idx].age = healthMatch.age;
        } else {
          const eduMatch = eduMembers.find((m) => {
            const name = m.person === "Other" ? m.name : m.person;
            return name && name.toLowerCase().trim() === val.toLowerCase().trim();
          });
          if (eduMatch && eduMatch.age) {
            updated[idx].age = eduMatch.age;
          }
        }
      }

      return updated;
    });
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
        isWhatsAppNumber: isWhatsApp,
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
    repName, mobile, isWhatsApp, age, gender, totalMembers, ayushmanStatus, ayushmanCount,
    hasHealthIssue, healthMembers, hasEduIssue, eduMembers, hasUnemployment, unempMembers
  ]);

  // Auto-save draft (only for new/continue mode — not update mode)
  useEffect(() => {
    if (mode === 'update') return;   // skip: update hits the DB directly on Submit
    const formData = getCurrentFormData();
    SurveyApiService.saveDraft(formData, village);
  }, [getCurrentFormData, village, mode]);

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

      if (mode === 'update' && surveyId) {
        // Update existing survey in-place via PUT /surveys/:id
        await SurveyorApiService.updateSurvey(surveyId, requestData as any);
        // Re-submit to mark as Submitted
        await SurveyorApiService.submitSurvey(surveyId);
      } else if (!SurveyApiService.getCurrentSurveyId()) {
        await SurveyApiService.createSurvey(requestData);
        await SurveyApiService.submitSurvey();
      } else {
        await SurveyApiService.updateSurvey(requestData);
        await SurveyApiService.submitSurvey();
      }

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

      {/* Loading overlay while pre-filling update data */}
      {isPrefilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading survey data...</p>
          </div>
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
            {mode === 'update' ? 'Update Survey' : 'New Survey'} — Step {step} of 4
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
                  {/* Mobile Number field + inline Validate button */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <PhoneInput
                          label="Mobile Number"
                          id="mobile"
                          value={mobile}
                          onChange={handleMobileChange}
                          required
                        />
                      </div>
                      {/* mt-[1.375rem] skips past the label (text-xs + gap-1) so the
                          button top-aligns with the input box, not with the label.
                          This prevents the button from jumping when the error message
                          below PhoneInput appears or disappears. */}
                      <div className="mt-[1.375rem] shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={handleValidateMobile}
                          disabled={isValidatingMobile || !mobile || mobile.length < 10}
                        >
                          {isValidatingMobile ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            "Validate"
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Validation status message */}
                    {mobileValidated === false && (
                      <div className="flex items-center gap-1.5 text-xs text-destructive">
                        <XCircle className="size-3.5 shrink-0" />
                        <span>Mobile number already used.</span>
                      </div>
                    )}
                    {mobileValidated === true && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span>Mobile number is available.</span>
                      </div>
                    )}
                  </div>

                  <CompactRadioGroup
                    label="Is this WhatsApp number?"
                    options={["Yes", "No"]}
                    value={isWhatsApp}
                    onChange={setIsWhatsApp}
                  />
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
                    maxLength={2}
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
                      maxLength={2}
                    />
                  )}
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
                      <div
                        className="overflow-hidden"
                        {...makeSwipeHandlers(healthTouchX, healthIdx, healthMembers.length, setHealthIdx, setHealthDir)}
                      >
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
                            {/* <CompactRadioGroup
                              label="Has Ayushman Card?"
                              value={healthMembers[healthIdx]?.hasAyushman || ""}
                              onChange={(v) => updateHealthMember(healthIdx, "hasAyushman", v)}
                              options={["Yes", "No"]}
                            /> */}
                            {/* Health Issues Selection */}
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-medium">Type of Health Issue</label>
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val && !healthMembers[healthIdx]?.healthIssue.includes(val)) {
                                      const updated = [...(healthMembers[healthIdx]?.healthIssue || []), val];
                                      updateHealthMember(healthIdx, "healthIssue", updated);
                                    }
                                  }}
                                  className="border rounded p-1 text-xs"
                                >
                                  <option value="">+ Add Issue</option>
                                  {HEALTH_ISSUES.map((issue) => (
                                    <option key={issue} value={issue}>
                                      {issue}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {healthMembers[healthIdx]?.healthIssue?.map((issue) => (
                                  <div key={issue} className="flex items-center gap-1 bg-primary/10 rounded px-2 py-1">
                                    <span className="text-xs">{issue}</span>
                                    <button
                                      onClick={() => {
                                        const updated = healthMembers[healthIdx]?.healthIssue.filter((i) => i !== issue) || [];
                                        updateHealthMember(healthIdx, "healthIssue", updated);
                                      }}
                                      className="text-xs text-destructive hover:font-bold"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Morbidity Selection */}
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-medium">Morbidity / Other Health Problems</label>
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val && !healthMembers[healthIdx]?.morbidity.includes(val)) {
                                      const updated = [...(healthMembers[healthIdx]?.morbidity || []), val];
                                      updateHealthMember(healthIdx, "morbidity", updated);
                                    }
                                  }}
                                  className="border rounded p-1 text-xs"
                                >
                                  <option value="">+ Add Problem</option>
                                  {MORBIDITY_OPTIONS.map((morbidity) => (
                                    <option key={morbidity} value={morbidity}>
                                      {morbidity}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {healthMembers[healthIdx]?.morbidity?.map((morb) => (
                                  <div key={morb} className="flex items-center gap-1 bg-primary/10 rounded px-2 py-1">
                                    <span className="text-xs">{morb}</span>
                                    <button
                                      onClick={() => {
                                        const updated = healthMembers[healthIdx]?.morbidity.filter((m) => m !== morb) || [];
                                        updateHealthMember(healthIdx, "morbidity", updated);
                                      }}
                                      className="text-xs text-destructive hover:font-bold"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
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
                      <div
                        className="overflow-hidden"
                        {...makeSwipeHandlers(eduTouchX, eduIdx, eduMembers.length, setEduIdx, setEduDir)}
                      >
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
                            <CompactDropdown
                              label="Current Education Level"
                              value={eduMembers[eduIdx]?.educationLevel || ""}
                              onChange={(v) => updateEduMember(eduIdx, "educationLevel", v)}
                              options={EDUCATION_LEVELS}
                              placeholder="Select level"
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
                      <div
                        className="overflow-hidden"
                        {...makeSwipeHandlers(unempTouchX, unempIdx, unempMembers.length, setUnempIdx, setUnempDir)}
                      >
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
                            <CompactDropdown
                              label="Employment Status"
                              value={unempMembers[unempIdx]?.employmentStatus || ""}
                              onChange={(v) => updateUnempMember(unempIdx, "employmentStatus", v)}
                              options={["Suboptimally Employed", "Unemployed"]}
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
                            {unempMembers[unempIdx]?.employmentStatus === "Unemployed" && (
                              <>
                                <CompactDropdown
                                  label="Main Reason for Unemployment"
                                  value={unempMembers[unempIdx]?.unemploymentReason || ""}
                                  onChange={(v) => updateUnempMember(unempIdx, "unemploymentReason", v)}
                                  options={UNEMPLOYMENT_REASONS}
                                  placeholder="Select reason"
                                />
                              </>
                            )}

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
                  // In update mode: data is pre-filled from an existing valid survey,
                  // so only block if isPrefilling (data still loading). 
                  isPrefilling ||
                  // In new mode: enforce per-step field validation.
                  (mode !== 'update' && (
                    (step === 1 && (
                      !repName || !mobile || !isWhatsApp || !age || !gender || !totalMembers || !ayushmanStatus ||
                      (ayushmanStatus === 'Some Members Have' && !ayushmanCount)
                    )) ||
                    (step === 2 && !hasHealthIssue) ||
                    (step === 3 && !hasEduIssue)
                  ))
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {mode === 'update' ? 'Saving...' : 'Submitting...'}
                  </>
                ) : (
                  mode === 'update' ? 'Save & Submit' : 'Submit Survey'
                )}
              </Button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
