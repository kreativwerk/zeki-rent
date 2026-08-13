import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saleTitle, type SaleVehicle } from "@/lib/types";
import SaleVehicleForm from "@/components/admin/SaleVehicleForm";

export default async function EditSaleVehiclePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("sale_vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const vehicle = data as SaleVehicle;

  return (
    <>
      <Link href="/admin/verkauf" className="back-link">
        ← Verkauf
      </Link>
      <div className="admin-page-header">
        <h1>{saleTitle(vehicle)}</h1>
        <p>
          <Link href={`/kaufen/${vehicle.id}`} target="_blank">
            Vorschau öffnen
          </Link>
        </p>
      </div>
      <SaleVehicleForm vehicle={vehicle} />
    </>
  );
}
