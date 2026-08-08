import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "@/lib/types";
import { emailLayout, sendEmail } from "@/lib/email";

export async function PATCH(request: Request) {
  let body: { id?: string; status?: BookingStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.id || !body.status || !BOOKING_STATUSES.includes(body.status)) {
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

  const { data: booking, error } = await supabase
    .from("bookings")
    .update({ status: body.status })
    .eq("id", body.id)
    .select("*, vehicles(name), profiles(name, email)")
    .single();
  if (error || !booking) {
    console.error("Statusänderung fehlgeschlagen:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const b = booking as Booking;
  const to = b.profiles?.email;
  const date = new Date(b.start_date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  if (to && body.status === "bestätigt") {
    await sendEmail({
      to,
      subject: "Ihre Buchung bei Zeki Rent ist bestätigt",
      html: emailLayout(
        "Ihre Buchung ist bestätigt!",
        `<p style="font-size:14px;">Hallo ${b.profiles?.name ?? ""},</p>
         <p style="font-size:14px;">gute Nachrichten: Ihre Anfrage für <strong>${b.vehicles?.name ?? "Ihr Fahrzeug"}</strong> ab dem <strong>${date}</strong> ist bestätigt.</p>
         <p style="font-size:14px;">Wir melden uns telefonisch, um Übergabe und Vertragsunterzeichnung abzustimmen. Bei Fragen erreichen Sie uns unter 0163 9574116.</p>`
      ),
    });
  }

  if (to && body.status === "abgelehnt") {
    await sendEmail({
      to,
      subject: "Ihre Anfrage bei Zeki Rent",
      html: emailLayout(
        "Ihre Anfrage können wir leider nicht bestätigen",
        `<p style="font-size:14px;">Hallo ${b.profiles?.name ?? ""},</p>
         <p style="font-size:14px;">leider ist <strong>${b.vehicles?.name ?? "das gewünschte Fahrzeug"}</strong> zum gewünschten Zeitraum ab ${date} nicht verfügbar.</p>
         <p style="font-size:14px;">Rufen Sie uns gern an unter 0163 9574116, gemeinsam finden wir einen Alternativtermin oder ein anderes Fahrzeug.</p>`
      ),
    });
  }

  return NextResponse.json({ ok: true });
}
