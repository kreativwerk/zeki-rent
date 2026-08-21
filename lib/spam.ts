/**
 * Leichter Spamschutz fuer die Registrierung.
 *
 * Drei Huerden, die echte Menschen nicht merken:
 *  1. Honeypot – ein Feld, das nur Bots ausfuellen
 *  2. Zeitfalle – ein Formular, das in unter drei Sekunden abgeschickt wird
 *  3. Wegwerf-Adressen – die haeufigsten Trash-Mail-Anbieter
 *
 * Harte Absicherung uebernimmt zusaetzlich das Captcha (siehe Captcha.tsx),
 * sobald in Supabase und Vercel ein Turnstile-Schluessel hinterlegt ist.
 */

/** Mindestens so lange muss das Formular offen gewesen sein. */
export const MIN_FILL_MS = 3000;

const DISPOSABLE_DOMAINS = [
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.de",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "trashmail.com",
  "trashmail.de",
  "wegwerfemail.de",
  "wegwerf-email.de",
  "yopmail.com",
  "sharklasers.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "throwawaymail.com",
  "mohmal.com",
  "spam4.me",
  "byom.de",
  "einrot.com",
  "mytemp.email",
  "emailondeck.com",
  "moakt.com",
];

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.some(
    (d) => domain === d || domain.endsWith(`.${d}`),
  );
}

/**
 * Prueft Honeypot und Ausfuellzeit. Gibt eine Meldung zurueck, wenn etwas
 * nicht stimmt, sonst null.
 */
export function checkHuman(honeypot: string, openedAt: number): string | null {
  if (honeypot.trim() !== "") {
    // Nur Bots fuellen dieses Feld aus
    return "Ihre Eingabe konnte nicht verarbeitet werden. Bitte laden Sie die Seite neu.";
  }
  if (Date.now() - openedAt < MIN_FILL_MS) {
    return "Einen Moment noch, bitte senden Sie das Formular gleich noch einmal ab.";
  }
  return null;
}
