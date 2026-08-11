"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

function safeName(name: string): string {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "jpg";
  return `${crypto.randomUUID()}.${ext.replace(/[^a-z0-9]/g, "") || "jpg"}`;
}

/**
 * Laedt Bilder in einen Supabase-Storage-Bucket. Gibt bei oeffentlichen
 * Buckets die fertige URL zurueck, sonst den Pfad im Bucket.
 */
export default function ImageUpload({
  bucket,
  folder,
  multiple = false,
  returnPublicUrl = false,
  label = "Bild hochladen",
  onUploaded,
}: {
  bucket: string;
  folder: string;
  multiple?: boolean;
  returnPublicUrl?: boolean;
  label?: string;
  onUploaded: (values: string[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const list = Array.from(files);
    for (const f of list) {
      if (!ALLOWED.includes(f.type)) {
        setError("Nur Bilder (JPG, PNG, WebP, AVIF, GIF) sind möglich.");
        return;
      }
      if (f.size > MAX_BYTES) {
        setError(`„${f.name}“ ist größer als 8 MB.`);
        return;
      }
    }

    setBusy(true);
    const supabase = createClient();
    const results: string[] = [];

    for (const file of list) {
      const path = `${folder}/${safeName(file.name)}`;
      const { error: upError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (upError) {
        console.error(upError);
        setError("Upload fehlgeschlagen. Bitte erneut versuchen.");
        setBusy(false);
        return;
      }
      results.push(
        returnPublicUrl
          ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
          : path
      );
    }

    setBusy(false);
    if (input.current) input.current.value = "";
    onUploaded(results);
  }

  return (
    <div className="upload-row">
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="upload-input"
        onChange={(e) => handle(e.target.files)}
        disabled={busy}
      />
      <button
        type="button"
        className="btn-secondary btn-upload"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? "Wird hochgeladen …" : label}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
