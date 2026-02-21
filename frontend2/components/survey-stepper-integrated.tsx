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

  // Step 2
  const [hasHealthIssue, setHasHealthIssue] = useState("");
  const [healthMembers, setHealthMembers] = useState<any[]>([]);
  const [healthIdx, setHealthIdx] = useState(0);
  const [healthDir, setHealthDir] = useState(1);

  // Step 3
  const [hasEduIssue, setHasEduIssue] = useState("");
  const [eduMembers, setEduMembers] = useState<any[]>([]);
  const [eduIdx, setEduIdx] = useState(0);
  const [eduDir, setEduDir] = useState(1);

  // Step 4
  const [hasUnemployment, setHasUnemployment] = useState("");
  const [unempMembers, setUnempMembers] = useState<any[]>([]);
  const [unempIdx, setUnempIdx] = useState(0);
  const [unempDir, setUnempDir] = useState(1);

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

  // Member management functions (simplified for now)
  const addHealthMember = () => {
    if (canAddMember) {
      setHealthMembers([...healthMembers, {
        patient: "",
        patientName: "",
        age: "",
        gender: "",
        hasAadhar: "",
        hasAyushman: "",
        healthIssues: [],
        medicines: [],
        hospitalVisits: "",
        treatments: [],
      }]);
    }
  };

  const addEduMember = () => {
    if (canAddMember) {
      setEduMembers([...eduMembers, {
        person: "",
        name: "",
        age: "",
        gender: "",
        hasAadhar: "",
        educationLevel: "",
        schoolType: "",
        medium: "",
        scholarship: "",
        dropoutReason: "",
        currentClass: "",
        schoolName: "",
      }]);
    }
  };

  const addUnempMember = () => {
    if (canAddMember) {
      setUnempMembers([...unempMembers, {
        person: "",
        name: "",
        age: "",
        gender: "",
        hasAadhar: "",
        employmentType: "",
        employmentStatus: "",
        businessType: "",
        businessSector: "",
        monthlyIncome: "",
        workLocation: "",
        unemploymentReason: "",
        skills: [],
      }]);
    }
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
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Health Information</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <CompactRadioGroup
                    label="Does anyone in the family have health issues?"
                    options={["Yes", "No"]}
                    value={hasHealthIssue}
                    onChange={setHasHealthIssue}
                  />
                  
                  {hasHealthIssue === "Yes" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Health Members</h3>
                        {canAddMember && (
                          <Button
                            size="sm"
                            onClick={addHealthMember}
                            className="h-7 px-2 text-xs"
                          >
                            <Plus className="size-3 mr-1" />
                            Add Member
                          </Button>
                        )}
                      </div>
                      
                      {healthMembers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          No health members added
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {healthMembers.map((member, idx) => (
                            <div key={idx} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Member {idx + 1}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setHealthMembers(healthMembers.filter((_, i) => i !== idx))}
                                  className="h-6 px-1 text-destructive"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                              {/* Health member form fields would go here */}
                              <p className="text-xs text-muted-foreground">Health form fields to be implemented</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Education Information</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <CompactRadioGroup
                    label="Does anyone in the family go to school?"
                    options={["Yes", "No"]}
                    value={hasEduIssue}
                    onChange={setHasEduIssue}
                  />
                  
                  {hasEduIssue === "Yes" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Education Members</h3>
                        {canAddMember && (
                          <Button
                            size="sm"
                            onClick={addEduMember}
                            className="h-7 px-2 text-xs"
                          >
                            <Plus className="size-3 mr-1" />
                            Add Member
                          </Button>
                        )}
                      </div>
                      
                      {eduMembers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          No education members added
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {eduMembers.map((member, idx) => (
                            <div key={idx} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Member {idx + 1}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEduMembers(eduMembers.filter((_, i) => i !== idx))}
                                  className="h-6 px-1 text-destructive"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                              {/* Education member form fields would go here */}
                              <p className="text-xs text-muted-foreground">Education form fields to be implemented</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Employment Information</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <CompactRadioGroup
                    label="Does anyone in the family have employment?"
                    options={["Yes", "No"]}
                    value={hasUnemployment}
                    onChange={setHasUnemployment}
                  />
                  
                  {hasUnemployment === "Yes" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Employment Members</h3>
                        {canAddMember && (
                          <Button
                            size="sm"
                            onClick={addUnempMember}
                            className="h-7 px-2 text-xs"
                          >
                            <Plus className="size-3 mr-1" />
                            Add Member
                          </Button>
                        )}
                      </div>
                      
                      {unempMembers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          No employment members added
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {unempMembers.map((member, idx) => (
                            <div key={idx} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Member {idx + 1}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setUnempMembers(unempMembers.filter((_, i) => i !== idx))}
                                  className="h-6 px-1 text-destructive"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                              {/* Employment member form fields would go here */}
                              <p className="text-xs text-muted-foreground">Employment form fields to be implemented</p>
                            </div>
                          ))}
                        </div>
                      )}
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
