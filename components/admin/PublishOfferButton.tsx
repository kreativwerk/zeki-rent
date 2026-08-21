"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Uebernimmt ein Kundenangebot in den Verkaufsbestand und springt direkt
 * ins Formular, wo Preis und Freischaltung gesetzt werden.
 */
export default function PublishOfferButton({
  id,
  saleVehicleId,
}: {
  id: string;
  saleVehicleId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (saleVehicleId) {
    return (
      <Link href={`/admin/verkauf/${saleVehicleId}`} className="btn-small">
        Im Angebot
      </Link>
    );
  }

  async function publish() {
    setBusy(true);
    const res = await fetch("/api/verkaufen/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!res?.ok || !data?.id) {
      setBusy(false);
      alert("Übernahme fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }
    router.push(`/admin/verkauf/${data.id}`);
    router.refresh();
  }

  return (
    <button type="button" className="btn-small" disabled={busy} onClick={publish}>
      {busy ? "…" : "Ins Angebot"}
    </button>
  );
}
