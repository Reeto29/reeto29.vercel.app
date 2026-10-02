import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecordShelf } from '../components/RecordShelf';
import { albums, displayCapacity, shelf } from '../records';
import { SECTION_IDS } from '../content';

const shelfCss = readFileSync(resolve(process.cwd(), 'src/components/RecordShelf.css'), 'utf8');

/** Slugs on the display rails, in slot order. */
function onRails(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLElement>('.rails__slot .shelf__sleeve')].map(
    (sleeve) => sleeve.dataset.slot ?? '',
  );
}

/** Slugs filed in the crate, left to right. */
function inCrate(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLElement>('.crate__slot .shelf__sleeve')].map(
    (sleeve) => sleeve.dataset.slot ?? '',
  );
}

/** The record button for a slug, wherever it currently sits. */
function buttonFor(container: HTMLElement, slug: string): HTMLElement {
  const button = container.querySelector<HTMLElement>(`.shelf__sleeve[data-slot="${slug}"]`);
  if (button === null) throw new Error(`no record button for ${slug}`);
  return button;
}

/** The album currently described as playing, if any. */
function nowPlaying(container: HTMLElement): string | null {
  const title = container.querySelector('.records__title')?.textContent ?? '';
  return title === '' ? null : title;
}

function stubEnvironment() {
  frames = [];

  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn().mockImplementation((cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    }),
  );

  vi.stubGlobal('cancelAnimationFrame', vi.fn());
}

let frames: FrameRequestCallback[] = [];

/**
 * Runs queued animation frames for `milliseconds` of simulated time. Wrapped in
 * `act` because landing a flight commits state from inside a frame callback.
 */
function advance(milliseconds: number, step = 16) {
  let now = 0;

  act(() => {
    for (let i = 0; i < Math.round(milliseconds / step); i += 1) {
      const pending = frames;
      frames = [];
      now += step;
      for (const callback of pending) callback(now);
    }
  });
}

/** Lets the crate hold at least one record to click. */
function spareFromCrate(container: HTMLElement): string {
  const spare = inCrate(container)[0];
  if (spare === undefined) throw new Error('the crate is empty, nothing to lift');
  return spare;
}

beforeEach(() => {
  stubEnvironment();
});

