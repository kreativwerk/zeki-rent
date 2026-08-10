import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailLayout, notifyOwner, sendEmail } from "@/lib/email";
import { isCompanyComplete } from "@/lib/company";

interface RequestBody {
  large_vans?: Record<string, number>;
  small_vans?: number;
  km_per_month?: string;
  fuel_type?: string;
  start_from?: string;
  handover?: string;
  note?: string | null;
}

function describeRequest(r: {
  large_vans?: Record<string, number> | null;
  small_vans?: number | null;
  vehicle_wish?: string | null;
}): string {
  const parts: string[] = [];
  for (const [size, count] of Object.entries(r.large_vans ?? {})) {
    if (count > 0) parts.push(`${count}× ${size}`);
  }
  if (r.small_vans) parts.push(`${r.small_vans}× Kleintransporter`);
  if (parts.length === 0 && r.vehicle_wish) return r.vehicle_wish;
  return parts.join(", ") || "Keine Angabe";
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const largeVans = Object.fromEntries(
    Object.entries(body.large_vans ?? {}).filter(
      ([, n]) => typeof n === "number" && n > 0
    )
  );
  const smallVans = Number(body.small_vans) || 0;
  const total =
    smallVans + Object.values(largeVans).reduce((sum, n) => sum + n, 0);
  if (total === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, email, customer_type, company_name, billing_street, billing_zip, billing_city, delivery_same, delivery_street, delivery_zip, delivery_city")
    .eq("id", user.id)
    .single();

  if (!isCompanyComplete(profile)) {
    return NextResponse.json(
      { ok: false, reason: "company_data_missing" },
      { status: 422 }
    );
  }

  const summaryText = describeRequest({
    large_vans: largeVans,
    small_vans: smallVans,
  });

  const { error } = await supabase.from("general_requests").insert({
    user_id: user.id,
    vehicle_wish: summaryText,
    large_vans: largeVans,
    small_vans: smallVans,
    km_per_month: body.km_per_month ?? null,
    fuel_type: body.fuel_type ?? null,
    start_from: body.start_from ?? null,
    handover: body.handover ?? null,
    note: body.note?.trim() || null,
  });
  if (error) {
    console.error("Allgemeine Anfrage fehlgeschlagen:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const rows: Array<[string, string]> = [["Fahrzeuge", summaryText]];
  if (body.km_per_month) rows.push(["Kilometer pro Monat", body.km_per_month]);
  if (body.fuel_type) rows.push(["Antrieb", body.fuel_type]);
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
      subject: "Ihre Anfrage bei Zeki Rent ist eingegangen",
      html: emailLayout(
        "Wir kümmern uns um Ihre Fahrzeuge!",
        `<p style="font-size:14px;">Hallo ${profile?.name ?? ""},</p>
         <p style="font-size:14px;">vielen Dank für Ihre Anfrage. Über unser Partnernetzwerk finden wir passende Fahrzeuge zum Bestpreis und melden uns schnellstmöglich bei Ihnen.</p>
         ${details}`
      ),
    });
  }

  await notifyOwner(
    "Neue Fahrzeuganfrage",
    emailLayout(
      "Neue Fahrzeuganfrage",
      `<p style="font-size:14px;"><strong>${profile?.company_name ?? ""}</strong><br>
        ${profile?.name ?? ""}<br>
        ${customerEmail ?? ""}${profile?.phone ? `<br>${profile.phone}` : ""}<br>
        <span style="color:#8e8e93;">${profile?.billing_street ?? ""}, ${profile?.billing_zip ?? ""} ${profile?.billing_city ?? ""}</span></p>
       ${details}`
    )
  );

  return NextResponse.json({ ok: true });
}
