"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminIcon from "@/components/admin/AdminIcon";

/** Erste Buchstaben von Vor- und Nachname, sonst der Anfang der E-Mail. */
function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const LINKS = [
  { href: "/konto", label: "Übersicht" },
  { href: "/konto/anfragen", label: "Meine Anfragen" },
  { href: "/konto/profil", label: "Profil & Rechnungsdaten" },
];

export default function AccountMenu({
  name,
  email,
}: {
  name: string | null;
  email: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Menü schließt bei Klick daneben und mit Escape
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Nach einem Seitenwechsel wieder zu
  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    setBusy(true);
    await createClient().auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="account-menu" ref={wrap}>
      <button
        type="button"
        className="account-avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>{initials(name, email)}</span>
        <span className="sr-only">Mein Konto</span>
      </button>

      {open && (
        <div className="account-dropdown" role="menu">
          <div className="account-dropdown-head">
            <AdminIcon name="profil" size={18} />
            <div>
              <strong>{name ?? "Mein Konto"}</strong>
              {email && <span>{email}</span>}
            </div>
          </div>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} role="menuitem">
              {l.label}
            </Link>
          ))}
          <button type="button" role="menuitem" disabled={busy} onClick={logout}>
            {busy ? "Wird abgemeldet …" : "Abmelden"}
          </button>
        </div>
      )}
    </div>
  );
}
