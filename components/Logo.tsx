/*
 * ZEKI RENT wordmark as inline SVG.
 * Letters inherit `currentColor` (dark in the header, white on dark
 * surfaces); only the top bar of the Z uses the accent color.
 */
export default function ZekiLogo() {
  return (
    <svg
      viewBox="0 0 1010 240"
      fill="none"
      role="img"
      aria-label="ZEKI RENT"
      className="zeki-logo"
    >
      {/* Z: accent top bar, diagonal, bottom bar */}
      <rect x="0" y="0" width="172" height="44" fill="var(--accent)" />
      <polygon
        points="172,64 116,64 0,176 56,176"
        fill="currentColor"
      />
      <rect x="0" y="176" width="172" height="44" fill="currentColor" />

      {/* E: three floating bars */}
      <rect x="216" y="0" width="168" height="44" fill="currentColor" />
      <rect x="216" y="88" width="168" height="44" fill="currentColor" />
      <rect x="216" y="176" width="168" height="44" fill="currentColor" />

      {/* K: stem and two diagonals */}
      <rect x="428" y="0" width="46" height="220" fill="currentColor" />
      <polygon
        points="474,102 594,0 650,0 474,150"
        fill="currentColor"
      />
      <polygon
        points="474,118 474,166 588,220 650,220"
        fill="currentColor"
      />

      {/* I */}
      <rect x="678" y="0" width="46" height="220" fill="currentColor" />

      {/* RENT in Inter, bottom-aligned */}
      <text
        x="762"
        y="219"
        fill="currentColor"
        fontFamily="'Inter Variable', Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="92"
        letterSpacing="6"
      >
        RENT
      </text>
    </svg>
  );
}
