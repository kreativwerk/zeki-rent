"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Anfragen" },
  { href: "/admin/fahrzeuge", label: "Fahrzeuge" },
  { href: "/admin/kunden", label: "Kunden" },
  { href: "/admin/support", label: "Support" },
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
