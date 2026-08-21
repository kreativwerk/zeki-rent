"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RequestKind } from "@/lib/types";

/**
 * Blendet eine erledigte Anfrage aus der Liste aus. Nichts wird geloescht,
 * im Archiv laesst sich alles jederzeit zurueckholen.
 */
export default function ArchiveButton({
  kind,
  id,
  archived,
}: {
  kind: RequestKind;
  id: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/requests/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, archived: !archived }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      alert("Das hat nicht geklappt. Bitte erneut versuchen.");
      return;
    }
    router.refresh();
  }

  return (
    <button type="button" className="btn-small" disabled={busy} onClick={toggle}>
      {busy ? "…" : archived ? "Zurückholen" : "Archivieren"}
    </button>
  );
}
