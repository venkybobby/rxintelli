"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { createRx } from "@/lib/mockApi";

type ManualForm = {
  patientName: string;
  dob: string;
  gender: string;
  physicianName: string;
  npi: string;
  drug: string;
  strength: string;
  sig: string;
  qty: string;
  refills: string;
};

const GENDERS = [
  { value: "", label: "Select..." },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
  { value: "U", label: "Unknown" },
];

const MOCK_ERX = [
  { id: "ERX-001", patientId: "P-1001", patientName: "John D.", drug: "Lisinopril 10mg", ref: "REF-A1" },
  { id: "ERX-002", patientId: "P-1002", patientName: "Jane S.", drug: "Metformin 500mg", ref: "REF-B2" },
];

export default function IntakePage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showOcrPreview, setShowOcrPreview] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [erxSearch, setErxSearch] = useState("");
  const [erxMatches] = useState(MOCK_ERX);
  const [toast, setToast] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ManualForm>({
    defaultValues: {
      patientName: "",
      dob: "",
      gender: "",
      physicianName: "",
      npi: "",
      drug: "",
      strength: "",
      sig: "",
      qty: "",
      refills: "",
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png"], "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 5,
    onDrop: (accepted) => setFiles((prev) => [...prev, ...accepted]),
  });

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const simulateProcess = (onDone: () => void) => {
    setProcessing(true);
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(iv);
          setProcessing(false);
          onDone();
          return 100;
        }
        return p + 12;
      });
    }, 120);
  };

  const handleUploadSubmit = async () => {
    if (files.length === 0) return;
    simulateProcess(async () => {
      const newRx = await createRx({
        source: "Upload",
        patient: { name: "From upload", id: `PAT-${Math.floor(1000 + Math.random() * 9000)}` },
        prescriptionDetails: {
          drugName: "Extracted (mock)",
          sig: "As directed",
          quantity: 30,
          refills: 0,
        },
      });
      setToast(`Prescription received! Redirecting to validation... (${newRx.rxId})`);
      setTimeout(() => router.push(`/verification?rxId=${newRx.rxId}`), 1500);
    });
  };

  const handleErxImport = async (idx: number) => {
    const m = erxMatches[idx];
    if (!m) return;
    setValue("patientName", m.patientName);
    setValue("drug", m.drug);
    simulateProcess(async () => {
      const newRx = await createRx({
        source: "eRx",
        patient: { name: m.patientName, id: m.patientId },
        prescriptionDetails: {
          drugName: m.drug,
          sig: "As directed",
          quantity: 30,
          refills: 0,
        },
      });
      setToast(`Prescription received! Redirecting to validation... (${newRx.rxId})`);
      setTimeout(() => router.push(`/verification?rxId=${newRx.rxId}`), 1500);
    });
  };

  const onManualSubmit = async (data: ManualForm) => {
    simulateProcess(async () => {
      const newRx = await createRx({
        source: "Manual",
        patient: {
          name: data.patientName,
          dob: data.dob,
          gender: data.gender,
          id: `PAT-${String(Math.floor(10000 + Math.random() * 90000))}`,
        },
        physician: {
          name: data.physicianName,
          npi: data.npi,
          verified: false,
        },
        prescriptionDetails: {
          drugName: data.drug,
          strength: data.strength,
          sig: data.sig,
          quantity: data.qty ? parseInt(data.qty, 10) : 30,
          refills: data.refills ? parseInt(data.refills, 10) : 0,
        },
      });
      setToast(`Prescription received! Redirecting to validation... (${newRx.rxId})`);
      setTimeout(() => router.push(`/verification?rxId=${newRx.rxId}`), 1500);
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Stepper current="Intake" className="mb-8" />

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome to RxIntelli – Start Processing Prescriptions Instantly
        </h1>
        <p className="mt-1 text-slate-600">
          Choose your intake method below.
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="erx">eRx Import</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Prescription</CardTitle>
              <CardDescription>
                Drag your prescription image or PDF here. Our secure AI will preview extracted details (drug, dosage, RPE elements) before submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={cn(
                  "flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors",
                  isDragActive ? "border-teal-500 bg-teal-50/50" : "border-slate-300 bg-slate-50/50 hover:border-teal-400 hover:bg-teal-50/30"
                )}
              >
                <input {...getInputProps()} />
                <p className="text-center text-sm text-slate-600">
                  {isDragActive ? "Drop files here..." : "Drag & drop image or PDF here, or click to select"}
                </p>
                <Button type="button" variant="outline" size="sm" className="mt-3">
                  Or take photo (mobile)
                </Button>
              </div>
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">File preview</p>
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <span className="truncate text-sm">{f.name}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(i)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch checked={showOcrPreview} onCheckedChange={setShowOcrPreview} />
                <Label>Show AI OCR Preview</Label>
              </div>
              {showOcrPreview && files.length > 0 && (
                <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4 text-sm">
                  <p className="font-medium text-teal-800">AI-extracted preview (mock)</p>
                  <p className="mt-1 text-slate-600">Drug: [extracted] · Sig: [extracted] · Patient: [extracted]</p>
                </div>
              )}
              {processing && <Progress value={progress} className="h-2" />}
              <Button
                className="w-full sm:w-auto"
                disabled={files.length === 0 || processing}
                onClick={handleUploadSubmit}
              >
                {processing ? "Processing…" : "Process Prescription"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="erx">
          <Card>
            <CardHeader>
              <CardTitle>eRx Import</CardTitle>
              <CardDescription>
                Enter patient ID or eRx reference to pull from network (mock integration ready for production).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Patient ID / eRx Reference #"
                  value={erxSearch}
                  onChange={(e) => setErxSearch(e.target.value)}
                  className="flex-1"
                />
                <Button variant="secondary">Search</Button>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent eRx matches (mock)</p>
                {erxMatches.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div>
                      <span className="font-medium">{m.patientName}</span> · {m.drug} · {m.ref}
                    </div>
                    <Button size="sm" onClick={() => handleErxImport(i)} disabled={processing}>
                      Import
                    </Button>
                  </div>
                ))}
              </div>
              {processing && <Progress value={progress} className="h-2" />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
              <CardDescription>
                Fill in key details – fields auto-suggest based on common RPE standards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onManualSubmit)} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Patient Name</Label>
                  <Input placeholder="Patient Name" {...register("patientName", { required: "Required" })} />
                  {errors.patientName && (
                    <p className="text-xs text-red-600">{errors.patientName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>DOB</Label>
                  <Input type="date" {...register("dob", { required: "Required" })} />
                  {errors.dob && <p className="text-xs text-red-600">{errors.dob.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    {...register("gender")}
                  >
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Physician Name</Label>
                  <Input placeholder="Physician Name" {...register("physicianName")} />
                </div>
                <div className="space-y-2">
                  <Label>NPI</Label>
                  <Input placeholder="NPI" {...register("npi")} />
                </div>
                <div className="space-y-2">
                  <Label>Drug Name</Label>
                  <Input placeholder="Drug (autocomplete mock)" {...register("drug", { required: "Required" })} />
                  {errors.drug && <p className="text-xs text-red-600">{errors.drug.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Strength</Label>
                  <Input placeholder="e.g. 10mg" {...register("strength")} />
                </div>
                <div className="space-y-2">
                  <Label>Sig</Label>
                  <Input placeholder="e.g. 1 tab daily" {...register("sig")} />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" placeholder="30" {...register("qty")} />
                </div>
                <div className="space-y-2">
                  <Label>Refills</Label>
                  <Input type="number" placeholder="0" {...register("refills")} />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-2">
                  {processing && <Progress value={progress} className="h-2" />}
                  <Button type="submit" disabled={processing}>
                    {processing ? "Processing…" : "Process Prescription"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-8 border-slate-200 bg-slate-50/50">
        <CardContent className="py-4">
          <p className="text-sm text-slate-600">
            <strong>Tips:</strong> Supported: JPG, PNG, PDF · Max 10MB · Encrypted upload · AI extracts RPE in seconds. HIPAA-secure.
          </p>
        </CardContent>
      </Card>

      {toast && (
        <div
          className="fixed bottom-4 right-4 z-50 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 shadow-lg"
          role="alert"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
