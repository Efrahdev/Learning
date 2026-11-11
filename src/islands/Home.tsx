/**
 * The home page. Its job: get to any lesson fast.
 *
 *  1. Hero: the promise, instant search, and the Shelf, a still picture of the library where
 *     each subject is a book (the thicker the book, the more lessons inside). Tapping a book opens it.
 *  2. The library: every lesson, grouped by subject and topic, each ONE tap from here.
 *     A filter (All / Interactive / Reading) and a row of subject shortcuts sit on top.
 *
 * Built phone first: everything stacks in one column, nothing is pinned to the screen,
 * and every tap target is at least 48px tall.
 */
import { useEffect, useId, useState, type CSSProperties } from 'react';
import { LazyMotion, MotionConfig, domMax, m } from 'motion/react';
import type { Catalogue, FolderItem, LessonItem } from '@lib/catalogue';
import SearchBox from './SearchBox';
import { Icon, plural } from './ui';
import './islands.css';
import './home.css';

type Kind = 'all' | 'live' | 'read';
const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 } as const;
const vt = (name: string) => ({ viewTransitionName: name }) as CSSProperties;

export default function Home({ data, mapHref }: { data: Catalogue; mapHref: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domMax} strict>
        <Hero data={data} />
        <Library data={data} mapHref={mapHref} />
      </LazyMotion>
    </MotionConfig>
  );
}

/* ───────────────────────── Hero ───────────────────────── */

function greetingFor(h: number) {
  return h < 5 ? 'Up late? Hello' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function Hero({ data }: { data: Catalogue }) {
  const [greeting, setGreeting] = useState('Hello');
  useEffect(() => setGreeting(greetingFor(new Date().getHours())), []);
  const { totals } = data;
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="hello">{greeting}!</p>
        <h1 id="hero-title" className="hero-title">
          Learn how everything <span className="hero-accent">works.</span>
        </h1>
        <p className="hero-lead">
          {totals.lessons} lessons across {totals.subjects} subjects: {totals.interactive} hands-on labs to play with,
          and {totals.lessons - totals.interactive} friendly guides to read.
        </p>
        <div className="search-wrap">
          <SearchBox lessons={data.lessons} />
        </div>
        <a className="browse" href="#library">Browse every lesson <Icon name="arrow" size={18} /></a>
      </div>
      <Shelf subjects={data.subjects} />
    </section>
  );
}

/** The library as a shelf of books: one book per subject, thicker when it holds more lessons. Still, not animated. */
function Shelf({ subjects }: { subjects: FolderItem[] }) {
  const most = Math.max(1, ...subjects.map((s) => s.count));
  const heights = [94, 100, 86, 97, 90, 100, 92, 84, 96, 88];
  return (
    <figure className="shelf">
      <div className="shelf-books">
        {subjects.map((s, n) => (
          <a
            key={s.path}
            href={s.href}
            data-accent={s.accent}
            className={`book${s.count ? '' : ' is-empty'}`}
            style={{ '--grow': (1 + (2.4 * s.count) / most).toFixed(2), '--h': `${heights[n % heights.length]}%` } as CSSProperties}
            aria-label={`${s.title}: ${s.count ? plural(s.count, 'lesson') : 'coming soon'}`}
          >
            <span className="book-icon" aria-hidden="true" style={vt(`icon-${s.slug}`)}>{s.icon ?? '📘'}</span>
            <span className="book-title" aria-hidden="true">{s.title}</span>
            <span className="book-n" aria-hidden="true">{s.count}</span>
          </a>
        ))}
        <span className="bookend" aria-hidden="true" />
      </div>
      <figcaption>Each book is a subject. The thicker the book, the more lessons inside.</figcaption>
    </figure>
  );
}

/* ───────────────────────── The library: every lesson, one tap away ───────────────────────── */

interface Group { title: string | null; href?: string; lessons: LessonItem[] }

const flatten = (f: FolderItem): LessonItem[] => [...f.lessons, ...f.folders.flatMap(flatten)];

/** A subject's lessons in reading order: its own lessons first ("General"), then each topic. */
function groupsOf(s: FolderItem): Group[] {
  const out: Group[] = [];
  if (s.lessons.length) out.push({ title: s.folders.length ? 'General' : null, lessons: s.lessons });
  for (const f of s.folders) out.push({ title: f.title, href: f.href, lessons: flatten(f) });
  return out;
}

