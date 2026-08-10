export type CustomerType = "privat" | "gewerblich";

export interface CompanyData {
  customer_type?: CustomerType | string | null;
  company_name: string | null;
  billing_street: string | null;
  billing_zip: string | null;
  billing_city: string | null;
  vat_id?: string | null;
  delivery_same?: boolean | null;
  delivery_street?: string | null;
  delivery_zip?: string | null;
  delivery_city?: string | null;
}

/**
 * Rechnungsanschrift ist fuer alle Pflicht, der Firmenname nur fuer
 * gewerbliche Kunden. Bei abweichender Lieferadresse muss diese vollstaendig
 * sein.
 */
export function isCompanyComplete<T extends CompanyData>(
  c: T | null | undefined
): c is T {
  if (!c) return false;
  const business = (c.customer_type ?? "gewerblich") !== "privat";
  if (business && !c.company_name) return false;
  if (!c.billing_street || !c.billing_zip || !c.billing_city) return false;
  if (c.delivery_same === false) {
    if (!c.delivery_street || !c.delivery_zip || !c.delivery_city) return false;
  }
  return true;
}

export function formatAddress(
  street?: string | null,
  zip?: string | null,
  city?: string | null
): string | null {
  if (!street && !zip && !city) return null;
  return `${street ?? ""}, ${zip ?? ""} ${city ?? ""}`.trim().replace(/^,\s*/, "");
}
