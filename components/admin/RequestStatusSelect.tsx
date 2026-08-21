"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REQUEST_STATUSES, STATUS_LABEL, type RequestKind } from "@/lib/types";

/**
 * Status einer Anfrage aendern. Bei "bestätigt" und "abgelehnt" verschickt
 * der Server automatisch eine Info-Mail an die Kundschaft.
 */
export default function RequestStatusSelect({
  kind,
  id,
  status,
}: {
  kind: RequestKind;
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    const previous = value;
    setValue(next);
    setSaving(true);
    const res = await fetch("/api/requests/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, status: next }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
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
      aria-label="Status"
      onChange={(e) => change(e.target.value)}
    >
      {REQUEST_STATUSES[kind].map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s] ?? s}
        </option>
      ))}
    </select>
  );
}
