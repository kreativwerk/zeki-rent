import VehicleForm from "@/components/admin/VehicleForm";

export default function NewVehiclePage() {
  return (
    <>
      <div className="admin-page-header">
        <h1>Fahrzeug anlegen</h1>
      </div>
      <VehicleForm />
    </>
  );
}
