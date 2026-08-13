import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailLayout, notifyOwner, sendEmail } from "@/lib/email";
import { isCompanyComplete } from "@/lib/company";

export async function POST(request: Request) {
  let body: {
    sale_vehicle_id?: string;
    financing?: boolean;
    trade_in?: boolean;
    note?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body.sale_vehicle_id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

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
    .from("sale_vehicles")
    .select("brand, model, variant, condition, active")
    .eq("id", body.sale_vehicle_id)
    .maybeSingle();

  if (!vehicle?.active) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const financing = body.financing === true;
  const tradeIn = body.trade_in === true;

  const { error } = await supabase.from("sale_requests").insert({
    user_id: user.id,
    sale_vehicle_id: body.sale_vehicle_id,
    financing,
    trade_in: tradeIn,
    note: body.note?.trim() || null,
  });

  if (error) {
    console.error("Kaufanfrage fehlgeschlagen:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const name = [vehicle.brand, vehicle.model, vehicle.variant]
    .filter(Boolean)
    .join(" ");

  const rows: Array<[string, string]> = [
    ["Fahrzeug", name],
    ["Zustand", vehicle.condition === "neu" ? "Neuwagen" : "Gebrauchtwagen"],
    ["Finanzierung gewünscht", financing ? "Ja" : "Nein"],
    ["Inzahlungnahme gewünscht", tradeIn ? "Ja" : "Nein"],
  ];
  if (body.note?.trim()) rows.push(["Nachricht", body.note.trim()]);

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
      subject: `Ihre Kaufanfrage zum ${name} ist eingegangen`,
      html: emailLayout(
        "Vielen Dank für Ihr Interesse!",
        `<p style="font-size:14px;">Hallo ${profile?.name ?? ""},</p>
         <p style="font-size:14px;">wir haben Ihre Anfrage erhalten und melden uns mit allen Details. Auf Wunsch stimmen wir direkt einen Termin für die Probefahrt ab.</p>
         ${details}
         <p style="font-size:14px;">Die Anfrage ist unverbindlich. Der Kaufvertrag kommt erst nach beiderseitiger Unterschrift zustande.</p>`
      ),
    });
  }

  await notifyOwner(
    "Neue Kaufanfrage",
    emailLayout(
      "Neue Kaufanfrage",
      `<p style="font-size:14px;"><strong>${profile?.company_name ?? ""}</strong><br>
        ${profile?.name ?? ""}<br>
        ${customerEmail ?? ""}${profile?.phone ? `<br>${profile.phone}` : ""}</p>
       ${details}`
    )
  );

  return NextResponse.json({ ok: true });
}
