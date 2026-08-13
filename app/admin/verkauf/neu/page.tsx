import Link from "next/link";
import SaleVehicleForm from "@/components/admin/SaleVehicleForm";

export default function NewSaleVehiclePage() {
  return (
    <>
      <Link href="/admin/verkauf" className="back-link">
        ← Verkauf
      </Link>
      <div className="admin-page-header">
        <h1>Fahrzeug zum Verkauf anlegen</h1>
      </div>
      <SaleVehicleForm />
    </>
  );
}
