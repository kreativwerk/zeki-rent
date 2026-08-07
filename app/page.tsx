import Questionnaire from "@/components/Questionnaire";

export default function Home() {
  return (
    <div className="container">
      <header className="header">
        <div className="logo">
          ZEKI <span>RENT</span>
        </div>
        <h1>Fragebogen: Ihre neue Webapp für die Transporter-Vermietung</h1>
        <p>
          Damit wir Ihre Buchungs-Webapp optimal planen können, bitten wir Sie,
          die folgenden Fragen zu beantworten. Dauer: ca. 10 Minuten.
        </p>
      </header>
      <Questionnaire />
      <footer className="footer">
        Ihre Angaben werden vertraulich behandelt und ausschließlich zur
        Projektplanung verwendet.
      </footer>
    </div>
  );
}
