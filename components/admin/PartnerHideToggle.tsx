"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Blendet ein einzelnes Partnerfahrzeug auf der Website aus oder wieder ein */
export default function PartnerHideToggle({
  id,
  feed,
  hidden,
}: {
  id: string;
  feed: string;
  hidden: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("sale_vehicles")
      .update({ hidden: !hidden })
      .eq("id", id);
    if (!error) await supabase.rpc("apply_partner_feed", { feed });
    setBusy(false);
    if (error) alert("Ändern fehlgeschlagen. Bitte erneut versuchen.");
    router.refresh();
  }

  return (
    <button type="button" className="btn-small" disabled={busy} onClick={toggle}>
      {busy ? "…" : hidden ? "Einblenden" : "Ausblenden"}
    </button>
  );
}
