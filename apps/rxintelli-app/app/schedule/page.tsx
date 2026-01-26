"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { format, addDays, startOfDay, isBefore } from "date-fns";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/contexts/toast-context";
import { getRxById, updateRx } from "@/lib/mockApi";
import type { Rx } from "@/lib/rx-types";
import { cn } from "@/lib/utils";

const DELIVERY_FEE = 5;
const SLOTS_FETCH_DELAY_MS = 800;
const CONFIRM_DELAY_MS = 600;

const PHARMACY_OPTIONS = [
  { value: "CVS Georgetown TX", label: "CVS Georgetown TX" },
  { value: "Walgreens Round Rock", label: "Walgreens Round Rock" },
  { value: "Other", label: "Other" },
];

type DeliveryMethod = "Pickup" | "Delivery";

type SlotOption = {
  id: string;
  date: string;
  dateLabel: string;
  slotLabel: string;
  timeSlot: string;
  specificTime: string;
  available: boolean;
};

/** 9AM–5PM, 2-hour blocks: 9–11, 11–1, 1–3, 3–5. */
const SLOT_BLOCKS = [
  { start: 9, end: 11, label: "9AM–11AM", timeSlot: "9:00 AM - 11:00 AM", mid: "10:00 AM" },
  { start: 11, end: 13, label: "11AM–1PM", timeSlot: "11:00 AM - 1:00 PM", mid: "12:00 PM" },
  { start: 13, end: 15, label: "1PM–3PM", timeSlot: "1:00 PM - 3:00 PM", mid: "2:00 PM" },
  { start: 15, end: 17, label: "3PM–5PM", timeSlot: "3:00 PM - 5:00 PM", mid: "4:00 PM" },
];

/** Generate 7 days from today with random availability (seeded by date string for stability). */
function generateSlots(): SlotOption[] {
  const now = new Date();
  const today = startOfDay(now);
  const todayStr = format(today, "yyyy-MM-dd");
  const currentHour = now.getHours();
  const slots: SlotOption[] = [];
  let id = 0;
  for (let d = 0; d < 7; d++) {
    const date = addDays(today, d);
    const dateStr = format(date, "yyyy-MM-dd");
    const dateLabel = format(date, "MMM d");
    const seed = dateStr.length + d * 10;
    SLOT_BLOCKS.forEach((block, bi) => {
      const slotSeed = seed + bi * 7;
      let available = slotSeed % 5 !== 0;
      const isToday = dateStr === todayStr;
      if (isToday && block.end <= currentHour) available = false;
      slots.push({
        id: `slot-${++id}`,
        date: dateStr,
        dateLabel,
        slotLabel: block.label,
        timeSlot: block.timeSlot,
        specificTime: block.mid,
        available,
      });
    });
  }
  return slots;
}

/** Mock async fetch of availability. */
async function fetchSlots(): Promise<SlotOption[]> {
  await new Promise((r) => setTimeout(r, SLOTS_FETCH_DELAY_MS));
  return generateSlots();
}

