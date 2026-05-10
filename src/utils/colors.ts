function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** `h`: 0–360, `s` / `l`: 0–100 */
function hslToHex(hRaw: number, sRaw: number, lRaw: number): string {
  const h = ((hRaw % 360) + 360) % 360;
  const s = clamp(sRaw / 100, 0, 1);
  const l = clamp(lRaw / 100, 0, 1);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let gr = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    gr = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    gr = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    gr = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    gr = x;
    b = c;
  } else if (h < 300) {
    r = x;
    gr = 0;
    b = c;
  } else {
    r = c;
    gr = 0;
    b = x;
  }
  const rr = Math.round(255 * (r + m));
  const gg = Math.round(255 * (gr + m));
  const bb = Math.round(255 * (b + m));
  return `#${[rr, gg, bb].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function normalizeHex(hex: string): string | null {
  const t = hex.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(t)) return t;
  if (/^#[0-9a-f]{3}$/.test(t)) {
    return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`;
  }
  return null;
}

function rgbFromHex(hex: string): [number, number, number] | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  return [
    parseInt(n.slice(1, 3), 16),
    parseInt(n.slice(3, 5), 16),
    parseInt(n.slice(5, 7), 16),
  ];
}

/** Squared Euclidean distance in RGB space; higher means more visually distinct roughly. */
function colorDistanceSquared(a: string, b: string): number | null {
  const ra = rgbFromHex(a);
  const rb = rgbFromHex(b);
  if (!ra || !rb) return null;
  const d0 = ra[0] - rb[0];
  const d1 = ra[1] - rb[1];
  const d2 = ra[2] - rb[2];
  return d0 * d0 + d1 * d1 + d2 * d2;
}

const MIN_PAIR_DIST_SQ = 45 * 45 * 3; // coarse threshold (~45 steps per channel min)

/**
 * Picks a light pastel-ish hex color that avoids being too similar to `existingColors`.
 */
export function generateDistinctColor(existingColors: string[]): string {
  const normalized = existingColors
    .map((c) => normalizeHex(c))
    .filter((c): c is string => Boolean(c));

  let bestHex = hslToHex(
    Math.floor(Math.random() * 360),
    52 + Math.random() * 18,
    72 + Math.random() * 12,
  );
  let bestMinDist = normalized.length === 0 ? Infinity : 0;

  for (let attempt = 0; attempt < 48; attempt++) {
    const h = Math.floor(Math.random() * 360);
    const s = 48 + Math.random() * 22;
    const light = 70 + Math.random() * 14;
    const candidate = hslToHex(h, s, light);

    if (normalized.length === 0) {
      return candidate;
    }

    let minSq = Infinity;
    for (const ex of normalized) {
      const d = colorDistanceSquared(candidate, ex);
      if (d != null && d < minSq) minSq = d;
    }

    if (minSq >= MIN_PAIR_DIST_SQ) {
      return candidate;
    }
    if (minSq > bestMinDist || bestMinDist === 0) {
      bestMinDist = minSq;
      bestHex = candidate;
    }
  }

  return bestHex;
}

/**
 * Returns black or white for readable text on `hexcolor` using YIQ luminance.
 * Light backgrounds → `#000000`, dark backgrounds → `#FFFFFF`.
 */
export function getContrastYIQ(hexcolor: string): "#000000" | "#FFFFFF" {
  const n = normalizeHex(hexcolor);
  if (!n) return "#000000";
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
}
