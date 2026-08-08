import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailLayout, notifyOwner, sendEmail } from "@/lib/email";

const MODELS = ["Togg T10X", "Togg T10F"];

export async function POST(request: Request) {
  let body: { note?: string | null; model?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const model =
    body.model && MODELS.includes(body.model) ? body.model : MODELS[0];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { error } = await supabase.from("prebookings").insert({
    user_id: user.id,
    model,
    note: body.note?.trim() || null,
  });
  if (error) {
    // Unique constraint: already on the list — treat as success
    if (error.code === "23505") return NextResponse.json({ ok: true });
    console.error("Vormerkung fehlgeschlagen:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, email")
    .eq("id", user.id)
    .single();

  const customerEmail = profile?.email ?? user.email;
  if (customerEmail) {
    await sendEmail({
      to: customerEmail,
      subject: `Ihre Vormerkung für den ${model}`,
      html: emailLayout(
        "Sie stehen auf der Liste!",
        `<p style="font-size:14px;">Hallo ${profile?.name ?? ""},</p>
         <p style="font-size:14px;">Ihre Vormerkung für den <strong>${model}</strong> ist eingetragen. Sobald das vollelektrische Fahrzeug bei Zeki Mobility verfügbar ist, melden wir uns als Erstes bei Ihnen.</p>
         <p style="font-size:14px;">Den Status Ihrer Vormerkung sehen Sie jederzeit in Ihrem Kundenkonto.</p>`
      ),
    });
  }

  await notifyOwner(
    "Neue Togg-Vormerkung",
    emailLayout(
      `Neue Vormerkung: ${model}`,
      `<p style="font-size:14px;"><strong>${profile?.name ?? "Unbekannt"}</strong><br>
        ${customerEmail ?? ""}${profile?.phone ? `<br>${profile.phone}` : ""}</p>
       ${body.note?.trim() ? `<p style="font-size:14px;">Anmerkung: ${body.note.trim()}</p>` : ""}`
    )
  );

  return NextResponse.json({ ok: true });
}
