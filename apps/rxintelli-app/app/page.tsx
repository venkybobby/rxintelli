import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          RxIntelli
        </h1>
        <p className="mt-2 text-slate-600">
          Process prescriptions instantly. Multi-channel intake, real-time oversight, and scalable workflow monitoring.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="border-teal-100 transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Intake</CardTitle>
            <CardDescription>
              Upload image/PDF, pull from eRx, or manual entry. HIPAA-secure upload with Smart OCR preview.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/intake" className="inline-block w-full sm:w-auto">
              <Button className="w-full sm:w-auto">Start Intake</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="border-teal-100 transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Control Tower</CardTitle>
            <CardDescription>
              End-to-end visibility. Metrics, alerts, prescription list, and status timeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/control-tower" className="inline-block w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">Open Control Tower</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-600">
        <strong>Quick tips:</strong> Sign in (Login) with mock users: patient@rx.com, rph@rx.com, or admin@rx.com (password: pass). Control Tower requires Admin or RPh. From Intake, submit a prescription → Verification → Entry → Adjudication → Schedule.
      </div>
    </div>
  );
}
