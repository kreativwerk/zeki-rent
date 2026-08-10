"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ASSIGNMENT_STATUSES, type AssignmentStatus } from "@/lib/types";

export default function AssignmentActions({
  id,
  status,
}: {
  id: string;
  status: AssignmentStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<AssignmentStatus>(status);
  const [busy, setBusy] = useState(false);

  async function update(next: AssignmentStatus) {
    setValue(next);
    setBusy(true);
    await createClient().from("assignments").update({ status: next }).eq("id", id);
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Diese Einplanung wirklich löschen?")) return;
    setBusy(true);
    await createClient().from("assignments").delete().eq("id", id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="assignment-actions">
      <select
        className="status-select"
        value={value}
        disabled={busy}
        aria-label="Status der Einplanung"
        onChange={(e) => update(e.target.value as AssignmentStatus)}
      >
        {ASSIGNMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn-icon-danger"
        onClick={remove}
        disabled={busy}
        aria-label="Einplanung löschen"
        title="Einplanung löschen"
      >
        ✕
      </button>
    </div>
  );
}