describe('record data', () => {
  it('lists every album once with a title, artist, and year', () => {
    expect(albums.length).toBeGreaterThan(0);

    for (const album of albums) {
      expect(album.title.trim(), `missing title: ${album.slug}`).not.toBe('');
      expect(album.artist.trim(), `missing artist: ${album.slug}`).not.toBe('');
      expect(album.year).toBeGreaterThan(1950);
      expect(album.year).toBeLessThanOrEqual(new Date().getFullYear());
    }

    expect(new Set(albums.map((album) => album.slug)).size).toBe(albums.length);
    expect(new Set(albums.map((album) => album.title)).size).toBe(albums.length);
  });

  it('points every cover at a real image in public/albums', () => {
    for (const album of albums) {
      expect(album.cover, `not under /albums/: ${album.cover}`).toMatch(
        /^\/albums\/[\w.-]+\.(jpg|jpeg|png|webp|avif)$/,
      );
      // The cover path is site-absolute ("/albums/x.jpg"), so strip the leading
      // slash before resolving it under public/ or it escapes to the filesystem root.
      expect(
        existsSync(resolve(process.cwd(), 'public', album.cover.replace(/^\//, ''))),
        `missing ${album.cover}`,
      ).toBe(true);
    }
  });

  it('derives the display capacity from the rails rather than hardcoding it', () => {
    expect(displayCapacity).toBe(shelf.displayRows * shelf.displayCols);
    expect(displayCapacity).toBeGreaterThan(0);
  });

  it('has at least one record to display and at least one left in the crate', () => {
    expect(displayCapacity).toBeLessThan(albums.length);
  });

  it('keeps the section id in step with the nav', () => {
    expect(SECTION_IDS).toContain('records');
  });
});

describe('record shelf', () => {
  it('labels the section and names both shelves', () => {
    const { container } = render(<RecordShelf />);

    const section = container.querySelector('section#records');
    expect(section).not.toBeNull();
    expect(section?.getAttribute('aria-labelledby')).toBe('records-heading');
    expect(document.querySelector('#records-heading')).not.toBeNull();

    expect(screen.getByRole('list', { name: /records in the crate/i })).toBeInTheDocument();
  });

  it('builds the rails from the configured rows and columns', () => {
    const { container } = render(<RecordShelf />);

    const rows = [...container.querySelectorAll('.rails__row')];
    expect(rows.length).toBe(shelf.displayRows);

    for (const row of rows) {
      expect(row.querySelectorAll('.rails__slot').length).toBe(shelf.displayCols);
    }
  });

  it('files every record exactly once, split between rails and crate', () => {
    const { container } = render(<RecordShelf />);

    const everywhere = [...onRails(container), ...inCrate(container)];
    expect(everywhere.sort()).toEqual(albums.map((album) => album.slug).sort());
    expect(new Set(everywhere).size).toBe(everywhere.length);
  });

  it('starts with the rails full and the rest in the crate', () => {
    const { container } = render(<RecordShelf />);

    expect(onRails(container)).toHaveLength(displayCapacity);
    expect(inCrate(container)).toHaveLength(albums.length - displayCapacity);
    expect(nowPlaying(container)).toBeNull();
  });

  it('takes a record out of the shelf when it goes up, with no gap left behind', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const before = inCrate(container).length;
    expect(before).toBe(albums.length - displayCapacity);
    expect(container.querySelectorAll('.crate__gap')).toHaveLength(0);

    const spare = spareFromCrate(container);
    await user.click(buttonFor(container, spare));
    advance(shelf.flightMs + 100);

    // The stack is an overlap rather than fixed slots, so a promoted record just
    // leaves it. The rails are full, so the tail comes back down at the same time
    // and the stack holds its size instead of leaving a hole.
    expect(inCrate(container)).not.toContain(spare);
    expect(inCrate(container)).toHaveLength(before);
    expect(container.querySelectorAll('.crate__slot')).toHaveLength(before);
    expect(container.querySelectorAll('.crate__gap')).toHaveLength(0);
  });

  it('gives every record a button naming what clicking it does', () => {
    const { container } = render(<RecordShelf />);

    for (const album of albums) {
      const button = buttonFor(container, album.slug);
      expect(button.tagName).toBe('BUTTON');

      const label = button.getAttribute('aria-label') ?? '';
      expect(label).toContain(album.title);
      expect(label).toContain(album.artist);
    }
  });

  it('puts a record from the crate onto the front of the rails and plays it', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const spare = spareFromCrate(container);
    const album = albums.find((candidate) => candidate.slug === spare);

    await user.click(buttonFor(container, spare));
    advance(shelf.flightMs + 100);

    expect(onRails(container)[0]).toBe(spare);
    expect(nowPlaying(container)).toBe(album?.title);
    expect(inCrate(container)).not.toContain(spare);
  });

  it('sends the record at the end of the queue back down to the crate', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    // Rails start full, so the first lift has to push something off the end.
    const tail = onRails(container).at(-1);
    if (tail === undefined) throw new Error('expected a record on the rails');

    await user.click(buttonFor(container, spareFromCrate(container)));
    advance(shelf.flightMs + 100);

    expect(onRails(container)).toHaveLength(displayCapacity);
    expect(onRails(container)).not.toContain(tail);
    expect(inCrate(container)).toContain(tail);
  });

  it('flies the returning record down at the same time as the picked one goes up', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    await user.click(buttonFor(container, spareFromCrate(container)));

    // Both the lift and the drop are travelling: two overlays, not one.
    expect(container.querySelectorAll('.records__flight')).toHaveLength(2);

    advance(shelf.flightMs + 100);
    expect(container.querySelector('.records__flight')).toBeNull();
  });

  it('switches which rail record is playing without moving it', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const before = onRails(container);
    await user.click(buttonFor(container, before[0]));
    await user.click(buttonFor(container, before[1]));
    advance(shelf.flightMs + 100);

    expect(onRails(container)).toEqual(before);
    expect(nowPlaying(container)).toBe(albums[1].title);
  });

  it('puts the playing record back in the crate when it is clicked again', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const slug = onRails(container)[0];
    await user.click(buttonFor(container, slug));
    await user.click(buttonFor(container, slug));
    advance(shelf.flightMs + 100);

    expect(inCrate(container)).toContain(slug);
    expect(onRails(container)).not.toContain(slug);
    expect(nowPlaying(container)).toBeNull();
  });

  it('marks only the playing record', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    await user.click(buttonFor(container, onRails(container)[0]));

    const marked = [
      ...container.querySelectorAll<HTMLElement>('.shelf__sleeve[data-playing="true"]'),
    ].map((node) => node.dataset.slot);

    expect(marked).toEqual([onRails(container)[0]]);
  });

  it('is operable from the keyboard alone', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const spare = spareFromCrate(container);
    await user.tab();

    let guard = 0;
    while (document.activeElement !== buttonFor(container, spare) && guard < albums.length + 4) {
      await user.tab();
      guard += 1;
    }

    expect(buttonFor(container, spare)).toHaveFocus();

    await user.keyboard('{Enter}');
    advance(shelf.flightMs + 100);

    expect(onRails(container)[0]).toBe(spare);
  });

  it('announces the change for assistive tech', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const status = container.querySelector('[role="status"]');
    const spare = spareFromCrate(container);

    await user.click(buttonFor(container, spare));
    expect(status?.textContent).toContain('is playing');

    await user.click(buttonFor(container, spare));
    expect(status?.textContent).toContain('crate');
  });

  it('hides the real record while it is in flight, then reveals it', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const spare = spareFromCrate(container);
    await user.click(buttonFor(container, spare));

    // Re-query: the record moves from the crate into a rail, so React unmounts
    // the crate button and mounts a new one rather than reusing the node.
    expect(buttonFor(container, spare)).toHaveAttribute('data-flying', 'true');
    expect(container.querySelector('.records__flight')).not.toBeNull();

    advance(shelf.flightMs + 100);

    expect(buttonFor(container, spare)).not.toHaveAttribute('data-flying');
    expect(container.querySelector('.records__flight')).toBeNull();
  });

  it('reports the flight as loading until it lands', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    await user.click(buttonFor(container, spareFromCrate(container)));
    expect(container.textContent).toContain('loading');

    advance(shelf.flightMs + 100);
    expect(container.textContent).toContain('now playing');
  });

  it('skips the flight entirely under reduced motion', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const spare = spareFromCrate(container);
    await user.click(buttonFor(container, spare));

    expect(container.querySelector('.records__flight')).toBeNull();
    expect(onRails(container)[0]).toBe(spare);
  });

  it('holds the section copy to the same house style as the rest of the site', () => {
    // content.test.ts only covers the prose in content.ts, so the copy rendered
    // here is checked against the same rules directly.
    const { container } = render(<RecordShelf />);

    const copy = [
      container.querySelector('.records__intro')?.textContent ?? '',
      container.querySelector('.records__meta')?.textContent ?? '',
    ].join(' ');

    expect(copy).not.toContain('—');

    for (const filler of [
      'seamless',
      'revolutioniz',
      'leverage',
      'synergy',
      'innovative',
      'cutting-edge',
    ]) {
      expect(copy.toLowerCase(), `filler phrase: ${filler}`).not.toContain(filler);
    }

    // No emoji as icons or bullets, matching the App-level rule.
    expect(copy).not.toMatch(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]|\u{FE0F}|\u{20E3}/u,
    );
  });
});

