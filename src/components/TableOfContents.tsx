import { useEffect, useState } from 'react';
import { SECTION_IDS, SECTION_LABELS } from '../content';

/**
 * A fixed table of contents in the viewport's left gutter, outside the centred
 * column, so it never competes with the sticky per-section labels. The active
 * item tracks the section being read, chosen by a reading line a third of the way
 * down the viewport: a section becomes active once its top has passed it.
 *
 * It renders only once the first section is reached. The hero's photo grid is
 * full-bleed and runs under the gutter, so a sidebar painted over it would be
 * type on photographs; above the first section there is also no active item to
 * highlight. Below the hero it stays out of the way entirely.
 */
export function TableOfContents() {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let scheduled = false;

    const update = () => {
      scheduled = false;
      const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
        (section): section is HTMLElement => section !== null,
      );

      const line = window.scrollY + window.innerHeight / 3;
      let current: string | null = null;

      for (const section of sections) {
        if (section.getBoundingClientRect().top + window.scrollY <= line) {
          current = section.id;
        }
      }

      setActiveId(current);
    };

    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  if (activeId === null) return null;

  return (
    <nav className="toc" aria-label="table of contents">
      <ul className="toc__list">
        {SECTION_IDS.map((id) => (
          <li key={id}>
            <a
              className="toc__link"
              href={`#${id}`}
              aria-current={activeId === id ? 'true' : undefined}
            >
              {SECTION_LABELS[id]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
