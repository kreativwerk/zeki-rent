// Taeglicher Abgleich der Partnerfahrzeuge von Autohaus Kaufmann.
// Aufruf per pg_cron (siehe Migration) oder ueber "Jetzt abgleichen" im Admin.
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  listUrl,
  PAGE_SIZE,
  parseDetails,
  parseList,
  parseTotal,
  type ListedVehicle,
} from "./parse.ts";

const FEED = "kaufmann";
const COOLDOWN_MS = 5 * 60 * 1000;
const DETAILS_PER_RUN = 100;
const TIME_BUDGET_MS = 110 * 1000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ZekiRent-Partnerabgleich/1.0 (+https://zeki-rent.com)" },
  });
  if (!res.ok) throw new Error(`${res.status} bei ${url}`);
  return await res.text();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const started = Date.now();
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: feed } = await db.from("partner_feeds").select("*").eq("id", FEED).single();
  if (!feed) return json({ ok: false, error: "Feed fehlt" }, 500);

  // Schutz gegen Mehrfachaufrufe, damit die Partnerseite nicht ueberlastet wird
  if (feed.last_run_at && started - Date.parse(feed.last_run_at) < COOLDOWN_MS) {
    return json({ ok: false, error: "Abgleich lief gerade erst, bitte kurz warten." }, 429);
  }

  const runStart = new Date(started).toISOString();
  await db.from("partner_feeds")
    .update({ last_run_at: runStart, last_status: "läuft", last_error: null })
    .eq("id", FEED);

  try {
    // 1. Fahrzeugliste komplett einlesen
    const first = await fetchHtml(listUrl(1));
    const total = parseTotal(first);
    if (!total) throw new Error("Fahrzeugliste nicht lesbar (Seitenaufbau geändert?)");

    const all = new Map<string, ListedVehicle>();
    for (const v of parseList(first)) all.set(v.external_id, v);
    const pages = Math.ceil(total / PAGE_SIZE);
    for (let p = 2; p <= pages; p++) {
      for (const v of parseList(await fetchHtml(listUrl(p)))) all.set(v.external_id, v);
    }

    // Sicherheitsnetz: lieber nichts aendern als versehentlich alles ausblenden
    if (all.size < total * 0.8) {
      throw new Error(`Nur ${all.size} von ${total} Fahrzeugen gelesen, Abgleich abgebrochen.`);
    }

    // 2. Speichern. Herkunft und Einkaufspreis getrennt in partner_vehicles;
    //    Beschreibung, Ausblenden, Preis und Status bleiben unberuehrt.
    const { data: known } = await db.from("partner_vehicles")
      .select("sale_vehicle_id, external_id")
      .eq("feed", FEED);
    const idOf = new Map((known ?? []).map((k) => [k.external_id, k.sale_vehicle_id]));

    const listed = [...all.values()];
    const ids = listed.map((v) => idOf.get(v.external_id) ?? crypto.randomUUID());
    const vehicles = listed.map((v, i) => ({
      id: ids[i],
      is_partner: true,
      condition: v.condition,
      brand: v.brand,
      model: v.model,
      variant: v.variant,
      vat_note: v.vat_note,
      source_status: v.source_status,
      mileage_km: v.mileage_km,
      first_registration: v.first_registration,
      power: v.power,
      fuel: v.fuel,
      body_type: v.body_type,
      transmission: v.transmission,
      photo_url: v.photo_url,
      photo_urls: v.photo_urls,
      listed: true,
      synced_at: runStart,
      sort_order: 1000,
    }));
    const sources = listed.map((v, i) => ({
      sale_vehicle_id: ids[i],
      feed: FEED,
      external_id: v.external_id,
      source_url: v.source_url,
      source_price: v.source_price,
      source_location: v.source_location,
    }));
    for (let i = 0; i < listed.length; i += 200) {
      const { error } = await db.from("sale_vehicles")
        .upsert(vehicles.slice(i, i + 200), { onConflict: "id" });
      if (error) throw new Error(`Speichern fehlgeschlagen: ${error.message}`);
      const { error: srcError } = await db.from("partner_vehicles")
        .upsert(sources.slice(i, i + 200), { onConflict: "sale_vehicle_id" });
      if (srcError) throw new Error(`Speichern fehlgeschlagen: ${srcError.message}`);
    }

    // 3. Nicht mehr gelistete Fahrzeuge (verkauft) ausblenden
    const gone = [...idOf.entries()]
      .filter(([ext]) => !all.has(ext))
      .map(([, id]) => id);
    for (let i = 0; i < gone.length; i += 200) {
      await db.from("sale_vehicles").update({ listed: false }).in("id", gone.slice(i, i + 200));
    }

    // 4. Details fuer neue Fahrzeuge nachladen, verteilt auf mehrere Laeufe
    const { data: pending } = await db.from("sale_vehicles")
      .select("id")
      .eq("is_partner", true)
      .eq("listed", true)
      .is("details_fetched_at", null)
      .limit(DETAILS_PER_RUN);
    const urlOf = new Map(sources.map((s) => [s.sale_vehicle_id, s.source_url]));
    const queue = (pending ?? [])
      .filter((p) => urlOf.has(p.id))
      .map((p) => ({ id: p.id, source_url: urlOf.get(p.id)! }));
    let detailed = 0;
    const worker = async () => {
      while (queue.length && Date.now() - started < TIME_BUDGET_MS) {
        const item = queue.shift()!;
        try {
          const d = parseDetails(await fetchHtml(item.source_url));
          await db.from("sale_vehicles")
            .update({ ...d, details_fetched_at: new Date().toISOString() })
            .eq("id", item.id);
          detailed++;
        } catch (e) {
          console.error("Details", item.source_url, e);
        }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);

    // 5. Preis mit Aufschlag und Sichtbarkeit berechnen
    const { error: applyError } = await db.rpc("apply_partner_feed", { feed: FEED });
    if (applyError) throw new Error(`Preisberechnung fehlgeschlagen: ${applyError.message}`);

    await db.from("partner_feeds")
      .update({ last_status: "ok", last_count: all.size })
      .eq("id", FEED);
    return json({ ok: true, count: all.size, detailed, ms: Date.now() - started });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(message);
    await db.from("partner_feeds")
      .update({ last_status: "fehler", last_error: message })
      .eq("id", FEED);
    return json({ ok: false, error: message }, 500);
  }
});
