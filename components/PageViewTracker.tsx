"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Cookiefreie Reichweitenmessung. Es wird keine IP-Adresse und kein
 * Cookie gespeichert, nur eine Zufalls-ID im sessionStorage, die beim
 * Schliessen des Tabs verfaellt. Damit ist keine Einwilligung noetig.
 */
function sessionId(): string | null {
  try {
    const key = "zr_sid";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return null;
  }
}

function device(): "mobil" | "tablet" | "desktop" {
  const w = window.innerWidth;
  if (w < 640) return "mobil";
  if (w < 1024) return "tablet";
  return "desktop";
}

function referrerHost(): string | null {
  try {
    if (!document.referrer) return null;
    const url = new URL(document.referrer);
    if (url.host === window.location.host) return null;
    return url.host;
  } catch {
    return null;
  }
}

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Adminbereich zaehlt nicht zur Reichweite
    if (!pathname || pathname.startsWith("/admin")) return;
    const sid = sessionId();
    if (!sid) return;

    const body = JSON.stringify({
      path: pathname,
      session_id: sid,
      referrer_host: referrerHost(),
      device: device(),
    });

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Messung darf die Seite nie stoeren
    });
  }, [pathname]);

  return null;
}
