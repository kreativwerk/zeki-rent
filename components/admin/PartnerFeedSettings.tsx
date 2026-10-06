"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatEuro, type PartnerFeed } from "@/lib/types";

export default function PartnerFeedSettings({ feed }: { feed: PartnerFeed }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(feed.enabled);
  const [markup, setMarkup] = useState(String(feed.markup_net));
  const [onlyCommercial, setOnlyCommercial] = useState(feed.only_commercial);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const markupNet = Number(markup.replace(",", "."));
  const markupGross = Number.isFinite(markupNet)
    ? Math.round(markupNet * (1 + Number(feed.vat_rate)))
    : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(markupNet) || markupNet < 0) {
      setMessage("Bitte einen gültigen Aufschlag eingeben.");
      return;
    }
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    // Preise und Sichtbarkeit zieht ein Trigger in der Datenbank sofort nach
    const { error } = await supabase
      .from("partner_feeds")
      .update({
        enabled,
        markup_net: markupNet,
        only_commercial: onlyCommercial,
      })
      .eq("id", feed.id);
    setSaving(false);
    setMessage(error ? "Speichern fehlgeschlagen." : "Gespeichert.");
    router.refresh();
  }

  async function syncNow() {
    setSyncing(true);
    setMessage("Abgleich läuft, das dauert bis zu zwei Minuten …");
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke("kaufmann-sync", {
      body: {},
    });
    setSyncing(false);
    if (error) {
      let text = "Abgleich fehlgeschlagen.";
      try {
        const body = await (error as { context?: Response }).context?.json();
        if (body?.error) text = body.error;
      } catch {
        // Antwort ohne JSON
      }
      setMessage(text);
    } else {
      setMessage(`Abgleich fertig: ${data?.count ?? "?"} Fahrzeuge.`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card">
      <h2>Einstellungen</h2>

      <label className="consent-row">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <span>
          <strong>Auf der Website zeigen</strong> – Partnerfahrzeuge erscheinen
          unter „Kaufen“
        </span>
      </label>

      <label className="consent-row">
        <input
          type="checkbox"
          checked={onlyCommercial}
          onChange={(e) => setOnlyCommercial(e.target.checked)}
        />
        <span>Nur Nutzfahrzeuge (Kasten, Van/Kleinbus, Pritsche …)</span>
      </label>

      <div className="field">
        <label className="field-label" htmlFor="p-markup">
          Aufschlag netto je Fahrzeug{" "}
          <span className="hint">
            {markupGross !== null &&
              `= ${formatEuro(markupGross)} mehr im angezeigten Preis`}
          </span>
        </label>
        <input
          id="p-markup"
          type="text"
          inputMode="decimal"
          value={markup}
          onChange={(e) => setMarkup(e.target.value)}
        />
      </div>

      {message && <p className="muted">{message}</p>}

      <div className="abo-contact">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Speichern …" : "Speichern"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={syncing}
          onClick={syncNow}
        >
          {syncing ? "Abgleich läuft …" : "Jetzt abgleichen"}
        </button>
      </div>
    </form>
  );
}
