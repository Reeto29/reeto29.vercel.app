import { useEffect } from 'react';

/**
 * Fades and lifts blocks into view as they are scrolled to.
 *
 * Targets are the entry rows in the list sections (work, projects) so those
 * stagger one by one, or the whole body of a section that is a single block
 * (records, skills, education, contact). Hiding is applied only once this hook
 * has run, via `data-reveal` on the root, so a visitor without JS — or a script
 * that never loads — simply sees everything. Under reduced motion the hook does
 * not opt in at all, which leaves the page completely static rather than fading
 * it in.
 */
export function useScrollReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const targets: Element[] = [];
    for (const section of document.querySelectorAll('.section')) {
      const body = section.querySelector('.section__body');
      if (body === null) continue;

      const rows = body.querySelectorAll('.row');
      if (rows.length > 0) targets.push(...rows);
      else targets.push(body);
    }

    if (targets.length === 0) return;

    document.documentElement.setAttribute('data-reveal', '');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).setAttribute('data-revealed', '');
          observer.unobserve(entry.target);
        }
      },
      // Reveal a touch after a block's top edge clears the fold, so it settles as
      // it comes into view rather than the instant the pixel crosses the line.
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    );

    for (const target of targets) {
      (target as HTMLElement).setAttribute('data-reveal-item', '');
      observer.observe(target);
    }

    return () => {
      observer.disconnect();
      for (const target of targets) {
        (target as HTMLElement).removeAttribute('data-revealed');
      }
    };
  }, []);
}
