"use client";

import { useState } from "react";
import CompanyForm from "@/components/CompanyForm";
import type { CompanyData } from "@/lib/company";

/**
 * Shows the company/billing form until the customer's data is on file,
 * then reveals the actual request form.
 */
export default function CompanyGate({
  complete,
  initial,
  children,
}: {
  complete: boolean;
  initial?: CompanyData | null;
  children: React.ReactNode;
}) {
  const [saved, setSaved] = useState(complete);

  if (saved) return <>{children}</>;

  return (
    <>
      <p className="step-intro">
        Für die Anfrage benötigen wir einmalig Ihre Firmen- und
        Rechnungsdaten. Danach sind alle weiteren Anfragen mit einem Klick
        möglich.
      </p>
      <CompanyForm
        initial={initial}
        submitLabel="Weiter zur Anfrage"
        onSaved={() => setSaved(true)}
      />
    </>
  );
}
