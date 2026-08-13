"use client";

import { useEffect, useState } from "react";

export interface Slide {
  src: string;
  alt: string;
  label?: string;
}

/**
 * Kleiner Bildwechsler für Kacheln. Respektiert die Systemeinstellung für
 * reduzierte Bewegung und lässt sich über die Punkte steuern.
 */
export default function TileSlider({
  slides,
  interval = 4000,
}: {
  slides: Slide[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      interval
    );
    return () => clearInterval(timer);
  }, [slides.length, interval]);

  const current = slides[index];

  return (
    <div className="tile-slider">
      {slides.map((slide, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className={i === index ? "slide slide-active" : "slide"}
        />
      ))}
      {current.label && <span className="slide-label">{current.label}</span>}
      {slides.length > 1 && (
        <div className="slide-dots">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Bild ${i + 1} anzeigen`}
              className={i === index ? "dot dot-active" : "dot"}
              onClick={(e) => {
                e.preventDefault();
                setIndex(i);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
