"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper } from "@/components/stepper";

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const rxId = searchParams.get("rxId");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Stepper current="Schedule" className="mb-8" />
      <Card>
        <CardHeader>
          <CardTitle>Schedule (stub)</CardTitle>
          <CardDescription>
            {rxId
              ? `Prescription ${rxId} has been adjudicated. Select delivery method, date, and time slot (placeholder).`
              : "No prescription selected. Proceed from Adjudication (Pay) with ?rxId=..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {rxId && (
            <Link href={`/adjudication?rxId=${rxId}`}>
              <Button variant="outline">Back to Adjudication</Button>
            </Link>
          )}
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
