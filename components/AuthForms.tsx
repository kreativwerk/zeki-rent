"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError("Anmeldung fehlgeschlagen. Bitte prüfen Sie E-Mail und Passwort.");
      setSubmitting(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="auth-form">
      <div className="field">
        <label className="field-label" htmlFor="email">
          E-Mail-Adresse
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="password">
          Passwort
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn-primary btn-block" disabled={submitting}>
        {submitting ? "Wird angemeldet …" : "Anmelden"}
      </button>
      <p className="auth-switch">
        Noch kein Konto bei uns?{" "}
        <Link href={`/registrieren?next=${encodeURIComponent(next)}`}>
          Jetzt registrieren
        </Link>
      </p>
    </form>
  );
}

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

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [customerType, setCustomerType] = useState("gewerblich");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [vatId, setVatId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [billingStreet, setBillingStreet] = useState("");
  const [billingZip, setBillingZip] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [deliverySame, setDeliverySame] = useState(true);
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [deliveryZip, setDeliveryZip] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmHint, setConfirmHint] = useState(false);

  const business = customerType === "gewerblich";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (business && !companyName.trim()) {
      setError("Bitte tragen Sie Ihren Firmennamen ein.");
      return;
    }
    if (!deliverySame && (!deliveryStreet.trim() || !deliveryZip.trim() || !deliveryCity.trim())) {
      setError("Bitte vervollständigen Sie die abweichende Lieferadresse.");
      return;
    }
    if (!consent) {
      setError("Bitte stimmen Sie der Datenverarbeitung zu.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          consent: "true",
          customer_type: customerType,
          company_name: business ? companyName.trim() : "",
          vat_id: business ? vatId.trim() : "",
          billing_street: billingStreet.trim(),
          billing_zip: billingZip.trim(),
          billing_city: billingCity.trim(),
          delivery_same: deliverySame,
          delivery_street: deliverySame ? "" : deliveryStreet.trim(),
          delivery_zip: deliverySame ? "" : deliveryZip.trim(),
          delivery_city: deliverySame ? "" : deliveryCity.trim(),
        },
        // Confirmation link returns to the live site, not localhost
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (authError) {
      setError(
        authError.message.includes("already registered")
          ? "Für diese E-Mail existiert bereits ein Konto."
          : "Registrierung fehlgeschlagen. Passwort: mindestens 8 Zeichen."
      );
      setSubmitting(false);
      return;
    }
    if (data.session) {
      router.push(next);
      router.refresh();
    } else {
      // E-Mail-Bestätigung ist aktiviert
      setConfirmHint(true);
      setSubmitting(false);
    }
  }

  if (confirmHint) {
    return (
      <div className="auth-form">
        <h3>Fast geschafft!</h3>
        <p>
          Wir haben Ihnen eine Bestätigungs-E-Mail geschickt. Bitte klicken Sie
          auf den Link darin und melden Sie sich anschließend an.
        </p>
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-primary btn-link btn-block">
          Zur Anmeldung
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="auth-form">
      <div className="field">
        <span className="field-label">Ich melde mich an als</span>
        <PillChoice
          value={customerType}
          onChange={setCustomerType}
          options={[
            { value: "gewerblich", label: "Firma / Gewerbe" },
            { value: "privat", label: "Privatperson" },
          ]}
        />
      </div>

      {business && (
        <>
          <div className="field">
            <label className="field-label" htmlFor="company">
              Firmenname
            </label>
            <input
              id="company"
              type="text"
              autoComplete="organization"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="vat">
              USt-IdNr. <span className="hint">optional</span>
            </label>
            <input
              id="vat"
              type="text"
              value={vatId}
              onChange={(e) => setVatId(e.target.value)}
              placeholder="DE123456789"
            />
          </div>
        </>
      )}

      <div className="field">
        <label className="field-label" htmlFor="name">
          {business ? "Ansprechpartner" : "Vor- und Nachname"}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="email">
          E-Mail-Adresse
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="phone">
          Telefonnummer
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="password">
          Passwort <span className="hint">mindestens 8 Zeichen</span>
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <h3 className="auth-section">Rechnungsanschrift</h3>
      <div className="field">
        <label className="field-label" htmlFor="b-street">
          Straße und Hausnummer
        </label>
        <input
          id="b-street"
          type="text"
          autoComplete="street-address"
          value={billingStreet}
          onChange={(e) => setBillingStreet(e.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="b-zip">
            PLZ
          </label>
          <input
            id="b-zip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            value={billingZip}
            onChange={(e) => setBillingZip(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="b-city">
            Ort
          </label>
          <input
            id="b-city"
            type="text"
            autoComplete="address-level2"
            value={billingCity}
            onChange={(e) => setBillingCity(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="field">
        <span className="field-label">Lieferadresse</span>
        <PillChoice
          value={deliverySame ? "same" : "other"}
          onChange={(v) => setDeliverySame(v === "same")}
          options={[
            { value: "same", label: "Wie Rechnungsadresse" },
            { value: "other", label: "Abweichende Adresse" },
          ]}
        />
      </div>

      {!deliverySame && (
        <>
          <div className="field">
            <label className="field-label" htmlFor="d-street">
              Straße und Hausnummer
            </label>
            <input
              id="d-street"
              type="text"
              value={deliveryStreet}
              onChange={(e) => setDeliveryStreet(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label className="field-label" htmlFor="d-zip">
                PLZ
              </label>
              <input
                id="d-zip"
                type="text"
                inputMode="numeric"
                value={deliveryZip}
                onChange={(e) => setDeliveryZip(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d-city">
                Ort
              </label>
              <input
                id="d-city"
                type="text"
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
                required
              />
            </div>
          </div>
        </>
      )}

      <label className="consent-row">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        <span>
          Ich willige ein, dass meine Angaben zur Abwicklung meiner
          Mietanfragen gespeichert und verarbeitet werden. Details in der{" "}
          <Link href="/datenschutz" target="_blank">
            Datenschutzerklärung
          </Link>
          . Die Einwilligung kann ich jederzeit widerrufen.
        </span>
      </label>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn-primary btn-block" disabled={submitting}>
        {submitting ? "Konto wird erstellt …" : "Konto erstellen"}
      </button>
      <p className="auth-switch">
        Bereits registriert?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`}>Anmelden</Link>
      </p>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Abmelden
    </button>
  );
}
