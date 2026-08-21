import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Uebernimmt ein Kundenangebot als Entwurf in den Verkaufsbestand.
 * Preis und Freischaltung setzt der Admin danach im Verkaufsformular.
 */
export async function POST(request: Request) {
  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { data: offer, error: offerError } = await supabase
    .from("sell_offers")
    .select("*")
    .eq("id", body.id)
    .maybeSingle();

  if (offerError || !offer) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  // Schon uebernommen? Dann direkt zum vorhandenen Eintrag
  if (offer.sale_vehicle_id) {
    return NextResponse.json({
      ok: true,
      id: offer.sale_vehicle_id,
      existing: true,
    });
  }

  const photos: string[] = Array.isArray(offer.photo_urls)
    ? offer.photo_urls
    : [];

  // Ort und Anmerkung des Anbieters als Startpunkt fuer die Beschreibung
  const descriptionParts = [
    offer.note,
    offer.location
      ? `${offer.location_type === "abholung" ? "Abholort" : "Besichtigung"}: ${offer.location}`
      : null,
  ].filter(Boolean);

  const { data: created, error } = await supabase
    .from("sale_vehicles")
    .insert({
      condition: "gebraucht",
      brand: offer.brand,
      model: offer.model,
      first_registration: offer.build_year ? String(offer.build_year) : null,
      mileage_km: offer.mileage_km,
      power: offer.power,
      transmission: offer.transmission,
      fuel: offer.fuel,
      hu_until: offer.hu_until,
      description: descriptionParts.join("\n\n") || null,
      price: null,
      price_on_request: true,
      photo_url: photos[0] ?? null,
      photo_urls: photos,
      active: false,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("Übernahme ins Angebot fehlgeschlagen:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const { error: linkError } = await supabase
    .from("sell_offers")
    .update({ sale_vehicle_id: created.id, status: "in_bearbeitung" })
    .eq("id", offer.id);

  if (linkError) {
    console.error("Verknüpfung fehlgeschlagen:", linkError);
  }

  return NextResponse.json({ ok: true, id: created.id });
}
