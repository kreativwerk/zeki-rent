import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEVICES = new Set(["mobil", "tablet", "desktop"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Nimmt einen Seitenaufruf entgegen. Es wird bewusst weder die IP noch der
 * User-Agent gespeichert, nur Pfad, Geraeteklasse, Herkunfts-Host und die
 * kurzlebige Session-ID aus dem Browser.
 */
export async function POST(request: Request) {
  let body: {
    path?: string;
    session_id?: string;
    referrer_host?: string | null;
    device?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = (body.path ?? "").slice(0, 200);
  const sessionId = body.session_id ?? "";
  if (!path.startsWith("/") || !UUID.test(sessionId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (path.startsWith("/admin")) {
    return NextResponse.json({ ok: true });
  }

  const device = DEVICES.has(body.device ?? "") ? body.device : "desktop";
  const referrer = body.referrer_host?.slice(0, 120) || null;

  try {
    const supabase = await createClient();
    await supabase.from("page_views").insert({
      path,
      session_id: sessionId,
      referrer_host: referrer,
      device,
    });
  } catch (err) {
    console.error("Seitenaufruf konnte nicht gezaehlt werden:", err);
  }

  return NextResponse.json({ ok: true });
}
