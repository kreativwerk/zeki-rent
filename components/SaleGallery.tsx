"use client";

import { useState } from "react";

/**
 * Fahrzeugfotos mit auswaehlbaren Vorschaubildern: Ein Klick auf ein
 * kleines Bild zeigt es gross im Hauptfenster.
 */
export default function SaleGallery({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) return null;

  const current = photos[Math.min(active, photos.length - 1)];

  return (
    <div className="sale-gallery">
      <div className="sale-gallery-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={
            photos.length > 1 ? `${alt}, Foto ${active + 1} von ${photos.length}` : alt
          }
        />
      </div>

      {photos.length > 1 && (
        <div className="sale-gallery-thumbs">
          {photos.map((url, i) => (
            <button
              key={url}
              type="button"
              className={i === active ? "sale-thumb sale-thumb-on" : "sale-thumb"}
              aria-label={`Foto ${i + 1} anzeigen`}
              aria-current={i === active}
              onClick={() => setActive(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
