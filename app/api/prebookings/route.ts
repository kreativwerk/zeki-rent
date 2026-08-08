import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailLayout, notifyOwner, sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  let body: { note?: string | null };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { error } = await supabase.from("prebookings").insert({
    user_id: user.id,
    model: "Togg T10X",
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
      subject: "Ihre Vormerkung für den Togg T10X",
      html: emailLayout(
        "Sie stehen auf der Liste!",
        `<p style="font-size:14px;">Hallo ${profile?.name ?? ""},</p>
         <p style="font-size:14px;">Ihre Vormerkung für den <strong>Togg T10X</strong> ist eingetragen. Sobald das vollelektrische SUV bei Zeki Mobility verfügbar ist, melden wir uns als Erstes bei Ihnen.</p>
         <p style="font-size:14px;">Den Status Ihrer Vormerkung sehen Sie jederzeit in Ihrem Kundenkonto.</p>`
      ),
    });
  }

  await notifyOwner(
    "Neue Togg-Vormerkung",
    emailLayout(
      "Neue Vormerkung: Togg T10X",
      `<p style="font-size:14px;"><strong>${profile?.name ?? "Unbekannt"}</strong><br>
        ${customerEmail ?? ""}${profile?.phone ? `<br>${profile.phone}` : ""}</p>
       ${body.note?.trim() ? `<p style="font-size:14px;">Anmerkung: ${body.note.trim()}</p>` : ""}`
    )
  );

  return NextResponse.json({ ok: true });
}
