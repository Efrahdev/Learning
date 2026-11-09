/**
 * The home page: a welcoming hero with instant search, the subjects as a bento grid,
 * and an explorer that filters every lesson with fluid layout animations.
 *
 * Entrance effects are plain CSS (they run before React wakes up); Motion handles the
 * interactive animations (filter pills, cards re-flowing, search results).
 */
import { useEffect, useId, useState, type CSSProperties, type PointerEvent } from 'react';
import { AnimatePresence, LazyMotion, MotionConfig, domMax, m } from 'motion/react';
import type { Catalogue, FolderItem, LessonItem } from '@lib/catalogue';
import SearchBox from './SearchBox';
import { Icon, KindBadge, plural } from './ui';
import './islands.css';
import './home.css';

const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 } as const;
const vt = (name: string) => ({ viewTransitionName: name }) as CSSProperties;

export default function Home({ data, mapHref }: { data: Catalogue; mapHref: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domMax} strict>
        <Hero data={data} mapHref={mapHref} />
        <Subjects subjects={data.subjects} />
        <Explorer data={data} />
        <MapPromo href={mapHref} totals={data.totals} />
      </LazyMotion>
    </MotionConfig>
  );
}

/* ───────────────────────── Hero ───────────────────────── */

function greetingFor(h: number) {
  return h < 5 ? 'Still up? Hello, night owl' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function Hero({ data, mapHref }: { data: Catalogue; mapHref: string }) {
  const [greeting, setGreeting] = useState('Hello');
  useEffect(() => setGreeting(greetingFor(new Date().getHours())), []);
  const surprise = () => {
    const pick = data.lessons[Math.floor(Math.random() * data.lessons.length)];
    if (pick) location.assign(pick.href);
  };
  const { totals } = data;
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="aurora" aria-hidden="true">
        <span data-accent="blue" /><span data-accent="violet" /><span data-accent="rose" /><span data-accent="teal" />
      </div>
      <div className="hero-inner">
        <p className="hello rise" style={{ '--i': 0 } as CSSProperties}>
          <span className="wave" aria-hidden="true">👋</span> {greeting}!
        </p>
        <h1 id="hero-title" className="hero-title">
          {['What', 'shall', 'we'].map((w, i) => (
            <span key={w} className="word rise" style={{ '--i': i + 1 } as CSSProperties}>{w} </span>
          ))}
          <span className="word rise shine" style={{ '--i': 4 } as CSSProperties}>explore</span>{' '}
          <span className="word rise" style={{ '--i': 5 } as CSSProperties}>today?</span>
        </h1>
        <p className="hero-lead rise" style={{ '--i': 6 } as CSSProperties}>
          Every lesson, animation and guide we have made, all in one calm place. Search for anything, or pick a subject below.
        </p>
        <div className="search-wrap rise" style={{ '--i': 7 } as CSSProperties}>
          <SearchBox lessons={data.lessons} />
        </div>
        <div className="hero-actions rise" style={{ '--i': 8 } as CSSProperties}>
          <button type="button" className="btn pop" onClick={surprise}><Icon name="dice" /> Surprise me</button>
          <a className="btn quiet pop" href={mapHref}><Icon name="map" /> See the whole map</a>
        </div>
        <ul className="stats rise" style={{ '--i': 9 } as CSSProperties} role="list">
          <Stat n={totals.subjects} label="subjects" />
          <Stat n={totals.topics} label="topics" />
          <Stat n={totals.lessons} label="lessons" />
          <Stat n={totals.interactive} label="interactive" />
        </ul>
      </div>
    </section>
  );
}

/** The number counts up with a pure-CSS animation (an animatable @property counter). */
function Stat({ n, label }: { n: number; label: string }) {
  return (
    <li className="stat">
      <span className="stat-n" style={{ '--to': n } as CSSProperties} aria-hidden="true" />
      <span className="sr-only">{n}</span>
      <span className="stat-label">{label}</span>
    </li>
  );
}

