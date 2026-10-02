import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecordShelf } from '../components/RecordShelf';
import { albums, deck } from '../records';
import { SECTION_IDS } from '../content';

const shelfCss = readFileSync(resolve(process.cwd(), 'src/components/RecordShelf.css'), 'utf8');

/** Slugs currently rendered in the queue, in play order. */
function queued(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLElement>('.deck__slot')]
    .map((slot) => slot.dataset.slot)
    .filter((slug): slug is string => slug !== undefined);
}

/** Slugs currently rendered on the shelf, left to right. */
function onShelf(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLElement>('.shelf__spine')].map(
    (spine) => spine.dataset.slot ?? '',
  );
}

/** The leftmost shelf button, i.e. the next record a click would pick. */
function firstShelfButton(container: HTMLElement): HTMLElement {
  const button = container.querySelector<HTMLElement>('.shelf__spine');
  if (button === null) throw new Error('no record on the shelf to click');
  return button;
}

/** jsdom reports zero-sized boxes, so the flight overlay fades rather than flies. */
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

  it('gives every album its own spine colour as a hex value', () => {
    for (const album of albums) {
      expect(album.spine, `bad spine colour: ${album.slug}`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('seeds fewer records than the queue holds, so there is room to queue one', () => {
    expect(deck.seed).toBeGreaterThan(0);
    expect(deck.seed).toBeLessThanOrEqual(deck.queueSize);
    expect(albums.length).toBeGreaterThan(deck.queueSize);
  });

  it('keeps the section id in step with the nav', () => {
    expect(SECTION_IDS).toContain('records');
  });
});

describe('record shelf', () => {
  it('labels the section and names the queue', () => {
    const { container } = render(<RecordShelf />);

    const section = container.querySelector('section#records');
    expect(section).not.toBeNull();
    expect(section?.getAttribute('aria-labelledby')).toBe('records-heading');
    expect(document.querySelector('#records-heading')).not.toBeNull();

    expect(screen.getByRole('list', { name: /record queue/i })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /records on the shelf/i })).toBeInTheDocument();
  });

  it('renders exactly as many queue slots as the queue holds', () => {
    const { container } = render(<RecordShelf />);

    expect(container.querySelectorAll('.deck__slot')).toHaveLength(deck.queueSize);
  });

  it('starts with the queue partly filled and the rest of the records on the shelf', () => {
    const { container } = render(<RecordShelf />);

    expect(queued(container)).toHaveLength(deck.seed);
    expect(onShelf(container)).toHaveLength(albums.length - deck.seed);
  });

  it('never shows the same record in the queue and on the shelf at once', () => {
    const { container } = render(<RecordShelf />);

    const inQueue = queued(container);
    const shelved = onShelf(container);

    expect(inQueue.filter((slug) => shelved.includes(slug))).toEqual([]);
    expect([...inQueue, ...shelved].sort()).toEqual(albums.map((album) => album.slug).sort());
  });

  it('gives every shelf record a button named for the album it plays', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const shelved = onShelf(container);
    const target = shelved[0] as string;
    const album = albums.find((candidate) => candidate.slug === target);

    const button = screen.getByRole('button', { name: `Play ${album?.title} by ${album?.artist}` });
    expect(button).toBeInTheDocument();

    await user.click(button);

    expect(queued(container)[0]).toBe(target);
    expect(onShelf(container)).not.toContain(target);
  });

  it('puts a clicked record at the front of the queue and drops the rest back one', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const before = queued(container);
    const target = onShelf(container)[0] as string;

    await user.click(firstShelfButton(container));

    // Nothing is evicted yet: the seeded queue still has room.
    expect(queued(container)).toEqual([target, ...before]);
  });

  it('returns the record at the end of a full queue to the bottom of the shelf', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    // Fill the queue past capacity one pick at a time.
    const picks = deck.queueSize - deck.seed + 1;
    const shelved = onShelf(container).slice();

    for (let i = 0; i < picks; i += 1) {
      if (onShelf(container).length === 0) break;
      await user.click(firstShelfButton(container));
      advance(deck.flightMs + 100);
    }

    // The queue never exceeds its capacity.
    expect(queued(container)).toHaveLength(deck.queueSize);

    const shelfNow = onShelf(container);
    expect(shelfNow).toHaveLength(albums.length - deck.queueSize);
    expect(shelfNow[shelfNow.length - 1]).not.toBe(shelved[shelved.length - 1] as string);

    for (const slug of shelved.slice(0, picks)) {
      expect(shelfNow.includes(slug), `${slug} should have left the shelf`).toBe(false);
    }
  });

  it('is operable from the keyboard alone', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const target = onShelf(container)[0] as string;
    const first = firstShelfButton(container);

    first.focus();
    expect(first).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(queued(container)[0]).toBe(target);
    expect(onShelf(container)).not.toContain(target);
  });

  it('announces the change for assistive tech', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const button = firstShelfButton(container);
    const label = button.getAttribute('aria-label') ?? '';

    await user.click(button);

    const status = screen.getByRole('status');
    expect(status.textContent).toContain('is playing');
    expect(status.textContent).toContain(label.replace(/^Play /, '').split(' by ')[0] as string);
  });

  it('hides the real element while its record is in flight, then reveals it', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const target = onShelf(container)[0] as string;
    await user.click(firstShelfButton(container));

    // Mid-flight: the queue already holds the record and it is stepped out of
    // the way, with the overlay standing in for it.
    const sleeve = container.querySelector<HTMLElement>(
      `.deck__slot[data-slot="${target}"] .deck__sleeve`,
    );
    expect(sleeve?.dataset.flying).toBe('true');
    expect(container.querySelectorAll('.records__flight')).toHaveLength(1);

    // Land it.
    advance(deck.flightMs + 100);

    expect(container.querySelectorAll('.records__flight')).toHaveLength(0);
    expect(
      container.querySelector<HTMLElement>(`.deck__slot[data-slot="${target}"] .deck__sleeve`)
        ?.dataset.flying,
    ).toBeUndefined();
  });

  it('flies the returned record down at the same time as the picked one goes up', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    for (let i = 0; i < deck.queueSize - deck.seed; i += 1) {
      await user.click(firstShelfButton(container));
      advance(deck.flightMs + 100);
    }

    expect(queued(container)).toHaveLength(deck.queueSize);

    // The queue is full. The next pick should displace two records at once.
    const tailBefore = queued(container)[deck.queueSize - 1] as string;
    const picked = onShelf(container)[0] as string;

    await user.click(firstShelfButton(container));

    expect(container.querySelectorAll('.records__flight')).toHaveLength(2);
    expect(queued(container)[0]).toBe(picked);
    expect(queued(container)).not.toContain(tailBefore);
    expect(onShelf(container)[onShelf(container).length - 1]).toBe(tailBefore);
  });

  it('skips the flight entirely under reduced motion', async () => {
    const user = userEvent.setup();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    try {
      const { container } = render(<RecordShelf />);
      const target = onShelf(container)[0] as string;

      await user.click(firstShelfButton(container));

      // State still commits; nothing animates and nothing is hidden.
      expect(queued(container)[0]).toBe(target);
      expect(container.querySelectorAll('.records__flight')).toHaveLength(0);
      expect(
        container.querySelector<HTMLElement>(`.deck__slot[data-slot="${target}"] .deck__sleeve`)
          ?.dataset.flying,
      ).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('shows the playing record with its artist and year', () => {
    const { container } = render(<RecordShelf />);

    // The metadata lives below the queue, not inside the lead slot, so it cannot
    // make that slot taller than the five behind it.
    const meta = container.querySelector('.deck__meta');
    const lead = container.querySelector('.deck__slot');

    expect(within(meta as HTMLElement).getByText('now playing')).toBeInTheDocument();
    expect(meta?.textContent).toMatch(/\d{4}/);
    expect(meta?.closest('.deck__slot')).toBeNull();
    expect(lead?.querySelector('.deck__meta')).toBeNull();
  });

  it('marks only the playing sleeve as playing', () => {
    const { container } = render(<RecordShelf />);

    expect(container.querySelectorAll('.deck__sleeve--playing')).toHaveLength(1);
    expect(container.querySelector('.deck__slot .deck__sleeve--playing')).not.toBeNull();
  });

  it('counts the records left on the shelf', () => {
    const { container } = render(<RecordShelf />);

    const foot = container.querySelector('.records__foot');
    expect(foot?.textContent).toContain(String(albums.length - deck.seed));
  });

  it('states the shelf and queue size from the data rather than hardcoding them', () => {
    const { container } = render(<RecordShelf />);

    const intro = container.querySelector('.records__intro')?.textContent ?? '';

    expect(intro).toContain(String(albums.length));
    expect(intro).toContain(String(deck.queueSize));
  });

  it('holds the section copy to the same house style as the rest of the site', () => {
    // content.test.ts only covers the prose in content.ts, so the copy rendered
    // here is checked against the same rules directly.
    const { container } = render(<RecordShelf />);

    const copy = [
      container.querySelector('.records__intro')?.textContent ?? '',
      container.querySelector('.records__foot')?.textContent ?? '',
      container.querySelector('.deck__meta')?.textContent ?? '',
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

  it('tints each spine from its own artwork colour', () => {
    expect(shelfCss).toMatch(/\.shelf__spine\s*\{[^}]*background:\s*var\(--spine\)/);
  });

  it('puts the flight overlay in a fixed full-viewport layer', () => {
    expect(shelfCss).toMatch(/\.records__flights\s*\{[^}]*position:\s*fixed[^}]*inset:\s*0/);
    expect(shelfCss).toMatch(/\.records__flights\s*\{[^}]*pointer-events:\s*none/);
  });

  it('writes spine titles vertically, as they run on a record', () => {
    expect(shelfCss).toMatch(/writing-mode:\s*vertical-rl/);
  });

  it('takes the hover lift away under reduced motion', () => {
    expect(shelfCss).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });

  it('keeps the now-playing metadata out of the queue slots', () => {
    // Inside a slot the taller lead column shunts the rest of the queue into a
    // ragged wrap on narrow viewports, so the metadata is a sibling of the row.
    expect(shelfCss).not.toMatch(/\.deck__slot\s+\.deck__meta/);
  });

  it('grids the queue into even rows on a phone rather than wrapping it', () => {
    expect(shelfCss).toMatch(
      /@media \(max-width: 40rem\)[\s\S]*?\.deck\s*\{[^}]*display:\s*grid[^}]*repeat\(3,/,
    );
  });

  it('gives the lead queue slot no extra width on a phone', () => {
    // Otherwise the enlarged first cover straddles the grid's row break.
    expect(shelfCss).toMatch(
      /\.deck__slot,\s*\.deck__slot:first-child\s*\{\s*width:\s*auto;?\s*\}/,
    );
  });

  it('introduces no raw colours outside the theme tokens', () => {
    // Artwork colours live in the data module as --spine, so the stylesheet
    // itself must not hardcode a hex.
    expect(shelfCss).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
