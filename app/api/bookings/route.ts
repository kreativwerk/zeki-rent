import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { priceFor, type Vehicle } from "@/lib/types";
import {
  bookingSummaryHtml,
  emailLayout,
  notifyOwner,
  sendEmail,
} from "@/lib/email";

const VALID_DURATIONS = [1, 3, 6, 12, 24];

export async function POST(request: Request) {
  let body: {
    vehicle_id?: string;
    start_date?: string;
    duration_months?: number;
    km_package?: string;
    note?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (
    !body.vehicle_id ||
    !body.start_date ||
    !body.duration_months ||
    !VALID_DURATIONS.includes(body.duration_months) ||
    !body.km_package
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", body.vehicle_id)
    .single();
  if (!vehicle) return NextResponse.json({ ok: false }, { status: 404 });

  const { error: insertError } = await supabase.from("bookings").insert({
    user_id: user.id,
    vehicle_id: body.vehicle_id,
    start_date: body.start_date,
    duration_months: body.duration_months,
    km_package: body.km_package,
    note: body.note?.trim() || null,
  });
  if (insertError) {
    console.error("Buchung fehlgeschlagen:", insertError);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, email")
    .eq("id", user.id)
    .single();

  const summary = bookingSummaryHtml({
    vehicleName: (vehicle as Vehicle).name,
    startDate: body.start_date,
    durationMonths: body.duration_months,
    kmPackage: body.km_package,
    monthlyPrice: priceFor(vehicle as Vehicle, body.duration_months),
    note: body.note,
  });

  const customerEmail = profile?.email ?? user.email;
  if (customerEmail) {
    await sendEmail({
      to: customerEmail,
      subject: "Ihre Anfrage bei Zeki Rent ist eingegangen",
      html: emailLayout(
        "Vielen Dank für Ihre Anfrage!",
        `<p style="font-size:14px;">Hallo ${profile?.name ?? ""},</p>
         <p style="font-size:14px;">wir haben Ihre Mietanfrage erhalten und melden uns schnellstmöglich mit der Bestätigung. Hier die Übersicht:</p>
         ${summary}
         <p style="font-size:14px;">Die Anfrage ist unverbindlich. Der Mietvertrag kommt erst nach unserer Bestätigung zustande. Den aktuellen Status sehen Sie jederzeit in Ihrem Kundenkonto.</p>`
      ),
    });
  }

  await notifyOwner(
    `Neue Mietanfrage: ${(vehicle as Vehicle).name}`,
    emailLayout(
      "Neue Mietanfrage",
      `<p style="font-size:14px;"><strong>${profile?.name ?? "Unbekannt"}</strong><br>
        ${customerEmail ?? ""}${profile?.phone ? `<br>${profile.phone}` : ""}</p>
       ${summary}
       <p style="font-size:14px;">Bestätigen oder ablehnen im <a href="https://zeki-rent-cpon.vercel.app/admin" style="color:#193bf4;">Admin-Bereich</a>.</p>`
    )
  );

  return NextResponse.json({ ok: true });
}
