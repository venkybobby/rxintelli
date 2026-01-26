"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_RX_FLOW_STEPS, getMockFlowStep } from "@/lib/mock-rx-flow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FlowDemoPage() {
  const [stepIndex, setStepIndex] = useState(4);

  const current = getMockFlowStep(stepIndex);
  const rx = current?.rx;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Step-by-Step Mock Data Flow Simulation
        </h1>
        <p className="mt-1 text-slate-600">
          RX-00123 (Lisinopril, John Doe) through Intake → Validated → Entered → RPh Approved →
          Adjudicated → Scheduled → Completed.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {MOCK_RX_FLOW_STEPS.map(({ stage }, i) => (
          <Button
            key={stage}
            variant={stepIndex === i ? "default" : "outline"}
            size="sm"
            onClick={() => setStepIndex(i)}
          >
            {i + 1}. {stage}
          </Button>
        ))}
      </div>

      {current && rx && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{rx.rxId}</CardTitle>
                <Badge>{rx.status}</Badge>
                <span className="text-sm text-slate-500">
                  {rx.createdAt} → {rx.updatedAt}
                </span>
              </div>
              <CardDescription>Source: {rx.source}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-700">Patient</h4>
                <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-3 text-xs">
                  {JSON.stringify(rx.patient, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700">Prescription details</h4>
                <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-3 text-xs">
                  {JSON.stringify(rx.prescriptionDetails, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700">Validation</h4>
                <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-3 text-xs">
                  {JSON.stringify(rx.validation, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700">RPh verification</h4>
                <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-3 text-xs">
                  {JSON.stringify(rx.rphVerification, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700">Adjudication</h4>
                <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-3 text-xs">
                  {JSON.stringify(rx.adjudication, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700">Scheduling</h4>
                <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-3 text-xs">
                  {JSON.stringify(rx.scheduling, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700">Audit log ({rx.auditLog.length})</h4>
                <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-3 text-xs">
                  {JSON.stringify(rx.auditLog, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700">Metrics (timeInStatus sec)</h4>
                <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-3 text-xs">
                  {JSON.stringify(rx.metrics.timeInStatus ?? {}, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-8 flex gap-4">
        <Link href="/control-tower">
          <Button variant="outline">Control Tower</Button>
        </Link>
        <Link href="/">
          <Button variant="ghost">Home</Button>
        </Link>
      </div>
    </div>
  );
}
