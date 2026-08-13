import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailLayout, notifyOwner, sendEmail } from "@/lib/email";
import { isCompanyComplete } from "@/lib/company";

const TERMS = [6, 12, 18, 24];

export async function POST(request: Request) {
  let body: {
    catalog_vehicle_id?: string;
    service?: string;
    term_months?: number;
    km_per_year?: string;
    start_from?: string;
    handover?: string;
    note?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body.catalog_vehicle_id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const service = body.service === "miete" ? "miete" : "abo";
  const term = TERMS.includes(Number(body.term_months))
    ? Number(body.term_months)
    : 12;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "name, phone, email, customer_type, company_name, billing_street, billing_zip, billing_city, delivery_same, delivery_street, delivery_zip, delivery_city"
    )
    .eq("id", user.id)
    .single();

  if (!isCompanyComplete(profile)) {
    return NextResponse.json(
      { ok: false, reason: "company_data_missing" },
      { status: 422 }
    );
  }

  const { data: vehicle } = await supabase
    .from("catalog_vehicles")
    .select("brand, model, active")
    .eq("id", body.catalog_vehicle_id)
    .maybeSingle();

  if (!vehicle?.active) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { error } = await supabase.from("abo_requests").insert({
    user_id: user.id,
    catalog_vehicle_id: body.catalog_vehicle_id,
    service,
    term_months: term,
    km_per_year: body.km_per_year ?? null,
    start_from: body.start_from ?? null,
    handover: body.handover ?? null,
    note: body.note?.trim() || null,
  });

  if (error) {
    console.error("Abo-Anfrage fehlgeschlagen:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const vehicleName = `${vehicle.brand} ${vehicle.model}`;
  const rows: Array<[string, string]> = [
    ["Fahrzeug", vehicleName],
    ["Service", service === "miete" ? "Miete" : "Auto-Abo"],
    ["Laufzeit", `${term} Monate`],
  ];
  if (body.km_per_year) rows.push(["Kilometer pro Jahr", body.km_per_year]);
  if (body.start_from) rows.push(["Ab wann", body.start_from]);
  if (body.handover) rows.push(["Übergabe", body.handover]);
  if (body.handover === "Lieferung") {
    rows.push([
      "Lieferadresse",
      profile.delivery_same === false && profile.delivery_street
        ? `${profile.delivery_street}, ${profile.delivery_zip ?? ""} ${profile.delivery_city ?? ""}`
        : `${profile.billing_street}, ${profile.billing_zip} ${profile.billing_city}`,
    ]);
  }
  if (body.note?.trim()) rows.push(["Anmerkung", body.note.trim()]);

  const details = `<div style="background:#f2f2f7;border-radius:12px;padding:4px 16px;margin:16px 0;">
    ${rows
      .map(
        ([k, v]) =>
          `<p style="margin:12px 0;font-size:14px;"><span style="color:#8e8e93;">${k}</span><br><strong>${v}</strong></p>`
      )
      .join("")}
  </div>`;

  const customerEmail = profile?.email ?? user.email;
  if (customerEmail) {
    await sendEmail({
      to: customerEmail,
      subject: `Ihre Anfrage zum ${vehicleName} ist eingegangen`,
      html: emailLayout(
        "Vielen Dank für Ihre Anfrage!",
        `<p style="font-size:14px;">Hallo ${profile?.name ?? ""},</p>
         <p style="font-size:14px;">wir haben Ihre Anfrage erhalten und melden uns schnellstmöglich mit Ihrem Angebot. Hier die Übersicht:</p>
         ${details}
         <p style="font-size:14px;">Die Anfrage ist unverbindlich. Der Vertrag kommt erst nach unserer Bestätigung zustande.</p>`
      ),
    });
  }

  await notifyOwner(
    service === "miete" ? "Neue Mietanfrage aus der Modellpalette" : "Neue Abo-Anfrage",
    emailLayout(
      service === "miete" ? "Neue Mietanfrage" : "Neue Abo-Anfrage",
      `<p style="font-size:14px;"><strong>${profile?.company_name ?? ""}</strong><br>
        ${profile?.name ?? ""}<br>
        ${customerEmail ?? ""}${profile?.phone ? `<br>${profile.phone}` : ""}<br>
        <span style="color:#8e8e93;">${profile?.billing_street ?? ""}, ${profile?.billing_zip ?? ""} ${profile?.billing_city ?? ""}</span></p>
       ${details}`
    )
  );

  return NextResponse.json({ ok: true });
}
