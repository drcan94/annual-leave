import type { Person } from "@/stores";

function normalizeWhitespace(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function tokens(displayName: string): string[] {
  return normalizeWhitespace(displayName).split(/\s+/).filter(Boolean);
}

function graphemes(s: string): string[] {
  return Array.from(s.normalize("NFC"));
}

function graphemeSlice(s: string, count: number): string {
  if (count <= 0) return "";
  return graphemes(s).slice(0, count).join("");
}

function initialsTwo(displayName: string): string {
  const parts = tokens(displayName);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const w = parts[0]!;
    const g = graphemes(w);
    if (g.length === 0) return "?";
    if (g.length === 1) return g[0]!.toLocaleUpperCase("tr");
    return `${g[0]!}${g[1]!}`.toLocaleUpperCase("tr");
  }
  const fg = graphemes(parts[0]!)[0];
  const lg = graphemes(parts[parts.length - 1]!)[0];
  if (!fg || !lg) return "?";
  return `${fg}${lg}`.toLocaleUpperCase("tr");
}

function firstToken(displayName: string): string | null {
  const t = tokens(displayName);
  return t.length > 0 ? t[0]! : null;
}

function titleCaseLeading(token: string): string {
  const g = graphemes(token);
  if (g.length === 0) return token;
  return `${g[0]!.toLocaleUpperCase("tr")}${g
    .slice(1)
    .join("")
    .toLocaleLowerCase("tr")}`;
}

function countSameFirstName(person: Person, allPersons: Person[]): number {
  const f = firstToken(person.name)?.toLocaleLowerCase("tr") ?? "";
  if (!f) return 0;
  return allPersons.filter(
    (p) => (firstToken(p.name)?.toLocaleLowerCase("tr") ?? "") === f,
  ).length;
}

/** Normalized uppercase key used to detect ribbon collisions between two strings. */
function abbrevEqKey(display: string): string {
  return display.trim().toLocaleUpperCase("tr").replace(/\s+/g, " ").normalize("NFC");
}

/** Ordered candidates: earliest wins among globally-free labels (stable sort elsewhere). */
function buildCandidates(person: Person, allPersons: Person[]): string[] {
  const name = normalizeWhitespace(person.name);
  const parts = tokens(name);
  const out: string[] = [];

  const push = (s: string) => {
    const t = normalizeWhitespace(s);
    if (
      !t ||
      out.some((x) => abbrevEqKey(x) === abbrevEqKey(t))
    ) {
      return;
    }
    out.push(t);
  };

  if (parts.length === 0) {
    push(`◇${abbrevEqKey(person.id).replace(/\s+/g, "").slice(-4)}`);
    return out;
  }

  if (countSameFirstName(person, allPersons) >= 2 && parts.length >= 2) {
    const firstTit = titleCaseLeading(parts[0]!);
    const lastTok = parts[parts.length - 1]!;
    const maxK = Math.max(lastTok.length, 8);
    for (let k = 1; k <= maxK; k++) {
      const suf = graphemeSlice(lastTok, k).toLocaleUpperCase("tr");
      push(`${firstTit} ${suf}`);
    }
  }

  const maxL = graphemes(name).length;
  for (let L = 2; L <= maxL; L++) {
    push(graphemeSlice(name, L));
  }

  push(initialsTwo(person.name));

  const dig = initialsTwo(person.name);
  const idStem = graphemes(person.id.replace(/-/g, "")).join("");
  for (let n = 1; n <= Math.max(idStem.length, 8); n++) {
    push(`${dig}${graphemeSlice(idStem, n).toUpperCase()}`.slice(0, 7));
    push(`${dig}.${graphemeSlice(idStem, n).toUpperCase()}`.slice(0, 8));
  }

  push(dig + abbrevEqKey(person.id.replace(/-/g, "")).slice(-4));

  for (let n = 1; n <= 8; n++) {
    push(`◇${graphemeSlice(idStem + person.id, n).toUpperCase()}`.slice(0, 8));
  }

  return out;
}

function sortPeople(a: Person, b: Person): number {
  const c = a.name.localeCompare(b.name, "tr", {
    sensitivity: "base",
    ignorePunctuation: true,
  });
  if (c !== 0) return c;
  return a.id.localeCompare(b.id);
}

function finalizeDisplay(chosen: string): string {
  return abbrevEqKey(chosen).replace(/\s+/g, " ").trim();
}

/** Stable map.id → abbreviation for rendering many cells without recomputing. */
export function abbreviationLookup(persons: Person[]): Map<string, string> {
  const sorted = [...persons].sort(sortPeople);
  const takenKeys = new Set<string>();
  const result = new Map<string, string>();

  for (const p of sorted) {
    let picked: string | null = null;

    for (const cand of buildCandidates(p, persons)) {
      const key = abbrevEqKey(cand);
      if (!key) continue;
      if (!takenKeys.has(key)) {
        picked = finalizeDisplay(cand);
        takenKeys.add(key);
        break;
      }
    }

    if (!picked) {
      let n = 0;
      let alt = "";
      do {
        n += 1;
        alt = finalizeDisplay(`${initialsTwo(p.name)}◇${n}`);
      } while (takenKeys.has(abbrevEqKey(alt)));
      picked = alt;
      takenKeys.add(abbrevEqKey(picked));
    }

    result.set(p.id, graphemeTruncate(picked, 8));
  }

  return result;
}

function graphemeTruncate(s: string, max: number): string {
  const g = graphemes(s.normalize("NFC"));
  return g.slice(0, max).join("");
}

/** Unique ribbon abbreviation for `person` within `allPersons` (capitalized uppercase TR). */
export function getUniqueAbbreviation(
  person: Person,
  allPersons: Person[],
): string {
  const list = allPersons.length > 0 ? allPersons : [person];
  const map = abbreviationLookup(list);
  return (
    map.get(person.id) ?? graphemeTruncate(initialsTwo(person.name), 8)
  );
}