/* ───────────────────────── Subjects (bento grid) ───────────────────────── */

function Subjects({ subjects }: { subjects: FolderItem[] }) {
  // The biggest subjects get wide tiles, so the grid has rhythm instead of a flat wall of cards.
  // Just enough of them that a three-column grid ends on a full row (no lonely tile at the end).
  const n = (3 - (subjects.length % 3)) % 3 || (subjects.length >= 6 ? 3 : 0);
  const wide = new Set([...subjects].filter((s) => s.count > 0).sort((a, b) => b.count - a.count).slice(0, n).map((s) => s.path));
  return (
    <section className="section" aria-labelledby="subjects-title">
      <div className="section-head">
        <p className="eyebrow">Subjects</p>
        <h2 id="subjects-title" className="section-title">Choose your adventure</h2>
      </div>
      <ul className="bento" role="list">
        {subjects.map((s, i) => <SubjectCard key={s.path} s={s} wide={wide.has(s.path)} index={i} />)}
      </ul>
    </section>
  );
}

function SubjectCard({ s, wide, index }: { s: FolderItem; wide: boolean; index: number }) {
  const empty = s.count === 0;
  const topics = s.folders.map((f) => f.title);
  // Pointer-following light and a gentle 3D tilt, written straight to CSS variables (no re-render).
  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget, r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
    el.style.setProperty('--ry', `${(x - 0.5) * 7}deg`);
    el.style.setProperty('--rx', `${(0.5 - y) * 7}deg`);
  };
  const onLeave = (e: PointerEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
  };
  return (
    <li className={`bento-cell${wide ? ' wide' : ''}`} data-accent={s.accent} style={{ '--i': index } as CSSProperties}>
      <a className={`subject${empty ? ' is-empty' : ''}`} href={s.href} onPointerMove={onMove} onPointerLeave={onLeave}>
        <span className="subject-glow" aria-hidden="true" />
        <span className="subject-top">
          <span className="subject-icon" aria-hidden="true" style={vt(`icon-${s.slug}`)}>{s.icon ?? '📁'}</span>
          {empty ? <span className="soon">Coming soon</span> : <span className="subject-count">{plural(s.count, 'lesson')}</span>}
        </span>
        <span className="subject-name" style={vt(`title-${s.slug}`)}>{s.title}</span>
        {s.blurb && <span className="subject-blurb">{s.blurb}</span>}
        {topics.length > 0 && (
          <span className="topics">
            {topics.slice(0, wide ? 5 : 3).map((t) => <span key={t} className="topic">{t}</span>)}
            {topics.length > (wide ? 5 : 3) && <span className="topic more">+{topics.length - (wide ? 5 : 3)}</span>}
          </span>
        )}
        <span className="subject-foot">
          <span className="meta">{s.interactive ? `${s.interactive} interactive` : empty ? 'Lessons on the way' : plural(s.folders.length || 1, 'topic')}</span>
          <span className="go" aria-hidden="true"><Icon name="arrow" /></span>
        </span>
      </a>
    </li>
  );
}

/* ───────────────────────── Explorer (every lesson) ───────────────────────── */

type Kind = 'all' | 'live' | 'read';
const PAGE = 12;

