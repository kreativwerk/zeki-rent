export type AdminIconName =
  | "dashboard"
  | "anfragen"
  | "wunsch"
  | "vormerkung"
  | "buchungen"
  | "fahrzeuge"
  | "kunden"
  | "statistik"
  | "support";

const PATHS: Record<AdminIconName, string> = {
  // grid / dashboard
  dashboard:
    "M4 4h6v6H4V4Zm0 10h6v6H4v-6ZM14 4h6v6h-6V4Zm0 10h6v6h-6v-6Z",
  // inbox
  anfragen:
    "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 10h-4a4 4 0 0 1-8 0H4V6h16v8Z",
  // magic / wish
  wunsch:
    "m12 2 1.8 4.2L18 8l-4.2 1.8L12 14l-1.8-4.2L6 8l4.2-1.8L12 2Zm6 10 1 2.3 2.3 1-2.3 1-1 2.3-1-2.3-2.3-1 2.3-1 1-2.3ZM6 13l1.2 2.8L10 17l-2.8 1.2L6 21l-1.2-2.8L2 17l2.8-1.2L6 13Z",
  // bookmark
  vormerkung: "M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2Z",
  // calendar
  buchungen:
    "M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14v10Zm0-12H5V6h14v2ZM7 12h5v5H7v-5Z",
  // van
  fahrzeuge:
    "M3 6h11a2 2 0 0 1 2 2v1h2.1a2 2 0 0 1 1.7 1l1.9 3.1a2 2 0 0 1 .3 1V17h-2.1a3 3 0 0 0-5.8 0H9.9a3 3 0 0 0-5.8 0H2V8a2 2 0 0 1 1-2Zm13 5h4l-1.5-2.4a.5.5 0 0 0-.4-.2H16v2.6ZM7 16.5A1.5 1.5 0 1 0 7 19.5a1.5 1.5 0 0 0 0-3Zm10 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z",
  // people
  kunden:
    "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-6 1.8-6 4v2h12v-2c0-2.2-2.7-4-6-4Zm8-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-.7 0-1.4.1-2 .3 1.8.9 3 2.3 3 3.9V20h5v-2c0-2.2-2.7-4-6-4Z",
  // bar chart
  statistik: "M4 20h3V10H4v10Zm6.5 0h3V4h-3v16ZM17 20h3v-7h-3v7Z",
  // chat
  support:
    "M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2ZM7 9h10v2H7V9Zm0 4h7v2H7v-2Z",
};

export default function AdminIcon({
  name,
  size = 22,
}: {
  name: AdminIconName;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
