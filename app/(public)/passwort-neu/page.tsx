import { NewPasswordForm } from "@/components/PasswordForms";

export const metadata = { title: "Neues Passwort – Zeki Rent" };

export default function NewPasswordPage() {
  return (
    <div className="page-narrow auth-page">
      <div className="card">
        <h1>Neues Passwort</h1>
        <NewPasswordForm />
      </div>
    </div>
  );
}
