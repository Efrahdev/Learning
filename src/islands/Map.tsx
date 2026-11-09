/**
 * The library map: the whole tree on one page. Each subject is a branch; its topics are cards;
 * lessons hang off each topic as leaves. Live filtering highlights matches and folds away the rest,
 * and every change animates (Motion), so the reader never loses their place.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, LazyMotion, MotionConfig, domMax, m } from 'motion/react';
import type { Catalogue, FolderItem, LessonItem } from '@lib/catalogue';
import { score, terms } from './search';
import { Highlight, Icon, plural } from './ui';
import './islands.css';
import './map.css';

type Kind = 'all' | 'live' | 'read';
const spring = { type: 'spring', stiffness: 380, damping: 36, mass: 0.9 } as const;

export default function LibraryMap({ data }: { data: Catalogue }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Kind>('all');
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const input = useRef<HTMLInputElement>(null);
  const ts = useMemo(() => terms(q), [q]);
  const filtering = ts.length > 0 || kind !== 'all';
  const keep = (l: LessonItem) => (kind === 'all' || (kind === 'live') === l.interactive) && (!ts.length || score(l, ts) > 0);
  const matched = data.lessons.filter(keep).length;

  // "/" or Ctrl/⌘ + K focuses the filter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea');
      if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); input.current?.focus(); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const active = useScrollSpy(data.subjects.map((s) => s.path));
  const toggle = (path: string) => setClosed((c) => { const n = new Set(c); n.has(path) ? n.delete(path) : n.add(path); return n; });
  const visibleSubjects = data.subjects.filter((s) => !filtering || countIn(s, keep) > 0);

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domMax} strict>
        <header className="map-hero">
          <p className="eyebrow rise">The library map</p>
          <h1 className="map-title rise" style={{ '--i': 1 } as CSSProperties}>Everything, at a glance</h1>
          <p className="lead rise" style={{ '--i': 2 } as CSSProperties}>
            {plural(data.totals.subjects, 'subject')}, {plural(data.totals.topics, 'topic')} and {plural(data.totals.lessons, 'lesson')}, laid out as one tree.
            Tap any card to open it.
          </p>
        </header>

        <div className="map-bar">
          <label className="map-filter">
            <span className="sr-only">Filter the map</span>
            <Icon name="search" />
            <input ref={input} type="search" placeholder="Filter: try “force” or “kubernetes”" value={q} autoComplete="off" spellCheck={false}
              onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setQ(''); }} />
            {q && <button type="button" className="map-clear" aria-label="Clear filter" onClick={() => { setQ(''); input.current?.focus(); }}><Icon name="close" size={16} /></button>}
          </label>
          <div className="seg" role="radiogroup" aria-label="Kind of lesson">
            {([['all', 'All'], ['live', 'Interactive'], ['read', 'Reading']] as const).map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={kind === v} className={kind === v ? 'on' : ''} onClick={() => setKind(v)}>
                {kind === v && <m.span layoutId="map-seg" className="seg-pill" transition={spring} />}
                <span className="seg-label">{label}</span>
              </button>
            ))}
          </div>
          <div className="map-folds">
            <button type="button" className="icon-btn" aria-label="Open every subject" title="Open all" onClick={() => setClosed(new Set())}><Icon name="plus" /></button>
            <button type="button" className="icon-btn" aria-label="Fold every subject" title="Fold all" onClick={() => setClosed(new Set(data.subjects.map((s) => s.path)))}><Icon name="minus" /></button>
          </div>
          <p className="map-count meta" role="status">{filtering ? `${plural(matched, 'lesson')} found` : plural(data.totals.lessons, 'lesson')}</p>
        </div>

        <nav className="map-jump" aria-label="Jump to a subject">
          {data.subjects.map((s) => {
            const n = filtering ? countIn(s, keep) : s.count;
            return (
              <a key={s.path} href={`#s-${s.slug}`} data-accent={s.accent} className={`jump${active === s.path ? ' on' : ''}${filtering && !n ? ' dim' : ''}`}
                onClick={() => closed.has(s.path) && toggle(s.path)}>
                {active === s.path && <m.span layoutId="jump-pill" className="jump-pill" transition={spring} />}
                <span className="jump-label"><span aria-hidden="true">{s.icon}</span> {s.title} <span className="jump-n">{n}</span></span>
              </a>
            );
          })}
        </nav>

        <div className="map-tree">
          <AnimatePresence initial={false} mode="popLayout">
            {visibleSubjects.map((s) => (
              <SubjectBranch key={s.path} s={s} open={filtering || !closed.has(s.path)} onToggle={() => toggle(s.path)} keep={keep} ts={ts} filtering={filtering} />
            ))}
          </AnimatePresence>
          {visibleSubjects.length === 0 && (
            <p className="map-none lead">No lessons match that filter. <button type="button" className="btn quiet pop" onClick={() => { setQ(''); setKind('all'); }}>Show everything</button></p>
          )}
        </div>
      </LazyMotion>
    </MotionConfig>
  );
}

function countIn(f: FolderItem, keep: (l: LessonItem) => boolean): number {
  return f.lessons.filter(keep).length + f.folders.reduce((n, c) => n + countIn(c, keep), 0);
}

/** Which subject section is nearest the top of the screen right now. */
function useScrollSpy(paths: string[]) {
  const [active, setActive] = useState<string | undefined>();
  useEffect(() => {
    const seen = new Map<string, number>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set((e.target as HTMLElement).dataset.path!, e.isIntersecting ? e.boundingClientRect.top : Infinity);
      const best = [...seen].filter(([, top]) => top !== Infinity).sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))[0];
      if (best) setActive(best[0]);
    }, { rootMargin: '-30% 0px -55% 0px' });
    document.querySelectorAll<HTMLElement>('.branch[data-path]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [paths.join('|')]);
  return active;
}

