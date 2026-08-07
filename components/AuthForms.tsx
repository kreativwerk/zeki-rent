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
        Noch kein Konto?{" "}
        <Link href={`/registrieren?next=${encodeURIComponent(next)}`}>
          Jetzt registrieren
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmHint, setConfirmHint] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
        data: { name, phone, consent: "true" },
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
        <label className="field-label" htmlFor="name">
          Vor- und Nachname
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
