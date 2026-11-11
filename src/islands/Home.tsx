/**
 * The home page, built around one idea: the library is a small universe of learning.
 *
 *  1. Hero: a bold promise, instant search, and the Library Orbit (each subject a world,
 *     each moon a lesson). Pointing at a world, or at its name, wakes it up.
 *  2. A band of numbers, then the subjects as an editorial, numbered index.
 *  3. "Two ways to learn": interactive labs and deep guides.
 *  4. Every lesson, filterable, and the map.
 *
 * Entrance effects are plain CSS (they play before React wakes up); Motion handles the
 * interactive animations (filter pills, cards re-flowing, search results).
 */
import { useEffect, useId, useState, type CSSProperties } from 'react';
import { AnimatePresence, LazyMotion, MotionConfig, domMax, m } from 'motion/react';
import type { Catalogue, FolderItem, LessonItem } from '@lib/catalogue';
import SearchBox from './SearchBox';
import Orbit from './Orbit';
import { Icon, KindBadge, plural } from './ui';
import './islands.css';
import './home.css';

const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 } as const;
const vt = (name: string) => ({ viewTransitionName: name }) as CSSProperties;
const i = (n: number) => ({ '--i': n }) as CSSProperties;

export default function Home({ data, mapHref }: { data: Catalogue; mapHref: string }) {
  const [kind, setKind] = useState<Kind>('all');
  const pickKind = (k: Kind) => {
    setKind(k);
    document.getElementById('explore')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domMax} strict>
        <div className="grain" aria-hidden="true" />
        <Hero data={data} />
        <Numbers totals={data.totals} />
        <SubjectIndex subjects={data.subjects} />
        <TwoWays data={data} onPick={pickKind} />
        <Explorer data={data} kind={kind} setKind={setKind} />
        <MapPromo href={mapHref} totals={data.totals} />
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
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => setGreeting(greetingFor(new Date().getHours())), []);
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="hello rise" style={i(0)}>
          <span className="hello-dot" aria-hidden="true" /> {greeting}! {data.totals.lessons} lessons are waiting.
        </p>
        <h1 id="hero-title" className="hero-title">
          <span className="line"><span className="line-in" style={i(1)}>Learn how</span></span>
          <span className="line"><span className="line-in" style={i(2)}>everything</span></span>
          <span className="line"><span className="line-in hero-accent" style={i(3)}>works.</span></span>
        </h1>
        <p className="hero-lead rise" style={i(5)}>
          Hands-on labs and friendly, deep guides across maths, science, coding, English and technology.
          Pick a world to explore, or search for any idea.
        </p>
        <div className="search-wrap rise" style={i(6)}>
          <SearchBox lessons={data.lessons} />
        </div>
      </div>

      <div className="hero-visual rise" style={i(4)}>
        <Orbit subjects={data.subjects} active={active} onActive={setActive} />
        <p className="orbit-caption"><span aria-hidden="true">●</span> Each world is a subject. Each moon is a lesson.</p>
        <nav className="worlds" aria-label="Subjects">
          {data.subjects.map((s) => (
            <a key={s.path} href={s.href} data-accent={s.accent} className={`world${active === s.path ? ' on' : ''}${s.count ? '' : ' soon'}`}
              onPointerEnter={() => setActive(s.path)} onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(s.path)} onBlur={() => setActive(null)}>
              <span aria-hidden="true">{s.icon}</span> {s.title}
              <span className="world-n">{s.count || 'soon'}</span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}

/* ───────────────────────── Numbers ───────────────────────── */

function Numbers({ totals }: { totals: Catalogue['totals'] }) {
  const items = [
    { n: totals.lessons, label: 'lessons', note: 'in one place' },
    { n: totals.interactive, label: 'interactive labs', note: 'to touch and try' },
    { n: totals.lessons - totals.interactive, label: 'deep guides', note: 'to read slowly' },
    { n: totals.subjects, label: 'subjects', note: `and ${totals.topics} topics` },
  ];
  return (
    <section className="numbers" aria-label="The library in numbers">
      <ul role="list">
        {items.map((x) => (
          <li key={x.label} className="num-item">
            <span className="stat-n" style={{ '--to': x.n } as CSSProperties} aria-hidden="true" />
            <span className="sr-only">{x.n}</span>
            <span className="num-label">{x.label}</span>
            <span className="num-note">{x.note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────────────────────── Subjects: an editorial index ───────────────────────── */

function SubjectIndex({ subjects }: { subjects: FolderItem[] }) {
  return (
    <section className="section" aria-labelledby="subjects-title">
      <div className="section-head">
        <p className="eyebrow">Contents</p>
        <h2 id="subjects-title" className="section-title">Choose a subject</h2>
      </div>
      <ol className="index" role="list">
        {subjects.map((s, n) => (
          <li key={s.path} data-accent={s.accent} className="index-item">
            <a className={`row${s.count ? '' : ' is-empty'}`} href={s.href}>
              <span className="row-num" aria-hidden="true">{String(n + 1).padStart(2, '0')}</span>
              <span className="row-icon" aria-hidden="true" style={vt(`icon-${s.slug}`)}>{s.icon ?? '📁'}</span>
              <span className="row-main">
                <span className="row-title" style={vt(`title-${s.slug}`)}>{s.title}</span>
                {s.blurb && <span className="row-blurb">{s.blurb}</span>}
              </span>
              {s.folders.length > 0 && (
                <span className="row-topics" aria-label="Topics">
                  {s.folders.slice(0, 4).map((f) => <span key={f.path} className="topic">{f.title}</span>)}
                  {s.folders.length > 4 && <span className="topic more">+{s.folders.length - 4}</span>}
                </span>
              )}
              <span className="row-count">
                {s.count ? <><b>{s.count}</b> {s.count === 1 ? 'lesson' : 'lessons'}</> : <span className="soon">Coming soon</span>}
              </span>
              <span className="go" aria-hidden="true"><Icon name="arrow" /></span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ───────────────────────── Two ways to learn ───────────────────────── */

/** Up to three lessons of one kind, each from a different subject where possible. */
function sample(list: LessonItem[], count = 3) {
  const out: LessonItem[] = [], seen = new Set<string>();
  for (const l of list) if (!seen.has(l.subject) && out.length < count) { out.push(l); seen.add(l.subject); }
  for (const l of list) if (out.length < count && !out.includes(l)) out.push(l);
  return out;
}

function TwoWays({ data, onPick }: { data: Catalogue; onPick: (k: Kind) => void }) {
  const labs = data.lessons.filter((l) => l.interactive);
  const guides = data.lessons.filter((l) => !l.interactive);
  const ways = [
    { k: 'live' as const, cls: 'way-labs', icon: 'spark' as const, title: 'Interactive labs', count: labs.length,
      text: 'Drag, slide, press and watch. Ideas you can play with until they click.', list: sample(labs) },
    { k: 'read' as const, cls: 'way-guides', icon: 'book' as const, title: 'Deep guides', count: guides.length,
      text: 'Read at your own pace, with clear diagrams and real-world examples.', list: sample(guides) },
  ];
  return (
    <section className="section" aria-labelledby="ways-title">
      <div className="section-head">
        <p className="eyebrow">How to learn here</p>
        <h2 id="ways-title" className="section-title">Two ways to learn</h2>
      </div>
      <div className="ways">
        {ways.map((w) => (
          <article key={w.k} className={`way ${w.cls}`}>
            <div className="way-head">
              <span className="way-icon"><Icon name={w.icon} size={26} /></span>
              <span className="way-count"><b>{w.count}</b> lessons</span>
            </div>
            <h3 className="way-title">{w.title}</h3>
            <p className="way-text">{w.text}</p>
            <ul className="way-list" role="list">
              {w.list.map((l) => (
                <li key={l.id} data-accent={l.accent}>
                  <a href={l.href}><span aria-hidden="true">{l.icon}</span><span className="way-l">{l.title}</span><Icon name="arrow" size={16} /></a>
                </li>
              ))}
            </ul>
            <button type="button" className="btn quiet pop way-all" onClick={() => onPick(w.k)}>See all {w.count} <Icon name="arrow" size={18} /></button>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── Explorer (every lesson) ───────────────────────── */

type Kind = 'all' | 'live' | 'read';
const PAGE = 12;

function Explorer({ data, kind, setKind }: { data: Catalogue; kind: Kind; setKind: (k: Kind) => void }) {
  const [subject, setSubject] = useState('all');
  const [shown, setShown] = useState(PAGE);
  const subjects = data.subjects.filter((s) => s.count > 0);
  const list = data.lessons.filter(
    (l) => (subject === 'all' || l.subject === subject) && (kind === 'all' || (kind === 'live') === l.interactive),
  );
  useEffect(() => setShown(PAGE), [subject, kind]);
  const visible = list.slice(0, shown);

  return (
    <section className="section" id="explore" aria-labelledby="explore-title">
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
