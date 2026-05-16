/**
 * regexInterpreter.ts
 *
 * Translates XSD regex patterns into plain-English descriptions.
 * XSD regex is a subset of Unicode regex: no anchors (^ $ are treated as
 * literals inside the full-match context), no lookaheads, but full Unicode
 * character classes and escape sequences are valid.
 *
 * The interpreter tokenises the pattern left-to-right and builds an array
 * of English phrases, then joins them into a readable sentence.
 */

// ─── Character-class helpers ─────────────────────────────────────────────────

/**
 * Canonical named sub-ranges ordered by code point.
 * Any arbitrary [from-to] range is decomposed against this list so users see
 * recognisable groups (digits, letters, punctuation) rather than raw endpoints.
 */
interface SubRange { from: number; to: number; label: string }

const CANONICAL_SUBRANGES: SubRange[] = [
  { from: 0x20, to: 0x20, label: 'space' },
  { from: 0x21, to: 0x2F, label: '!"#$%&\'()*+,-./ (punctuation)' },
  { from: 0x30, to: 0x39, label: '0-9 (digits)' },
  { from: 0x3A, to: 0x40, label: ':;<=>?@ (symbols)' },
  { from: 0x41, to: 0x5A, label: 'A-Z (uppercase letters)' },
  { from: 0x5B, to: 0x60, label: '[\\]^_` (symbols)' },
  { from: 0x61, to: 0x7A, label: 'a-z (lowercase letters)' },
  { from: 0x7B, to: 0x7E, label: '{|}~ (symbols)' },
  { from: 0xC0, to: 0xD6, label: 'À-Ö (Latin extended uppercase)' },
  { from: 0xD8, to: 0xF6, label: 'Ø-ö (Latin extended)' },
  { from: 0xF8, to: 0xFF, label: 'ø-ÿ (Latin extended lowercase)' },
];

/** Named exact-match shortcuts for common XSD character-class ranges. */
const EXACT_RANGE_LABELS: Map<string, string> = new Map([
  ['0-9',   '0-9 (digits)'],
  ['a-z',   'a-z (lowercase letters)'],
  ['A-Z',   'A-Z (uppercase letters)'],
  ['a-f',   'a-f (hex digits)'],
  ['A-F',   'A-F (hex digits)'],
  ['a-e',   'a-e'],
  ['a-zA-Z','a-z, A-Z (letters)'],
]);

/**
 * Append one or more descriptions for the code-point range [fromCP, toCP]
 * into `out`, using canonical sub-range labels where possible and falling
 * back to `"x"-"y"` for short gaps or `x-y` for longer unknown spans.
 */
function appendRangeDesc(out: string[], fromCP: number, toCP: number): void {
  // Short span with no canonical split — just list characters explicitly
  if (toCP - fromCP + 1 <= 3) {
    for (let cp = fromCP; cp <= toCP; cp++) out.push(labelChar(String.fromCodePoint(cp)));
    return;
  }

  let cursor = fromCP;

  for (const sr of CANONICAL_SUBRANGES) {
    if (sr.from > toCP) break;
    if (sr.to < cursor) continue;

    // Gap before this sub-range
    if (cursor < sr.from) {
      appendGap(out, cursor, sr.from - 1);
    }

    const subFrom = Math.max(sr.from, fromCP);
    const subTo   = Math.min(sr.to,   toCP);

    if (subFrom === sr.from && subTo === sr.to) {
      out.push(sr.label);          // perfectly aligned — use full label
    } else if (subFrom === subTo) {
      out.push(labelChar(String.fromCodePoint(subFrom)));
    } else {
      // Partial overlap — show compact range
      out.push(`${String.fromCodePoint(subFrom)}-${String.fromCodePoint(subTo)}`);
    }

    cursor = sr.to + 1;
  }

  // Trailing gap after all canonical sub-ranges
  if (cursor <= toCP) appendGap(out, cursor, toCP);
}

function appendGap(out: string[], fromCP: number, toCP: number): void {
  const count = toCP - fromCP + 1;
  if (count <= 3) {
    for (let cp = fromCP; cp <= toCP; cp++) out.push(labelChar(String.fromCodePoint(cp)));
  } else {
    out.push(`${String.fromCodePoint(fromCP)}-${String.fromCodePoint(toCP)}`);
  }
}

/**
 * Describe a character range [from, to] in human-readable form,
 * decomposing it into named sub-ranges wherever possible.
 */
function describeRange(from: string, to: string): string {
  // Fast path: exact well-known ranges
  const key = `${from}-${to}`;
  const exact = EXACT_RANGE_LABELS.get(key);
  if (exact) return exact;

  const fromCP = from.codePointAt(0)!;
  const toCP   = to.codePointAt(0)!;

  // Special case: the full printable-ASCII span
  if (fromCP === 0x20 && toCP === 0x7E) return 'all printable ASCII (space – ~)';

  const parts: string[] = [];
  appendRangeDesc(parts, fromCP, toCP);
  return parts.length ? parts.join(', ') : key;
}

