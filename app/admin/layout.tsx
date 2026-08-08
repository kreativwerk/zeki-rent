import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/AuthForms";
import AdminNav from "@/components/admin/AdminNav";
import ZekiLogo from "@/components/Logo";

export const metadata = { title: "Admin – Zeki Rent" };

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    return (
      <div className="page-narrow">
        <div className="card" style={{ textAlign: "center" }}>
          <h1>Kein Zugriff</h1>
          <p className="step-intro">
            Dieses Konto ({user.email}) hat keine Admin-Berechtigung.
          </p>
          <Link href="/" className="btn-secondary btn-link">
            Zur Website
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="logo">
          <ZekiLogo />
        </Link>
        <AdminNav />
        <div className="admin-sidebar-footer">
          <Link href="/">← Zur Website</Link>
          <LogoutButton />
        </div>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
