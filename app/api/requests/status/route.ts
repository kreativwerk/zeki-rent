import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { REQUEST_STATUSES, formatDate, type RequestKind } from "@/lib/types";
import { emailLayout, sendEmail } from "@/lib/email";

/**
 * Eine Route fuer alle Anfragearten: Status setzen und archivieren.
 * Archivieren blendet die Anfrage nur aus, geloescht wird nichts.
 */
const TABLES: Record<RequestKind, string> = {
  buchung: "bookings",
  kauf: "sale_requests",
  abo: "abo_requests",
  wunsch: "general_requests",
  togg: "prebookings",
  verkauf: "sell_offers",
};

/** Wie die Anfrage in der E-Mail an die Kundschaft heisst. */
const SUBJECT: Record<RequestKind, string> = {
  buchung: "Ihre Fahrzeuganfrage",
  kauf: "Ihre Kaufanfrage",
  abo: "Ihre Abo-Anfrage",
  wunsch: "Ihre Wunschfahrzeug-Anfrage",
  togg: "Ihre Togg-Vormerkung",
  verkauf: "Ihr Verkaufsangebot",
};

const CONTACT = "profiles(name, email)";

/** Fahrzeuganfragen nennen in der Mail Fahrzeug und Starttermin. */
const SELECT: Record<RequestKind, string> = {
  buchung: `id, status, start_date, vehicles(name), ${CONTACT}`,
  kauf: `id, status, ${CONTACT}`,
  abo: `id, status, ${CONTACT}`,
  wunsch: `id, status, ${CONTACT}`,
  togg: `id, status, ${CONTACT}`,
  verkauf: `id, status, brand, model, ${CONTACT}`,
};

interface UpdatedRow {
  id: string;
  status: string;
  start_date?: string | null;
  brand?: string | null;
  model?: string | null;
  vehicles?: { name: string | null } | null;
  profiles?: { name: string | null; email: string | null } | null;
}

function isKind(value: unknown): value is RequestKind {
  return typeof value === "string" && value in TABLES;
}

export async function PATCH(request: Request) {
  let body: {
    kind?: string;
    id?: string;
    status?: string;
    archived?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!isKind(body.kind) || !body.id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const kind = body.kind;
  const status = typeof body.status === "string" ? body.status : null;
  const archived = typeof body.archived === "boolean" ? body.archived : null;
  if (status === null && archived === null) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (status !== null && !REQUEST_STATUSES[kind].includes(status)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const patch: Record<string, unknown> = {};
  if (status !== null) patch.status = status;
  if (archived !== null) {
    patch.archived_at = archived ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from(TABLES[kind])
    .update(patch)
    .eq("id", body.id)
    .select(SELECT[kind])
    .single();

  if (error || !data) {
    console.error("Anfrage konnte nicht aktualisiert werden:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (status === "bestätigt" || status === "abgelehnt") {
    await notifyCustomer(kind, status, data as unknown as UpdatedRow);
  }

  return NextResponse.json({ ok: true });
}

/** Bestaetigung oder Absage an die Kundschaft, sobald der Status wechselt. */
async function notifyCustomer(
  kind: RequestKind,
  status: "bestätigt" | "abgelehnt",
  row: UpdatedRow,
) {
  const to = row.profiles?.email;
  if (!to) return;

  const subject = SUBJECT[kind];
  const hello = `<p style="font-size:14px;">Hallo ${row.profiles?.name ?? ""},</p>`;
  const phone =
    `<p style="font-size:14px;">Fragen? Rufen Sie uns gern an unter ` +
    `<a href="tel:+491639574116" style="color:#146d90;">0163 9574116</a>.</p>`;

  // Worum es geht, soweit die Anfrageart das hergibt
  const vehicle =
    row.vehicles?.name || [row.brand, row.model].filter(Boolean).join(" ");
  const what = vehicle ? `<strong>${vehicle}</strong>` : "Ihre Anfrage";
  const when = row.start_date ? ` ab dem <strong>${formatDate(row.start_date)}</strong>` : "";

  if (status === "bestätigt") {
    await sendEmail({
      to,
      subject: `${subject} bei Zeki Rent ist bestätigt`,
      html: emailLayout(
        `${subject} ist bestätigt!`,
        `${hello}
         <p style="font-size:14px;">gute Nachrichten: ${what}${when} ist bestätigt. Wir melden uns
         mit allen weiteren Schritten und stimmen die Details persönlich mit Ihnen ab.</p>
         ${phone}`,
      ),
    });
    return;
  }

  await sendEmail({
    to,
    subject: `${subject} bei Zeki Rent`,
    html: emailLayout(
      "Diese Anfrage können wir leider nicht bestätigen",
      `${hello}
       <p style="font-size:14px;">leider können wir ${what}${when} dieses Mal nicht bestätigen.
       Das tut uns leid – oft finden wir gemeinsam trotzdem eine Lösung, etwa ein anderes
       Fahrzeug oder einen anderen Zeitraum.</p>
       ${phone}`,
    ),
  });
}