const ESCAPE_LABELS: Record<string, string> = {
  d: '0-9 (digit)',
  D: 'non-digit',
  w: 'word character (letter, digit, or underscore)',
  W: 'non-word character',
  s: 'whitespace',
  S: 'non-whitespace',
  n: '"newline"',
  r: '"carriage return"',
  t: '"tab"',
  i: 'initial XML name character',
  I: 'non-initial XML name character',
  c: 'XML name character',
  C: 'non-XML name character',
};

const PRINTABLE_CHAR_NAMES: Record<string, string> = {
  ' ': 'space',
  '-': 'hyphen (-)',
  '.': 'period (.)',
  '_': 'underscore (_)',
  '@': 'at-sign (@)',
  '+': 'plus (+)',
  '/': 'forward-slash (/)',
  '\\': 'backslash (\\)',
  ':': 'colon (:)',
  ';': 'semicolon (;)',
  ',': 'comma (,)',
  '!': 'exclamation mark (!)',
  '?': 'question mark (?)',
  '#': 'hash (#)',
  '%': 'percent (%)',
  '&': 'ampersand (&)',
  '=': 'equals (=)',
  '(': 'open-paren',
  ')': 'close-paren',
  '[': 'open-bracket',
  ']': 'close-bracket',
  '{': 'open-brace',
  '}': 'close-brace',
  '<': 'less-than (<)',
  '>': 'greater-than (>)',
  '"': 'double-quote (")',
  "'": "single-quote (')",
  '|': 'pipe (|)',
  '^': 'caret (^)',
  '$': 'dollar ($)',
  '*': 'asterisk (*)',
};

function labelChar(ch: string): string {
  return PRINTABLE_CHAR_NAMES[ch] ?? `"${ch}"`;
}

