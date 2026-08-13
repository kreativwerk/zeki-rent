"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 25 * 1024 * 1024;

export default function CatalogUploadForm() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [brand, setBrand] = useState("");
  const [title, setTitle] = useState("");
  const [service, setService] = useState("abo");
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileInput.current?.files?.[0] ?? null;
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Bitte eine PDF-Datei auswählen.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Die PDF-Datei ist größer als 25 MB.");
        return;
      }
    }

    setSaving(true);
    const supabase = createClient();
    let pdfPath: string | null = null;

    if (file) {
      pdfPath = `paletten/${crypto.randomUUID()}.pdf`;
      const { error: upError } = await supabase.storage
        .from("catalogs")
        .upload(pdfPath, file, { contentType: "application/pdf" });
      if (upError) {
        console.error(upError);
        setError("Upload fehlgeschlagen. Bitte erneut versuchen.");
        setSaving(false);
        return;
      }
    }

    const { data, error: dbError } = await supabase
      .from("model_catalogs")
      .insert({
        brand: brand.trim(),
        title: title.trim() || `${brand.trim()} Modellpalette`,
        service_type: service,
        pdf_path: pdfPath,
        note: note.trim() || null,
      })
      .select("id")
      .single();

    if (dbError || !data) {
      console.error(dbError);
      setError("Speichern fehlgeschlagen. Bitte Eingaben prüfen.");
      setSaving(false);
      return;
    }

    router.push(`/admin/modellpaletten/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>Neue Modellpalette</h2>
      <p className="step-intro">
        PDF des Herstellers hochladen und die Palette anlegen. Die Fahrzeuge
        tragen Sie danach ein, sie bleiben bis zur Freigabe unsichtbar und ohne
        Preise.
      </p>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="c-brand">
            Marke
          </label>
          <input
            id="c-brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="z. B. Kia"
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="c-title">
            Titel <span className="hint">optional</span>
          </label>
          <input
            id="c-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z. B. Kia Modellpalette 2026"
          />
        </div>
      </div>

      <div className="field">
        <label className="field-label">Für welchen Service?</label>
        <div className="choice-pills">
          {[
            { v: "abo", l: "Auto-Abo" },
            { v: "miete", l: "Miete" },
            { v: "beides", l: "Beides" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              className={`pill ${service === o.v ? "pill-active" : ""}`}
              onClick={() => setService(o.v)}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label">
          Modellpalette als PDF <span className="hint">optional, max. 25 MB</span>
        </label>
        <div className="upload-row">
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf"
            className="upload-input"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <button
            type="button"
            className="btn-secondary btn-upload"
            onClick={() => fileInput.current?.click()}
          >
            PDF auswählen
          </button>
          {fileName && <span className="muted">{fileName}</span>}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="c-note">
          Notiz <span className="hint">optional, nur intern</span>
        </label>
        <textarea
          id="c-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z. B. Stand der Preisliste, Ansprechpartner beim Händler"
        />
      </div>

      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Wird angelegt …" : "Modellpalette anlegen"}
      </button>
    </form>
  );
}
