"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useOverrideRole } from "@/contexts/override-role-context";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/contexts/toast-context";
import { getRxById, updateRx } from "@/lib/mockApi";
import { validateRx } from "@/lib/validateRx";
import type { Rx } from "@/lib/rx-types";
import { cn } from "@/lib/utils";

type FormState = {
  physicianName: string;
  physicianNpi: string;
  drugName: string;
  strength: string;
  sig: string;
  quantity: number;
  refills: number;
  indication: string;
  directions: string;
  daysSupply: number;
};

const defaultForm = (rx: Rx): FormState => ({
  physicianName: rx.physician.name,
  physicianNpi: rx.physician.npi,
  drugName: rx.prescriptionDetails.drugName,
  strength: rx.prescriptionDetails.strength,
  sig: rx.prescriptionDetails.sig,
  quantity: rx.prescriptionDetails.quantity,
  refills: rx.prescriptionDetails.refills,
  indication: rx.prescriptionDetails.rpeElements?.indication ?? "",
  directions: rx.prescriptionDetails.rpeElements?.directions ?? "",
  daysSupply: rx.prescriptionDetails.rpeElements?.daysSupply ?? 0,
});

function EntryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rxId = searchParams.get("rxId");
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const { overrideRole } = useOverrideRole();
  const role = (overrideRole ?? session?.user?.role) ?? null;

  useEffect(() => {
    if (status === "unauthenticated") {
      const cb = rxId ? `/entry?rxId=${encodeURIComponent(rxId)}` : "/entry";
      router.replace(`/login?callbackUrl=${encodeURIComponent(cb)}`);
      return;
    }
  }, [status, router, rxId]);

  const [rx, setRx] = useState<Rx | null>(null);
  const [loading, setLoading] = useState(!!rxId);
  const [form, setForm] = useState<FormState | null>(null);
  const [verified, setVerified] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadRx = useCallback(async (id: string) => {
    const data = await getRxById(id);
    if (data) {
      setRx(data);
      setForm(defaultForm(data));
    } else {
      setRx(null);
      setForm(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!rxId) {
      setLoading(false);
      setRx(null);
      setForm(null);
      return;
    }
    setLoading(true);
    loadRx(rxId);
  }, [rxId, loadRx]);

  const validationResults = rx ? validateRx(rx) : null;
  const isPatient = role === "patient";
  const isRph = role === "rph" || role === "admin";
  const isLoadingOrUnauth = status === "loading" || status === "unauthenticated";

  const handleSubmitForReview = async () => {
    if (!rxId || !rx || !verified) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    const auditLog = [
      ...rx.auditLog,
      { timestamp: now, action: "Entered", by: "Patient" },
    ];
    const updated = await updateRx(rxId, { status: "Entered", auditLog });
    if (updated) {
      setRx(updated);
      toast("Submitted for RPh review.");
    }
    setSubmitting(false);
  };

  const buildUpdatesFromForm = (): Partial<Rx> => {
    if (!rx || !form) return {};
    return {
      physician: {
        ...rx.physician,
        name: form.physicianName,
        npi: form.physicianNpi,
      },
      prescriptionDetails: {
        ...rx.prescriptionDetails,
        drugName: form.drugName,
        strength: form.strength,
        sig: form.sig,
        quantity: form.quantity,
        refills: form.refills,
        rpeElements: {
          ...(rx.prescriptionDetails.rpeElements ?? {}),
          indication: form.indication || undefined,
          directions: form.directions || undefined,
          daysSupply: form.daysSupply || undefined,
        },
      },
    };
  };

  const handleApprove = async () => {
    if (!rxId || !rx || !verified) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    const updates = buildUpdatesFromForm();
    const auditLog = [
      ...rx.auditLog,
      { timestamp: now, action: "RPhApproved", by: "RPh Jane" },
    ];
    const payload: Partial<Rx> = {
      ...updates,
      status: "RPhApproved",
      rphVerification: {
        ...rx.rphVerification,
        approvedBy: "RPh Jane",
        notes: rx.rphVerification.notes || "No issues",
        approvedAt: now,
        rejectedAt: null,
      },
      auditLog,
    };
    const updated = await updateRx(rxId, payload);
    if (updated) {
      setRx(updated);
      toast("Prescription approved – proceeding to adjudication.");
      router.push(`/adjudication?rxId=${rxId}`);
    }
    setSubmitting(false);
  };

  const handleRejectConfirm = async () => {
    if (!rxId || !rx) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    const auditLog = [
      ...rx.auditLog,
      { timestamp: now, action: "Rejected", by: "RPh Jane" },
    ];
    const payload: Partial<Rx> = {
      status: "Rejected",
      rphVerification: {
        approvedBy: null,
        notes: rejectNotes,
        approvedAt: null,
        rejectedAt: now,
      },
      auditLog,
    };
    const updated = await updateRx(rxId, payload);
    if (updated) {
      setRx(updated);
      setRejectOpen(false);
      setRejectNotes("");
      toast("Prescription rejected.");
    }
    setSubmitting(false);
  };

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
            <CardTitle>Prescription Entry</CardTitle>
            <CardDescription>No prescription selected. Use ?rxId=... or proceed from Verification.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link href="/verification">
              <Button>Verification</Button>
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
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-xl font-bold text-slate-900">Prescription Entry</h1>
        <p className="mt-4 text-slate-500">Loading {rxId}…</p>
      </div>
    );
  }

  if (!rx || !form) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Prescription Entry</CardTitle>
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

  const readOnly = isPatient;
  const p = rx.patient;
  const rpe = rx.prescriptionDetails.rpeElements ?? {};

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Stepper current="Entry" className="mb-8" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Prescription Entry & RPh Verification</h1>
        <p className="mt-1 text-slate-600">
          {rxId} · {isPatient ? "Review and submit for RPh review" : "Review, edit if needed, and approve or reject"}
        </p>
      </div>

      {validationResults && (
        <Card className="mb-6">
          <button
            type="button"
            onClick={() => setValidationOpen((o) => !o)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <div>
              <CardTitle className="text-base">Previous validation results</CardTitle>
              <CardDescription>Score: {validationResults.overallScore}% · Click to expand</CardDescription>
            </div>
            <span className="text-slate-400">{validationOpen ? "▼" : "▶"}</span>
          </button>
          {validationOpen && (
            <CardContent className="border-t border-slate-200 pt-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["Patient", validationResults.patient],
                    ["Physician", validationResults.physician],
                    ["Drug", validationResults.drug],
                    ["RPE", validationResults.rpe],
                  ] as const
                ).map(([name, r]) => (
                  <div
                    key={name}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      r.status === "Pass"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    )}
                  >
                    <span className="font-medium">{name}:</span> {r.status} · {r.details}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <Card>
          <CardHeader>
            <CardTitle>Patient info</CardTitle>
            <CardDescription>Read-only</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={p.name} readOnly className="bg-slate-50" />
              </div>
              <div>
                <Label>Patient ID</Label>
                <Input value={p.id} readOnly className="bg-slate-50" />
              </div>
              <div>
                <Label>DOB</Label>
                <Input value={p.dob} readOnly className="bg-slate-50" />
              </div>
              <div>
                <Label>Gender</Label>
                <Input value={p.gender} readOnly className="bg-slate-50" />
              </div>
              {p.eligibility && (
                <div className="sm:col-span-2">
                  <Label>Eligibility</Label>
                  <Input
                    value={`${p.eligibility.status} · ${p.eligibility.plan}`}
                    readOnly
                    className="bg-slate-50"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Physician</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="physician-name">Name</Label>
                <Input
                  id="physician-name"
                  value={form.physicianName}
                  onChange={(e) => setForm({ ...form, physicianName: e.target.value })}
                  readOnly={readOnly}
                  className={readOnly ? "bg-slate-50" : ""}
                />
              </div>
              <div>
                <Label htmlFor="physician-npi">NPI</Label>
                <Input
                  id="physician-npi"
                  value={form.physicianNpi}
                  onChange={(e) => setForm({ ...form, physicianNpi: e.target.value })}
                  readOnly={readOnly}
                  className={readOnly ? "bg-slate-50" : ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Drug details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="drug-name">Drug name</Label>
                <Input
                  id="drug-name"
                  value={form.drugName}
                  onChange={(e) => setForm({ ...form, drugName: e.target.value })}
                  readOnly={readOnly}
                  className={readOnly ? "bg-slate-50" : ""}
                />
              </div>
              <div>
                <Label htmlFor="strength">Strength</Label>
                <Input
                  id="strength"
                  value={form.strength}
                  onChange={(e) => setForm({ ...form, strength: e.target.value })}
                  readOnly={readOnly}
                  className={readOnly ? "bg-slate-50" : ""}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="sig">Sig</Label>
                <Textarea
                  id="sig"
                  value={form.sig}
                  onChange={(e) => setForm({ ...form, sig: e.target.value })}
                  readOnly={readOnly}
                  className={cn("min-h-[60px]", readOnly && "bg-slate-50")}
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: parseInt(String(e.target.value), 10) || 0 })
                  }
                  readOnly={readOnly}
                  className={readOnly ? "bg-slate-50" : ""}
                />
              </div>
              <div>
                <Label htmlFor="refills">Refills</Label>
                <Input
                  id="refills"
                  type="number"
                  min={0}
                  value={form.refills}
                  onChange={(e) =>
                    setForm({ ...form, refills: parseInt(String(e.target.value), 10) || 0 })
                  }
                  readOnly={readOnly}
                  className={readOnly ? "bg-slate-50" : ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RPE</CardTitle>
            <CardDescription>Indication, directions, days supply</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-1">
              <div>
                <Label htmlFor="indication">Indication</Label>
                <Textarea
                  id="indication"
                  value={form.indication}
                  onChange={(e) => setForm({ ...form, indication: e.target.value })}
                  readOnly={readOnly}
                  placeholder="e.g. Hypertension"
                  className={cn("min-h-[60px]", readOnly && "bg-slate-50")}
                />
              </div>
              <div>
                <Label htmlFor="directions">Directions</Label>
                <Textarea
                  id="directions"
                  value={form.directions}
                  onChange={(e) => setForm({ ...form, directions: e.target.value })}
                  readOnly={readOnly}
                  placeholder="e.g. With food"
                  className={cn("min-h-[60px]", readOnly && "bg-slate-50")}
                />
              </div>
              <div className="max-w-[200px]">
                <Label htmlFor="days-supply">Days supply</Label>
                <Input
                  id="days-supply"
                  type="number"
                  min={1}
                  value={form.daysSupply || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      daysSupply: parseInt(String(e.target.value), 10) || 0,
                    })
                  }
                  readOnly={readOnly}
                  className={readOnly ? "bg-slate-50" : ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm font-medium">I verify this Rx</span>
            </label>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link href={rxId ? `/verification?rxId=${rxId}` : "/verification"}>
              <Button type="button" variant="outline">
                Back to Verification
              </Button>
            </Link>
            <Link href="/control-tower">
              <Button type="button" variant="ghost">
                Control Tower
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {isPatient && (
              <Button
                type="button"
                disabled={!verified || submitting}
                onClick={() => handleSubmitForReview()}
              >
                {submitting ? "Submitting…" : "Submit for RPh Review"}
              </Button>
            )}
            {isRph && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  disabled={submitting}
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  disabled={!verified || submitting}
                  onClick={() => handleApprove()}
                >
                  {submitting ? "Approving…" : "Approve"}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>

      <Dialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject prescription"
        description="Provide notes for the rejection. This will set status to Rejected."
      >
        <div>
          <Label htmlFor="reject-notes">Notes</Label>
          <Textarea
            id="reject-notes"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Reason for rejection…"
            className="mt-2 min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => handleRejectConfirm()}
            disabled={submitting}
          >
            {submitting ? "Rejecting…" : "Confirm Reject"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default function EntryPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Stepper current="Entry" className="mb-8" />
        <p className="text-slate-500">Loading...</p>
      </div>
    }>
      <EntryPageContent />
    </Suspense>
  );
}
