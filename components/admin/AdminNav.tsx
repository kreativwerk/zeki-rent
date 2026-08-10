"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminIcon, { type AdminIconName } from "@/components/admin/AdminIcon";

const items: { href: string; label: string; icon: AdminIconName }[] = [
  { href: "/admin", label: "Übersicht", icon: "dashboard" },
  { href: "/admin/anfragen", label: "Anfragen", icon: "anfragen" },
  { href: "/admin/buchungen", label: "Buchungen", icon: "buchungen" },
  { href: "/admin/fahrzeuge", label: "Fahrzeuge", icon: "fahrzeuge" },
  { href: "/admin/kunden", label: "Kunden", icon: "kunden" },
  { href: "/admin/support", label: "Support", icon: "support" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "active" : ""}
          >
            <AdminIcon name={item.icon} size={19} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
