"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Vehicle } from "@/lib/types";

const CATEGORIES = [
  "Transporter / Kastenwagen",
  "Transporter mit Hochdach",
  "Pritschenwagen / Kipper",
  "Kühlfahrzeug",
  "PKW / Kleinwagen",
  "Anhänger",
];

type FormState = {
  name: string;
  category: string;
  transmission: string;
  load_volume: string;
  photo_url: string;
  license_b: boolean;
  price_1m: string;
  price_3m: string;
  price_6m: string;
  price_12m: string;
  price_24m: string;
  price_on_request: boolean;
  active: boolean;
  notes: string;
};

function toForm(v?: Vehicle): FormState {
  return {
    name: v?.name ?? "",
    category: v?.category ?? CATEGORIES[0],
    transmission: v?.transmission ?? "Schaltgetriebe",
    load_volume: v?.load_volume ?? "",
    photo_url: v?.photo_url ?? "",
    license_b: v?.license_b ?? true,
    price_1m: v?.price_1m?.toString() ?? "",
    price_3m: v?.price_3m?.toString() ?? "",
    price_6m: v?.price_6m?.toString() ?? "",
    price_12m: v?.price_12m?.toString() ?? "",
    price_24m: v?.price_24m?.toString() ?? "",
    price_on_request: v?.price_on_request ?? false,
    active: v?.active ?? true,
    notes: v?.notes ?? "",
  };
}

function num(value: string): number | null {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export default function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toForm(vehicle));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      transmission: form.transmission,
      load_volume: form.load_volume.trim() || null,
      photo_url: form.photo_url.trim() || null,
      license_b: form.license_b,
      price_1m: num(form.price_1m),
      price_3m: num(form.price_3m),
      price_6m: num(form.price_6m),
      price_12m: num(form.price_12m),
      price_24m: num(form.price_24m),
      price_on_request: form.price_on_request,
      active: form.active,
      notes: form.notes.trim() || null,
    };
    const supabase = createClient();
    const { error: dbError } = vehicle
      ? await supabase.from("vehicles").update(payload).eq("id", vehicle.id)
      : await supabase.from("vehicles").insert(payload);
    if (dbError) {
      setError("Speichern fehlgeschlagen. Bitte Eingaben prüfen.");
      setSaving(false);
      return;
    }
    router.push("/admin/fahrzeuge");
    router.refresh();
  }

  async function remove() {
    if (!vehicle) return;
    if (
      !confirm(
        `„${vehicle.name}“ wirklich löschen? Einplanungen für dieses Fahrzeug werden entfernt. Bisherige Kundenanfragen bleiben erhalten, verlieren aber die Fahrzeugzuordnung. Alternativ können Sie es nur verstecken (Haken bei „Auf der Website sichtbar“ entfernen).`
      )
    )
      return;
    setSaving(true);
    const { error: dbError } = await createClient()
      .from("vehicles")
      .delete()
      .eq("id", vehicle.id);
    if (dbError) {
      console.error(dbError);
      setError("Löschen fehlgeschlagen: " + dbError.message);
      setSaving(false);
      return;
    }
    router.push("/admin/fahrzeuge");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card">
      <div className="field">
        <label className="field-label" htmlFor="v-name">
          Fahrzeugname
        </label>
        <input
          id="v-name"
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="z. B. Mercedes Sprinter, lang + Hochdach"
          required
        />
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="v-cat">
            Kategorie
          </label>
          <select
            id="v-cat"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="v-trans">
            Getriebe
          </label>
          <select
            id="v-trans"
            value={form.transmission}
            onChange={(e) => set("transmission", e.target.value)}
          >
            <option>Schaltgetriebe</option>
            <option>Automatik</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="v-vol">
          Ladevolumen / Maße <span className="hint">optional</span>
        </label>
        <input
          id="v-vol"
          type="text"
          value={form.load_volume}
          onChange={(e) => set("load_volume", e.target.value)}
          placeholder="z. B. ca. 14 m³ · Ladefläche 4,30 m"
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="v-photo">
          Foto-URL <span className="hint">optional, z. B. Link zu einem Bild</span>
        </label>
        <input
          id="v-photo"
          type="text"
          value={form.photo_url}
          onChange={(e) => set("photo_url", e.target.value)}
          placeholder="https://…"
        />
      </div>

      <label className="consent-row">
        <input
          type="checkbox"
          checked={form.price_on_request}
          onChange={(e) => set("price_on_request", e.target.checked)}
        />
        <span>
          Preis auf Anfrage – auf der Website werden keine Raten gezeigt, die
          Konditionen werden individuell besprochen
        </span>
      </label>

      <div className="field">
        <label className="field-label">
          Monatsraten in € (leer = Laufzeit nicht buchbar)
          {form.price_on_request && (
            <span className="hint">
              nur intern, wird auf der Website nicht angezeigt
            </span>
          )}
        </label>
        <div className="price-inputs">
          {(
            [
              ["price_1m", "1 Monat"],
              ["price_3m", "3 Monate"],
              ["price_6m", "6 Monate"],
              ["price_12m", "12 Monate"],
              ["price_24m", "24 Monate"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="price-input">
              <span>{label}</span>
              <input
                type="text"
                inputMode="decimal"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder="–"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="v-notes">
          Beschreibung <span className="hint">optional, erscheint auf der Fahrzeugseite</span>
        </label>
        <textarea
          id="v-notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      <label className="consent-row">
        <input
          type="checkbox"
          checked={form.license_b}
          onChange={(e) => set("license_b", e.target.checked)}
        />
        <span>Führerschein Klasse B ausreichend</span>
      </label>

      <label className="consent-row">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => set("active", e.target.checked)}
        />
        <span>Auf der Website sichtbar</span>
      </label>

      {error && <p className="error-text">{error}</p>}

      <div className="nav">
        {vehicle ? (
          <button
            type="button"
            className="btn-danger"
            onClick={remove}
            disabled={saving}
          >
            Löschen
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Wird gespeichert …" : "Speichern"}
        </button>
      </div>
    </form>
  );
}
