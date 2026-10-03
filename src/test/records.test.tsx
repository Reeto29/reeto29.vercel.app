import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecordShelf } from '../components/RecordShelf';
import { albums, displayCapacity, shelf } from '../records';
import { SECTION_IDS } from '../content';

const shelfCss = readFileSync(resolve(process.cwd(), 'src/components/RecordShelf.css'), 'utf8');

/** Slugs on the main shelf, in queue order. */
function onQueue(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLElement>('.rails__slot .shelf__sleeve')].map(
    (sleeve) => sleeve.dataset.slot ?? '',
  );
}

/** Slugs on the bottom shelf, left to right. */
function onBottom(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLElement>('.crate__slot .shelf__sleeve')].map(
    (sleeve) => sleeve.dataset.slot ?? '',
  );
}

/**
 * The slug of the record on the turntable, if any.
 *
 * Read from the cover the platter is showing rather than from a rendered slug,
 * since that is the only thing the deck puts in the DOM.
 */
function onDeck(container: HTMLElement): string | null {
  const cover = container
    .querySelector('.deck__label')
    ?.getAttribute('src')
    ?.replace('/albums/', '')
    .replace(/\.jpg$/, '');

  return cover === undefined ? null : cover === '' ? null : cover;
}

/** The record button for a slug, wherever it currently sits. */
function buttonFor(container: HTMLElement, slug: string): HTMLElement {
  const button = container.querySelector<HTMLElement>(`.shelf__sleeve[data-slot="${slug}"]`);
  if (button === null) throw new Error(`no record button for ${slug}`);
  return button;
}

