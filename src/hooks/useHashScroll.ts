import { useEffect } from 'react';

/**
 * Restores the scroll position for a fragment in the URL.
 *
 * The browser's native fragment scroll runs before React mounts the sections,
 * so the target does not exist yet and Chromium never retries. This re-runs the
 * scroll after the DOM is in place, and again on `hashchange` for in-page edits
 * to the URL.
 */
export function useHashScroll() {
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;

      const target = document.getElementById(decodeURIComponent(hash));
      if (!target) return;

      target.scrollIntoView();
    };

    scrollToHash();

    // Web fonts swap in after mount and change document height, so a target
    // measured against fallback metrics lands in the wrong place on a cold
    // cache. Re-align once the real fonts are ready.
    let cancelled = false;
    const realign = () => {
      if (!cancelled) scrollToHash();
    };

    void document.fonts?.ready.then(realign);

    window.addEventListener('hashchange', scrollToHash);
    return () => {
      cancelled = true;
      window.removeEventListener('hashchange', scrollToHash);
    };
  }, []);
}
