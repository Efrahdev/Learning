/** Small pieces shared by the home page and the map islands. */
import type { LessonItem } from '@lib/catalogue';
import { parts } from './search';

export function Highlight({ text, ts }: { text: string; ts: string[] }) {
  return (
    <>
      {parts(text, ts).map((p, i) => (p.hit ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}
    </>
  );
}

type IconName = 'search' | 'spark' | 'book' | 'arrow' | 'dice' | 'map' | 'plus' | 'minus' | 'close' | 'chevron';
const PATHS: Record<IconName, string> = {
  search: 'M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm5.3 12.8L21 21',
  spark: 'M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9L12 2.5ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Zm0 15A2.5 2.5 0 0 0 6.5 23H20v-5M8 7.5h8M8 11h6',
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  dice: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 4.5h.01M16 7.5h.01M12 12h.01M8 16.5h.01M16 16.5h.01',
  map: 'M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Zm0 0v13m6-10.5v13',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  chevron: 'm9 6 6 6-6 6',
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const filled = name === 'spark';
  return (
    <svg className={`ico ico-${name}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth={name === 'dice' ? 2.4 : 1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** "Interactive" for older lessons that open as their own animated app, "Read" (with minutes) for written ones. */
export function KindBadge({ lesson }: { lesson: LessonItem }) {
  return lesson.interactive ? (
    <span className="kind kind-live"><Icon name="spark" size={15} /> Interactive</span>
  ) : (
    <span className="kind kind-read"><Icon name="book" size={15} /> Read{lesson.minutes ? ` · ${lesson.minutes} min` : ''}</span>
  );
}

export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
