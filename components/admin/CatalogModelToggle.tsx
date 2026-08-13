"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CatalogModelToggle({
  id,
  active,
  ready,
}: {
  id: string;
  active: boolean;
  /** false, wenn noch kein Preis und kein "Preis auf Anfrage" gesetzt ist */
  ready: boolean;
}) {
  const router = useRouter();
  const [on, setOn] = useState(active);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !on;
    if (next && !ready) {
      alert(
        "Bitte zuerst Raten eintragen oder „Preis auf Anfrage“ setzen, bevor das Modell live geht."
      );
      return;
    }
    setBusy(true);
    setOn(next);
    await createClient()
      .from("catalog_vehicles")
      .update({ active: next })
      .eq("id", id);
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      className={`live-toggle ${on ? "live-on" : ""}`}
      onClick={toggle}
      disabled={busy}
      aria-pressed={on}
    >
      {on ? "live" : "Entwurf"}
    </button>
  );
}
