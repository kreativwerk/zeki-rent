export interface Vehicle {
  id: string;
  name: string;
  category: string;
  transmission: string;
  load_volume: string | null;
  photo_url: string | null;
  license_b: boolean;
  price_1m: number | null;
  price_3m: number | null;
  price_6m: number | null;
  price_12m: number | null;
  price_24m: number | null;
  /** Keine Preise auf der Website zeigen, Konditionen kommen auf Anfrage */
  price_on_request: boolean;
  /** Waehlbare Kilometerpakete, die Monatsrate gilt fuer das kleinste */
  km_packages: KmPackage[] | null;
  active: boolean;
  notes: string | null;
  created_at: string;
}

export interface KmPackage {
  km: number;
  /** Monatlicher Aufpreis in Euro gegenueber der hinterlegten Rate */
  surcharge: number;
}

const DEFAULT_KM_PACKAGES: KmPackage[] = [{ km: 1000, surcharge: 0 }];

/** Immer eine aufsteigend sortierte, gueltige Liste zurueckgeben */
export function kmPackages(vehicle: Vehicle): KmPackage[] {
  const raw = Array.isArray(vehicle.km_packages) ? vehicle.km_packages : [];
  const clean = raw
    .filter((p) => Number.isFinite(p?.km) && p.km > 0)
    .map((p) => ({ km: Math.round(p.km), surcharge: Number(p.surcharge) || 0 }))
    .sort((a, b) => a.km - b.km);
  return clean.length > 0 ? clean : DEFAULT_KM_PACKAGES;
}

export function kmLabel(km: number): string {
  return `${new Intl.NumberFormat("de-DE").format(km)} km/Monat`;
}

/** Monatsrate inklusive Kilometerpaket, null wenn Preis auf Anfrage */
export function priceForKm(
  vehicle: Vehicle,
  months: number,
  km: number
): number | null {
  const base = priceFor(vehicle, months);
  if (base === null) return null;
  const pack = kmPackages(vehicle).find((p) => p.km === km);
  return base + (pack?.surcharge ?? 0);
}

export interface Booking {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  start_date: string;
  duration_months: number;
  km_package: string;
  km_per_month?: number | null;
  /** Beim Absenden berechnete Monatsrate inkl. Kilometerpaket */
  monthly_price?: number | null;
  handover?: string | null;
  note: string | null;
  status: BookingStatus;
  archived_at: string | null;
  created_at: string;
  vehicles?: Pick<Vehicle, "name"> | null;
  profiles?: Pick<Profile, "name" | "email" | "phone"> | null;
}

export type ServiceType = "abo" | "miete" | "beides";

export interface ModelCatalog {
  id: string;
  brand: string;
  title: string;
  service_type: ServiceType;
  pdf_path: string | null;
  note: string | null;
  created_at: string;
}

