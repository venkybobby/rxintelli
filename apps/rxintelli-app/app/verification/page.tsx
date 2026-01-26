"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/contexts/toast-context";
import { getRxById, updateRx } from "@/lib/mockApi";
import {
  validateRx,
  VERIFICATION_THRESHOLD,
  type ValidationResults,
  type ValidationSection,
} from "@/lib/validateRx";
import type { Rx } from "@/lib/rx-types";
import { cn } from "@/lib/utils";

type DraftPatient = Pick<Rx["patient"], "name" | "id" | "dob" | "gender">;
type DraftPhysician = Pick<Rx["physician"], "name" | "npi">;
type DraftDrug = Pick<
  Rx["prescriptionDetails"],
  "drugName" | "strength" | "sig" | "quantity" | "refills"
>;
type DraftRpe = {
  directions: string;
  indication: string;
  daysSupply: number;
};

export default function VerificationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rxId = searchParams.get("rxId");
  const { data: session, status } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") {
      const cb = rxId ? `/verification?rxId=${encodeURIComponent(rxId)}` : "/verification";
      router.replace(`/login?callbackUrl=${encodeURIComponent(cb)}`);
      return;
    }
  }, [status, router, rxId]);

  const [rx, setRx] = useState<Rx | null>(null);
  const [loading, setLoading] = useState(!!rxId);
  const [reValidating, setReValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [editingSection, setEditingSection] = useState<ValidationSection | null>(null);
  const [draftPatient, setDraftPatient] = useState<DraftPatient | null>(null);
  const [draftPhysician, setDraftPhysician] = useState<DraftPhysician | null>(null);
  const [draftDrug, setDraftDrug] = useState<DraftDrug | null>(null);
  const [draftRpe, setDraftRpe] = useState<DraftRpe | null>(null);

  const loadRx = useCallback(async (id: string) => {
    const data = await getRxById(id);
    if (data) {
      setRx(data);
      setValidationResults(validateRx(data));
    } else {
      setRx(null);
      setValidationResults(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!rxId) {
      setLoading(false);
      setRx(null);
      setValidationResults(null);
      return;
    }
    setLoading(true);
    loadRx(rxId);
  }, [rxId, loadRx]);

  const handleSaveSection = async (
    section: ValidationSection,
    updates: Partial<Rx>
  ) => {
    if (!rxId || !rx) return;
    setReValidating(true);
    const updated = await updateRx(rxId, updates);
    if (updated) {
      setRx(updated);
      const prevScore = validationResults?.overallScore ?? 0;
      const next = validateRx(updated);
      setValidationResults(next);
      setEditingSection(null);
      setDraftPatient(null);
      setDraftPhysician(null);
      setDraftDrug(null);
      setDraftRpe(null);
      if (next.overallScore > prevScore) {
        toast(`Re-validation complete. Score improved to ${next.overallScore}%`);
      } else {
        toast("Changes saved.");
      }
    }
    setReValidating(false);
  };

  const startEdit = (section: ValidationSection) => {
    if (!rx) return;
    setEditingSection(section);
    const pd = rx.prescriptionDetails;
    const rpe = pd.rpeElements ?? {};
    switch (section) {
      case "Patient":
        setDraftPatient({
          name: rx.patient.name,
          id: rx.patient.id,
          dob: rx.patient.dob,
          gender: rx.patient.gender,
        });
        break;
      case "Physician":
        setDraftPhysician({ name: rx.physician.name, npi: rx.physician.npi });
        break;
      case "Drug":
        setDraftDrug({
          drugName: pd.drugName,
          strength: pd.strength,
          sig: pd.sig,
          quantity: pd.quantity,
          refills: pd.refills,
        });
        break;
      case "RPE":
        setDraftRpe({
          directions: rpe.directions ?? "",
          indication: rpe.indication ?? "",
          daysSupply: rpe.daysSupply ?? 0,
        });
        break;
    }
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setDraftPatient(null);
    setDraftPhysician(null);
    setDraftDrug(null);
    setDraftRpe(null);
  };

  const savePatient = () => {
    if (!draftPatient) return;
    const patient = { ...rx!.patient, ...draftPatient };
    if (patient.name && patient.id) {
      (patient as Rx["patient"]).eligibility = {
        status: "Eligible",
        plan: "Demo Plan",
        copayTier: 1,
      };
    }
    handleSaveSection("Patient", { patient });
  };
  const savePhysician = () => {
    if (!draftPhysician) return;
    const physician = { ...rx!.physician, ...draftPhysician };
    if (physician.npi?.length === 10) {
      (physician as Rx["physician"]).verified = true;
    }
    handleSaveSection("Physician", { physician });
  };
  const saveDrug = () => {
    if (!draftDrug) return;
    handleSaveSection("Drug", {
      prescriptionDetails: { ...rx!.prescriptionDetails, ...draftDrug },
    });
  };
  const saveRpe = () => {
    if (!draftRpe) return;
    const base = rx!.prescriptionDetails.rpeElements ?? {};
    const rpeElements = {
      ...base,
      directions: draftRpe.directions?.trim() || undefined,
      indication: draftRpe.indication?.trim() || undefined,
      daysSupply: draftRpe.daysSupply > 0 ? draftRpe.daysSupply : undefined,
    };
    handleSaveSection("RPE", {
      prescriptionDetails: {
        ...rx!.prescriptionDetails,
        rpeElements,
      },
    });
  };

  const handleReValidate = async () => {
    if (!rxId || !rx) return;
    setReValidating(true);
    const prevScore = validationResults?.overallScore ?? 0;
    const next = validateRx(rx);
    setValidationResults(next);
    setReValidating(false);
    if (next.overallScore > prevScore) {
      toast(`Re-validation complete. Score improved to ${next.overallScore}%`);
    } else {
      toast("Re-validation complete.");
    }
  };

  const canProceed = (validationResults?.overallScore ?? 0) >= VERIFICATION_THRESHOLD;
  const busy = loading || reValidating;
  const isLoadingOrUnauth = status === "loading" || status === "unauthenticated";

  if (isLoadingOrUnauth) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!rxId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Verification</CardTitle>
            <CardDescription>
              No prescription selected. Use Intake to create one, then open Verification with
              ?rxId=...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link href="/intake">
              <Button>New intake</Button>
            </Link>
            <Link href="/control-tower">
              <Button variant="outline">Control Tower</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-xl font-bold text-slate-900">Verification</h1>
        <p className="mt-4 text-slate-500">Loading prescription {rxId}…</p>
      </div>
    );
  }

  if (!rx || !validationResults) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Verification</CardTitle>
            <CardDescription>Prescription {rxId} not found.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link href="/control-tower">
              <Button>Control Tower</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const score = validationResults.overallScore;
  const { patient, physician, drug, rpe } = validationResults;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Verification</h1>
          <p className="mt-1 text-slate-600">
            {rxId} · Overall score: <strong>{score}%</strong>
            {score >= VERIFICATION_THRESHOLD
              ? " — Ready to proceed"
              : ` — Need ${VERIFICATION_THRESHOLD}% to proceed`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleReValidate}
            disabled={busy}
          >
            {reValidating ? (
              <span className="inline-flex items-center gap-2">
                <Spinner />
                Re-validating…
              </span>
            ) : (
              "Re-Validate"
            )}
          </Button>
          <Link href={`/control-tower`}>
            <Button variant="outline">Control Tower</Button>
          </Link>
        </div>
      </div>

      {busy && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/20">
          <div className="rounded-lg bg-white px-6 py-4 shadow-lg">
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <Spinner />
              {reValidating ? "Re-validating…" : "Loading…"}
            </span>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        <ValidationCard
          section="Patient"
          result={patient}
          rx={rx}
          editing={editingSection === "Patient"}
          draftPatient={draftPatient}
          setDraftPatient={setDraftPatient}
          onEdit={() => startEdit("Patient")}
          onSave={savePatient}
          onCancel={cancelEdit}
          disabled={busy}
        />
        <ValidationCard
          section="Physician"
          result={physician}
          rx={rx}
          editing={editingSection === "Physician"}
          draftPhysician={draftPhysician}
          setDraftPhysician={setDraftPhysician}
          onEdit={() => startEdit("Physician")}
          onSave={savePhysician}
          onCancel={cancelEdit}
          disabled={busy}
        />
        <ValidationCard
          section="Drug"
          result={drug}
          rx={rx}
          editing={editingSection === "Drug"}
          draftDrug={draftDrug}
          setDraftDrug={setDraftDrug}
          onEdit={() => startEdit("Drug")}
          onSave={saveDrug}
          onCancel={cancelEdit}
          disabled={busy}
        />
        <ValidationCard
          section="RPE"
          result={rpe}
          rx={rx}
          editing={editingSection === "RPE"}
          draftRpe={draftRpe}
          setDraftRpe={setDraftRpe}
          onEdit={() => startEdit("RPE")}
          onSave={saveRpe}
          onCancel={cancelEdit}
          disabled={busy}
        />
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link href="/intake">
            <Button variant="outline">New intake</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">Home</Button>
          </Link>
        </div>
        {canProceed ? (
          <Link href={rxId ? `/entry?rxId=${rxId}` : "/entry"}>
            <Button>Proceed to Entry</Button>
          </Link>
        ) : (
          <Button
            disabled
            title={`Score must be ≥ ${VERIFICATION_THRESHOLD}% to proceed`}
          >
            Proceed to Entry
          </Button>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-slate-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

type ValidationCardProps = {
  section: ValidationSection;
  result: ValidationResults["patient"] | ValidationResults["physician"] | ValidationResults["drug"] | ValidationResults["rpe"];
  rx: Rx;
  editing: boolean;
  disabled: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
} & (
  | { section: "Patient"; draftPatient: DraftPatient | null; setDraftPatient: (v: DraftPatient | null) => void }
  | { section: "Physician"; draftPhysician: DraftPhysician | null; setDraftPhysician: (v: DraftPhysician | null) => void }
  | { section: "Drug"; draftDrug: DraftDrug | null; setDraftDrug: (v: DraftDrug | null) => void }
  | { section: "RPE"; draftRpe: DraftRpe | null; setDraftRpe: (v: DraftRpe | null) => void }
);

function ValidationCard(props: ValidationCardProps) {
  const { section, result, rx, editing, disabled, onEdit, onSave, onCancel } = props;
  const showEdit = result.status !== "Pass" && !editing;

  return (
    <Card className={cn("flex flex-col")}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{section}</CardTitle>
          <Badge variant={result.status === "Pass" ? "success" : "destructive"}>
            {result.status}
          </Badge>
        </div>
        {result.message && (
          <CardDescription>{result.message}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {!editing ? (
          <>
            <p className="text-sm text-slate-600">{result.details}</p>
            {showEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} disabled={disabled}>
                Edit
              </Button>
            )}
          </>
        ) : (
          <SectionEditor
            section={section}
            rx={rx}
            props={props}
            onSave={onSave}
            onCancel={onCancel}
            disabled={disabled}
          />
        )}
      </CardContent>
    </Card>
  );
}

function SectionEditor({
  section,
  rx,
  props,
  onSave,
  onCancel,
  disabled,
}: {
  section: ValidationSection;
  rx: Rx;
  props: ValidationCardProps;
  onSave: () => void;
  onCancel: () => void;
  disabled: boolean;
}) {
  const isPatient = section === "Patient";
  const isPhysician = section === "Physician";
  const isDrug = section === "Drug";
  const isRpe = section === "RPE";

  return (
    <div className="flex flex-col gap-3">
      {isPatient && "draftPatient" in props && props.draftPatient && (
        <>
          <div>
            <Label htmlFor="v-patient-name">Name</Label>
            <Input
              id="v-patient-name"
              value={props.draftPatient.name}
              onChange={(e) =>
                props.setDraftPatient!({ ...props.draftPatient!, name: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="v-patient-id">Patient ID</Label>
            <Input
              id="v-patient-id"
              value={props.draftPatient.id}
              onChange={(e) =>
                props.setDraftPatient!({ ...props.draftPatient!, id: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="v-patient-dob">DOB</Label>
            <Input
              id="v-patient-dob"
              type="date"
              value={props.draftPatient.dob || ""}
              onChange={(e) =>
                props.setDraftPatient!({ ...props.draftPatient!, dob: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="v-patient-gender">Gender</Label>
            <Input
              id="v-patient-gender"
              value={props.draftPatient.gender || ""}
              onChange={(e) =>
                props.setDraftPatient!({ ...props.draftPatient!, gender: e.target.value })
              }
              className="mt-1"
            />
          </div>
        </>
      )}
      {isPhysician && "draftPhysician" in props && props.draftPhysician && (
        <>
          <div>
            <Label htmlFor="v-physician-name">Name</Label>
            <Input
              id="v-physician-name"
              value={props.draftPhysician.name}
              onChange={(e) =>
                props.setDraftPhysician!({ ...props.draftPhysician!, name: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="v-physician-npi">NPI</Label>
            <Input
              id="v-physician-npi"
              value={props.draftPhysician.npi}
              onChange={(e) =>
                props.setDraftPhysician!({ ...props.draftPhysician!, npi: e.target.value })
              }
              placeholder="10 digits"
              className="mt-1"
            />
          </div>
        </>
      )}
      {isDrug && "draftDrug" in props && props.draftDrug && (
        <>
          <div>
            <Label htmlFor="v-drug-name">Drug name</Label>
            <Input
              id="v-drug-name"
              value={props.draftDrug.drugName}
              onChange={(e) =>
                props.setDraftDrug!({ ...props.draftDrug!, drugName: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="v-drug-strength">Strength</Label>
            <Input
              id="v-drug-strength"
              value={props.draftDrug.strength}
              onChange={(e) =>
                props.setDraftDrug!({ ...props.draftDrug!, strength: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="v-drug-sig">Sig</Label>
            <Textarea
              id="v-drug-sig"
              value={props.draftDrug.sig}
              onChange={(e) =>
                props.setDraftDrug!({ ...props.draftDrug!, sig: e.target.value })
              }
              className="mt-1 min-h-[60px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="v-drug-qty">Quantity</Label>
              <Input
                id="v-drug-qty"
                type="number"
                min={1}
                value={props.draftDrug.quantity}
                onChange={(e) =>
                  props.setDraftDrug!({
                    ...props.draftDrug!,
                    quantity: parseInt(String(e.target.value), 10) || 0,
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="v-drug-refills">Refills</Label>
              <Input
                id="v-drug-refills"
                type="number"
                min={0}
                value={props.draftDrug.refills}
                onChange={(e) =>
                  props.setDraftDrug!({
                    ...props.draftDrug!,
                    refills: parseInt(String(e.target.value), 10) || 0,
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
        </>
      )}
      {isRpe && "draftRpe" in props && props.draftRpe && (
        <>
          <div>
            <Label htmlFor="v-rpe-directions">Directions</Label>
            <Textarea
              id="v-rpe-directions"
              value={props.draftRpe.directions}
              onChange={(e) =>
                props.setDraftRpe!({ ...props.draftRpe!, directions: e.target.value })
              }
              placeholder="e.g. With food"
              className="mt-1 min-h-[60px]"
            />
          </div>
          <div>
            <Label htmlFor="v-rpe-indication">Indication</Label>
            <Textarea
              id="v-rpe-indication"
              value={props.draftRpe.indication}
              onChange={(e) =>
                props.setDraftRpe!({ ...props.draftRpe!, indication: e.target.value })
              }
              placeholder="e.g. Hypertension"
              className="mt-1 min-h-[60px]"
            />
          </div>
          <div>
            <Label htmlFor="v-rpe-days">Days supply</Label>
            <Input
              id="v-rpe-days"
              type="number"
              min={1}
              value={props.draftRpe.daysSupply || ""}
              onChange={(e) =>
                props.setDraftRpe!({
                  ...props.draftRpe!,
                  daysSupply: parseInt(String(e.target.value), 10) || 0,
                })
              }
              className="mt-1"
            />
          </div>
        </>
      )}
      <div className="mt-1 flex flex-wrap gap-2">
        <Button size="sm" onClick={onSave} disabled={disabled}>
          Save Changes
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={disabled}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
