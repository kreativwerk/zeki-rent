// Liest die Fahrzeugliste und Detailseiten von renault-kaufmann.de (Carzilla).
// Bewusst ohne Abhaengigkeiten, damit es in Deno und Node gleich laeuft.

export const BASE = "https://www.renault-kaufmann.de";
export const PAGE_SIZE = 100;

export interface ListedVehicle {
  external_id: string;
  source_url: string;
  brand: string;
  model: string;
  variant: string | null;
  source_price: number | null;
  vat_note: "ausweisbar" | "differenzbesteuert" | null;
  source_status: string | null;
  condition: "neu" | "gebraucht";
  mileage_km: number | null;
  first_registration: string | null;
  power: string | null;
  fuel: string | null;
  body_type: string | null;
  transmission: string | null;
  source_location: string | null;
  photo_url: string | null;
  photo_urls: string[];
}

export interface VehicleDetails {
  description: string | null;
  previous_owners: number | null;
  hu_until: string | null;
}

const MONTHS: Record<string, string> = {
  januar: "01", februar: "02", "märz": "03", maerz: "03", april: "04",
  mai: "05", juni: "06", juli: "07", august: "08", september: "09",
  oktober: "10", november: "11", dezember: "12",
};

function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&uuml;/g, "ü").replace(/&ouml;/g, "ö").replace(/&auml;/g, "ä")
    .replace(/&Uuml;/g, "Ü").replace(/&Ouml;/g, "Ö").replace(/&Auml;/g, "Ä")
    .replace(/&szlig;/g, "ß")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function text(s: string | undefined | null): string | null {
  if (!s) return null;
  const t = decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  return t || null;
}

function field(block: string, title: string): string | null {
  const m = block.match(new RegExp(`title="${title}"[^>]*>([\\s\\S]*?)</span>`));
  return text(m?.[1]);
}

export function listUrl(page: number): string {
  return `${BASE}/Fahrzeuge/Fahrzeugliste?rp=${PAGE_SIZE}&sf=createdAt-&cp=${page}`;
}

export function parseTotal(html: string): number | null {
  const m = html.match(/Fahrzeug\s+\d+\s*-\s*\d+\s+von\s+(\d+)/);
  return m ? Number(m[1]) : null;
}

export function parseList(html: string): ListedVehicle[] {
  const parts = html.split('itemtype="https://schema.org/Vehicle').slice(1);
  const out: ListedVehicle[] = [];
  for (const block of parts) {
    const href = block.match(/class="cc-link-vehicle-detail" href="([^"]+)"/)?.[1];
    if (!href) continue;
    const path = decode(href).split("?")[0];
    const id = path.match(/\/([0-9a-f]{32})\/\d+$/)?.[1];
    if (!id) continue;

    const brand = text(block.match(/itemprop="brand">([\s\S]*?)<\/span>/)?.[1]) ?? "";
    const desc = text(block.match(/itemprop="description">([\s\S]*?)<\/span>/)?.[1]) ?? "";
    const [model, ...rest] = desc.split(" ");

    const priceRaw = block.match(/itemprop="price" content="([\d.]+)"/)?.[1];
    const vatRaw = text(block.match(/itemprop="price"[\s\S]*?<small>([\s\S]*?)<\/small>/)?.[1]);
    const vat_note = vatRaw === "MwSt. ausweisbar"
      ? "ausweisbar"
      : vatRaw?.includes("nicht ausweisbar")
        ? "differenzbesteuert"
        : null;

    const status = field(block, "Status");
    const km = field(block, "Kilometerstand");
    const ezRaw = field(block, "Erstzulassung");
    let first_registration: string | null = null;
    const ez = ezRaw?.match(/EZ\s+(\S+)\s+(\d{4})/);
    if (ez) {
      const mm = MONTHS[ez[1].toLowerCase()];
      first_registration = mm ? `${mm}/${ez[2]}` : ez[2];
    }

    const img = decode(block.match(/itemprop="image"[^>]*src="([^"]+)"/)?.[1] ?? "");
    const vid = img.match(/vid=(\d+)/)?.[1];
    const bid = img.match(/bid=(\d+)/)?.[1];
    const count = Number(block.match(/fa-photo"><\/i>\s*(\d+)\s*Bild/)?.[1] ?? 0);
    const photos: string[] = [];
    if (vid && bid) {
      for (let i = 1; i <= Math.max(count, 1); i++) {
        photos.push(
          `https://img.cargate360.de/default.aspx?vid=${vid}&bid=${bid}&format=l&ino=${i}&app=Kiste-Default`,
        );
      }
    }

    const location = block.match(/itemtype="http:\/\/schema.org\/LocalBusiness">\s*<meta itemprop="name" content="([^"]+)"/)?.[1];

    out.push({
      external_id: id,
      source_url: BASE + path,
      brand,
      model: model ?? "",
      variant: rest.join(" ") || null,
      source_price: priceRaw ? Number(priceRaw) : null,
      vat_note,
      source_status: status,
      condition: status === "Neufahrzeug" ? "neu" : "gebraucht",
      mileage_km: km ? Number(km.replace(/\D/g, "")) || 0 : null,
      first_registration,
      power: field(block, "Leistung"),
      fuel: field(block, "Kraftstoff"),
      body_type: field(block, "Karosserie"),
      transmission: field(block, "Getriebe"),
      source_location: location ? decode(location) : null,
      photo_url: photos[0] ?? null,
      photo_urls: photos.slice(1),
    });
  }
  return out;
}

// Nichts vom Partner nach aussen tragen: Saetze mit Name, Telefon oder Link raus
function clean(description: string): string | null {
  const kept = description
    .split(/(?<=[.!?])\s+/)
    .filter((s) => !/kaufmann|www\.|https?:|@|\btel\b|telefon|(?:\+49|\b0)\d{2,5}[ /-]?\d{4,}/i.test(s));
  const t = kept.join(" ").trim();
  return t || null;
}

export function parseDetails(html: string): VehicleDetails {
  const descBlock = html.match(
    /Fahrzeugbeschreibung<\/h3>[\s\S]*?<div class="panel-body">([\s\S]*?)<\/div>/,
  )?.[1];
  const raw = descBlock ? text(descBlock.replace(/<!--[\s\S]*?-->/g, "")) : null;

  const owners = html.match(/Anzahl Vorbesitzer<\/th>\s*<td>\s*(\d+)/)?.[1];
  const hu = html.match(/(?:HU|Hauptuntersuchung)[^<]*<\/th>\s*<td>\s*([^<]+)/)?.[1];

  return {
    description: raw ? clean(raw) : null,
    previous_owners: owners ? Number(owners) : null,
    hu_until: hu ? text(hu) : null,
  };
}
