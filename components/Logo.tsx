/*
 * ZEKI RENT wordmark in Inter ExtraBold. An accent-colored bar sits
 * exactly on the Z's top stroke (covering it), like the brand logo;
 * the letters inherit currentColor.
 */
export default function ZekiLogo() {
  return (
    <svg
      viewBox="0 0 1240 235"
      fill="none"
      role="img"
      aria-label="ZEKI RENT"
      className="zeki-logo"
    >
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
      {/* Accent bar replacing the Z's top stroke */}
      <rect x="2" y="53" width="150" height="47" fill="var(--accent)" />
    </svg>
  );
}
