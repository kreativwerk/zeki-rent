import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DURATIONS, formatEuro, priceFor, type Vehicle } from "@/lib/types";
import BookingForm from "@/components/BookingForm";

export default async function VehiclePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  let vehicle: Vehicle | null = null;
  let loggedIn = false;
  try {
    const supabase = await createClient();
    const [{ data }, { data: auth }] = await Promise.all([
      supabase.from("vehicles").select("*").eq("id", id).single(),
      supabase.auth.getUser(),
    ]);
    vehicle = data;
    loggedIn = !!auth.user;
  } catch {
    vehicle = null;
  }

  if (!vehicle) notFound();

  return (
    <div className="page-narrow">
      <Link href="/#fahrzeuge" className="back-link">
        ← Alle Fahrzeuge
      </Link>
      <div className="vehicle-detail">
        <div>
          <span className="vehicle-category">{vehicle.category}</span>
          <h1>{vehicle.name}</h1>
          <ul className="spec-list">
            <li>{vehicle.transmission}</li>
            {vehicle.load_volume && <li>{vehicle.load_volume}</li>}
            {vehicle.license_b && <li>Führerschein Klasse B ausreichend</li>}
          </ul>
          {vehicle.notes && <p className="vehicle-notes">{vehicle.notes}</p>}

          <h2>Monatsraten</h2>
          <table className="price-table">
            <tbody>
              {DURATIONS.map((m) => {
                const p = priceFor(vehicle, m);
                if (p === null) return null;
                return (
                  <tr key={m}>
                    <td>
                      {m} {m === 1 ? "Monat" : "Monate"}
                    </td>
                    <td>
                      <strong>{formatEuro(p)}</strong>/Monat
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="fine-print">
            Zzgl. Kilometerpaket. Kaution 1.000 €, Vollkasko mit 1.000 €
            Selbstbeteiligung inklusive.
          </p>
        </div>

        <div className="booking-panel">
          <h2>Jetzt anfragen</h2>
          <BookingForm vehicle={vehicle} loggedIn={loggedIn} />
        </div>
      </div>
    </div>
  );
}
