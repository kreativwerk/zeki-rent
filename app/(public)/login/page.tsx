import { LoginForm } from "@/components/AuthForms";

export const metadata = { title: "Anmelden – Zeki Rent" };

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await props.searchParams;
  const target = next && next.startsWith("/") ? next : "/konto";

  return (
    <div className="page-narrow auth-page">
      <div className="card">
        <h1>Anmelden</h1>
        <p className="step-intro">
          Melden Sie sich an, um Fahrzeuge zu buchen und Ihre Anfragen
          einzusehen.
        </p>
        <LoginForm next={target} />
      </div>
    </div>
  );
}
