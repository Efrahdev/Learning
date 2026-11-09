/**
 * Instant lesson search, shared by the home page and the map. Runs in the browser over the small catalogue.
 * Every word typed must match somewhere; matches in the title count most, then folders, tags and summary.
 */
import type { LessonItem } from '@lib/catalogue';

export const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const terms = (q: string) => fold(q).split(/[^a-z0-9+#]+/).filter((t) => t.length > 0);

function fieldScore(text: string, t: string, weight: number): number {
  const s = fold(text);
  const i = s.indexOf(t);
  if (i < 0) return 0;
  const wordStart = i === 0 || !/[a-z0-9]/.test(s[i - 1]);
  return weight * (wordStart ? 2 : 1) + (s === t ? weight * 2 : 0);
}

export function score(l: LessonItem, ts: string[]): number {
  let total = 0;
  for (const t of ts) {
    const best = Math.max(
      fieldScore(l.title, t, 10),
      fieldScore(l.trail.join(' '), t, 5),
      fieldScore(l.tags.join(' '), t, 5),
      fieldScore(l.summary, t, 2),
    );
    if (!best) return 0;
    total += best;
  }
  return total;
}

export function search(lessons: LessonItem[], q: string, limit = Infinity): LessonItem[] {
  const ts = terms(q);
  if (!ts.length) return [];
  return lessons
    .map((l, i) => ({ l, i, s: score(l, ts) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.l);
}

/** Splits text into plain and matching parts, so matches can be shown in <mark>. */
export function parts(text: string, ts: string[]): { text: string; hit: boolean }[] {
  if (!ts.length) return [{ text, hit: false }];
  const s = fold(text);
  const hits = new Array(text.length).fill(false);
  for (const t of ts) {
    for (let i = s.indexOf(t); i >= 0; i = s.indexOf(t, i + 1)) for (let k = i; k < i + t.length; k++) hits[k] = true;
  }
  const out: { text: string; hit: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = out[out.length - 1];
    if (last && last.hit === hits[i]) last.text += text[i];
    else out.push({ text: text[i], hit: hits[i] });
  }
  return out;
}
