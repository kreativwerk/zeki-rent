export const metadata = { title: "Impressum – Zeki Rent" };

export default function ImprintPage() {
  return (
    <div className="page-narrow legal-page">
      <h1>Impressum</h1>
      <p>
        <strong>Zeki Rent</strong>
        <br />
        [Straße und Hausnummer]
        <br />
        [PLZ und Ort]
      </p>
      <p>
        Vertreten durch: Koray Zeki
        <br />
        Telefon: 0163 9574116
        <br />
        E-Mail: info@zeki-rent.com
      </p>
      <p>
        Handelsregister: [Amtsgericht, HRB-Nummer]
        <br />
        Umsatzsteuer-ID: [USt-IdNr.]
      </p>
      <p className="fine-print">
        Hinweis: Die Angaben in eckigen Klammern müssen vor dem Go-live
        ergänzt werden.
      </p>
    </div>
  );
}
