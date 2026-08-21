"use client";

import { useState } from "react";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";
import { SELL_CONDITIONS } from "@/lib/types";

const FUELS = ["Diesel", "Benzin", "Elektro", "Hybrid", "LPG/CNG"];
const GEARBOXES = ["Schaltgetriebe", "Automatik"];

function PillChoice({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="choice-pills">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? "pill pill-active" : "pill"}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function SellOfferForm({ userId }: { userId: string }) {
  const [vehicleType, setVehicleType] = useState("pkw");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [buildYear, setBuildYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [condition, setCondition] = useState<string>(SELL_CONDITIONS[1]);
  const [power, setPower] = useState("");
  const [fuel, setFuel] = useState("");
  const [gearbox, setGearbox] = useState("");
  const [huUntil, setHuUntil] = useState("");
  const [locationType, setLocationType] = useState("besichtigung");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="booking-success">
        <h3>Angebot eingegangen ✓</h3>
        <p>
          Vielen Dank! Wir sehen uns Ihr Fahrzeug an und melden uns mit einer
          Einschätzung. Ihr Angebot finden Sie unter{" "}
          <Link href="/konto">Mein Konto</Link>.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/verkaufen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle_type: vehicleType,
        brand: brand.trim(),
        model: model.trim(),
        build_year: buildYear ? Number(buildYear) : null,
        mileage_km: mileage ? Number(mileage.replace(/\D/g, "")) : null,
        condition,
        power: power.trim() || null,
        fuel: fuel || null,
        transmission: gearbox || null,
        hu_until: huUntil.trim() || null,
        location_type: locationType,
        location: location.trim(),
        price_expectation: price ? Number(price.replace(/\D/g, "")) : null,
        note: note.trim() || null,
        photo_urls: photos,
      }),
    }).catch(() => null);

    if (!res?.ok) {
      setError(
        res?.status === 401
          ? "Bitte melden Sie sich erneut an."
          : "Das hat leider nicht geklappt. Bitte versuchen Sie es erneut.",
      );
      setSubmitting(false);
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <span className="field-label">Um was für ein Fahrzeug geht es?</span>
        <PillChoice
          value={vehicleType}
          onChange={setVehicleType}
          options={[
            { value: "pkw", label: "Pkw" },
            { value: "transporter", label: "Transporter" },
          ]}
        />
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="s-brand">
            Marke
          </label>
          <input
            id="s-brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="z. B. Mercedes-Benz"
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
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="z. B. Sprinter 316 CDI"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="s-year">
            Baujahr
          </label>
          <input
            id="s-year"
            type="number"
            inputMode="numeric"
            min={1950}
            max={2030}
            value={buildYear}
            onChange={(e) => setBuildYear(e.target.value)}
            placeholder="2019"
            required
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
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            placeholder="145000"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="s-power">
            Leistung
          </label>
          <input
            id="s-power"
            type="text"
            value={power}
            onChange={(e) => setPower(e.target.value)}
            placeholder="163 PS"
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="s-hu">
            TÜV bis
          </label>
          <input
            id="s-hu"
            type="text"
            value={huUntil}
            onChange={(e) => setHuUntil(e.target.value)}
            placeholder="03/2027"
            required
          />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="s-condition">
          Zustand
        </label>
        <select
          id="s-condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          {SELL_CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="s-fuel">
            Kraftstoff <span className="hint">optional</span>
          </label>
          <select
            id="s-fuel"
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
          >
            <option value="">Bitte wählen</option>
            {FUELS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="s-gear">
            Getriebe <span className="hint">optional</span>
          </label>
          <select
            id="s-gear"
            value={gearbox}
            onChange={(e) => setGearbox(e.target.value)}
          >
            <option value="">Bitte wählen</option>
            {GEARBOXES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Wo steht das Fahrzeug?</span>
        <PillChoice
          value={locationType}
          onChange={setLocationType}
          options={[
            { value: "besichtigung", label: "Besichtigungsort" },
            { value: "abholung", label: "Abholort" },
          ]}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="s-location">
          Ort
        </label>
        <input
          id="s-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="PLZ und Ort, z. B. 45879 Gelsenkirchen"
          required
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="s-price">
          Ihre Preisvorstellung in Euro <span className="hint">optional</span>
        </label>
        <input
          id="s-price"
          type="text"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="18500"
        />
      </div>

      <div className="field">
        <span className="field-label">
          Fotos <span className="hint">bis zu 8 Bilder, je max. 8 MB</span>
        </span>
        <ImageUpload
          bucket="sell-photos"
          folder={userId}
          multiple
          returnPublicUrl
          label="Fotos auswählen"
          onUploaded={(urls) =>
            setPhotos((prev) => [...prev, ...urls].slice(0, 8))
          }
        />
        {photos.length > 0 && (
          <div className="thumb-row">
            {photos.map((url) => (
              <button
                key={url}
                type="button"
                className="thumb-remove"
                title="Foto entfernen"
                onClick={() => setPhotos((p) => p.filter((u) => u !== url))}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" />
                <span aria-hidden>×</span>
                <span className="sr-only">Foto entfernen</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="s-note">
          Anmerkungen <span className="hint">optional</span>
        </label>
        <textarea
          id="s-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z. B. Scheckheft, Unfallfreiheit, Ausstattung, bekannte Mängel"
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button
        type="submit"
        className="btn-primary btn-block"
        disabled={submitting}
      >
        {submitting ? "Wird gesendet …" : "Fahrzeug anbieten"}
      </button>
      <p className="fine-print">
        Das Angebot ist unverbindlich. Ihre Kontaktdaten sehen ausschließlich
        wir, sie werden nicht veröffentlicht und nicht weitergegeben.
      </p>
    </form>
  );
}
