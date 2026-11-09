/**
 * Instant search over every lesson, as an accessible combobox: type, move with the arrow keys, Enter to open.
 * Used by the home page hero and the search page.
 */
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, m } from 'motion/react';
import type { LessonItem } from '@lib/catalogue';
import { search, terms } from './search';
import { Highlight, Icon, KindBadge } from './ui';
import './search.css';

const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 } as const;

export default function SearchBox({ lessons, autoFocus = false, limit = 7 }: { lessons: LessonItem[]; autoFocus?: boolean; limit?: number }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const results = useMemo(() => search(lessons, q, limit), [lessons, q, limit]);
  const ts = useMemo(() => terms(q), [q]);
  const showPanel = open && q.trim().length > 0;

  // "/" or Ctrl/⌘ + K jumps to the search box from anywhere on the page.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable="true"]');
      if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => setActive(0), [q]);
  // The search page can arrive with ?q=… and starts with the box focused.
  useEffect(() => {
    const start = new URLSearchParams(location.search).get('q');
    if (start) { setQ(start); setOpen(true); }
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  const go = (l?: LessonItem) => { if (l) location.assign(l.href); };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
    else if (e.key === 'Escape') { if (q) setQ(''); else input.current?.blur(); }
  };

  return (
    <div className="search" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <label className="search-field">
        <span className="sr-only">Search every lesson</span>
        <Icon name="search" size={24} />
        <input
          ref={input}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && results[active] ? `${listId}-${active}` : undefined}
          placeholder="Search any lesson…"
          autoComplete="off"
          spellCheck={false}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {q ? (
          <button type="button" className="search-clear" aria-label="Clear search" onClick={() => { setQ(''); input.current?.focus(); }}>
            <Icon name="close" size={18} />
          </button>
        ) : (
          <kbd className="search-kbd" aria-hidden="true">/</kbd>
        )}
      </label>
      <AnimatePresence>
        {showPanel && (
          <m.div
            className="search-panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            {results.length ? (
              <ul id={listId} role="listbox" aria-label="Matching lessons">
                {results.map((l, i) => (
                  <li
                    key={l.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    data-accent={l.accent}
                    className="result"
                    onPointerEnter={() => setActive(i)}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => go(l)}
                  >
                    {i === active && <m.span layoutId="result-hl" className="result-hl" transition={spring} />}
                    <span className="result-icon" aria-hidden="true">{l.icon ?? '📘'}</span>
                    <span className="result-body">
                      <span className="result-title"><Highlight text={l.title} ts={ts} /></span>
                      <span className="result-trail">{l.trail.join(' › ')}</span>
                    </span>
                    <KindBadge lesson={l} />
                  </li>
                ))}
              </ul>
            ) : (
              <p id={listId} className="search-empty" role="status">
                Nothing matches “{q.trim()}” yet. Try a shorter word, like <em>force</em> or <em>chip</em>.
              </p>
            )}
            <p className="search-hint" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> to move · <kbd>Enter</kbd> to open · <kbd>Esc</kbd> to clear</p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
