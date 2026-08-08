import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailLayout, notifyOwner, sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  let body: { vehicle_wish?: string; period?: string | null; note?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.vehicle_wish?.trim()) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { error } = await supabase.from("general_requests").insert({
    user_id: user.id,
    vehicle_wish: body.vehicle_wish.trim(),
    period: body.period?.trim() || null,
    note: body.note?.trim() || null,
  });
  if (error) {
    console.error("Allgemeine Anfrage fehlgeschlagen:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, email")
    .eq("id", user.id)
    .single();

  const details = `<div style="background:#f2f2f7;border-radius:12px;padding:4px 16px;margin:16px 0;">
    <p style="margin:12px 0;font-size:14px;"><span style="color:#8e8e93;">Wunschfahrzeug</span><br><strong>${body.vehicle_wish.trim()}</strong></p>
    ${body.period?.trim() ? `<p style="margin:12px 0;font-size:14px;"><span style="color:#8e8e93;">Zeitraum</span><br><strong>${body.period.trim()}</strong></p>` : ""}
    ${body.note?.trim() ? `<p style="margin:12px 0;font-size:14px;"><span style="color:#8e8e93;">Anmerkung</span><br><strong>${body.note.trim()}</strong></p>` : ""}
  </div>`;

  const customerEmail = profile?.email ?? user.email;
  if (customerEmail) {
    await sendEmail({
      to: customerEmail,
      subject: "Ihre Anfrage bei Zeki Rent ist eingegangen",
      html: emailLayout(
        "Wir kümmern uns um Ihr Wunschfahrzeug!",
        `<p style="font-size:14px;">Hallo ${profile?.name ?? ""},</p>
         <p style="font-size:14px;">vielen Dank für Ihre Anfrage. Über unser Partnernetzwerk finden wir Ihr Wunschfahrzeug zum Bestpreis und melden uns schnellstmöglich bei Ihnen.</p>
         ${details}`
      ),
    });
  }

  await notifyOwner(
    "Neue allgemeine Fahrzeuganfrage",
    emailLayout(
      "Neue allgemeine Anfrage",
      `<p style="font-size:14px;"><strong>${profile?.name ?? "Unbekannt"}</strong><br>
        ${customerEmail ?? ""}${profile?.phone ? `<br>${profile.phone}` : ""}</p>
       ${details}`
    )
  );

  return NextResponse.json({ ok: true });
}
