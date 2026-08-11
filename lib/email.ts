const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL =
  process.env.FROM_EMAIL ?? "Zeki Rent <onboarding@resend.dev>";
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

export function emailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log("E-Mail übersprungen (RESEND_API_KEY fehlt):", opts.subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      console.error("E-Mail-Versand fehlgeschlagen:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("E-Mail-Versand fehlgeschlagen:", err);
    return false;
  }
}

export async function notifyOwner(subject: string, html: string) {
  if (!NOTIFY_EMAIL) return;
  await sendEmail({ to: NOTIFY_EMAIL, subject, html });
}

/* Branded, table-free HTML shell that renders well in all clients */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="de">
<body style="margin:0;padding:0;background:#f2f2f7;font-family:Inter,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1c1c1e;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="font-weight:800;font-size:18px;margin-bottom:16px;">ZEKI <span style="color:#8e8e93;">RENT</span></div>
    <div style="background:#ffffff;border-radius:16px;padding:28px 24px;">
      <h1 style="font-size:20px;margin:0 0 12px;letter-spacing:-0.01em;">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="color:#8e8e93;font-size:12px;margin-top:16px;">
      Zeki Rent GmbH · Telefon 0163 9574116 ·
      <a href="mailto:info@zeki-rent.com" style="color:#8e8e93;">info@zeki-rent.com</a>
    </p>
  </div>
</body>
</html>`;
}

export function bookingSummaryHtml(b: {
  vehicleName: string;
  startDate: string;
  durationMonths: number;
  kmPackage: string;
  monthlyPrice: number | null;
  handover?: string | null;
  note?: string | null;
}): string {
  const date = new Date(b.startDate).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const rows: Array<[string, string]> = [
    ["Fahrzeug", b.vehicleName],
    ["Gewünschter Start", date],
    ["Laufzeit", `${b.durationMonths} ${b.durationMonths === 1 ? "Monat" : "Monate"}`],
    ["Kilometerpaket", b.kmPackage],
  ];
  rows.push([
    "Monatsrate",
    b.monthlyPrice !== null
      ? `${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(b.monthlyPrice)} zzgl. Kilometerpaket`
      : "Auf Anfrage, wir melden uns mit Ihrem Angebot",
  ]);
  if (b.handover) rows.push(["Übergabe", b.handover]);
  if (b.note) rows.push(["Ihre Anmerkung", b.note]);
  return `<div style="background:#f2f2f7;border-radius:12px;padding:4px 16px;margin:16px 0;">
    ${rows
      .map(
        ([k, v]) =>
          `<p style="margin:12px 0;font-size:14px;"><span style="color:#8e8e93;">${k}</span><br><strong>${v}</strong></p>`
      )
      .join("")}
  </div>`;
}
