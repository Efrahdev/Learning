/** The search page: the same instant search as the home page, with room for more results. */
import { LazyMotion, MotionConfig, domMax } from 'motion/react';
import type { Catalogue } from '@lib/catalogue';
import SearchBox from './SearchBox';
import { plural } from './ui';
import './islands.css';

export default function SearchPage({ data }: { data: Catalogue }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domMax} strict>
        <section className="search-page">
          <p className="eyebrow rise">Search</p>
          <h1 className="search-page-title rise" style={{ '--i': 1 } as React.CSSProperties}>Find any lesson</h1>
          <p className="lead rise" style={{ '--i': 2 } as React.CSSProperties}>
            Type a word from a title, a topic or an idea. All {plural(data.totals.lessons, 'lesson')} are searched as you type.
          </p>
          <div className="search-wrap rise" style={{ '--i': 3 } as React.CSSProperties}>
            <SearchBox lessons={data.lessons} autoFocus limit={12} />
          </div>
        </section>
      </LazyMotion>
    </MotionConfig>
  );
}
