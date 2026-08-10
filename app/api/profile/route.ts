import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: {
    customer_type?: string;
    company_name?: string;
    billing_street?: string;
    billing_zip?: string;
    billing_city?: string;
    vat_id?: string | null;
    delivery_same?: boolean;
    delivery_street?: string | null;
    delivery_zip?: string | null;
    delivery_city?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const customerType = body.customer_type === "privat" ? "privat" : "gewerblich";
  const required = [body.billing_street, body.billing_zip, body.billing_city];
  if (customerType === "gewerblich") required.push(body.company_name);
  if (required.some((v) => !v?.trim())) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const deliverySame = body.delivery_same !== false;
  if (
    !deliverySame &&
    [body.delivery_street, body.delivery_zip, body.delivery_city].some(
      (v) => !v?.trim()
    )
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { error } = await supabase
    .from("profiles")
    .update({
      customer_type: customerType,
      company_name:
        customerType === "gewerblich" ? body.company_name!.trim() : null,
      billing_street: body.billing_street!.trim(),
      billing_zip: body.billing_zip!.trim(),
      billing_city: body.billing_city!.trim(),
      vat_id: body.vat_id?.trim() || null,
      delivery_same: deliverySame,
      delivery_street: deliverySame ? null : body.delivery_street!.trim(),
      delivery_zip: deliverySame ? null : body.delivery_zip!.trim(),
      delivery_city: deliverySame ? null : body.delivery_city!.trim(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Firmendaten speichern fehlgeschlagen:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
