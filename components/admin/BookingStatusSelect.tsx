"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/types";

export default function BookingStatusSelect({
  id,
  status,
}: {
  id: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<BookingStatus>(status);
  const [saving, setSaving] = useState(false);

  async function change(next: BookingStatus) {
    const previous = value;
    setValue(next);
    setSaving(true);
    const { error } = await createClient()
      .from("bookings")
      .update({ status: next })
      .eq("id", id);
    setSaving(false);
    if (error) {
      setValue(previous);
      alert("Statusänderung fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }
    router.refresh();
  }

  return (
    <select
      className={`status-select status-${value}`}
      value={value}
      disabled={saving}
      onChange={(e) => change(e.target.value as BookingStatus)}
    >
      {BOOKING_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
