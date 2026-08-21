import { ForgotPasswordForm } from "@/components/PasswordForms";

export const metadata = { title: "Passwort vergessen – Zeki Rent" };

export default function ForgotPasswordPage() {
  return (
    <div className="page-narrow auth-page">
      <div className="card">
        <h1>Passwort vergessen</h1>
        <p className="step-intro">
          Tragen Sie Ihre E-Mail-Adresse ein. Wir schicken Ihnen einen Link,
          mit dem Sie ein neues Passwort setzen können.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
