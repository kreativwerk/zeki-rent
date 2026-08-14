import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  kmLabel,
  kmPackages,
  priceForKm,
  type Vehicle,
} from "@/lib/types";
import {
  bookingSummaryHtml,
  emailLayout,
  notifyOwner,
  sendEmail,
} from "@/lib/email";
import { isCompanyComplete } from "@/lib/company";

const VALID_DURATIONS = [1, 3, 6, 12, 24];

export async function POST(request: Request) {
  let body: {
    vehicle_id?: string;
    start_date?: string;
    duration_months?: number;
    km_per_month?: number;
    km_package?: string;
    handover?: string;
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
    !VALID_DURATIONS.includes(body.duration_months)
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: profileCheck } = await supabase
    .from("profiles")
    .select("customer_type, company_name, billing_street, billing_zip, billing_city, vat_id, delivery_same, delivery_street, delivery_zip, delivery_city")
    .eq("id", user.id)
    .single();
  if (!isCompanyComplete(profileCheck)) {
    return NextResponse.json(
      { ok: false, reason: "company_data_missing" },
      { status: 422 }
    );
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", body.vehicle_id)
    .single();
  if (!vehicle) return NextResponse.json({ ok: false }, { status: 404 });

  // Das Kilometerpaket muss zum Fahrzeug passen, der Preis kommt vom Server
  const packages = kmPackages(vehicle as Vehicle);
  const chosen =
    packages.find((p) => p.km === Number(body.km_per_month)) ?? packages[0];
  const monthlyPrice = priceForKm(
    vehicle as Vehicle,
    body.duration_months,
    chosen.km
  );

  const { error: insertError } = await supabase.from("bookings").insert({
    user_id: user.id,
    vehicle_id: body.vehicle_id,
    start_date: body.start_date,
    duration_months: body.duration_months,
    km_per_month: chosen.km,
    km_package: kmLabel(chosen.km),
    monthly_price: monthlyPrice,
    handover: body.handover === "Lieferung" ? "Lieferung" : "Abholung",
    note: body.note?.trim() || null,
  });
  if (insertError) {
    console.error("Buchung fehlgeschlagen:", insertError);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, email, customer_type, company_name, billing_street, billing_zip, billing_city, delivery_same, delivery_street, delivery_zip, delivery_city")
    .eq("id", user.id)
    .single();

  const summary = bookingSummaryHtml({
    vehicleName: (vehicle as Vehicle).name,
    startDate: body.start_date,
    durationMonths: body.duration_months,
    kmPackage: kmLabel(chosen.km),
    monthlyPrice,
    handover: body.handover,
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

  const deliveryLine =
    body.handover === "Lieferung"
      ? `<p style="font-size:14px;"><span style="color:#8e8e93;">Lieferadresse</span><br><strong>${
          profile?.delivery_same === false && profile?.delivery_street
            ? `${profile.delivery_street}, ${profile.delivery_zip ?? ""} ${profile.delivery_city ?? ""}`
            : `${profile?.billing_street ?? ""}, ${profile?.billing_zip ?? ""} ${profile?.billing_city ?? ""}`
        }</strong></p>`
      : "";

  await notifyOwner(
    `Neue Mietanfrage: ${(vehicle as Vehicle).name}`,
    emailLayout(
      "Neue Mietanfrage",
      `<p style="font-size:14px;"><strong>${profile?.company_name ?? ""}</strong><br>
        ${profile?.name ?? "Unbekannt"}<br>
        ${customerEmail ?? ""}${profile?.phone ? `<br>${profile.phone}` : ""}<br>
        <span style="color:#8e8e93;">${profile?.billing_street ?? ""}, ${profile?.billing_zip ?? ""} ${profile?.billing_city ?? ""}</span></p>
       ${summary}
       ${deliveryLine}
       <p style="font-size:14px;">Bestätigen oder ablehnen im <a href="https://zeki-rent-cpon.vercel.app/admin" style="color:#0f52ba;">Admin-Bereich</a>.</p>`
    )
  );

  return NextResponse.json({ ok: true });
}
