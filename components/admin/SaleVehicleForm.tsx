"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";
import type { SaleVehicle } from "@/lib/types";

function num(v: string): number | null {
  const n = Number(v.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toForm(v?: SaleVehicle) {
  return {
    condition: (v?.condition ?? "gebraucht") as string,
    brand: v?.brand ?? "",
    model: v?.model ?? "",
    variant: v?.variant ?? "",
    first_registration: v?.first_registration ?? "",
    mileage_km: v?.mileage_km?.toString() ?? "",
    power: v?.power ?? "",
    transmission: v?.transmission ?? "",
    fuel: v?.fuel ?? "",
    hu_until: v?.hu_until ?? "",
    previous_owners: v?.previous_owners?.toString() ?? "",
    accident_free: v?.accident_free ?? true,
    description: v?.description ?? "",
    price: v?.price?.toString() ?? "",
    price_on_request: v?.price_on_request ?? true,
    vat_note: v?.vat_note ?? "",
    photo_url: v?.photo_url ?? "",
    photo_urls: v?.photo_urls ?? [],
    active: v?.active ?? false,
  };
}

export default function SaleVehicleForm({ vehicle }: { vehicle?: SaleVehicle }) {
  const router = useRouter();
  const [f, setF] = useState(() => toForm(vehicle));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((s) => ({ ...s, [k]: v }));
  }

  const used = f.condition === "gebraucht";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (f.active && !f.price_on_request && num(f.price) === null) {
      setError(
        "Zum Freischalten bitte einen Preis eintragen oder „Preis auf Anfrage“ setzen."
      );
      return;
    }
    if (f.active && !f.price_on_request && !f.vat_note) {
      setError(
        "Bitte angeben, wie das Fahrzeug versteuert wird: MwSt. ausweisbar, differenzbesteuert oder Privatverkauf. Das ist bei sichtbaren Preisen Pflicht."
      );
      return;
    }
    setSaving(true);
    const owners = Number(f.previous_owners);
    const payload = {
      condition: f.condition,
      brand: f.brand.trim(),
      model: f.model.trim(),
      variant: f.variant.trim() || null,
      first_registration: used ? f.first_registration.trim() || null : null,
      mileage_km: used ? num(f.mileage_km) : null,
      power: f.power.trim() || null,
      transmission: f.transmission.trim() || null,
      fuel: f.fuel.trim() || null,
      hu_until: used ? f.hu_until.trim() || null : null,
      previous_owners:
        used && Number.isFinite(owners) && f.previous_owners !== ""
          ? Math.round(owners)
          : null,
      accident_free: used ? f.accident_free : null,
      description: f.description.trim() || null,
      price: num(f.price),
      price_on_request: f.price_on_request,
      vat_note: f.vat_note || null,
      photo_url: f.photo_url.trim() || f.photo_urls[0] || null,
      photo_urls: f.photo_urls,
      active: f.active,
    };

    const supabase = createClient();
    const { error: dbError } = vehicle
      ? await supabase.from("sale_vehicles").update(payload).eq("id", vehicle.id)
      : await supabase.from("sale_vehicles").insert(payload);

    if (dbError) {
      console.error(dbError);
      setError("Speichern fehlgeschlagen. Bitte Eingaben prüfen.");
      setSaving(false);
      return;
    }
    router.push("/admin/verkauf");
    router.refresh();
  }

  async function remove() {
    if (!vehicle) return;
    if (!confirm(`„${f.brand} ${f.model}“ wirklich löschen?`)) return;
    setSaving(true);
    const { error: dbError } = await createClient()
      .from("sale_vehicles")
      .delete()
      .eq("id", vehicle.id);
    if (dbError) {
      setError("Löschen fehlgeschlagen: " + dbError.message);
      setSaving(false);
      return;
    }
    router.push("/admin/verkauf");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card">
      <div className="field">
        <label className="field-label">Zustand</label>
        <div className="choice-pills">
          {[
            { v: "gebraucht", l: "Gebrauchtwagen" },
            { v: "neu", l: "Neuwagen" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              className={`pill ${f.condition === o.v ? "pill-active" : ""}`}
              onClick={() => set("condition", o.v)}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="s-brand">
            Marke
          </label>
          <input
            id="s-brand"
            type="text"
            value={f.brand}
            onChange={(e) => set("brand", e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="s-model">
            Modell
          </label>
          <input
            id="s-model"
            type="text"
            value={f.model}
            onChange={(e) => set("model", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="s-variant">
          Ausführung <span className="hint">optional</span>
        </label>
        <input
          id="s-variant"
          type="text"
          value={f.variant}
          onChange={(e) => set("variant", e.target.value)}
          placeholder="z. B. L4H3 Maxi, 2.0 TDI"
        />
      </div>

      {used && (
        <div className="form-row">
          <div className="field">
            <label className="field-label" htmlFor="s-ez">
              Erstzulassung
            </label>
            <input
              id="s-ez"
              type="text"
              value={f.first_registration}
              onChange={(e) => set("first_registration", e.target.value)}
              placeholder="z. B. 03/2023"
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="s-km">
              Kilometerstand
            </label>
            <input
              id="s-km"
              type="text"
              inputMode="numeric"
              value={f.mileage_km}
              onChange={(e) => set("mileage_km", e.target.value)}
              placeholder="48000"
            />
          </div>
        </div>
      )}

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="s-power">
            Leistung
          </label>
          <input
            id="s-power"
            type="text"
            value={f.power}
            onChange={(e) => set("power", e.target.value)}
            placeholder="z. B. 177 PS"
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="s-fuel">
            Kraftstoff
          </label>
          <input
            id="s-fuel"
            type="text"
            value={f.fuel}
            onChange={(e) => set("fuel", e.target.value)}
            placeholder="z. B. Diesel"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="s-trans">
            Getriebe
          </label>
          <input
            id="s-trans"
            type="text"
            value={f.transmission}
            onChange={(e) => set("transmission", e.target.value)}
            placeholder="z. B. Automatik"
          />
        </div>
        {used && (
          <div className="field">
            <label className="field-label" htmlFor="s-hu">
              HU gültig bis
            </label>
            <input
              id="s-hu"
              type="text"
              value={f.hu_until}
              onChange={(e) => set("hu_until", e.target.value)}
              placeholder="z. B. 08/2027"
            />
          </div>
        )}
      </div>

      {used && (
        <>
          <div className="field">
            <label className="field-label" htmlFor="s-owners">
              Anzahl Vorbesitzer
            </label>
            <input
              id="s-owners"
              type="text"
              inputMode="numeric"
              value={f.previous_owners}
              onChange={(e) => set("previous_owners", e.target.value)}
              placeholder="1"
            />
          </div>
          <label className="consent-row">
            <input
              type="checkbox"
              checked={f.accident_free}
              onChange={(e) => set("accident_free", e.target.checked)}
            />
            <span>Unfallfrei</span>
          </label>
        </>
      )}

      <div className="field">
        <label className="field-label" htmlFor="s-desc">
          Beschreibung <span className="hint">erscheint auf der Fahrzeugseite</span>
        </label>
        <textarea
          id="s-desc"
          value={f.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Ausstattung, Zustand, Besonderheiten …"
        />
      </div>

      <label className="consent-row">
        <input
          type="checkbox"
          checked={f.price_on_request}
          onChange={(e) => set("price_on_request", e.target.checked)}
        />
        <span>Preis auf Anfrage – auf der Website wird kein Preis gezeigt</span>
      </label>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="s-price">
            Kaufpreis in €
            {f.price_on_request && <span className="hint">nur intern</span>}
          </label>
          <input
            id="s-price"
            type="text"
            inputMode="decimal"
            value={f.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="24900"
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="s-vat">
            Mehrwertsteuer
          </label>
          <select
            id="s-vat"
            value={f.vat_note}
            onChange={(e) => set("vat_note", e.target.value)}
          >
            <option value="">Bitte wählen …</option>
            <option value="ausweisbar">MwSt. ausweisbar</option>
            <option value="differenzbesteuert">
              Differenzbesteuert (§ 25a UStG)
            </option>
            <option value="privat">Privatverkauf, keine MwSt.</option>
          </select>
        </div>
      </div>
      <p className="fine-print">
        Bei sichtbarem Preis ist die Angabe Pflicht. Der Preis erscheint immer
        als Endpreis. „Privatverkauf“ und „differenzbesteuert“ bedeuten, dass
        keine Mehrwertsteuer ausgewiesen werden kann.
      </p>

      <div className="field">
        <label className="field-label" htmlFor="s-photo">
          Foto <span className="hint">Link einfügen oder Bild hochladen</span>
        </label>
        <input
          id="s-photo"
          type="text"
          value={f.photo_url}
          onChange={(e) => set("photo_url", e.target.value)}
          placeholder="https://…"
        />
        <div className="photo-actions">
          <ImageUpload
            bucket="vehicle-photos"
            folder="verkauf"
            returnPublicUrl
            label="Bild hochladen"
            onUploaded={(urls) => set("photo_url", urls[0] ?? "")}
          />
          {f.photo_url && (
            <button
              type="button"
              className="btn-text-danger"
              onClick={() => set("photo_url", "")}
            >
              Foto entfernen
            </button>
          )}
        </div>
        {f.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.photo_url} alt="Vorschau" className="photo-preview" />
        )}
      </div>

      <div className="field">
        <span className="field-label">
          Weitere Fotos{" "}
          <span className="hint">
            erscheinen auf der Detailseite, Klick macht ein Bild zum Hauptfoto
          </span>
        </span>
        <ImageUpload
          bucket="vehicle-photos"
          folder="verkauf"
          multiple
          returnPublicUrl
          label="Bilder hochladen"
          onUploaded={(urls) =>
            setF((st) => ({
              ...st,
              photo_urls: [...st.photo_urls, ...urls].slice(0, 12),
              photo_url: st.photo_url || urls[0] || "",
            }))
          }
        />
        {f.photo_urls.length > 0 && (
          <div className="thumb-row">
            {f.photo_urls.map((url) => (
              <button
                key={url}
                type="button"
                className={
                  url === f.photo_url ? "thumb-pick thumb-main" : "thumb-pick"
                }
                title={
                  url === f.photo_url
                    ? "Hauptfoto"
                    : "Als Hauptfoto verwenden"
                }
                onClick={() => set("photo_url", url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" />
              </button>
            ))}
          </div>
        )}
        {f.photo_urls.length > 0 && (
          <button
            type="button"
            className="btn-text-danger"
            onClick={() =>
              setF((st) => ({
                ...st,
                photo_urls: st.photo_urls.filter((u) => u !== st.photo_url),
              }))
            }
          >
            Hauptfoto aus der Galerie entfernen
          </button>
        )}
      </div>

      <label className="consent-row">
        <input
          type="checkbox"
          checked={f.active}
          onChange={(e) => set("active", e.target.checked)}
        />
        <span>Auf der Website sichtbar</span>
      </label>

      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Wird gespeichert …" : "Speichern"}
      </button>
      {vehicle && (
        <button
          type="button"
          className="btn-text-danger"
          style={{ marginTop: "1rem", display: "block" }}
          onClick={remove}
          disabled={saving}
        >
          Fahrzeug löschen
        </button>
      )}
    </form>
  );
}