describe('record shelf stylesheet', () => {
  it('hides an element while its record is flying, so the overlay stands in', () => {
    expect(shelfCss).toMatch(/\[data-flying='true'\]\s*\{[^}]*visibility:\s*hidden/);
  });

  it('puts the flight overlay in a fixed full-viewport layer', () => {
    expect(shelfCss).toMatch(/\.records__flights\s*\{[^}]*position:\s*fixed/);
  });

  it('draws a rail under each row of display slots', () => {
    expect(shelfCss).toMatch(/\.rails__row::after\s*\{[^}]*height:\s*1px/);
  });

  it('keeps empty slots visible so the rails read as having capacity', () => {
    expect(shelfCss).toMatch(/\.rails__empty\s*\{[^}]*border:\s*1px dashed/);
  });

  it('stacks the shelf face out rather than filing it spine out', () => {
    // The shelf's covers are the record art, not a tinted spine bar.
    expect(shelfCss).not.toMatch(/--spine/);
    expect(shelfCss).not.toMatch(/writing-mode/);
  });

  it('makes the shelf a scrolling row rather than something that widens the page', () => {
    expect(shelfCss).toMatch(/\.crate\s*\{[^}]*overflow-x:\s*auto/);
  });

  it('draws the shelf as one thin line in the same grey as the rails', () => {
    // The rails are drawn with --border-strong; the shelf has to match, or it
    // reads as a different material from the furniture above it.
    expect(shelfCss).toMatch(
      /\.crate\s*\{[^}]*border-bottom:\s*\d+px solid var\(--border-strong\)/,
    );
    expect(shelfCss).toMatch(/\.rails__row::after\s*\{[^}]*background:\s*var\(--border-strong\)/);
  });

  it('overlaps the sleeves so the shelf reads as a stack of records', () => {
    // Each sleeve is tucked behind the one in front by the width it is hidden by,
    // which is what makes the shelf read as a crate of LPs instead of a row.
    expect(shelfCss).toMatch(
      /\.crate__slot\s*\{[^}]*margin-left:\s*calc\(var\(--reveal\)\s*-\s*var\(--sleeve\)\)/,
    );
    expect(shelfCss).toMatch(/\.crate__slot:first-child\s*\{\s*margin-left:\s*0/);
  });

  it('ranks the front sleeve above the ones behind it', () => {
    expect(shelfCss).toMatch(/\.shelf__sleeve--crate\s*\{[^}]*z-index:\s*var\(--z/);
    // A local stacking context, or the sleeves would rank against the whole page.
    expect(shelfCss).toMatch(/\.crate\s*\{[^}]*isolation:\s*isolate/);
  });

  it('peeks a sleeve out of the stack on hover instead of lifting it', () => {
    // Slid sideways and tipped from the shelf edge, which is what makes an album
    // in the middle of the stack identifiable.
    expect(shelfCss).toMatch(
      /\.shelf__sleeve--crate:hover[\s\S]*?transform:\s*translateX\([^)]*\)\s*rotate\(-[^)]*\)/,
    );
    expect(shelfCss).toMatch(/transform-origin:\s*0 100%/);
  });

  it('takes the pull-off away under reduced motion', () => {
    const reduced = shelfCss.slice(shelfCss.indexOf('@media (prefers-reduced-motion: reduce)'));

    expect(reduced).toMatch(/transform:\s*none/);
  });

  it('references no custom property that is never defined', () => {
    const globalCss = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');

    // Declared anywhere a stylesheet can see: the theme, or this component's own
    // scope. --z is set inline by the component from the slot index.
    const defined = new Set(
      [
        ...globalCss.matchAll(/(--[a-z0-9-]+)\s*:/g),
        ...shelfCss.matchAll(/(--[a-z0-9-]+)\s*:/g),
      ].map((match) => match[1]),
    );
    defined.add('--z');

    // A var() with no fallback has to resolve, or the browser drops the declaration
    // silently. That is how the rail line and the sleeve backgrounds went missing
    // once already: both used a token nothing ever declared.
    const missing = [...shelfCss.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/g)]
      .filter(([, , closer]) => closer !== ',')
      .map(([, name]) => name)
      .filter((name) => !defined.has(name))
      .sort();

    expect(missing, `undefined custom properties: ${missing.join(', ')}`).toEqual([]);
  });

  it('introduces no raw colours outside the theme tokens', () => {
    const hex = [...shelfCss.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((match) => match[0].toLowerCase());

    // Everything on this section comes from the palette; no hardware greys remain
    // now that the turntable is gone.
    expect(hex, `raw colours in stylesheet: ${hex.join(', ')}`).toEqual([]);
  });
});
