"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/contexts/toast-context";
import { useOverrideRole } from "@/contexts/override-role-context";
import {
  STEPS,
  getTimeline,
  getDurationSeconds,
  type Rx,
  type RxStatus,
} from "@/lib/rx-types";
import { getAllRx } from "@/lib/mockApi";
import { MOCK_RX_ALERTS } from "@/lib/mock-rx-data";
import { validateRx } from "@/lib/validateRx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL_MS = 5000;
const ROW_HIGHLIGHT_DURATION_MS = 2500;
const ALERT_SCORE_THRESHOLD = 70;

export type RiskLevel = "High" | "Medium" | "Low";

function getScore(rx: Rx): number {
  return validateRx(rx).overallScore;
}

/** Alert if: overallScore < 70, Rejected, drugValidatedRisk High, or RPh notes present. */
function isHighRiskAlert(rx: Rx): boolean {
  const score = getScore(rx);
  const notesLen = rx.rphVerification?.notes?.length ?? 0;
  return (
    score < ALERT_SCORE_THRESHOLD ||
    rx.status === "Rejected" ||
    rx.validation.drugValidatedRisk === "High" ||
    notesLen > 0
  );
}

/** Primary reason for alert (for toast). */
function getAlertReason(rx: Rx): string {
  if (rx.status === "Rejected") return "Rejected";
  if (rx.validation.drugValidatedRisk === "High") return "High risk";
  const notesLen = rx.rphVerification?.notes?.length ?? 0;
  if (notesLen > 0) return "RPh notes";
  const score = getScore(rx);
  if (score < ALERT_SCORE_THRESHOLD) return "Low score";
  return "Alert";
}

function getRiskLevel(rx: Rx): RiskLevel {
  if (rx.status === "Rejected") return "High";
  if (rx.validation.drugValidatedRisk === "High") return "High";
  const score = getScore(rx);
  if (score < ALERT_SCORE_THRESHOLD) return "High";
  const notesLen = rx.rphVerification?.notes?.length ?? 0;
  if (notesLen > 0) return "High";
  if (
    (score >= ALERT_SCORE_THRESHOLD && score < 80) ||
    rx.validation.drugValidatedRisk === "Medium" ||
    rx.status === "Entered"
  )
    return "Medium";
  return "Low";
}

function riskBadgeVariant(
  r: RiskLevel
): "destructive" | "warning" | "success" {
  if (r === "High") return "destructive";
  if (r === "Medium") return "warning";
  return "success";
}

function riskSortOrder(r: RiskLevel): number {
  if (r === "High") return 3;
  if (r === "Medium") return 2;
  return 1;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  ...STEPS.map((s) => ({ value: s, label: s })),
  { value: "Rejected", label: "Rejected" },
];

const ALERT_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "high-risk", label: "High Risk" },
  { value: "rejected", label: "Rejected" },
  { value: "pending-approval", label: "Pending Approval" },
];

function statusVariant(s: RxStatus): "default" | "success" | "warning" | "secondary" | "destructive" {
  if (s === "Rejected") return "destructive";
  if (s === "Completed" || s === "Scheduled" || s === "Adjudicated") return "success";
  if (s === "RPhApproved" || s === "Entered") return "warning";
  return "secondary";
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return iso;
  }
}

function ControlTowerPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const { overrideRole } = useOverrideRole();
  const role = (overrideRole ?? session?.user?.role) ?? null;
  const patientId = (session?.user as { patientId?: string | null })?.patientId ?? null;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/control-tower");
      return;
    }
  }, [status, router]);
  const [rxList, setRxList] = useState<Rx[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [alertFilter, setAlertFilter] = useState(() =>
    searchParams.get("alertFilter") || ""
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());
  const prevListRef = useRef<Rx[] | null>(null);
  const prevAlertIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const q = searchParams.get("alertFilter") || "";
    if (q) setAlertFilter(q);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllRx();
      const prev = prevListRef.current;
      prevListRef.current = data;

      const currentAlerts = new Map<string, string>(
        data
          .filter((r) => isHighRiskAlert(r))
          .map((r) => [r.rxId, getAlertReason(r)])
      );
      const prevAlertIds = prevAlertIdsRef.current;
      prevAlertIdsRef.current = new Set(currentAlerts.keys());
      if (prev && prev.length > 0) {
        currentAlerts.forEach((reason, id) => {
          if (!prevAlertIds.has(id)) {
            toast(`Alert: High-risk Rx #${id} (${reason})`);
          }
        });
      }

      if (prev && prev.length > 0) {
        const changed: { id: string; status: RxStatus }[] = [];
        for (const r of data) {
          const p = prev.find((x) => x.rxId === r.rxId);
          if (p && p.status !== r.status)
            changed.push({ id: r.rxId, status: r.status });
        }
        changed.forEach(({ id, status }) => {
          toast(`Rx ${id} advanced to ${status}`);
          setUpdatedIds((u) => {
            const next = new Set(u);
            next.add(id);
            return next;
          });
          setTimeout(() => {
            setUpdatedIds((u) => {
              const next = new Set(u);
              next.delete(id);
              return next;
            });
          }, ROW_HIGHLIGHT_DURATION_MS);
        });
      }

      setRxList([...data]);
      setLoading(false);
    };

    fetchData();
    if (paused) return;
    const id = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, toast]);

  const baseFiltered = useMemo(() => {
    let out = rxList;
    if (role === "patient" && patientId) {
      out = out.filter((r) => r.patient.id === patientId);
    }
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(
        (r) =>
          r.rxId.toLowerCase().includes(q) ||
          r.patient.name.toLowerCase().includes(q) ||
          r.prescriptionDetails.drugName.toLowerCase().includes(q)
      );
    }
    if (statusFilter) out = out.filter((r) => r.status === statusFilter);
    if (dateFrom) {
      out = out.filter((r) => r.createdAt >= `${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      out = out.filter((r) => r.createdAt <= `${dateTo}T23:59:59`);
    }
    return out;
  }, [rxList, role, patientId, search, statusFilter, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    let out = baseFiltered;
    if (alertFilter === "high-risk") out = out.filter((r) => isHighRiskAlert(r));
    else if (alertFilter === "rejected") out = out.filter((r) => r.status === "Rejected");
    else if (alertFilter === "pending-approval") out = out.filter((r) => r.status === "Entered");
    return [...out].sort((a, b) => riskSortOrder(getRiskLevel(b)) - riskSortOrder(getRiskLevel(a)));
  }, [baseFiltered, alertFilter]);

  const metrics = useMemo(() => {
    const total = baseFiltered.length;
    const completed = baseFiltered.filter((r) => r.status === "Completed").length;
    const sumSecs = baseFiltered.reduce((a, r) => a + (getDurationSeconds(r) ?? 0), 0);
    const avgMinutes = total > 0 ? Math.round(sumSecs / 60 / total) : 0;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const alerts = baseFiltered.filter((r) => isHighRiskAlert(r)).length;
    const pendingValidation = baseFiltered.filter(
      (r) => r.status === "Validated" || r.status === "Intake"
    ).length;
    return {
      total,
      avgMinutes,
      successRate,
      alerts,
      pendingValidation,
    };
  }, [baseFiltered]);

  const showAlertBanner = metrics.alerts > 0;

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">
          RxIntelli Control Tower – End-to-End Prescription Oversight
        </h1>
        <p className="mt-4 text-slate-500">Loading prescriptions…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            RxIntelli Control Tower – End-to-End Prescription Oversight
          </h1>
          <p className="mt-1 text-slate-600">
            Active Prescriptions: {metrics.total} · Success Rate: {metrics.successRate}% · Avg
            Process Time: {metrics.avgMinutes} min
          </p>
        </div>
        <Button
          variant={paused ? "default" : "outline"}
          onClick={() => setPaused((p) => !p)}
          className="shrink-0"
        >
          {paused ? "Resume Simulation" : "Pause Simulation"}
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Rx Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Avg Process Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.avgMinutes} min</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.successRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {metrics.alerts > 0 ? (
                <Badge variant="destructive">{metrics.alerts} High-Risk</Badge>
              ) : (
                "0"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {showAlertBanner && (
        <Alert variant="destructive" className="mb-6">
          <strong>High-Risk Items:</strong> {metrics.alerts} prescription{metrics.alerts !== 1 ? "s" : ""} need attention
          {" · "}
          <Link href="/control-tower?alertFilter=high-risk">View All</Link>
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search by Rx ID, patient, drug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={alertFilter}
          onChange={(e) => setAlertFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          aria-label="Alert filter"
        >
          {ALERT_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Input
          type="date"
          placeholder="From"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="max-w-[140px]"
        />
        <Input
          type="date"
          placeholder="To"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="max-w-[140px]"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-medium">Rx ID</th>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="px-4 py-3 font-medium">Started</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rx) => {
              const durationSecs = getDurationSeconds(rx);
              const durationMin = durationSecs != null ? Math.round(durationSecs / 60) : null;
              const timeline = getTimeline(rx);
              const alert = MOCK_RX_ALERTS[rx.rxId];
              const risk = getRiskLevel(rx);
              const rowBg =
                risk === "High"
                  ? "bg-red-100/50"
                  : risk === "Medium"
                    ? "bg-yellow-50/50"
                    : undefined;
              return (
                <React.Fragment key={rx.rxId}>
                  <tr
                    className={cn(
                      "cursor-pointer border-b border-slate-100 transition-colors hover:opacity-90",
                      rowBg ?? "hover:bg-slate-50",
                      expandedId === rx.rxId && "ring-1 ring-teal-300",
                      updatedIds.has(rx.rxId) && "updated"
                    )}
                    onClick={() => setExpandedId((prev) => (prev === rx.rxId ? null : rx.rxId))}
                  >
                    <td className="px-4 py-3 font-medium">{rx.rxId}</td>
                    <td className="px-4 py-3">{rx.patient.name}</td>
                    <td className="px-4 py-3">{rx.source}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex flex-wrap items-center gap-1">
                        <Badge variant={statusVariant(rx.status)}>{rx.status}</Badge>
                        {alert && (
                          <span className="text-xs text-amber-600">({alert})</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={riskBadgeVariant(risk)}>{risk}</Badge>
                    </td>
                    <td className="px-4 py-3">{formatTime(rx.createdAt)}</td>
                    <td className="px-4 py-3">{durationMin != null ? `${durationMin} min` : "–"}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId((prev) => (prev === rx.rxId ? null : rx.rxId));
                        }}
                      >
                        {expandedId === rx.rxId ? "Collapse" : "Expand"} timeline
                      </Button>
                    </td>
                  </tr>
                  {expandedId === rx.rxId && (
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <p className="mb-3 font-medium">
                            Timeline: Intake → Validated → Entered → RPh Approved → Adjudicated →
                            Scheduled → Completed
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {timeline.map((t) => (
                              <div
                                key={t.step}
                                className={cn(
                                  "flex items-center gap-1 rounded-full px-3 py-1 text-xs",
                                  t.done
                                    ? "bg-teal-100 text-teal-800"
                                    : "bg-slate-100 text-slate-500"
                                )}
                              >
                                <span>{t.step}</span>
                                {t.at && <span className="text-slate-500">@ {t.at}</span>}
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                            <span>
                              {rx.prescriptionDetails.drugName} {rx.prescriptionDetails.strength}
                            </span>
                            <span>{rx.physician.name}</span>
                            {rx.patient.eligibility && (
                              <span>
                                {rx.patient.eligibility.status} · {rx.patient.eligibility.plan}
                              </span>
                            )}
                            {rx.adjudication.copay != null && (
                              <span>Copay ${rx.adjudication.copay}</span>
                            )}
                          </div>
                          <p className="mt-2 text-xs text-slate-400">
                            Audit: {rx.auditLog.length} entries · View full details (placeholder)
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-slate-500">
            No prescriptions match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

export default function ControlTowerPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <p className="text-slate-500">Loading...</p>
      </div>
    }>
      <ControlTowerPageContent />
    </Suspense>
  );
}
