/**
 * Shared between server and client components, so it must NOT live in a
 * "use client" module — exports of client modules become client references
 * and cannot be called on the server.
 */
export interface CompanyData {
  company_name: string | null;
  billing_street: string | null;
  billing_zip: string | null;
  billing_city: string | null;
  vat_id: string | null;
  delivery_same?: boolean | null;
  delivery_street?: string | null;
  delivery_zip?: string | null;
  delivery_city?: string | null;
}

export function isCompanyComplete(c: CompanyData | null): boolean {
  return Boolean(
    c?.company_name && c?.billing_street && c?.billing_zip && c?.billing_city
  );
}