function Library({ data, mapHref }: { data: Catalogue; mapHref: string }) {
  const [kind, setKind] = useState<Kind>('all');
  const keep = (l: LessonItem) => kind === 'all' || (kind === 'live') === l.interactive;
  const shown = data.lessons.filter(keep).length;
  return (
    <section id="library" className="library" aria-labelledby="library-title">
      <div className="lib-head">
        <div className="lib-title">
          <p className="eyebrow">The library</p>
          <h2 id="library-title" className="section-title">Every lesson, one tap away</h2>
        </div>
        <Segmented
          label="Kind of lesson"
          value={kind}
          onChange={setKind}
          options={[{ v: 'all', label: 'All' }, { v: 'live', label: 'Interactive' }, { v: 'read', label: 'Reading' }]}
        />
      </div>
      <p className="meta lib-count" role="status">
        {kind === 'all' ? plural(shown, 'lesson') : `${plural(shown, kind === 'live' ? 'interactive lesson' : 'guide')}`}
      </p>
      <nav className="jump" aria-label="Jump to a subject">
        {data.subjects.map((s) => {
          const n = flatten(s).filter(keep).length;
          return (
            <a key={s.path} href={`#s-${s.slug}`} data-accent={s.accent} className={`jump-chip${n ? '' : ' is-dim'}`}>
              <span aria-hidden="true">{s.icon}</span> {s.title} <span className="jump-n">{n}</span>
            </a>
          );
        })}
      </nav>
      <div className="subjects">
        {data.subjects.map((s) => <SubjectBlock key={s.path} s={s} keep={keep} filtered={kind !== 'all'} />)}
      </div>
      <p className="lib-foot">
        Prefer a picture of everything? <a href={mapHref}>Open the library map <Icon name="arrow" size={16} /></a>
      </p>
    </section>
  );
}

function SubjectBlock({ s, keep, filtered }: { s: FolderItem; keep: (l: LessonItem) => boolean; filtered: boolean }) {
  const groups = groupsOf(s).map((g) => ({ ...g, lessons: g.lessons.filter(keep) })).filter((g) => g.lessons.length);
  const n = groups.reduce((sum, g) => sum + g.lessons.length, 0);
  return (
    <section id={`s-${s.slug}`} data-accent={s.accent} className={`subj${n ? '' : ' is-empty'}`} aria-labelledby={`t-${s.slug}`}>
      <header className="subj-head">
        <span className="subj-icon" aria-hidden="true">{s.icon ?? '📁'}</span>
        <div className="subj-text">
          <h3 id={`t-${s.slug}`} className="subj-title"><a href={s.href}>{s.title}</a></h3>
          {s.blurb && <p className="subj-blurb">{s.blurb}</p>}
        </div>
        <span className="subj-n">{n ? plural(n, 'lesson') : filtered ? 'None of this kind' : 'Coming soon'}</span>
      </header>
      {groups.length > 0 && (
        <div className="subj-body">
          {groups.map((g) => (
            <div key={g.title ?? 'all'} className="grp">
              {g.title && <h4 className="grp-title">{g.href ? <a href={g.href}>{g.title}</a> : g.title}</h4>}
              <ul className="lrows" role="list">
                {g.lessons.map((l) => <li key={l.id}><LessonRow l={l} /></li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function LessonRow({ l }: { l: LessonItem }) {
  return (
    <a className="lrow" href={l.href}>
      <span className={`lrow-kind${l.interactive ? ' live' : ''}`} aria-hidden="true"><Icon name={l.interactive ? 'spark' : 'book'} size={18} /></span>
      <span className="lrow-text">
        <span className="lrow-title">{l.title}</span>
        <span className="lrow-meta">{l.interactive ? 'Interactive' : `Read${l.minutes ? ` · ${l.minutes} min` : ''}`}</span>
      </span>
      <span className="lrow-go" aria-hidden="true"><Icon name="chevron" size={18} /></span>
    </a>
  );
}

function Segmented<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  const id = useId();
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>
          {value === o.v && <m.span layoutId={`seg-${id}`} className="seg-pill" transition={spring} />}
          <span className="seg-label">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
