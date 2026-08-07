export type FieldType = "text" | "email" | "tel" | "textarea" | "radio" | "checkbox" | "select";

export interface Field {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: string[];
  allowOther?: boolean;
}

export interface Step {
  title: string;
  intro?: string;
  fields: Field[];
}

export const steps: Step[] = [
  {
    title: "Unternehmen & Kontakt",
    intro: "Ein paar Angaben zu Ihrem Unternehmen, damit wir Sie erreichen können.",
    fields: [
      { id: "firma", label: "Firmenname", type: "text", required: true, placeholder: "z. B. Zeki Rent GmbH" },
      { id: "ansprechpartner", label: "Ansprechpartner/in", type: "text", required: true },
      { id: "email", label: "E-Mail-Adresse", type: "email", required: true },
      { id: "telefon", label: "Telefonnummer", type: "tel", required: true },
      { id: "standorte", label: "Standort(e) der Vermietung", type: "textarea", required: true, hint: "Adresse(n), an denen Fahrzeuge abgeholt und zurückgegeben werden." },
      { id: "oeffnungszeiten", label: "Öffnungs- bzw. Übergabezeiten", type: "textarea", hint: "z. B. Mo–Sa 8–18 Uhr, Übergabe nach Vereinbarung" },
      { id: "website", label: "Gibt es bereits eine Website oder Social-Media-Kanäle?", type: "textarea", hint: "Links zu Website, Instagram, Facebook, Google-Unternehmensprofil …" },
    ],
  },
  {
    title: "Fuhrpark",
    intro: "Welche Fahrzeuge sollen über die Webapp vermietet werden?",
    fields: [
      {
        id: "fahrzeugtypen",
        label: "Welche Fahrzeugtypen bieten Sie an?",
        type: "checkbox",
        required: true,
        options: [
          "Transporter / Kastenwagen (z. B. Sprinter, Ducato)",
          "Transporter mit Hochdach / lang",
          "Pritschenwagen / Kipper",
          "Kühlfahrzeug",
          "PKW / Kleinwagen",
          "Anhänger",
        ],
        allowOther: true,
      },
      { id: "anzahl_fahrzeuge", label: "Wie viele Fahrzeuge umfasst der Fuhrpark aktuell?", type: "text", required: true, placeholder: "z. B. 8 Fahrzeuge" },
      { id: "fahrzeug_details", label: "Welche Angaben pro Fahrzeug sind wichtig?", type: "checkbox", options: ["Fotos", "Ladevolumen / Maße der Ladefläche", "Zuladung (kg)", "Getriebe (Schalter / Automatik)", "Anhängerkupplung", "Führerscheinklasse B ausreichend"], hint: "Diese Infos zeigen wir später auf der Fahrzeugseite an." },
      { id: "fuhrpark_wachstum", label: "Ist geplant, den Fuhrpark zu erweitern?", type: "radio", options: ["Ja, in den nächsten 12 Monaten", "Ja, langfristig", "Nein / noch offen"] },
    ],
  },
  {
    title: "Mietkonditionen & Preise",
    intro: "Wie vermieten Sie – und zu welchen Bedingungen?",
    fields: [
      { id: "mietzeitraeume", label: "Welche Mietzeiträume bieten Sie an?", type: "checkbox", required: true, options: ["Stundenweise", "Tagesmiete", "Wochenendtarif", "Wochenmiete", "Langzeitmiete (ab 1 Monat)"] },
      { id: "preisstruktur", label: "Wie ist Ihre Preisstruktur aufgebaut?", type: "textarea", required: true, hint: "z. B. Tagespreis pro Fahrzeugklasse, Wochenendpauschale, Rabatte ab X Tagen …" },
      { id: "kilometer", label: "Wie regeln Sie die Kilometer?", type: "radio", required: true, options: ["Alle Kilometer inklusive", "Freikilometer inklusive, danach pro km", "Kilometerpakete zubuchbar", "Noch offen"], allowOther: true },
      { id: "kaution", label: "Kaution: Höhe und Zahlungsweise?", type: "text", required: true, placeholder: "z. B. 500 € in bar oder per Karte bei Abholung" },
      { id: "mindestalter", label: "Gibt es Anforderungen an Mieter?", type: "checkbox", options: ["Mindestalter (z. B. 21 Jahre)", "Führerschein seit mind. X Jahren", "Nur mit Wohnsitznachweis", "Keine besonderen Anforderungen"], allowOther: true },
      { id: "extras", label: "Welche Extras / Zusatzleistungen gibt es?", type: "checkbox", options: ["Umzugsdecken / Spanngurte", "Sackkarre / Möbelroller", "Zusatzfahrer", "Bring- & Abholservice", "Fahrer buchbar", "Keine Extras"], allowOther: true },
    ],
  },
  {
    title: "Buchung & Bezahlung",
    intro: "So läuft später die Buchung über die Webapp ab.",
    fields: [
      { id: "buchungsart", label: "Wie sollen Kunden buchen können?", type: "radio", required: true, options: ["Direkt online buchen mit Verfügbarkeitskalender", "Online anfragen – ich bestätige manuell", "Beides: erst Anfrage, später Direktbuchung", "Noch unsicher – bitte beraten"] },
      { id: "zahlung_online", label: "Soll online bezahlt werden können?", type: "radio", required: true, options: ["Ja, Zahlung direkt bei Buchung", "Anzahlung online, Rest vor Ort", "Nein, Zahlung nur vor Ort", "Noch offen"] },
      { id: "zahlungsarten", label: "Welche Zahlungsarten möchten Sie anbieten?", type: "checkbox", options: ["EC-/Kreditkarte", "PayPal", "Überweisung / Rechnung", "Barzahlung vor Ort", "Klarna / Ratenkauf"] },
      { id: "dokumente", label: "Sollen Kunden Dokumente online hochladen?", type: "checkbox", options: ["Führerschein", "Personalausweis", "Nichts hochladen – Prüfung vor Ort"], hint: "Digitale Prüfung spart Zeit bei der Übergabe." },
      { id: "vertrag", label: "Wie soll der Mietvertrag geschlossen werden?", type: "radio", options: ["Digital unterschreiben (online)", "Ausdruck & Unterschrift bei Abholung", "Noch offen"] },
      { id: "storno", label: "Welche Stornierungsbedingungen gelten?", type: "textarea", hint: "z. B. kostenlos bis 48 h vorher, danach 50 % …" },
    ],
  },
  {
    title: "Versicherung & Regeln",
    fields: [
      { id: "versicherung", label: "Welche Versicherungsoptionen bieten Sie an?", type: "checkbox", options: ["Haftpflicht + Vollkasko mit Selbstbeteiligung", "Reduzierung der Selbstbeteiligung zubuchbar", "Insassenschutz", "Noch offen / bitte beraten"], allowOther: true },
      { id: "selbstbeteiligung", label: "Wie hoch ist die Selbstbeteiligung?", type: "text", placeholder: "z. B. 1.000 €, reduzierbar auf 350 €" },
      { id: "ausland", label: "Sind Fahrten ins Ausland erlaubt?", type: "radio", options: ["Ja, ohne Einschränkung", "Ja, nur bestimmte Länder", "Nein", "Noch offen"] },
      { id: "tankregelung", label: "Wie ist die Tankregelung?", type: "radio", options: ["Voll abholen – voll zurückgeben", "Fehlende Kraftstoffmenge wird berechnet", "Noch offen"] },
      { id: "agb", label: "Haben Sie bereits AGB / Mietbedingungen als Dokument?", type: "radio", options: ["Ja, vorhanden", "Nein, muss noch erstellt werden"] },
    ],
  },
  {
    title: "Webapp: Funktionen & Design",
    intro: "Was soll die neue Webapp können und wie soll sie aussehen?",
    fields: [
      { id: "funktionen", label: "Welche Funktionen sind Ihnen wichtig?", type: "checkbox", required: true, options: ["Verfügbarkeitskalender in Echtzeit", "Kundenkonto mit Buchungsübersicht", "Automatische E-Mail-Bestätigungen", "WhatsApp-Kontakt / Chat", "Bewertungen anzeigen (z. B. Google)", "Mehrsprachigkeit (z. B. Deutsch / Türkisch / Englisch)", "Gutschein- / Rabattcodes"], allowOther: true },
      { id: "verwaltung", label: "Wie verwalten Sie Buchungen heute?", type: "textarea", hint: "z. B. Telefon & Papierkalender, Excel, andere Software – wichtig für die Übernahme." },
      { id: "benachrichtigung", label: "Wie möchten Sie über neue Buchungen informiert werden?", type: "checkbox", options: ["E-Mail", "WhatsApp", "SMS", "Übersicht im Admin-Bereich reicht"] },
      { id: "design", label: "Gibt es Logo, Farben oder Design-Vorgaben?", type: "textarea", hint: "z. B. Logo vorhanden, Firmenfarben, Websites die Ihnen gefallen …" },
    ],
  },
  {
    title: "Zeitplan & Sonstiges",
    fields: [
      { id: "zeitplan", label: "Bis wann soll die Webapp online gehen?", type: "radio", options: ["So schnell wie möglich", "In 1–2 Monaten", "In 3–6 Monaten", "Kein fester Termin"] },
      { id: "budget", label: "Gibt es einen Budgetrahmen für das Projekt?", type: "radio", options: ["Bis 2.500 €", "2.500 – 5.000 €", "5.000 – 10.000 €", "Über 10.000 €", "Möchte ich erst besprechen"] },
      { id: "sonstiges", label: "Gibt es sonst noch etwas, das wir wissen sollten?", type: "textarea", placeholder: "Wünsche, Besonderheiten, Fragen …" },
    ],
  },
];
