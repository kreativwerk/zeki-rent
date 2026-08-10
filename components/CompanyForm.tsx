"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyData } from "@/lib/company";

/**
 * Company and billing details. Used both as a gate before the first
 * request and as the editable block in the customer account.
 */
export default function CompanyForm({
  initial,
  submitLabel = "Speichern",
  onSaved,
}: {
  initial?: CompanyData | null;
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [customerType, setCustomerType] = useState(
    initial?.customer_type === "privat" ? "privat" : "gewerblich"
  );
  const [company, setCompany] = useState(initial?.company_name ?? "");
  const [street, setStreet] = useState(initial?.billing_street ?? "");
  const [zip, setZip] = useState(initial?.billing_zip ?? "");
  const [city, setCity] = useState(initial?.billing_city ?? "");
  const [vatId, setVatId] = useState(initial?.vat_id ?? "");
  const [deliverySame, setDeliverySame] = useState(
    initial?.delivery_same ?? true
  );
  const [dStreet, setDStreet] = useState(initial?.delivery_street ?? "");
  const [dZip, setDZip] = useState(initial?.delivery_zip ?? "");
  const [dCity, setDCity] = useState(initial?.delivery_city ?? "");
  const [saving, setSaving] = useState(false);
  const [savedHint, setSavedHint] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const business = customerType === "gewerblich";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (business && !company.trim()) {
      setError("Bitte tragen Sie Ihren Firmennamen ein.");
      return;
    }
    if (!deliverySame && (!dStreet.trim() || !dZip.trim() || !dCity.trim())) {
      setError("Bitte geben Sie die abweichende Lieferadresse vollständig an.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_type: customerType,
        company_name: business ? company : "",
        billing_street: street,
        billing_zip: zip,
        billing_city: city,
        vat_id: vatId || null,
        delivery_same: deliverySame,
        delivery_street: deliverySame ? null : dStreet,
        delivery_zip: deliverySame ? null : dZip,
        delivery_city: deliverySame ? null : dCity,
      }),
    }).catch(() => null);
    if (!res?.ok) {
      setError("Speichern hat nicht geklappt. Bitte versuchen Sie es erneut.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setSavedHint(true);
    setTimeout(() => setSavedHint(false), 3000);
    onSaved?.();
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label className="field-label">Kundentyp</label>
        <div className="choice-pills">
          <button
            type="button"
            className={`pill ${business ? "pill-active" : ""}`}
            onClick={() => setCustomerType("gewerblich")}
          >
            Firma / Gewerbe
          </button>
          <button
            type="button"
            className={`pill ${!business ? "pill-active" : ""}`}
            onClick={() => setCustomerType("privat")}
          >
            Privatperson
          </button>
        </div>
      </div>

      {business && (
        <div className="field">
          <label className="field-label" htmlFor="c-name">
            Firmenname <span className="required-star">*</span>
          </label>
          <input
            id="c-name"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
        </div>
      )}

      <div className="field">
        <label className="field-label" htmlFor="c-street">
          Rechnungsadresse <span className="required-star">*</span>
          <span className="hint">Straße und Hausnummer</span>
        </label>
        <input
          id="c-street"
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="c-zip">
            PLZ <span className="required-star">*</span>
          </label>
          <input
            id="c-zip"
            type="text"
            inputMode="numeric"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="c-city">
            Ort <span className="required-star">*</span>
          </label>
          <input
            id="c-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="c-vat">
          USt-IdNr. <span className="hint">optional</span>
        </label>
        <input
          id="c-vat"
          type="text"
          value={vatId}
          onChange={(e) => setVatId(e.target.value)}
          placeholder="DE123456789"
        />
      </div>

      <div className="field">
        <label className="field-label">Lieferadresse</label>
        <div className="choice-pills">
          <button
            type="button"
            className={`pill ${deliverySame ? "pill-active" : ""}`}
            onClick={() => setDeliverySame(true)}
          >
            Wie Rechnungsadresse
          </button>
          <button
            type="button"
            className={`pill ${!deliverySame ? "pill-active" : ""}`}
            onClick={() => setDeliverySame(false)}
          >
            Abweichende Adresse
          </button>
        </div>
      </div>

      {!deliverySame && (
        <>
          <div className="field">
            <label className="field-label" htmlFor="d-street">
              Straße und Hausnummer <span className="required-star">*</span>
            </label>
            <input
              id="d-street"
              type="text"
              value={dStreet}
              onChange={(e) => setDStreet(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label className="field-label" htmlFor="d-zip">
                PLZ <span className="required-star">*</span>
              </label>
              <input
                id="d-zip"
                type="text"
                inputMode="numeric"
                value={dZip}
                onChange={(e) => setDZip(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d-city">
                Ort <span className="required-star">*</span>
              </label>
              <input
                id="d-city"
                type="text"
                value={dCity}
                onChange={(e) => setDCity(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {error && <p className="error-text">{error}</p>}
      {savedHint && <p className="success-text">Gespeichert ✓</p>}
      <button type="submit" className="btn-primary btn-block" disabled={saving}>
        {saving ? "Wird gespeichert …" : submitLabel}
      </button>
    </form>
  );
}
