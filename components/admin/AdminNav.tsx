"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminIcon, { type AdminIconName } from "@/components/admin/AdminIcon";

// short: Beschriftung fuer die App-Leiste unten auf dem Handy
const items: {
  href: string;
  label: string;
  short: string;
  icon: AdminIconName;
}[] = [
  { href: "/admin", label: "Übersicht", short: "Start", icon: "dashboard" },
  {
    href: "/admin/anfragen",
    label: "Anfragen",
    short: "Anfragen",
    icon: "anfragen",
  },
  {
    href: "/admin/buchungen",
    label: "Buchungen",
    short: "Plan",
    icon: "buchungen",
  },
  {
    href: "/admin/fahrzeuge",
    label: "Fahrzeuge",
    short: "Flotte",
    icon: "fahrzeuge",
  },
  { href: "/admin/kunden", label: "Kunden", short: "Kunden", icon: "kunden" },
  {
    href: "/admin/statistik",
    label: "Statistik",
    short: "Zahlen",
    icon: "statistik",
  },
  {
    href: "/admin/support",
    label: "Support",
    short: "Support",
    icon: "support",
  },
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
            <span className="nav-label-full">{item.label}</span>
            <span className="nav-label-short">{item.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
