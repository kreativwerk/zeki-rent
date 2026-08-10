import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

type CustomerRow = Pick<
  Profile,
  "id" | "name" | "company_name" | "customer_type" | "created_at"
>;

function displayName(p: CustomerRow): string {
  if (p.customer_type === "gewerblich" && p.company_name) return p.company_name;
  return p.name ?? "Ohne Namen";
}

export default async function AdminCustomersPage() {
  const supabase = await createClient();
  // customer_profiles blendet Adminkonten aus
  const { data } = await supabase
    .from("customer_profiles")
    .select("id, name, company_name, customer_type, created_at")
    .order("created_at", { ascending: false });

  const profiles = (data ?? []) as CustomerRow[];

  return (
    <>
      <div className="admin-page-header">
        <h1>Kunden</h1>
        <p>{profiles.length} registriert</p>
      </div>

      {profiles.length === 0 ? (
        <div className="card">
          <p className="empty-state">Noch keine registrierten Kunden.</p>
        </div>
      ) : (
        <div className="card">
          <ul className="customer-list">
            {profiles.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/kunden/${p.id}`}>
                  <span className="customer-name">{displayName(p)}</span>
                  <span className="customer-meta">
                    {p.customer_type === "privat" ? "Privat" : "Gewerblich"}
                  </span>
                  <span className="customer-chevron" aria-hidden>
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
