export const metadata = { title: "Datenschutzerklärung – Zeki Rent" };

export default function PrivacyPage() {
  return (
    <div className="page-narrow legal-page">
      <h1>Datenschutzerklärung</h1>

      <h2>1. Verantwortlicher</h2>
      <p>
        Zeki Rent GmbH
        <br />
        [Straße und Hausnummer]
        <br />
        [PLZ und Ort]
        <br />
        E-Mail: koray.zeki@zeki-rent.com · Telefon: 0163 9574116
      </p>

      <h2>2. Welche Daten wir verarbeiten</h2>
      <p>
        Wir verarbeiten ausschließlich die Daten, die für die Abwicklung Ihrer
        Fahrzeugmiete erforderlich sind (Grundsatz der Datenminimierung):
      </p>
      <ul>
        <li>
          <strong>Kundenkonto:</strong> Name, E-Mail-Adresse, Telefonnummer
          sowie ein von Ihnen gewähltes Passwort (verschlüsselt gespeichert,
          für uns nicht einsehbar)
        </li>
        <li>
          <strong>Mietanfragen:</strong> gewünschtes Fahrzeug, Zeitraum,
          Kilometerpaket und Ihre optionalen Anmerkungen
        </li>
      </ul>

      <h2>3. Zwecke und Rechtsgrundlagen</h2>
      <p>
        Die Verarbeitung erfolgt zur Bearbeitung Ihrer Mietanfragen und zur
        Durchführung des Mietvertrags (Art. 6 Abs. 1 lit. b DSGVO) sowie auf
        Grundlage Ihrer bei der Registrierung erteilten Einwilligung (Art. 6
        Abs. 1 lit. a DSGVO). Sie können die Einwilligung jederzeit mit
        Wirkung für die Zukunft widerrufen.
      </p>

      <h2>4. Speicherort und Auftragsverarbeiter</h2>
      <p>
        Ihre Daten werden bei unserem Auftragsverarbeiter Supabase in einem
        Rechenzentrum in Frankfurt am Main (Deutschland, EU) gespeichert. Das
        Hosting der Website erfolgt über Vercel Inc.; dabei können technisch
        notwendige Verbindungsdaten (z. B. IP-Adresse) verarbeitet werden. Mit
        beiden Anbietern bestehen Auftragsverarbeitungsverträge nach Art. 28
        DSGVO.
      </p>

      <h2>5. Cookies</h2>
      <p>
        Wir verwenden ausschließlich technisch notwendige Cookies für die
        Anmeldung in Ihrem Kundenkonto. Es findet kein Tracking und keine
        Weitergabe an Werbenetzwerke statt.
      </p>

      <h2>6. Speicherdauer</h2>
      <p>
        Kontodaten speichern wir, solange Ihr Kundenkonto besteht.
        Vertragsbezogene Daten unterliegen den gesetzlichen
        Aufbewahrungsfristen (i. d. R. 6 bzw. 10 Jahre). Danach werden die
        Daten gelöscht.
      </p>

      <h2>7. Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16),
        Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
        Datenübertragbarkeit (Art. 20) sowie Widerspruch (Art. 21 DSGVO).
        Wenden Sie sich dazu formlos an{" "}
        <a href="mailto:koray.zeki@zeki-rent.com">koray.zeki@zeki-rent.com</a>.
        Zudem besteht ein Beschwerderecht bei einer
        Datenschutz-Aufsichtsbehörde.
      </p>

      <p className="fine-print">
        Stand: August 2026. Hinweis: Diese Erklärung ist eine Vorlage und
        sollte vor dem endgültigen Go-live rechtlich geprüft werden.
      </p>
    </div>
  );
}