export interface CatalogVehicle {
  id: string;
  catalog_id: string | null;
  brand: string;
  model: string;
  segment: string | null;
  drivetrain: string | null;
  power: string | null;
  length: string | null;
  range_text: string | null;
  seats: number | null;
  highlights: string | null;
  /** Listenpreis des Herstellers, nur intern zur Kalkulation */
  list_price: number | null;
  service_type: ServiceType;
  price_6m: number | null;
  price_12m: number | null;
  price_18m: number | null;
  price_24m: number | null;
  price_on_request: boolean;
  photo_url: string | null;
  notes: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export const ABO_TERMS = [6, 12, 18, 24] as const;

export function aboPriceFor(v: CatalogVehicle, months: number): number | null {
  if (v.price_on_request) return null;
  switch (months) {
    case 6:
      return v.price_6m;
    case 12:
      return v.price_12m;
    case 18:
      return v.price_18m;
    case 24:
      return v.price_24m;
    default:
      return null;
  }
}

export function cheapestAboPrice(v: CatalogVehicle): number | null {
  if (v.price_on_request) return null;
  const prices = [v.price_6m, v.price_12m, v.price_18m, v.price_24m].filter(
    (p): p is number => p !== null
  );
  return prices.length ? Math.min(...prices) : null;
}

export function vehicleTitle(v: CatalogVehicle): string {
  return `${v.brand} ${v.model}`;
}

export type SaleCondition = "gebraucht" | "neu";

export interface SaleVehicle {
  id: string;
  condition: SaleCondition;
  brand: string;
  model: string;
  variant: string | null;
  first_registration: string | null;
  mileage_km: number | null;
  power: string | null;
  transmission: string | null;
  fuel: string | null;
  hu_until: string | null;
  previous_owners: number | null;
  accident_free: boolean | null;
  description: string | null;
  price: number | null;
  price_on_request: boolean;
  /** null, 'ausweisbar' oder 'differenzbesteuert' */
  vat_note: string | null;
  photo_url: string | null;
  photo_urls: string[];
  active: boolean;
  sort_order: number;
  created_at: string;
}

export function saleTitle(v: SaleVehicle): string {
  return [v.brand, v.model, v.variant].filter(Boolean).join(" ");
}

export function formatKm(km: number | null): string | null {
  if (km === null) return null;
  return `${new Intl.NumberFormat("de-DE").format(km)} km`;
}

export const VAT_LABEL: Record<string, string> = {
  ausweisbar: "MwSt. ausweisbar",
  differenzbesteuert: "Differenzbesteuert nach § 25a UStG, MwSt. nicht ausweisbar",
};

export type CustomerType = "privat" | "gewerblich";

export interface Assignment {
  id: string;
  vehicle_id: string;
  user_id: string | null;
  booking_id: string | null;
  request_id: string | null;
  start_date: string;
  end_date: string;
  note: string | null;
  status: AssignmentStatus;
  created_at: string;
  vehicles?: Pick<Vehicle, "name"> | null;
  profiles?: Pick<Profile, "name" | "company_name" | "email" | "phone"> | null;
}

export type AssignmentStatus = "geplant" | "aktiv" | "beendet" | "storniert";

export const ASSIGNMENT_STATUSES: AssignmentStatus[] = [
  "geplant",
  "aktiv",
  "beendet",
  "storniert",
];

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  consent_at: string | null;
  created_at: string;
  customer_type: CustomerType;
  company_name: string | null;
  billing_street: string | null;
  billing_zip: string | null;
  billing_city: string | null;
  vat_id: string | null;
  delivery_same: boolean | null;
  delivery_street: string | null;
  delivery_zip: string | null;
  delivery_city: string | null;
}

export type BookingStatus = "neu" | "bestätigt" | "abgelehnt" | "beendet";

export const BOOKING_STATUSES: BookingStatus[] = [
  "neu",
  "bestätigt",
  "abgelehnt",
  "beendet",
];

export const DURATIONS = [1, 3, 6, 12, 24] as const;

export function priceFor(vehicle: Vehicle, months: number): number | null {
  if (vehicle.price_on_request) return null;
  switch (months) {
    case 1:
      return vehicle.price_1m;
    case 3:
      return vehicle.price_3m;
    case 6:
      return vehicle.price_6m;
    case 12:
      return vehicle.price_12m;
    case 24:
      return vehicle.price_24m;
    default:
      return null;
  }
}

