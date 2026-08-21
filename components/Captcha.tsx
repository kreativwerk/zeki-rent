"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Ist ein Captcha-Schluessel hinterlegt? Ohne Schluessel bleibt alles wie bisher. */
export const captchaEnabled = Boolean(SITE_KEY);

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Cloudflare Turnstile. Rendert nur, wenn NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * gesetzt ist – passend zum Captcha-Schalter in den Supabase-Auth-Einstellungen.
 */
export default function Captcha({
  onToken,
}: {
  onToken: (token: string | null) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    function render() {
      if (cancelled || widget.current !== null) return;
      if (!box.current || !window.turnstile) return;
      widget.current = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => cb.current(token),
        "expired-callback": () => cb.current(null),
        "error-callback": () => cb.current(null),
      });
    }

    if (window.turnstile) {
      render();
      return;
    }

    const selector = "script[data-turnstile]";
    const existing = document.querySelector<HTMLScriptElement>(selector);
    if (existing) {
      existing.addEventListener("load", render);
      return () => {
        cancelled = true;
        existing.removeEventListener("load", render);
      };
    }

    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = "true";
    script.addEventListener("load", render);
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", render);
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={box} className="captcha-box" />;
}

/** Unsichtbares Feld, das nur Bots ausfuellen. */
export function HoneyPot({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="hp-field" aria-hidden>
      <label htmlFor="firmen-website">
        Bitte nicht ausfüllen
        <input
          id="firmen-website"
          type="text"
          name="firmen-website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
