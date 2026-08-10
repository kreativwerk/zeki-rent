import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AssignmentForm, {
  type AssignmentPrefill,
  type CustomerOption,
  type VehicleOption,
} from "@/components/admin/AssignmentForm";

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export default async function NewAssignmentPage(props: {
  searchParams: Promise<{ booking?: string; request?: string; vehicle?: string }>;
}) {
  const params = await props.searchParams;
  const supabase = await createClient();

  const [{ data: vehicleData }, { data: customerData }] = await Promise.all([
    supabase.from("vehicles").select("id, name, active").order("name"),
    supabase
      .from("customer_profiles")
      .select("id, name, company_name, customer_type")
      .order("created_at", { ascending: false }),
  ]);

  const vehicles = (vehicleData ?? []) as VehicleOption[];
  const customers: CustomerOption[] = (customerData ?? []).map((c) => {
    const business = c.customer_type === "gewerblich";
    const primary = business && c.company_name ? c.company_name : c.name;
    const secondary = business && c.company_name && c.name ? ` (${c.name})` : "";
    return { id: c.id as string, label: `${primary ?? "Ohne Namen"}${secondary}` };
  });

  const prefill: AssignmentPrefill = { vehicle_id: params.vehicle ?? null };
  let context: string | null = null;

  if (params.booking) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, user_id, vehicle_id, start_date, duration_months, km_package, note, vehicles(name)")
      .eq("id", params.booking)
      .maybeSingle();
    if (booking) {
      prefill.booking_id = booking.id as string;
      prefill.user_id = booking.user_id as string;
      prefill.vehicle_id = (booking.vehicle_id as string | null) ?? null;
      prefill.start_date = booking.start_date as string;
      prefill.end_date = addMonths(
        booking.start_date as string,
        Number(booking.duration_months) || 1
      );
      prefill.note = (booking.note as string | null) ?? null;
      context = `Aus Fahrzeuganfrage: ${
        (booking.vehicles as { name?: string } | null)?.name ?? "Fahrzeug"
      }, ${booking.duration_months} Monate, ${booking.km_package}`;
    }
  } else if (params.request) {
    const { data: req } = await supabase
      .from("general_requests")
      .select("id, user_id, vehicle_wish, km_per_month, fuel_type, start_from, handover, note")
      .eq("id", params.request)
      .maybeSingle();
    if (req) {
      prefill.request_id = req.id as string;
      prefill.user_id = req.user_id as string;
      prefill.note = (req.note as string | null) ?? null;
      context = [
        `Aus Wunschfahrzeug-Anfrage: ${req.vehicle_wish ?? "–"}`,
        req.km_per_month,
        req.fuel_type,
        req.start_from,
        req.handover,
      ]
        .filter(Boolean)
        .join(" · ");
    }
  }

  return (
    <>
      <Link href="/admin/buchungen" className="back-link">
        ← Buchungsplan
      </Link>

      <div className="admin-page-header">
        <h1>Fahrzeug einplanen</h1>
      </div>

      {context && (
        <div className="card context-card">
          <p>{context}</p>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="card">
          <p className="empty-state">
            Noch keine Fahrzeuge angelegt.{" "}
            <Link href="/admin/fahrzeuge/neu">Jetzt ein Fahrzeug anlegen</Link>
          </p>
        </div>
      ) : (
        <AssignmentForm
          vehicles={vehicles}
          customers={customers}
          prefill={prefill}
        />
      )}
    </>
  );
}
