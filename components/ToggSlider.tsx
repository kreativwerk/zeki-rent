"use client";

import { useEffect, useState } from "react";

const SLIDES = [
  {
    src: "/fahrzeuge/togg-t10x.webp",
    alt: "Togg T10X, blaues SUV",
    label: "T10X · SUV",
  },
  {
    src: "/fahrzeuge/togg-t10f.webp",
    alt: "Togg T10F, grüne Limousine",
    label: "T10F · bis 623 km Reichweite",
  },
];

export default function ToggSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % SLIDES.length),
      4000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="tile-slider">
      {SLIDES.map((slide, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className={i === index ? "slide slide-active" : "slide"}
        />
      ))}
      <span className="slide-label">{SLIDES[index].label}</span>
      <div className="slide-dots">
        {SLIDES.map((slide, i) => (
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
    </div>
  );
}