function Explorer({ data }: { data: Catalogue }) {
  const [subject, setSubject] = useState('all');
  const [kind, setKind] = useState<Kind>('all');
  const [shown, setShown] = useState(PAGE);
  const subjects = data.subjects.filter((s) => s.count > 0);
  const list = data.lessons.filter(
    (l) => (subject === 'all' || l.subject === subject) && (kind === 'all' || (kind === 'live') === l.interactive),
  );
  useEffect(() => setShown(PAGE), [subject, kind]);
  const visible = list.slice(0, shown);

  return (
    <section className="section" aria-labelledby="explore-title">
      <div className="section-head row">
        <div>
          <p className="eyebrow">Explore</p>
          <h2 id="explore-title" className="section-title">Every lesson</h2>
        </div>
        <Segmented
          label="Kind of lesson"
          value={kind}
          onChange={setKind}
          options={[{ v: 'all', label: 'All' }, { v: 'live', label: 'Interactive' }, { v: 'read', label: 'Reading' }]}
        />
      </div>
      <div className="chips" role="toolbar" aria-label="Filter by subject">
        {[{ path: 'all', title: 'Everything', icon: '✨', accent: undefined }, ...subjects].map((s) => {
          const on = subject === s.path;
          return (
            <button key={s.path} type="button" className={`chip${on ? ' on' : ''}`} aria-pressed={on} data-accent={s.accent} onClick={() => setSubject(s.path)}>
              {on && <m.span layoutId="chip-pill" className="chip-pill" transition={spring} />}
              <span className="chip-label"><span aria-hidden="true">{s.icon}</span> {s.title}</span>
            </button>
          );
        })}
      </div>
      <p className="meta count" role="status">{plural(list.length, 'lesson')}</p>
      <m.ul className="lesson-grid" role="list" layout>
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((l) => (
            <m.li
              key={l.id}
              layout
              data-accent={l.accent}
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={spring}
            >
              <LessonCard l={l} />
            </m.li>
          ))}
        </AnimatePresence>
      </m.ul>
      {list.length === 0 && <p className="lead empty-note">No lessons of that kind here yet.</p>}
      {shown < list.length && (
        <div className="more-wrap">
          <button type="button" className="btn quiet pop" onClick={() => setShown((n) => n + PAGE)}>
            Show more <span className="meta">({list.length - shown} left)</span>
          </button>
        </div>
      )}
    </section>
  );
}

function LessonCard({ l }: { l: LessonItem }) {
  return (
    <a className="lesson" href={l.href}>
      <span className="lesson-trail"><span aria-hidden="true">{l.icon}</span> {l.trail.join(' › ')}</span>
      <span className="lesson-title">{l.title}</span>
      {l.summary && <span className="lesson-summary">{l.summary}</span>}
      <span className="lesson-foot"><KindBadge lesson={l} /><span className="go" aria-hidden="true"><Icon name="arrow" size={18} /></span></span>
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

/* ───────────────────────── Map promo ───────────────────────── */

function MapPromo({ href, totals }: { href: string; totals: Catalogue['totals'] }) {
  return (
    <section className="section">
      <a className="promo" href={href}>
        <svg className="promo-art" viewBox="0 0 220 120" aria-hidden="true">
          <g fill="none" strokeWidth="2.5" strokeLinecap="round">
            <path className="branch b1" d="M24 60 C70 60 70 22 116 22" />
            <path className="branch b2" d="M24 60 H116" />
            <path className="branch b3" d="M24 60 C70 60 70 98 116 98" />
            <path className="branch b4" d="M136 22 C160 22 160 10 190 10 M136 22 C160 22 160 34 190 34" />
            <path className="branch b5" d="M136 98 C160 98 160 86 190 86 M136 98 C160 98 160 110 190 110" />
          </g>
          <circle cx="24" cy="60" r="9" className="node n0" />
          {[22, 60, 98].map((y, i) => <circle key={y} cx="126" cy={y} r="7" className={`node n${i + 1}`} />)}
          {[10, 34, 86, 110].map((y) => <circle key={y} cx="196" cy={y} r="5" className="node leaf" />)}
        </svg>
        <span className="promo-text">
          <span className="eyebrow">The library map</span>
          <span className="promo-title">See all {totals.lessons} lessons on one page</span>
          <span className="promo-sub">Every subject, topic and lesson, laid out as one tree you can search.</span>
        </span>
        <span className="go big" aria-hidden="true"><Icon name="arrow" size={26} /></span>
      </a>
    </section>
  );
}
