# Zeki Rent – Online-Fragebogen

Online-Fragebogen zur Vorbereitung der Webapp für die Transporter-Vermietung
**Zeki Rent**. Der Kunde beantwortet in 7 Schritten die wichtigsten Fragen zu
Fuhrpark, Mietkonditionen, Buchung, Versicherung und gewünschten Funktionen.

Gebaut mit Next.js (App Router), ohne weitere Abhängigkeiten – bereit für
Deployment auf Vercel.

## Lokal starten

```bash
npm install
npm run dev
```

Dann http://localhost:3000 öffnen.

## Auf Vercel deployen

1. Repository bei [vercel.com](https://vercel.com) importieren
   (Framework wird automatisch als Next.js erkannt, keine weitere Konfiguration nötig).
2. Deployen – der Fragebogen ist sofort unter der Vercel-Domain erreichbar,
   z. B. `https://zeki-rent.vercel.app`.
3. Den Link an den Kunden schicken.

## Wohin gehen die Antworten?

- **Immer:** Jede Einsendung wird formatiert in die Vercel-Function-Logs
  geschrieben (Vercel-Dashboard → Projekt → *Logs*).
- **Optional per E-Mail:** Mit einem kostenlosen [Resend](https://resend.com)-Konto
  werden Einsendungen zusätzlich per E-Mail zugestellt. Dazu in Vercel unter
  *Settings → Environment Variables* setzen:

  | Variable | Beschreibung |
  | --- | --- |
  | `RESEND_API_KEY` | API-Key von Resend |
  | `NOTIFY_EMAIL` | Empfängeradresse, z. B. `info@arion-logistics.de` |
  | `FROM_EMAIL` | Optional: Absender (Standard: `onboarding@resend.dev`) |

## Fragen anpassen

Alle Fragen liegen zentral in [`lib/questions.ts`](lib/questions.ts) und sind
dort ohne Code-Kenntnisse änderbar (Text, Pflichtfeld, Antwortoptionen).