function getCopayPaid(rx: Rx): number {
  const copay = rx.adjudication?.copay;
  if (copay != null) return copay;
  return 0;
}

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const rxId = searchParams.get("rxId");
  const { toast } = useToast();

  const [rx, setRx] = useState<Rx | null>(null);
  const [loading, setLoading] = useState(!!rxId);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryMethod>("Pickup");
  const [location, setLocation] = useState("CVS Georgetown TX");
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [scheduled, setScheduled] = useState(false);

  const loadRx = useCallback(async (id: string) => {
    const data = await getRxById(id);
    setRx(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!rxId) {
      setLoading(false);
      setRx(null);
      setSlots([]);
      return;
    }
    setLoading(true);
    loadRx(rxId);
  }, [rxId, loadRx]);

  useEffect(() => {
    if (!rx) return;
    setSlotsLoading(true);
    fetchSlots()
      .then((s) => {
        setSlots(s);
        setSelectedSlot(null);
      })
      .finally(() => setSlotsLoading(false));
  }, [rx?.rxId]);

  const copayPaid = rx ? getCopayPaid(rx) : 0;
  const drugLabel = rx
    ? `${rx.prescriptionDetails.drugName} ${rx.prescriptionDetails.strength}`
    : "";
  const locationValue = delivery === "Delivery" ? "Home" : location;
  const canConfirm =
    !!rx &&
    !!rxId &&
    !!selectedSlot &&
    selectedSlot.available &&
    (delivery === "Pickup" ? !!location : true);

  const handleConfirm = async () => {
    if (!canConfirm || !rxId || !rx || !selectedSlot) return;
    setConfirming(true);
    await new Promise((r) => setTimeout(r, CONFIRM_DELAY_MS));

    const now = new Date().toISOString();
    const updates: Partial<Rx> = {
      status: "Scheduled",
      scheduling: {
        ...rx.scheduling,
        deliveryMethod: delivery,
        date: selectedSlot.date,
        timeSlot: selectedSlot.timeSlot,
        location: locationValue,
        confirmed: true,
      },
      auditLog: [
        ...rx.auditLog,
        { timestamp: now, action: "Scheduled", by: "Patient" },
      ],
      updatedAt: now,
    };

    const updated = await updateRx(rxId, updates);
    if (updated) {
      setRx(updated);
      setScheduled(true);
      const dateTime = `${selectedSlot.dateLabel} ${selectedSlot.specificTime}`;
      toast(`Scheduled for ${dateTime} – Thank you!`);
    }
    setConfirming(false);
  };

  const deliverySummary =
    delivery === "Pickup" ? "Pickup at Pharmacy" : "Home Delivery";
  const selectedSummary =
    selectedSlot && selectedSlot.available
      ? `${deliverySummary} · ${locationValue} · ${selectedSlot.dateLabel} ${selectedSlot.specificTime}`
      : null;

  const calendarDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, []);

  if (!rxId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Stepper current="Schedule" className="mb-8" />
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>
              No prescription selected. Proceed from Adjudication (Pay) with ?rxId=...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link href="/adjudication">
              <Button variant="outline">Back to Adjudication</Button>
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
        <Stepper current="Schedule" className="mb-8" />
        <p className="text-slate-500">Loading prescription…</p>
      </div>
    );
  }

  if (scheduled) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Stepper current="Schedule" className="mb-8" />
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle>Prescription Scheduled</CardTitle>
            <CardDescription>
              Rx #{rx.rxId} · {drugLabel} · {rx.scheduling.deliveryMethod} ·{" "}
              {rx.scheduling.date} {rx.scheduling.timeSlot}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link href="/control-tower">
              <Button>Track in Control Tower</Button>
            </Link>
            <Link href={`/adjudication?rxId=${rxId}`}>
              <Button variant="outline">Back to Adjudication</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Stepper current="Schedule" className="mb-8" />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rx Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Rx #{rx.rxId}</span>
              {drugLabel && <> · {drugLabel}</>}
            </p>
            <p>Copay Paid: ${copayPaid} · Ready for delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="delivery"
                  checked={delivery === "Pickup"}
                  onChange={() => setDelivery("Pickup")}
                  className="h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm">Pickup at Pharmacy</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="delivery"
                  checked={delivery === "Delivery"}
                  onChange={() => setDelivery("Delivery")}
                  className="h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm">
                  Home Delivery
                  <span className="ml-1 text-slate-500">(+${DELIVERY_FEE} mock fee)</span>
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location / Pharmacy</CardTitle>
          </CardHeader>
          <CardContent>
            {delivery === "Pickup" ? (
              <div>
                <Label htmlFor="schedule-pharmacy" className="text-xs">
                  Pharmacy
                </Label>
                <Select
                  id="schedule-pharmacy"
                  options={PHARMACY_OPTIONS}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1"
                />
              </div>
            ) : (
              <p className="text-sm text-slate-600">Deliver to Home</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calendar & Time Slots</CardTitle>
            <CardDescription>Select an available slot (7 days from today, 2‑hour blocks)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {slotsLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                <p className="text-sm text-slate-500">Fetching availability…</p>
              </div>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Next 7 days
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                    {calendarDays.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const daySlots = slots.filter((s) => s.date === dateStr);
                      const hasAvailable = daySlots.some((s) => s.available);
                      const isPast = isBefore(day, startOfDay(new Date()));
                      const disabled = isPast || !hasAvailable;
                      return (
                        <div
                          key={dateStr}
                          className={cn(
                            "rounded-lg border p-2 text-center text-sm",
                            disabled && "bg-slate-100 text-slate-400",
                            !disabled && "border-slate-200 bg-white"
                          )}
                        >
                          <div className="font-medium">{format(day, "EEE")}</div>
                          <div className="text-slate-600">{format(day, "MMM d")}</div>
                          {!hasAvailable && !isPast && (
                            <span className="text-xs text-slate-500">Full</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Available Slots
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => slot.available && setSelectedSlot(slot)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          slot.available
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500",
                          selectedSlot?.id === slot.id && "ring-2 ring-teal-500 ring-offset-2"
                        )}
                      >
                        {slot.dateLabel} {slot.slotLabel}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  <button
                    type="button"
                    onClick={() => toast("Call your pharmacy to arrange a different time.")}
                    className="text-teal-600 underline hover:text-teal-700"
                  >
                    No convenient slot?
                  </button>
                  {" "}Call your pharmacy to arrange a different time.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSummary ? (
              <p className="text-sm text-slate-700">Selected: {selectedSummary}</p>
            ) : (
              <p className="text-sm text-slate-500">
                Select a delivery option, location (if pickup), and time slot.
              </p>
            )}
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm || confirming || slotsLoading}
              className="w-full sm:w-auto"
            >
              {confirming ? "Scheduling…" : "Confirm & Schedule"}
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-4">
          <Link href={`/adjudication?rxId=${rxId}`}>
            <Button variant="outline">Back to Adjudication</Button>
          </Link>
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
