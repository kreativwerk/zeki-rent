/*
 * ZEKI RENT wordmark: Inter ExtraBold with the brand's accent bar
 * above the Z. Letters inherit currentColor (dark in the header,
 * white on dark surfaces).
 */
export default function ZekiLogo() {
  return (
    <svg
      viewBox="0 0 1260 235"
      fill="none"
      role="img"
      aria-label="ZEKI RENT"
      className="zeki-logo"
    >
      <rect x="4" y="0" width="148" height="36" fill="var(--accent)" />
      <text
        x="0"
        y="222"
        fill="currentColor"
        fontFamily="'Inter Variable', Inter, system-ui, sans-serif"
        fontWeight="800"
        fontSize="230"
        letterSpacing="2"
      >
        ZEKI RENT
      </text>
    </svg>
  );
}