function SubjectBranch({ s, open, onToggle, keep, ts, filtering }: {
  s: FolderItem; open: boolean; onToggle: () => void; keep: (l: LessonItem) => boolean; ts: string[]; filtering: boolean;
}) {
  const general: FolderItem | null = s.lessons.length ? { ...s, title: 'General', folders: [], href: s.href } : null;
  const groups = [...(general ? [general] : []), ...s.folders].filter((g) => !filtering || countIn(g, keep) > 0);
  const n = filtering ? countIn(s, keep) : s.count;
  const bodyId = `b-${s.slug}`;
  return (
    <m.section
      layout="position"
      id={`s-${s.slug}`}
      data-path={s.path}
      data-accent={s.accent}
      className="branch"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={spring}
    >
      <div className="trunk-head">
        <button type="button" className="trunk-toggle" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
          <span className="trunk-icon" aria-hidden="true">{s.icon ?? '📁'}</span>
          <span className="trunk-text">
            <span className="trunk-title">{s.title}</span>
            <span className="meta">{s.count ? `${plural(n, 'lesson')}${s.folders.length ? ` · ${plural(s.folders.length, 'topic')}` : ''}` : 'Nothing here yet'}</span>
          </span>
          <span className={`chev${open ? ' open' : ''}`} aria-hidden="true"><Icon name="chevron" /></span>
        </button>
        <a className="trunk-open" href={s.href}>Open <Icon name="arrow" size={16} /></a>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={bodyId}
            key="body"
            className="trunk-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: spring, opacity: { duration: 0.2 } }}
          >
            {groups.length ? (
              <ul className="topics-grid" role="list">
                <AnimatePresence initial={false} mode="popLayout">
                  {groups.map((g) => (
                    <m.li key={g.path + g.title} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={spring}>
                      <TopicCard f={g} keep={keep} ts={ts} filtering={filtering} isGeneral={g === general} />
                    </m.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <p className="empty-branch">Lessons for {s.title} will appear here.</p>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </m.section>
  );
}

function TopicCard({ f, keep, ts, filtering, isGeneral }: { f: FolderItem; keep: (l: LessonItem) => boolean; ts: string[]; filtering: boolean; isGeneral: boolean }) {
  const n = filtering ? countIn(f, keep) : (isGeneral ? f.lessons.length : f.count);
  return (
    <div className="topic-card">
      <div className="topic-head">
        {isGeneral ? <span className="topic-name">General</span> : <a className="topic-name" href={f.href}><Highlight text={f.title} ts={ts} /></a>}
        <span className="topic-n">{n}</span>
      </div>
      <Leaves f={f} keep={keep} ts={ts} filtering={filtering} />
    </div>
  );
}

/** Lessons, then sub-topics (drawn by calling itself), joined by curved tree lines. */
function Leaves({ f, keep, ts, filtering }: { f: FolderItem; keep: (l: LessonItem) => boolean; ts: string[]; filtering: boolean }) {
  const lessons = f.lessons.filter(keep);
  const subs = f.folders.filter((c) => !filtering || countIn(c, keep) > 0);
  if (!lessons.length && !subs.length) return <p className="empty-branch">Nothing here yet.</p>;
  return (
    <ul className="leaves" role="list">
      {lessons.map((l) => (
        <li key={l.id} className="leaf">
          <a href={l.href} className="leaf-link">
            <span className={`leaf-kind${l.interactive ? ' live' : ''}`} title={l.interactive ? 'Interactive' : 'Reading'}>
              <Icon name={l.interactive ? 'spark' : 'book'} size={15} />
              <span className="sr-only">{l.interactive ? 'Interactive:' : 'Reading:'}</span>
            </span>
            <span className="leaf-title"><Highlight text={l.title} ts={ts} /></span>
            {l.minutes && <span className="leaf-min">{l.minutes}′</span>}
          </a>
        </li>
      ))}
      {subs.map((c) => (
        <li key={c.path} className="leaf sub">
          <a className="sub-name" href={c.href}><Highlight text={c.title} ts={ts} /></a>
          <Leaves f={c} keep={keep} ts={ts} filtering={filtering} />
        </li>
      ))}
    </ul>
  );
}
