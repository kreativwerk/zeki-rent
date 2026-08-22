import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailLayout, notifyOwner, sendEmail } from "@/lib/email";
import {
  aboOfferSummary,
  formatEuro,
  formatKm,
  type AboInterest,
} from "@/lib/types";

const VEHICLE_TYPES = ["pkw", "transporter"];
const LOCATION_TYPES = ["besichtigung", "abholung"];
const ABO_INTEREST = ["nein", "ja", "verhandelbar"];

function toInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const brand = String(body.brand ?? "").trim();
  const model = String(body.model ?? "").trim();
  const location = String(body.location ?? "").trim();
  if (!brand || !model || !location) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const vehicleType = VEHICLE_TYPES.includes(String(body.vehicle_type))
    ? String(body.vehicle_type)
    : "pkw";
  const locationType = LOCATION_TYPES.includes(String(body.location_type))
    ? String(body.location_type)
    : "besichtigung";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, phone, company_name")
    .eq("id", user.id)
    .maybeSingle();

  // Nur Fotos aus dem eigenen Ordner im Verkaufs-Bucket zulassen
  const photos = Array.isArray(body.photo_urls)
    ? body.photo_urls
        .filter((u): u is string => typeof u === "string")
        .filter((u) => u.includes(`/sell-photos/${user.id}/`))
        .slice(0, 8)
    : [];

  const buildYear = toInt(body.build_year);
  const mileage = toInt(body.mileage_km);
  const priceWish = toInt(body.price_expectation);
  const condition = body.condition ? String(body.condition).slice(0, 120) : null;
  const power = body.power ? String(body.power).slice(0, 60) : null;
  const fuel = body.fuel ? String(body.fuel).slice(0, 40) : null;
  const transmission = body.transmission
    ? String(body.transmission).slice(0, 40)
    : null;
  const huUntil = body.hu_until ? String(body.hu_until).slice(0, 20) : null;
  const note = body.note ? String(body.note).slice(0, 2000) : null;

  // Abo-Angebot: nur uebernehmen, wenn die Person es anbietet
  const aboInterest = ABO_INTEREST.includes(String(body.abo_interest))
    ? String(body.abo_interest)
    : "nein";
  const wantsAbo = aboInterest !== "nein";
  const aboTerms = wantsAbo && Array.isArray(body.abo_terms)
    ? body.abo_terms
        .map((t) => toInt(t))
        .filter((t): t is number => t !== null && [3, 6, 12].includes(t))
    : [];
  const aboPrice = wantsAbo ? toInt(body.abo_price_net) : null;
  const aboKm = wantsAbo && body.abo_km ? String(body.abo_km).slice(0, 60) : null;
  const aboDeductible =
    wantsAbo && body.abo_deductible
      ? String(body.abo_deductible).slice(0, 60)
      : null;

  const { error } = await supabase.from("sell_offers").insert({
    user_id: user.id,
    vehicle_type: vehicleType,
    brand: brand.slice(0, 80),
    model: model.slice(0, 120),
    build_year: buildYear,
    mileage_km: mileage,
    condition,
    power,
    fuel,
    transmission,
    hu_until: huUntil,
    location: location.slice(0, 160),
    location_type: locationType,
    price_expectation: priceWish,
    note,
    abo_interest: aboInterest,
    abo_terms: aboTerms,
    abo_price_net: aboPrice,
    abo_km: aboKm,
    abo_deductible: aboDeductible,
    photo_urls: photos,
  });

  if (error) {
    console.error("Verkaufsangebot fehlgeschlagen:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const name = `${brand} ${model}`;
  const rows: Array<[string, string]> = [
    ["Fahrzeug", `${name} (${vehicleType === "transporter" ? "Transporter" : "Pkw"})`],
  ];
  if (buildYear) rows.push(["Baujahr", String(buildYear)]);
  if (mileage !== null) rows.push(["Kilometerstand", formatKm(mileage) ?? "–"]);
  if (condition) rows.push(["Zustand", condition]);
  if (power) rows.push(["Leistung", power]);
  if (fuel) rows.push(["Kraftstoff", fuel]);
  if (transmission) rows.push(["Getriebe", transmission]);
  if (huUntil) rows.push(["TÜV bis", huUntil]);
  rows.push([
    locationType === "abholung" ? "Abholort" : "Besichtigungsort",
    location,
  ]);
  if (priceWish !== null) rows.push(["Preisvorstellung", formatEuro(priceWish)]);
  rows.push([
    "Auch im Abo vermieten",
    aboOfferSummary({
      abo_interest: aboInterest as AboInterest,
      abo_terms: aboTerms,
      abo_price_net: aboPrice,
      abo_km: aboKm,
      abo_deductible: aboDeductible,
    }),
  ]);
  if (note) rows.push(["Anmerkungen", note]);
  rows.push(["Fotos", photos.length ? `${photos.length} hochgeladen` : "keine"]);

  const details = `<div style="background:#f2f2f7;border-radius:12px;padding:4px 16px;margin:16px 0;">
    ${rows
      .map(
        ([k, v]) =>
          `<p style="margin:12px 0;font-size:14px;"><span style="color:#8e8e93;">${k}</span><br><strong>${v}</strong></p>`,
      )
      .join("")}
  </div>`;

  const sellerEmail = profile?.email ?? user.email;
  if (sellerEmail) {
    await sendEmail({
      to: sellerEmail,
      subject: `Ihr Verkaufsangebot zum ${name} ist eingegangen`,
      html: emailLayout(
        "Danke für Ihr Angebot!",
        `<p style="font-size:14px;">Hallo ${profile?.name ?? ""},</p>
         <p style="font-size:14px;">wir haben Ihre Fahrzeugdaten erhalten und sehen sie uns an.
         Anschließend melden wir uns mit einer Einschätzung und stimmen bei Interesse einen
         Besichtigungstermin ab.</p>
         ${details}
         <p style="font-size:14px;">Das Angebot ist unverbindlich. Ihre Kontaktdaten geben wir nicht weiter.</p>`,
      ),
    });
  }

  await notifyOwner(
    `Neues Verkaufsangebot: ${name}`,
    emailLayout(
      "Neues Verkaufsangebot",
      `<p style="font-size:14px;"><strong>${profile?.company_name ?? ""}</strong><br>
        ${profile?.name ?? ""}<br>
        ${sellerEmail ?? ""}${profile?.phone ? `<br>${profile.phone}` : ""}</p>
       ${details}
       ${photos.map((u) => `<p style="margin:8px 0;"><a href="${u}" style="color:#146d90;font-size:13px;">${u}</a></p>`).join("")}`,
    ),
  );

  return NextResponse.json({ ok: true });
}
