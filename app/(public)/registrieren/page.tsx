import { RegisterForm } from "@/components/AuthForms";

export const metadata = { title: "Registrieren – Zeki Rent" };

export default async function RegisterPage(props: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await props.searchParams;
  const target = next && next.startsWith("/") ? next : "/konto";

  return (
    <div className="page-narrow auth-page">
      <div className="card">
        <h1>Konto erstellen</h1>
        <p className="step-intro">
          Wir benötigen nur die Angaben, die für Ihre Mietanfrage nötig sind.
        </p>
        <RegisterForm next={target} />
      </div>
    </div>
  );
}
