"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Schritt 1: Link zum Zuruecksetzen anfordern. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/passwort-neu` },
    );
    setSubmitting(false);
    if (authError) {
      setError("Das hat nicht geklappt. Bitte versuchen Sie es später erneut.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="booking-success">
        <h3>E-Mail ist unterwegs ✓</h3>
        <p>
          Falls ein Konto zu dieser Adresse existiert, haben wir Ihnen einen
          Link zum Zurücksetzen geschickt. Bitte öffnen Sie ihn im selben
          Browser. Der Link gilt eine Stunde.
        </p>
        <Link href="/login" className="btn-secondary btn-link btn-block">
          Zurück zur Anmeldung
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="auth-form">
      <div className="field">
        <label className="field-label" htmlFor="reset-email">
          E-Mail-Adresse
        </label>
        <input
          id="reset-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn-primary btn-block" disabled={submitting}>
        {submitting ? "Wird gesendet …" : "Link anfordern"}
      </button>
      <p className="auth-switch">
        Passwort doch parat? <Link href="/login">Zur Anmeldung</Link>
      </p>
    </form>
  );
}

/** Schritt 2: Nach dem Klick auf den Link ein neues Passwort setzen. */
export function NewPasswordForm() {
  const router = useRouter();
  const [state, setState] = useState<"pruefen" | "bereit" | "ungueltig">(
    "pruefen",
  );
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function check() {
      // Der Browser-Client loest den Link oft schon selbst ein
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setState("bereit");
        return;
      }
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) {
        setState("ungueltig");
        return;
      }
      await supabase.auth.exchangeCodeForSession(code);
      const { data: after } = await supabase.auth.getSession();
      if (cancelled) return;
      setState(after.session ? "bereit" : "ungueltig");
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== repeat) {
      setError("Die beiden Passwörter stimmen nicht überein.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (authError) {
      setError("Das Passwort konnte nicht gesetzt werden. Mindestens 8 Zeichen.");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (state === "pruefen") {
    return <p className="step-intro">Einen Moment, wir prüfen den Link …</p>;
  }

  if (state === "ungueltig") {
    return (
      <div className="booking-login-hint">
        <p>
          Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordern
          Sie einen neuen an und öffnen Sie ihn im selben Browser.
        </p>
        <Link
          href="/passwort-vergessen"
          className="btn-primary btn-link btn-block"
        >
          Neuen Link anfordern
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="booking-success">
        <h3>Passwort geändert ✓</h3>
        <p>Sie sind jetzt angemeldet und können direkt weitermachen.</p>
        <Link href="/konto" className="btn-primary btn-link btn-block">
          Zu meinem Konto
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="auth-form">
      <div className="field">
        <label className="field-label" htmlFor="new-password">
          Neues Passwort <span className="hint">mindestens 8 Zeichen</span>
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="repeat-password">
          Passwort wiederholen
        </label>
        <input
          id="repeat-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          required
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn-primary btn-block" disabled={submitting}>
        {submitting ? "Wird gespeichert …" : "Passwort speichern"}
      </button>
    </form>
  );
}
