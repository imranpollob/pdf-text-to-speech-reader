import type { TextSegment } from '../types';

const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'rev', 'hon', 'st',
  'vs', 'etc', 'eg', 'ie', 'cf', 'ca', 'approx', 'al',
  'inc', 'ltd', 'corp', 'co', 'dept', 'univ',
  'fig', 'figs', 'sec', 'secs', 'eq', 'eqs', 'tab', 'vol', 'vols', 'no', 'nos', 'pp', 'ch', 'chap', 'app'
]);

function getWordBefore(chars: string[], i: number): string {
  let end = i - 1;
  while (end >= 0 && /\s/.test(chars[end])) end--;
  let start = end;
  while (start >= 0 && /[a-zA-Z0-9]/.test(chars[start])) start--;
  return chars.slice(start + 1, end + 1).join('');
}

function isSingleInitial(chars: string[], i: number): boolean {
  if (i === 1 && /[A-Z]/.test(chars[0])) return true;
  if (i >= 2 && /[A-Z]/.test(chars[i - 1])) {
    const prevChar = chars[i - 2];
    let p = i - 2;
    while (p >= 0 && /\s/.test(chars[p])) p--;
    if (p >= 0 && /\d/.test(chars[p])) return false;

    if (/[\s\(\[\.]/.test(prevChar)) return true;
  }
  return false;
}

/**
 * Check if the dot at position `i` represents a genuine sentence boundary.
 * Prevents false splits on decimals, URLs, version numbers, academic citations,
 * single-letter initials, abbreviations, and lowercase continuations.
 */
function isSentenceEndPeriod(
  chars: string[],
  i: number,
  parenDepth: number,
  bracketDepth: number
): boolean {
  const prev = i > 0 ? chars[i - 1] : '';
  const next = i + 1 < chars.length ? chars[i + 1] : '';

  // 1. Decimals and software version numbers: e.g., 3.14, 10.5.6
  if (/\d/.test(prev) && /\d/.test(next)) {
    return false;
  }

  // 2. Trailing ellipsis: .. or ...
  if (prev === '.' || next === '.') {
    let nextNonDot = i + 1;
    while (nextNonDot < chars.length && chars[nextNonDot] === '.') nextNonDot++;
    let nextNonSpace = nextNonDot;
    while (nextNonSpace < chars.length && /\s/.test(chars[nextNonSpace])) nextNonSpace++;
    if (nextNonSpace < chars.length && /[a-z]/.test(chars[nextNonSpace])) {
      return false;
    }
    if (next === '.') {
      return false;
    }
  }

  // 3. Dot inside non-whitespace token (e.g., domain name, file extension, URL, DOI, IP)
  if (next && !/[\s"'\)\]\}]/.test(next)) {
    return false;
  }

  // 4. Abbreviation or Single Initial check
  const word = getWordBefore(chars, i).toLowerCase();
  const isAbbr = ABBREVIATIONS.has(word);
  const isInitial = isSingleInitial(chars, i);

  let j = i + 1;
  while (j < chars.length && /["'\)\]\s]/.test(chars[j])) j++;
  const nextChar = j < chars.length ? chars[j] : '';
  const isNextLowercase = /[a-z]/.test(nextChar);

  if (isNextLowercase) {
    return false;
  }

  if (parenDepth > 0 || bracketDepth > 0) {
    if (isAbbr || isInitial) {
      return false;
    }
  }

  if (isInitial) {
    return false;
  }

  if (isAbbr) {
    const canEndSentence = (word === 'etc' || word === 'pm' || word === 'am');
    if (!canEndSentence) {
      return false;
    }
  }

  return true;
}

/**
 * Normalize raw PDF.js text items into NaturalReader-like "sentence" chunks.
 * We keep span ordering from PDF.js (page-${pageIndex}-span-${idx}) and
 * split on punctuation boundaries while keeping per-span fragments so
 * sentences that share a single PDF span can still be wrapped separately.
 */
export function normalizeText(
  textItems: unknown[],
  pageIndex: number
): TextSegment[] {
  const fullTextChars: string[] = [];
  const charToSpanMap: { spanId: string }[] = [];
  const spanTextMap: Map<string, string[]> = new Map();

  textItems.forEach((item, idx) => {
    const textItem = item as { str?: string; hasEOL?: boolean } | null;
    const raw = typeof textItem?.str === 'string' ? textItem.str : '';
    if (raw.length === 0) return;

    const spanId = `page-${pageIndex}-span-${idx}`;

    for (const ch of raw) {
      fullTextChars.push(ch);
      charToSpanMap.push({ spanId });
      const bucket = spanTextMap.get(spanId) ?? [];
      bucket.push(ch);
      spanTextMap.set(spanId, bucket);
    }

    // Add a space separator when the PDF item doesn't already end with
    // whitespace or a hyphen. This prevents words from merging while still
    // allowing hyphenated line-breaks to stay contiguous.
    const endsWithWhitespace = /\s$/.test(raw);
    const endsWithHyphen = raw.endsWith('-');

    if (textItem?.hasEOL) {
      fullTextChars.push('\n');
      charToSpanMap.push({ spanId: 'EOL' });
    } else if (!endsWithWhitespace && !endsWithHyphen) {
      fullTextChars.push(' ');
      charToSpanMap.push({ spanId: 'SPACE' });
    }
  });

  const text = fullTextChars.join('');
  const segments: TextSegment[] = [];

  let segStart = 0;

  const flushSegment = (endExclusive: number) => {
    if (endExclusive <= segStart) return;

    const rawSegment = text.slice(segStart, endExclusive);

    // Remove hyphenation that occurs at line breaks / span boundaries.
    // This removes a hyphen followed by any whitespace/newline so that
    // "re-\nports" or "re- ports" becomes "reports". We then
    // collapse other whitespace into single spaces.
    const segmentText = rawSegment.replace(/-\s+/g, '').replace(/\s+/g, ' ').trim();
    if (!segmentText) {
      segStart = endExclusive;
      return;
    }

    const spanIds = new Set<string>();
    const spanFragments: { spanId: string; text: string }[] = [];

    let currentSpan: string | null = null;
    let buffer = '';

    for (let i = segStart; i < endExclusive; i++) {
      const mapped = charToSpanMap[i];
      if (!mapped) continue;
      if (mapped.spanId === 'SPACE' || mapped.spanId === 'EOL') continue;
      spanIds.add(mapped.spanId);

      if (mapped.spanId !== currentSpan) {
        if (buffer && currentSpan) {
          spanFragments.push({ spanId: currentSpan, text: buffer });
        }
        currentSpan = mapped.spanId;
        buffer = '';
      }

      buffer += fullTextChars[i];
    }

    if (buffer && currentSpan) {
      spanFragments.push({ spanId: currentSpan, text: buffer });
    }

    segments.push({
      id: crypto.randomUUID(),
      text: segmentText,
      pageNumber: pageIndex,
      spanIds: Array.from(spanIds),
      spanFragments,
    });

    segStart = endExclusive;
  };

  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < fullTextChars.length; i++) {
    const ch = fullTextChars[i];
    if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);

    let isSentenceEnd = /[.!:?]/.test(ch);

    if (isSentenceEnd && ch === '.') {
      isSentenceEnd = isSentenceEndPeriod(fullTextChars, i, parenDepth, bracketDepth);
    }

    if (isSentenceEnd) {
      let end = i + 1;
      while (end < fullTextChars.length && /["'\)\]]/.test(fullTextChars[end])) {
        end++;
      }
      flushSegment(end);
      i = end - 1;
    }
  }

  // Flush any trailing text.
  flushSegment(fullTextChars.length);

  return segments;
}

/**
 * Helper to split a single text line into sentences using punctuation boundaries.
 */
function splitLineIntoSentences(line: string): string[] {
  const chars = [...line];
  const sentences: string[] = [];
  let start = 0;

  const flush = (endExclusive: number) => {
    if (endExclusive <= start) return;
    const s = line.slice(start, endExclusive).trim();
    if (s) sentences.push(s);
    start = endExclusive;
  };

  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);

    let isSentenceEnd = /[.!?]/.test(ch);

    if (isSentenceEnd && ch === '.') {
      isSentenceEnd = isSentenceEndPeriod(chars, i, parenDepth, bracketDepth);
    }

    if (isSentenceEnd) {
      let end = i + 1;
      while (end < chars.length && /["'\)\]]/.test(chars[end])) {
        end++;
      }
      flush(end);
      i = end - 1;
    }
  }

  flush(chars.length);
  return sentences.length > 0 ? sentences : [line.trim()];
}

/**
 * Normalise a raw text string (pasted or typed) into sentence segments,
 * preserving paragraphs, line breaks, and natural document organization.
 */
export function normalizeRawText(text: string): TextSegment[] {
  if (!text || !text.trim()) return [];

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawParagraphs = normalized.split(/\n{2,}/);
  const segments: TextSegment[] = [];

  let paraIdx = 0;

  for (const rawPara of rawParagraphs) {
    const trimmedPara = rawPara.trim();
    if (!trimmedPara) continue;

    const lines = trimmedPara.split(/\n/);

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const isLastLineInPara = lineIdx === lines.length - 1;
      const lineSentences = splitLineIntoSentences(trimmedLine);

      for (let sIdx = 0; sIdx < lineSentences.length; sIdx++) {
        const segText = lineSentences[sIdx];
        const isLastSegInLine = sIdx === lineSentences.length - 1;

        let trailingNewlines = 0;
        if (isLastSegInLine) {
          trailingNewlines = isLastLineInPara ? 2 : 1;
        }

        segments.push({
          id: crypto.randomUUID(),
          text: segText,
          pageNumber: 1,
          spanIds: [],
          paragraphIndex: paraIdx,
          trailingNewlines,
        });
      }
    }

    paraIdx++;
  }

  return segments;
}
