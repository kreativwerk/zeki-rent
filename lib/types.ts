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
  active: boolean;
  notes: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  start_date: string;
  duration_months: number;
  km_package: string;
  handover?: string | null;
  note: string | null;
  status: BookingStatus;
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

export const KM_PACKAGES = [
  "1.000 km/Monat",
  "2.000 km/Monat",
  "3.000 km/Monat",
  "Mehr / individuell",
];

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