function joinList(items: string[]): string {
  if (items.length === 0) return 'character';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} or ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, or ${items[items.length - 1]}`;
}

/** Parse the interior of [...] into English. */
function describeCharClassBody(inner: string): string {
  const negated = inner.startsWith('^');
  const body = negated ? inner.slice(1) : inner;

  const parts: string[] = [];
  let i = 0;

  while (i < body.length) {
    if (body[i] === '\\' && i + 1 < body.length) {
      const esc = body[i + 1];
      parts.push(ESCAPE_LABELS[esc] ?? `"${esc}"`);
      i += 2;
      continue;
    }

    // Range a-z
    if (i + 2 < body.length && body[i + 1] === '-' && body[i + 2] !== ']') {
      const from = body[i];
      const to = body[i + 2];
      parts.push(describeRange(from, to));
      i += 3;
      continue;
    }

    parts.push(labelChar(body[i]));
    i++;
  }

  const desc = joinList(parts);
  return negated ? `any character except ${desc}` : desc;
}

// ─── Quantifier ───────────────────────────────────────────────────────────────

function applyQuantifier(q: string, subject: string): string {
  if (q === '?') return `an optional ${subject}`;
  if (q === '*') return `zero or more ${subject}`;
  if (q === '+') return `one or more ${subject}`;

  const exact = q.match(/^\{(\d+)\}$/);
  if (exact) {
    const n = parseInt(exact[1]);
    return `exactly ${n} ${subject}`;
  }

  const range = q.match(/^\{(\d+),(\d+)\}$/);
  if (range) {
    const min = parseInt(range[1]);
    const max = parseInt(range[2]);
    if (min === max) return `exactly ${min} ${subject}`;
    return `${min} to ${max} ${subject}`;
  }

  const minOnly = q.match(/^\{(\d+),\}$/);
  if (minOnly) {
    const n = parseInt(minOnly[1]);
    return n === 0 ? `zero or more ${subject}` : `at least ${n} ${subject}`;
  }

  return `${q} ${subject}`;
}

// ─── Tokeniser ────────────────────────────────────────────────────────────────

type Token =
  | { kind: 'literal'; value: string }
  | { kind: 'escape'; code: string }
  | { kind: 'dot' }
  | { kind: 'charClass'; inner: string }
  | { kind: 'groupStart'; capturing: boolean }
  | { kind: 'groupEnd' }
  | { kind: 'alternation' }
  | { kind: 'quantifier'; value: string };

function tokenise(pattern: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i];

    if (ch === '\\' && i + 1 < pattern.length) {
      tokens.push({ kind: 'escape', code: pattern[i + 1] });
      i += 2;
      continue;
    }

    if (ch === '[') {
      // Find the matching ]
      let j = i + 1;
      if (pattern[j] === '^') j++;
      if (pattern[j] === ']') j++; // ] immediately after [ or [^ is literal
      while (j < pattern.length && pattern[j] !== ']') {
        if (pattern[j] === '\\') j++;
        j++;
      }
      tokens.push({ kind: 'charClass', inner: pattern.slice(i + 1, j) });
      i = j + 1;
      continue;
    }

    if (ch === '(') {
      const capturing = pattern[i + 1] !== '?' || pattern[i + 2] === ':';
      tokens.push({ kind: 'groupStart', capturing });
      i += 1;
      continue;
    }

    if (ch === ')') {
      tokens.push({ kind: 'groupEnd' });
      i++;
      continue;
    }

    if (ch === '|') {
      tokens.push({ kind: 'alternation' });
      i++;
      continue;
    }

    if (ch === '.') {
      tokens.push({ kind: 'dot' });
      i++;
      continue;
    }

    // Quantifiers
    if (ch === '*' || ch === '+' || ch === '?') {
      tokens.push({ kind: 'quantifier', value: ch });
      i++;
      continue;
    }

    if (ch === '{') {
      const close = pattern.indexOf('}', i);
      if (close !== -1) {
        tokens.push({ kind: 'quantifier', value: pattern.slice(i, close + 1) });
        i = close + 1;
        continue;
      }
    }

    tokens.push({ kind: 'literal', value: ch });
    i++;
  }

  return tokens;
}

// ─── Parser / English builder ─────────────────────────────────────────────────

/** Consume one "atom" from the token stream and return its English description. */
function parseAtom(tokens: Token[], pos: { i: number }): string | null {
  const tok = tokens[pos.i];
  if (!tok) return null;

  if (tok.kind === 'literal') {
    pos.i++;
    return labelChar(tok.value);
  }

  if (tok.kind === 'escape') {
    pos.i++;
    return ESCAPE_LABELS[tok.code] ?? `"${tok.code}"`;
  }

  if (tok.kind === 'dot') {
    pos.i++;
    return 'any character';
  }

  if (tok.kind === 'charClass') {
    pos.i++;
    return describeCharClassBody(tok.inner);
  }

  if (tok.kind === 'groupStart') {
    pos.i++;
    const inner = parseAlternation(tokens, pos);
    if (tokens[pos.i]?.kind === 'groupEnd') pos.i++;
    return inner ? `(${inner})` : null;
  }

  return null;
}

function parseSequence(tokens: Token[], pos: { i: number }): string[] {
  const parts: string[] = [];

  while (pos.i < tokens.length) {
    const tok = tokens[pos.i];
    if (tok.kind === 'alternation' || tok.kind === 'groupEnd') break;

    const atom = parseAtom(tokens, pos);
    if (atom === null) { pos.i++; continue; }

    // Check for quantifier
    const next = tokens[pos.i];
    if (next?.kind === 'quantifier') {
      pos.i++;
      parts.push(applyQuantifier(next.value, atom));
    } else {
      parts.push(atom);
    }
  }

  return parts;
}

function parseAlternation(tokens: Token[], pos: { i: number }): string {
  const branches: string[][] = [];
  branches.push(parseSequence(tokens, pos));

  while (tokens[pos.i]?.kind === 'alternation') {
    pos.i++;
    branches.push(parseSequence(tokens, pos));
  }

  if (branches.length === 1) {
    return branches[0].join(', followed by ');
  }

  // Alternation — flatten each branch into a phrase
  const branchPhrases = branches.map(b =>
    b.length === 0 ? '(nothing)' : b.join(' followed by ')
  );
  return `either ${branchPhrases.join(', or ')}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface RegexInterpretation {
  /** One sentence summary */
  summary: string;
  /** Ordered list of clauses for a detailed view */
  clauses: string[];
  /** True if the interpreter gave up and produced only a generic message */
  isFallback: boolean;
}

/**
 * Convert an XSD regex pattern to a human-readable explanation.
 * The input may still contain HTML entities — pass it through
 * `decodeHtmlEntities` before calling this if needed (the caller controls
 * whether to use the raw or decoded form).
 */
export function interpretRegex(raw: string): RegexInterpretation {
  try {
    const tokens = tokenise(raw);
    const pos = { i: 0 };
    const top = parseAlternation(tokens, pos);

    if (!top || top === raw) {
      return fallback(raw);
    }

    // Build clause list: split on ", followed by "
    const clauses = top
      .split(', followed by ')
      .map(c => c.trim())
      .filter(Boolean);

    const summary =
      clauses.length === 1
        ? `Matches ${clauses[0]}.`
        : `Matches ${clauses.slice(0, -1).join(', then ')}${clauses.length > 1 ? ', then ' + clauses[clauses.length - 1] : ''}.`;

    return { summary, clauses, isFallback: false };
  } catch {
    return fallback(raw);
  }
}

function fallback(raw: string): RegexInterpretation {
  return {
    summary: 'Complex pattern — see raw expression.',
    clauses: [raw],
    isFallback: true,
  };
}
