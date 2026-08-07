import { NextResponse } from "next/server";
import { steps } from "@/lib/questions";

type Answers = Record<string, string | string[]>;

function formatAnswers(answers: Answers): string {
  const lines: string[] = [];
  for (const step of steps) {
    lines.push(`\n=== ${step.title} ===`);
    for (const field of step.fields) {
      const value = answers[field.id];
      const other = answers[`${field.id}__other`];
      let text = Array.isArray(value) ? value.join(", ") : (value ?? "").toString();
      if (typeof other === "string" && other.trim()) {
        text = text ? `${text}; ${other}` : other;
      }
      lines.push(`${field.label}\n  → ${text.trim() || "– keine Angabe –"}`);
    }
  }
  return lines.join("\n");
}

export async function POST(request: Request) {
  let body: { answers?: Answers; submittedAt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const answers = body.answers ?? {};
  const summary = formatAnswers(answers);

  // Fallback that always works: submission lands in the Vercel function logs.
  console.log("Neue Fragebogen-Einsendung", body.submittedAt ?? "", "\n" + summary);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (apiKey && to) {
    const firma = typeof answers.firma === "string" ? answers.firma : "unbekannt";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL ?? "Zeki Rent Fragebogen <onboarding@resend.dev>",
        to: [to],
        subject: `Neuer Fragebogen: ${firma}`,
        text: summary,
      }),
    });
    if (!res.ok) {
      console.error("Resend-Versand fehlgeschlagen:", res.status, await res.text());
    }
  }

  return NextResponse.json({ ok: true });
}
