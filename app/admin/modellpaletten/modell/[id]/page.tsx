import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { vehicleTitle, type CatalogVehicle } from "@/lib/types";
import CatalogVehicleForm from "@/components/admin/CatalogVehicleForm";

export default async function AdminCatalogVehiclePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("catalog_vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const vehicle = data as CatalogVehicle;

  return (
    <>
      <Link
        href={
          vehicle.catalog_id
            ? `/admin/modellpaletten/${vehicle.catalog_id}`
            : "/admin/modellpaletten"
        }
        className="back-link"
      >
        ← Zurück zur Modellpalette
      </Link>

      <div className="admin-page-header">
        <h1>{vehicleTitle(vehicle)}</h1>
        <p>
          <span className={`status ${vehicle.active ? "status-bestätigt" : "status-beendet"}`}>
            {vehicle.active ? "live" : "Entwurf"}
          </span>
        </p>
      </div>

      <CatalogVehicleForm vehicle={vehicle} />
    </>
  );
}