export function cheapestPrice(vehicle: Vehicle): number | null {
  if (vehicle.price_on_request) return null;
  const prices = [
    vehicle.price_1m,
    vehicle.price_3m,
    vehicle.price_6m,
    vehicle.price_12m,
    vehicle.price_24m,
  ].filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* ---------- Anfragen: Arten, Status und Archiv ---------- */

/** Kuerzel, unter dem die API die jeweilige Anfragetabelle anspricht. */
export type RequestKind = "buchung" | "kauf" | "abo" | "wunsch" | "togg" | "verkauf";

export const REQUEST_STATUSES: Record<RequestKind, string[]> = {
  buchung: ["neu", "bestätigt", "abgelehnt", "beendet"],
  kauf: ["neu", "in_bearbeitung", "bestätigt", "abgelehnt", "erledigt"],
  abo: ["neu", "in_bearbeitung", "bestätigt", "abgelehnt", "erledigt"],
  wunsch: ["neu", "in_bearbeitung", "bestätigt", "abgelehnt", "erledigt"],
  togg: ["neu", "kontaktiert", "bestätigt", "abgelehnt", "erledigt"],
  verkauf: ["neu", "in_bearbeitung", "bestätigt", "abgelehnt", "erledigt"],
};

export const STATUS_LABEL: Record<string, string> = {
  neu: "neu",
  in_bearbeitung: "in Bearbeitung",
  kontaktiert: "kontaktiert",
  bestätigt: "bestätigt",
  abgelehnt: "abgesagt",
  beendet: "beendet",
  erledigt: "erledigt",
};

/* ---------- Fahrzeuge, die Kunden selbst verkaufen wollen ---------- */

export type SellVehicleType = "pkw" | "transporter";
export type SellLocationType = "besichtigung" | "abholung";

export const SELL_CONDITIONS = [
  "sehr gut",
  "gut",
  "gebraucht mit Gebrauchsspuren",
  "reparaturbedürftig",
] as const;

export interface SellOffer {
  id: string;
  user_id: string;
  vehicle_type: SellVehicleType;
  brand: string;
  model: string;
  build_year: number | null;
  mileage_km: number | null;
  condition: string | null;
  power: string | null;
  fuel: string | null;
  transmission: string | null;
  hu_until: string | null;
  location: string | null;
  location_type: SellLocationType;
  price_expectation: number | null;
  note: string | null;
  photo_urls: string[];
  abo_interest: AboInterest;
  abo_terms: number[];
  abo_price_net: number | null;
  abo_km: string | null;
  abo_deductible: string | null;
  status: string;
  archived_at: string | null;
  created_at: string;
  profiles?: Pick<
    Profile,
    "name" | "email" | "phone" | "company_name"
  > | null;
}

/** Wuerde die anbietende Person das Fahrzeug auch im Abo vermieten? */
export type AboInterest = "nein" | "ja" | "verhandelbar";

/** Laufzeiten, die beim Abo-Angebot zur Wahl stehen. */
export const SELL_ABO_TERMS = [3, 6, 12] as const;

/** Kurzfassung des Abo-Angebots fuer Tabellen und E-Mails. */
export function aboOfferSummary(o: {
  abo_interest: AboInterest;
  abo_terms: number[];
  abo_price_net: number | null;
  abo_km: string | null;
  abo_deductible: string | null;
}): string {
  if (o.abo_interest === "nein") return "nein";
  const parts: string[] = [
    o.abo_interest === "verhandelbar" ? "verhandelbar" : "ja",
  ];
  if (o.abo_terms.length > 0) parts.push(`${o.abo_terms.join(", ")} Monate`);
  if (o.abo_price_net !== null) {
    parts.push(`${formatEuro(o.abo_price_net)} netto/Monat`);
  }
  if (o.abo_km) parts.push(o.abo_km);
  if (o.abo_deductible) parts.push(`SB ${o.abo_deductible}`);
  return parts.join(" · ");
}

export function sellTitle(o: SellOffer): string {
  return [o.brand, o.model].filter(Boolean).join(" ");
}

/** Enddatum eines Mietzeitraums: Start plus Laufzeit in Monaten. */
export function endDate(startIso: string, months: number): string {
  const d = new Date(startIso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** "01.09.2026 – 01.03.2027" */
export function formatPeriod(startIso: string, months: number): string {
  return `${formatDate(startIso)} – ${formatDate(endDate(startIso, months))}`;
}
