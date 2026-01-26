"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/contexts/toast-context";
import { getRxById, updateRx } from "@/lib/mockApi";
import type { Rx } from "@/lib/rx-types";

const MOCK_CLAIM_DELAY_MS = 1200;
const MOCK_APPROVE_CHANCE = 0.8;
const MOCK_COPAY_MIN = 0;
const MOCK_COPAY_MAX = 50;
const REJECT_REASONS = [
  "Out of network",
  "Prior authorization required",
  "Duplicate claim",
  "Drug not on formulary",
] as const;

/** Estimated total from validation (quantity, tier, etc.). */
function getEstimatedTotal(rx: Rx): number {
  const base = 35;
  const qty = rx.prescriptionDetails?.quantity ?? 30;
  const tier = rx.patient?.eligibility?.copayTier ?? 1;
  return Math.round(base + qty / 5 + tier * 8);
}

export default function AdjudicationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rxId = searchParams.get("rxId");
  const { data: session, status } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") {
      const cb = rxId ? `/adjudication?rxId=${encodeURIComponent(rxId)}` : "/adjudication";
      router.replace(`/login?callbackUrl=${encodeURIComponent(cb)}`);
      return;
    }
  }, [status, router, rxId]);

  const [rx, setRx] = useState<Rx | null>(null);
  const [loading, setLoading] = useState(!!rxId);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimStatus, setClaimStatus] = useState<"Approved" | "Rejected" | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"full" | "split">("full");
  const [splitNow, setSplitNow] = useState(0);
  const [splitLater, setSplitLater] = useState(0);
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const estimatedTotal = rx ? getEstimatedTotal(rx) : 0;
  const baseCopay = claimStatus === "Approved" && rx?.adjudication?.copay != null
    ? rx.adjudication.copay
    : 0;
  const assistDiscount = 0.35;
  const copay = enrolled
    ? Math.max(0, Math.round(baseCopay * (1 - assistDiscount)))
    : baseCopay;

  const hasPaid =
    paid ||
    (!!rx && rx.status === "Adjudicated" && rx.adjudication?.claimStatus === "Approved");

  const loadRx = useCallback(async (id: string) => {
    const data = await getRxById(id);
    setRx(data ?? null);
    if (data?.adjudication?.claimStatus === "Approved") {
      setClaimStatus("Approved");
      setRejectReason(null);
    } else if (data?.adjudication?.claimStatus === "Rejected") {
      setClaimStatus("Rejected");
      setRejectReason("Out of network");
    } else {
      setClaimStatus(null);
      setRejectReason(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!rxId) {
      setLoading(false);
      setRx(null);
      return;
    }
    setLoading(true);
    loadRx(rxId);
  }, [rxId, loadRx]);

  useEffect(() => {
    if (paymentMode === "split" && copay > 0) {
      const half = Math.floor(copay / 2);
      setSplitNow(half);
      setSplitLater(copay - half);
    }
  }, [paymentMode, copay]);

  const coverage = rx?.patient?.eligibility?.plan ?? "BlueCross";
  const drugLabel = rx
    ? `${rx.prescriptionDetails.drugName} ${rx.prescriptionDetails.strength}`
    : "";

  const handleSubmitClaim = async () => {
    if (!rxId || !rx) return;
    setClaimSubmitting(true);
    setRejectReason(null);
    await new Promise((r) => setTimeout(r, MOCK_CLAIM_DELAY_MS));

    const approved = Math.random() < MOCK_APPROVE_CHANCE;
    const now = new Date().toISOString();
    const copayVal = approved
      ? Math.floor(MOCK_COPAY_MIN + Math.random() * (MOCK_COPAY_MAX - MOCK_COPAY_MIN + 1))
      : 0;
    const covered = Math.max(0, estimatedTotal - copayVal);

    const updates: Partial<Rx> = {
      adjudication: {
        ...rx.adjudication,
        claimStatus: approved ? "Approved" : "Rejected",
        payerResponse: approved
          ? { coveredAmount: covered, patientResponsibility: copayVal }
          : null,
        copay: approved ? copayVal : null,
        copayEnrolled: false,
        splitPayment: null,
      },
      auditLog: [
        ...rx.auditLog,
        {
          timestamp: now,
          action: approved ? "Adjudicated" : "Claim Rejected",
          by: "System",
        },
      ],
      updatedAt: now,
    };

    const updated = await updateRx(rxId, updates);
    if (updated) {
      setRx(updated);
      setClaimStatus(approved ? "Approved" : "Rejected");
      if (!approved) {
        const reason = REJECT_REASONS[Math.floor(Math.random() * REJECT_REASONS.length)];
        setRejectReason(reason);
      }
    }
    setClaimSubmitting(false);
  };

  const handleRetry = async () => {
    if (!rxId || !rx) return;
    setClaimSubmitting(true);
    const now = new Date().toISOString();
    const updates: Partial<Rx> = {
      adjudication: {
        ...rx.adjudication,
        claimStatus: null,
        payerResponse: null,
        copay: null,
        copayEnrolled: false,
        splitPayment: null,
      },
      auditLog: [
        ...rx.auditLog,
        { timestamp: now, action: "Claim retry", by: "Patient" },
      ],
      updatedAt: now,
    };
    const updated = await updateRx(rxId, updates);
    if (updated) {
      setRx(updated);
      setClaimStatus(null);
      setRejectReason(null);
    }
    setClaimSubmitting(false);
  };

  const handleEnrollChange = (checked: boolean) => {
    setEnrolled(checked);
  };

  const handlePay = async () => {
    if (!rxId || !rx || claimStatus !== "Approved" || paying || paid) return;
    const payNow = paymentMode === "split" ? splitNow : copay;
    if (payNow < 0) return;
    setPaying(true);
    await new Promise((r) => setTimeout(r, 800));

    const now = new Date().toISOString();
    const updates: Partial<Rx> = {
      status: "Adjudicated",
      adjudication: {
        ...rx.adjudication,
        copayEnrolled: enrolled,
        splitPayment:
          paymentMode === "split" && copay > 0
            ? { initial: splitNow, remaining: splitLater }
            : null,
      },
      auditLog: [
        ...rx.auditLog,
        { timestamp: now, action: "Payment received", by: "Patient" },
      ],
      updatedAt: now,
    };
    const updated = await updateRx(rxId, updates);
    if (updated) {
      setRx(updated);
      setPaid(true);
      if (enrolled) {
        toast(`Claim Approved – Copay $${copay} after enrollment`);
      } else {
        toast("Adjudicated – Proceed to Schedule");
      }
      router.push(`/schedule?rxId=${rxId}`);
    }
    setPaying(false);
  };

  const syncSplitFromNow = (nowVal: number) => {
    const n = Math.max(0, Math.min(copay, Math.round(nowVal)));
    setSplitNow(n);
    setSplitLater(copay - n);
  };

  const syncSplitFromLater = (laterVal: number) => {
    const l = Math.max(0, Math.min(copay, Math.round(laterVal)));
    setSplitLater(l);
    setSplitNow(copay - l);
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Stepper current="Adjudication" className="mb-8" />
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!rxId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Stepper current="Adjudication" className="mb-8" />
        <Card>
          <CardHeader>
            <CardTitle>Adjudication</CardTitle>
            <CardDescription>
              No prescription selected. Proceed from Entry (Approve) with ?rxId=...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link href="/entry">
              <Button variant="outline">Back to Entry</Button>
            </Link>
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

  if (loading || !rx) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Stepper current="Adjudication" className="mb-8" />
        <p className="text-slate-500">Loading prescription…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Stepper current="Adjudication" className="mb-8" />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rx Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Rx #{rx.rxId}</span>
              {drugLabel && <> · Drug: {drugLabel}</>}
            </p>
            <p>
              Estimated Total (from validation): ${estimatedTotal} · Coverage: {coverage}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adjudication</CardTitle>
            <CardDescription>Submit claim to payer and view response.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!claimStatus ? (
              <Button
                onClick={handleSubmitClaim}
                disabled={claimSubmitting}
                className="w-full sm:w-auto"
              >
                {claimSubmitting ? "Submitting…" : "Submit Claim"}
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-600">Status:</span>
                <Badge variant={claimStatus === "Approved" ? "success" : "destructive"}>
                  {claimStatus}
                </Badge>
              </div>
            )}
            {claimStatus === "Approved" && rx.adjudication?.payerResponse && (
              <p className="text-sm text-slate-700">
                Payer Response: Covered ${rx.adjudication.payerResponse.coveredAmount} · Patient
                responsibility ${rx.adjudication.payerResponse.patientResponsibility}
              </p>
            )}
          </CardContent>
        </Card>

        {claimStatus === "Rejected" && (
          <Alert variant="destructive">
            <strong>Claim rejected:</strong> {rejectReason ?? "Unknown"}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                disabled={claimSubmitting}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Retry
              </Button>
              <Link href={`/entry?rxId=${rxId}`}>
                <Button size="sm" variant="outline">
                  Back to Entry
                </Button>
              </Link>
            </div>
          </Alert>
        )}

        {claimStatus === "Approved" && !hasPaid && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Copay & Assistance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={enrolled}
                    onCheckedChange={handleEnrollChange}
                    aria-label="Enroll in Assistance"
                  />
                  <span className="text-sm">Enroll in Assistance</span>
                </div>
                <p className="text-sm text-slate-600">
                  Mock discount 20–50%. {enrolled && "Reduced copay applied."}
                </p>
                <p className="text-sm font-medium text-slate-700">Copay: ${copay}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment</CardTitle>
                <CardDescription>Full or split payment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="payment-mode"
                      checked={paymentMode === "full"}
                      onChange={() => setPaymentMode("full")}
                      className="h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm">Full</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="payment-mode"
                      checked={paymentMode === "split"}
                      onChange={() => setPaymentMode("split")}
                      className="h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm">Split</span>
                  </label>
                </div>

                {paymentMode === "split" && copay > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="split-now" className="text-xs">
                        Pay now
                      </Label>
                      <Input
                        id="split-now"
                        type="number"
                        min={0}
                        max={copay}
                        value={splitNow}
                        onChange={(e) => syncSplitFromNow(Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="split-later" className="text-xs">
                        Pay later
                      </Label>
                      <Input
                        id="split-later"
                        type="number"
                        min={0}
                        max={copay}
                        value={splitLater}
                        onChange={(e) => syncSplitFromLater(Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <p className="text-xs text-slate-500 sm:col-span-2">
                      Total: ${splitNow + splitLater} (auto-calc)
                    </p>
                  </div>
                )}

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Mock payment form
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <Label htmlFor="adj-card" className="text-xs">
                        Card number
                      </Label>
                      <Input
                        id="adj-card"
                        type="text"
                        placeholder="•••• •••• •••• ••••"
                        value={card}
                        onChange={(e) => setCard(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="adj-expiry" className="text-xs">
                        Expiry
                      </Label>
                      <Input
                        id="adj-expiry"
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="adj-cvv" className="text-xs">
                        CVV
                      </Label>
                      <Input
                        id="adj-cvv"
                        type="text"
                        placeholder="•••"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handlePay}
                    disabled={paying || paid}
                    className="mt-4"
                  >
                    {paying ? "Processing…" : copay <= 0 ? "Proceed (no payment)" : "Pay"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {claimStatus === "Approved" && hasPaid && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-emerald-800">
                Payment received. Proceed to Schedule.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-4">
          <Link href={rxId ? `/entry?rxId=${rxId}` : "/entry"}>
            <Button variant="outline">Back to Entry</Button>
          </Link>
          {hasPaid && (
            <Link href={`/schedule?rxId=${rxId}`}>
              <Button>Proceed to Schedule</Button>
            </Link>
          )}
          {!hasPaid && <Button disabled>Proceed to Schedule</Button>}
          <Link href="/control-tower">
            <Button variant="ghost">Control Tower</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