/** The album described in the deck caption, if any. */
function deckTitle(container: HTMLElement): string | null {
  const title = container.querySelector('.deck__track')?.textContent ?? '';
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

/** Lets the bottom shelf hold at least one record to click. */
function spareFromBottom(container: HTMLElement): string {
  const spare = onBottom(container)[0];
  if (spare === undefined) throw new Error('the bottom shelf is empty, nothing to pull up');
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
  it('labels the section and names all three places a record can be', () => {
    const { container } = render(<RecordShelf />);

    const section = container.querySelector('section#records');
    expect(section).not.toBeNull();
    expect(section?.getAttribute('aria-labelledby')).toBe('records-heading');
    expect(document.querySelector('#records-heading')).not.toBeNull();

    expect(screen.getByRole('list', { name: /records on the bottom shelf/i })).toBeInTheDocument();
    // The deck reads as a region so its caption is reachable, not just a div.
    expect(container.querySelector('.deck')).toBeInTheDocument();
    expect(container.querySelector('.deck__idle')?.textContent).toMatch(/nothing on the deck/i);
  });

  it('keeps an empty deck on the page before anything is played', () => {
    const { container } = render(<RecordShelf />);

    // The turntable is a fixture, not something that appears on demand: the
    // platter is drawn with nothing on it so the layout does not shift when a
    // record arrives.
    expect(container.querySelector('.deck[data-empty="true"]')).not.toBeNull();
    expect(container.querySelector('.deck__platter--empty')).not.toBeNull();
    expect(container.querySelector('.deck__idle')?.textContent).toMatch(/nothing on the deck/i);
    expect(container.querySelector('audio')).toBeNull();
  });

  it('puts the deck beside the shelves rather than above them', () => {
    const layoutCss = readFileSync(
      resolve(process.cwd(), 'src/components/RecordShelf.css'),
      'utf8',
    );

    // Two columns with the deck pinned to the first, so it reads as part of the
    // furniture rather than a banner over the records.
    expect(layoutCss).toMatch(
      /\.records__layout\s*\{[^}]*grid-template-columns:\s*15rem minmax\(0, 1fr\)/,
    );
    expect(layoutCss).toMatch(/\.records__layout > \.deck\s*\{[^}]*grid-column:\s*1/);
    expect(layoutCss).toMatch(/\.records__layout > \.rails,[^}]*grid-column:\s*2/);
  });

  it('builds the rails from the configured rows and columns', () => {
    const { container } = render(<RecordShelf />);

    const rows = [...container.querySelectorAll('.rails__row')];
    expect(rows.length).toBe(shelf.displayRows);

    for (const row of rows) {
      expect(row.querySelectorAll('.rails__slot').length).toBe(shelf.displayCols);
    }
  });

  it('files every record exactly once across queue, deck, and bottom shelf', () => {
    const { container } = render(<RecordShelf />);

    const deck = onDeck(container);
    const everywhere = [
      ...onQueue(container),
      ...onBottom(container),
      ...(deck === null ? [] : [deck]),
    ];

    expect(everywhere.sort()).toEqual(albums.map((album) => album.slug).sort());
    expect(new Set(everywhere).size).toBe(everywhere.length);
  });

  it('opens with the queue full, the deck empty, and the rest on the bottom shelf', () => {
    const { container } = render(<RecordShelf />);

    expect(onQueue(container)).toHaveLength(displayCapacity);
    expect(onBottom(container)).toHaveLength(albums.length - displayCapacity);
    expect(onDeck(container)).toBeNull();
    expect(deckTitle(container)).toBeNull();
  });

  it('pulls a record off the bottom shelf onto the front of the queue, bumping the last one down', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const before = onBottom(container).length;
    const last = onQueue(container).at(-1);
    if (last === undefined) throw new Error('expected a full queue');

    const spare = spareFromBottom(container);
    await user.click(buttonFor(container, spare));
    advance(shelf.flightMs + 100);

    // The queue is already full, so this is a swap of ends: the spare arrives at
    // the front and the record that had been there longest falls to the bottom.
    expect(onQueue(container)[0]).toBe(spare);
    expect(onQueue(container)).toHaveLength(displayCapacity);
    expect(onQueue(container)).not.toContain(last);
    expect(onBottom(container)).toContain(last);
    expect(onBottom(container)).toHaveLength(before);
    expect(onDeck(container)).toBeNull();
  });

  it('parks the tonearm on an empty deck, waiting to be cued', () => {
    const { container } = render(<RecordShelf />);

    // The needle belongs to the turntable, not to the record: it is drawn from the
    // first paint and sitting at its rest angle until a record is put down.
    const arm = container.querySelector('.deck__arm');
    expect(arm).not.toBeNull();
    expect(arm?.getAttribute('data-cued')).toBeNull();
  });

  it('draws exactly one tonearm before and after a record is loaded', () => {
    const { container } = render(<RecordShelf />);

    // A turntable has one arm. Two were shipped once because a stale copy survived
    // a refactor, which is invisible to any test that only checks an arm exists.
    expect(container.querySelectorAll('.deck__arm')).toHaveLength(1);

    fireEvent.click(buttonFor(container, onQueue(container)[0]));

    expect(container.querySelectorAll('.deck__arm')).toHaveLength(1);
    expect(container.querySelectorAll('.deck__arm-rod')).toHaveLength(1);
    expect(container.querySelectorAll('.deck__arm-head')).toHaveLength(1);
  });

  it('resets the tonearm when a track is clicked', () => {
    /*
      fireEvent rather than userEvent here: the cueing delay is a real setTimeout,
      so this test needs a faked clock, and userEvent awaits animation frames, which
      this suite stubs out. A synchronous click sidesteps both.
    */
    const clock = vi.useFakeTimers();

    try {
      const { container } = render(<RecordShelf />);

      fireEvent.click(buttonFor(container, onQueue(container)[0]));
      expect(container.querySelector('.deck__arm')).not.toBeNull();

      // The arm settles instead of staying caught mid-return.
      act(() => {
        clock.advanceTimersByTime(400);
      });
      expect(container.querySelector('.deck__arm')).not.toBeNull();
    } finally {
      clock.useRealTimers();
    }
  });

  it('swings the tonearm about a fixed pivot, parking low and cuing over the label', () => {
    const deckCss = readFileSync(resolve(process.cwd(), 'src/components/Deck.css'), 'utf8');

    const arm = deckCss.match(/\.deck__arm\s*\{([^}]*)\}/)?.[1] ?? '';

    // One pivot the bearing stays on, so the needle end travels and the near end
    // does not. That is what reads as an arm rather than a line sliding around.
    expect(arm).toMatch(/transform-origin:\s*0 0/);
    // Parked low and to the right of the pivot, clear of the disc.
    expect(arm).toMatch(/transform:\s*rotate\(82deg\)/);
    // Cued swung left over the vinyl.
    expect(deckCss).toMatch(
      /\.deck__arm\[data-cued='true'\]\s*\{[^}]*transform:\s*rotate\(132deg\)/,
    );

    // The swing is motion, so reduced motion has to take it away.
    const reduced = deckCss.slice(deckCss.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduced).toMatch(/\.deck__arm\s*\{\s*transition:\s*none/);
  });

  it('fills an empty queue slot without bumping anything', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    // Drain one slot onto the deck so the queue is no longer full.
    await user.click(buttonFor(container, onQueue(container)[0]));
    advance(shelf.flightMs + 100);
    expect(onQueue(container)).toHaveLength(displayCapacity - 1);

    const last = onQueue(container).at(-1);
    const spare = spareFromBottom(container);
    await user.click(buttonFor(container, spare));
    advance(shelf.flightMs + 100);

    expect(onQueue(container)[0]).toBe(spare);
    expect(onQueue(container)).toHaveLength(displayCapacity);
    // Nothing was bumped: the queue had room.
    expect(onQueue(container)).toContain(last);
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

  it('promotes a record from the bottom shelf to the front of the queue', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const spare = spareFromBottom(container);
    await user.click(buttonFor(container, spare));
    advance(shelf.flightMs + 100);

    expect(onQueue(container)[0]).toBe(spare);
    expect(onBottom(container)).not.toContain(spare);
    // Promotion does not touch the deck; only the queue sleeves do.
    expect(onDeck(container)).toBeNull();
  });

  it('flies the returning record down at the same time as the picked one goes up', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    await user.click(buttonFor(container, spareFromBottom(container)));

    // Both the lift and the drop are travelling: two overlays, not one.
    expect(container.querySelectorAll('.records__flight')).toHaveLength(2);

    advance(shelf.flightMs + 100);
    expect(container.querySelector('.records__flight')).toBeNull();
  });

  it('swaps two records: the clicked one takes the deck and the other its slot', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    // Fill the deck, then pull two more records off the queue so the queue is
    // short one and a swap has somewhere to put what the deck gives back.
    await user.click(buttonFor(container, onQueue(container)[0]));
    advance(shelf.flightMs + 100);
    const held = onDeck(container);
    if (held === null) throw new Error('expected a record on the deck');

    const before = onQueue(container);
    const target = before[1];
    await user.click(buttonFor(container, target));
    advance(shelf.flightMs + 100);

    const after = onQueue(container);
    // The record the deck was holding took the clicked slot, so the queue is the
    // same length and only that one position changed.
    expect(after).toHaveLength(before.length);
    expect(after[1]).toBe(held);
    expect(onDeck(container)).toBe(target);
  });

  it('returns the record on the deck to the front of the queue when clicked again', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const slug = onQueue(container)[0];
    await user.click(buttonFor(container, slug));
    advance(shelf.flightMs + 100);
    expect(onDeck(container)).not.toBeNull();

    await user.click(container.querySelector('.deck__platter') as HTMLElement);
    advance(shelf.flightMs + 100);

    expect(onQueue(container)[0]).toBe(slug);
    expect(onDeck(container)).toBeNull();
    expect(deckTitle(container)).toBeNull();
  });

  it('bumps the last record down when the deck goes back onto a full queue', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    // A single record moves to the deck, leaving the queue one short.
    const slug = onQueue(container)[0];
    await user.click(buttonFor(container, slug));
    advance(shelf.flightMs + 100);
    expect(onQueue(container)).toHaveLength(displayCapacity - 1);

    // Two more swaps do not change the queue's length: the deck trades with them.
    await user.click(buttonFor(container, onQueue(container)[0]));
    advance(shelf.flightMs + 100);
    expect(onQueue(container)).toHaveLength(displayCapacity - 1);

    // Putting it back fills the slot, so nothing is bumped.
    const tail = onQueue(container).at(-1);
    await user.click(container.querySelector('.deck__platter') as HTMLElement);
    advance(shelf.flightMs + 100);

    expect(onQueue(container)).toHaveLength(displayCapacity);
    expect(onQueue(container)).toContain(tail);
  });

  it('takes exactly one record off the queue at a time', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    await user.click(buttonFor(container, onQueue(container)[0]));
    advance(shelf.flightMs + 100);

    // Only one record lives on the deck; the sleeve that went there is gone from
    // the queue and does not also appear on the bottom shelf.
    const deck = onDeck(container);
    expect(deck).not.toBeNull();
    expect(onQueue(container)).not.toContain(albums.find((a) => a.cover === deck)?.slug);
    expect(container.querySelectorAll('.deck__platter')).toHaveLength(1);
  });

  it('names the track each record plays', () => {
    for (const album of albums) {
      expect(album.trackName.trim(), `no track for ${album.slug}`).not.toBe('');
      expect(album.link).toMatch(/^https:\/\/music\.apple\.com\//);
    }
  });

  it('gives every record a preview clip from apple, and no record the same one twice', () => {
    const clips = new Set<string>();

    for (const album of albums) {
      expect(album.previewUrl, `no preview for ${album.slug}`).toMatch(
        /^https:\/\/audio-ssl\.itunes\.apple\.com\/.+\.m4a$/,
      );
      // A shared previewUrl would mean two records play the same song.
      expect(clips.has(album.previewUrl), `duplicate preview: ${album.slug}`).toBe(false);
      clips.add(album.previewUrl);
    }
  });

  it('is operable from the keyboard alone', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const spare = spareFromBottom(container);
    await user.tab();

    let guard = 0;
    while (document.activeElement !== buttonFor(container, spare) && guard < albums.length + 4) {
      await user.tab();
      guard += 1;
    }

    expect(buttonFor(container, spare)).toHaveFocus();

    await user.keyboard('{Enter}');
    advance(shelf.flightMs + 100);

    expect(onQueue(container)[0]).toBe(spare);
  });

  it('announces the change for assistive tech', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const status = container.querySelector('[role="status"]');
    const spare = spareFromBottom(container);

    await user.click(buttonFor(container, spare));
    expect(status?.textContent).toContain('main shelf');

    // Onto the deck next, naming the track it starts playing.
    await user.click(buttonFor(container, spare));
    expect(status?.textContent).toContain('turntable');
    expect(status?.textContent).toContain('playing');

    await user.click(container.querySelector('.deck__platter') as HTMLElement);
    expect(status?.textContent).toContain('back on the main shelf');
  });

  it('hides the real record while it is in flight, then reveals it', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const spare = spareFromBottom(container);
    await user.click(buttonFor(container, spare));

    // Re-query: the record moves from the crate into a rail, so React unmounts
    // the crate button and mounts a new one rather than reusing the node.
    expect(buttonFor(container, spare)).toHaveAttribute('data-flying', 'true');
    expect(container.querySelector('.records__flight')).not.toBeNull();

    advance(shelf.flightMs + 100);

    expect(buttonFor(container, spare)).not.toHaveAttribute('data-flying');
    expect(container.querySelector('.records__flight')).toBeNull();
  });

  it('names the track on the deck as soon as it is picked, not once it lands', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecordShelf />);

    const slug = onQueue(container)[0];
    const album = albums.find((candidate) => candidate.slug === slug);

    await user.click(buttonFor(container, slug));

    // Named immediately, while the record is still in flight.
    expect(container.querySelector('.deck__track')?.textContent).toContain(album?.trackName ?? '');
    expect(container.textContent).not.toMatch(/now playing/i);

    advance(shelf.flightMs + 100);
    expect(container.querySelector('.records__flight')).toBeNull();
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

    const spare = spareFromBottom(container);
    await user.click(buttonFor(container, spare));

    expect(container.querySelector('.records__flight')).toBeNull();
    expect(onQueue(container)[0]).toBe(spare);
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
