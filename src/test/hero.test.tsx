import { render, waitFor } from '@testing-library/react';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { PhotoGrid } from '../components/PhotoGrid';
import { cylinder, grid, photos, ringStep, spin } from '../photos';

// import.meta.url is an http URL under the jsdom environment, so resolve from
// the project root instead.
const globalCss = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');
const layoutCss = readFileSync(resolve(process.cwd(), 'src/styles/layout.css'), 'utf8');
const gridCss = readFileSync(resolve(process.cwd(), 'src/components/PhotoGrid.css'), 'utf8');

/** jsdom has no IntersectionObserver, and its localStorage needs a shim. */
function stubEnvironment() {
  class NoopIO implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn().mockImplementation((cb: (e: IntersectionObserverEntry[]) => void) => {
      const instance = new NoopIO();
      instance.observe = vi.fn();
      (instance as unknown as { trigger: typeof cb }).trigger = cb;
      return instance;
    }),
  );

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

function spinAngle(stage: HTMLElement): number {
  return Number.parseFloat(stage.style.getPropertyValue('--spin'));
}

/** Runs queued animation frames for roughly `seconds` of simulated time. */
function advance(seconds: number, step = 16) {
  let now = 0;

  for (let i = 0; i < Math.round((seconds * 1000) / step); i += 1) {
    const pending = frames;
    frames = [];
    now += step;
    for (const callback of pending) callback(now);
  }
}

describe('photo ring', () => {
  it('has one tile per photo so nothing repeats', () => {
    expect(new Set(photos.map((photo) => photo.src)).size).toBe(photos.length);

    const { container } = render(<PhotoGrid />);
    expect(container.querySelectorAll('.grid__tile')).toHaveLength(photos.length);
  });

  it('spans wide enough to read as a band rather than a block of tiles', () => {
    // The band is no longer a column track, so its width comes from the arc the
    // ring covers: half the photos either side, each one step apart.
    const step = ringStep(grid.tile, grid.gap);
    const halfSpan = ((photos.length - 1) / 2) * step;

    // Roughly 100 degrees of ring in total, which is enough curvature to read as
    // a ring without pushing the outermost tiles far enough round to face away.
    expect(halfSpan * 2).toBeGreaterThan(80);
    expect(halfSpan * 2).toBeLessThan(140);

    // Chords, not arc length, are what actually crosses the frame.
    const chord = 2 * cylinder.radius * Math.sin(((halfSpan + step) * Math.PI) / 360);
    expect(chord).toBeGreaterThan(1000);
  });

  it('keeps every photo in public/photos as a real image', () => {
    for (const photo of photos) {
      expect(photo.src, `not under /photos/: ${photo.src}`).toMatch(
        /^\/photos\/[\w.-]+\.(jpg|jpeg|png|webp|avif)$/,
      );
    }
  });

  it('describes each photo so the alt stays meaningful', () => {
    for (const photo of photos) {
      expect(photo.alt.trim(), `missing alt: ${photo.src}`).not.toBe('');
      // No leftover placeholder copy once real photographs are in place.
      expect(photo.alt).not.toMatch(/^Placeholder:/i);
      expect(photo.alt.length).toBeGreaterThan(12);
    }
  });

  it('keeps every photo as a real file in public/photos', () => {
    for (const photo of photos) {
      expect(photo.src, `not under /photos/: ${photo.src}`).toMatch(
        /^\/photos\/[\w.-]+\.(jpg|jpeg|png|webp|avif)$/,
      );
      expect(
        existsSync(resolve(process.cwd(), 'public', photo.src.slice(1))),
        `missing ${photo.src}`,
      ).toBe(true);
    }
  });

  it('leads with the photographs that have people in them', () => {
    // This list used to alternate landscape and portrait, which encoded an
    // aesthetic preference rather than anything the reader asked for, and it
    // reordered itself twice without being told to. The order is now: the five
    // photos with people, starting with the two of the photographer and their
    // friends, then the places. Assert the rule that was actually chosen rather
    // than the tidier one it replaced.
    const expected = [
      'sunset-friends',
      'elevator',
      'manhattan-bridge',
      'autumn-trail',
      'summit-ridge',
      'golden-gate',
      'palace-of-fine-arts',
      'san-francisco-street',
      'tahoe-shore',
      'vintage-tvs',
    ];

    expect(photos.map((photo) => photo.src.replace('/photos/', '').replace('.jpg', ''))).toEqual(
      expected,
    );

    // The two opening frames are the ones of the photographer and their friends.
    expect(photos[0]?.src).toContain('sunset-friends');
    expect(photos[1]?.src).toContain('elevator');
  });

  it('holds the grid light enough to sit behind the masthead', () => {
    // The band is decorative and loads before the reader scrolls anywhere, so a
    // runaway total is felt immediately on a phone.
    const total = photos.reduce((sum, photo) => {
      const file = resolve(process.cwd(), 'public', photo.src.slice(1));
      return sum + (existsSync(file) ? statSync(file).size : 0);
    }, 0);

    expect(total).toBeLessThan(4 * 1024 * 1024);
  });

  it('has unique alt text', () => {
    expect(new Set(photos.map((photo) => photo.alt)).size).toBe(photos.length);
  });

  it('gives every tile its own slot on the ring, symmetric about the axis', () => {
    const { container } = render(<PhotoGrid />);
    const slots = [...container.querySelectorAll<HTMLElement>('.grid__tile')].map((tile) =>
      Number.parseFloat(tile.style.getPropertyValue('--i')),
    );

    expect(slots).toHaveLength(photos.length);

    // Symmetric about zero: as far to the left of the axis as to the right, so
    // the band straddles the centre of the viewport.
    const first = slots[0] as number;
    const last = slots[slots.length - 1] as number;
    expect(first).toBeCloseTo(-last, 5);

    // Whole slots, one apart, with no repeats.
    const expected = Array.from({ length: photos.length }, (_, i) => i - (photos.length - 1) / 2);
    expect(slots).toEqual(expected);
    expect(new Set(slots).size).toBe(photos.length);

    // The angle comes from the stylesheet multiplying slot by step, so that a
    // change of tile size at a breakpoint stays correct without touching markup.
    expect(gridCss).toMatch(/--a:\s*calc\(var\(--i\)\s*\*\s*var\(--step\)\)/);
  });

  it('stacks the grid behind the type, not in front of it', () => {
    expect(layoutCss).toMatch(/\.hero\s*\{[^}]*isolation:\s*isolate/);
    expect(gridCss).toMatch(/\.grid__viewport\s*\{[^}]*z-index:\s*-2/);
    expect(gridCss).toMatch(/\.grid__scrim\s*\{[^}]*z-index:\s*-1/);
  });

  it('rotates the tiles rather than the whole stage', () => {
    // Rotating the stage or the field would carry the scrim and the mask around
    // with it, and would put every tile through the same foreshortening, which is
    // the slab that read as squishing rather than turning.
    expect(gridCss).not.toMatch(/\.grid__stage\s*\{[^}]*rotateY/);
    expect(gridCss).toMatch(/\.grid__tile\s*\{[^}]*rotateY/);
  });

  it('lets the stage drive the field instead of shadowing it locally', () => {
    // Regression guard, and the reason this file previously passed while the
    // carousel sat perfectly still. The rAF loop writes --spin to the stage; the
    // field consumes it by inheritance. A `--spin` declared on .grid__field
    // itself outranks the inherited value and silently pins the rotation at
    // zero, while a test that reads --spin back off the stage still sees motion
    // and passes. Nothing may redeclare these on the consuming element.
    const fieldBlock = gridCss.match(/\.grid__field\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(fieldBlock, '.grid__field redeclares --spin').not.toMatch(/--spin\s*:/);

    // The transform must carry a default so the ring is still valid before the
    // loop paints its first frame.
    expect(gridCss).toMatch(/rotateY\(calc\(var\(--a\)\s*\+\s*var\(--spin,\s*0deg\)\)\)/);
  });

  it('writes the animation property to the stage the tiles inherit from', () => {
    // Guards the write target itself: the loop's node and the tiles' ancestor have
    // to be the same element, or the coupling above is broken again.
    expect(gridCss).toMatch(/\.grid__field\s*\{[^}]*position:\s*absolute/);
    expect(gridCss).toMatch(/\.grid__viewport\s*\{[^}]*position:\s*absolute/);
    expect(gridCss).not.toMatch(/\.grid__viewport\s*\{[^}]*--spin\s*:/);

    // Same hazard one level down: a local --spin on a tile would outrank the
    // inherited animated value and freeze that tile in place.
    const tileBlock = gridCss.match(/\.grid__tile\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(tileBlock, '.grid__tile redeclares --spin').not.toMatch(/--spin\s*:/);
  });

  it('sways rather than spinning a full turn', () => {
    // A flat grid taken edge-on twice per cycle collapses every tile to a line.
    expect(spin.autoRange).toBeGreaterThan(0);
    expect(spin.autoRange).toBeLessThan(90);
    expect(spin.autoPeriod).toBeGreaterThan(8);
  });

  it('sweeps wide enough to read as a carousel rather than a wobble', () => {
    // The original 22 degrees was chosen while the field was pinned at zero, so
    // the amplitude had never actually been seen. Measured in a browser, 22
    // degrees turns the outermost tiles by a few percent of their width; 34
    // turns them visibly away while the centre pair stay square to the viewer.
    expect(spin.autoRange).toBeGreaterThanOrEqual(30);
    expect(spin.autoRange).toBeLessThan(50);
  });

  it('lays the band out on a cylinder rather than one flat plane', () => {
    // A flat plane rotated about Y foreshortens every tile by the same amount,
    // so the row reads as a slab squishing side to side. Each tile has to turn
    // to its own ring angle and step back along the radius.
    expect(gridCss).toMatch(
      /\.grid__tile\s*\{[^}]*transform:\s*translateX\(-50%\) rotateY\(calc\(var\(--a\)\s*\+\s*var\(--spin/,
    );
    expect(gridCss).toMatch(/translateZ\(calc\(var\(--radius\)\s*\*\s*-1\)\)/);

    // The field must not carry the rotation itself; that is the whole point of
    // the change, since a rotating field is exactly the slab that squished.
    const fieldBlock = gridCss.match(/\.grid__field\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(fieldBlock, '.grid__field still rotates').not.toMatch(/rotateY/);

    // A column track would reserve space the absolutely-placed tiles never use.
    expect(fieldBlock).not.toMatch(/grid-template-columns\s*:/);
  });

  it('computes the ring step from plain arithmetic CSS can actually resolve', () => {
    // The step is a length over a length, and CSS calc refuses to divide one
    // length by another, so it cannot be derived in the stylesheet. The exact
    // chord solution needs asin(); where that is unsupported the custom property
    // is still accepted as a token stream rather than dropped, so it substitutes
    // into every transform that reads it and silently invalidates all of them.
    // The symptom is the entire band collapsing to one spot with no visible
    // cause, which is exactly what happened here.
    const field = gridCss.match(/\.grid__field\s*\{([^}]*)\}/)?.[1] ?? '';
    // Comments explain the asin() trap and would match a naive search, so strip
    // them before asserting on what the rule actually declares.
    const declared = field.replace(/\/\*[\s\S]*?\*\//g, '');

    expect(declared, 'ring step uses asin()').not.toMatch(/asin\(/);
    expect(declared, 'ring step divides by a length').not.toMatch(/\)\s*\/\s*var\(--radius\)/);

    // A bare number, converted to an angle once.
    expect(field).toMatch(/--step-deg:\s*[\d.]+/);
    expect(field).toMatch(/--step:\s*calc\(var\(--step-deg\)\s*\*\s*1deg\)/);

    // Each declared step has to match what ringStep computes for that tile size,
    // or the band quietly overlaps or gaps at that breakpoint.
    const steps = [
      ...gridCss.matchAll(
        /--tile:\s*(\d+)px;[\s\S]*?--gap:\s*(\d+)px;[\s\S]*?--step-deg:\s*([\d.]+)/g,
      ),
    ];

    expect(steps.length, 'no ring geometry blocks found').toBeGreaterThanOrEqual(1);

    for (const [, tile, gap, step] of steps) {
      const expected = ringStep(Number(tile), Number(gap));
      expect(Number(step), `step at ${tile}px tiles`).toBeCloseTo(expected, 1);
    }
  });

  it('re-derives the ring step when the tiles shrink at a breakpoint', () => {
    // The angle is slot * step, and step is inherited from the field, so a
    // smaller tile needs only its own --tile and --gap. An inline per-tile step
    // would outrank the media query and leave the phone band full of gaps.
    const phone =
      gridCss.match(/@media \(max-width: 40rem\)\s*\{[\s\S]*?\.grid__field\s*\{([^}]*)\}/)?.[1] ??
      '';

    expect(phone, 'phone breakpoint does not resize the ring').toMatch(/--tile:\s*\d+px/);
    expect(phone, 'phone breakpoint does not resize the gap').toMatch(/--gap:\s*\d+px/);

    // The field must not set a width or height the tiles inherit, or the smaller
    // tile would sit in the desktop-sized box.
    const fieldBlock = gridCss.match(/\.grid__field\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(fieldBlock).toMatch(/height:\s*var\(--tile\)/);
    expect(fieldBlock).not.toMatch(/height:\s*\d+px/);
  });

  it('keeps perspective outside the ring so near tiles do not balloon', () => {
    // Perspective divides by (distance - z). If that distance is close to the
    // radius the closest tile scales without limit and the band looks like a
    // fish-eye, so it has to sit comfortably beyond it.
    expect(cylinder.perspective).toBeGreaterThan(cylinder.radius * 1.4);
    expect(gridCss).toMatch(/perspective:\s*\d+px/);

    // The two have to agree or the CSS silently uses its own value.
    const declared = Number(gridCss.match(/perspective:\s*(\d+)px/)?.[1] ?? '0');
    expect(declared).toBe(cylinder.perspective);
  });

  it('turns slowly enough to read as a drift rather than a timer', () => {
    expect(spin.autoPeriod).toBeGreaterThan(60);
  });

  it('fetches every photo up front, because lazy tiles never load off frame', () => {
    // The band is one row ten tiles wide, so most tiles start outside the
    // viewport. loading="lazy" never fetches them and they swing into view as
    // empty frames as the carousel turns.
    for (const img of document.createElement('div').querySelectorAll('img')) {
      expect(img.getAttribute('loading')).not.toBe('lazy');
    }

    const { container } = render(<PhotoGrid />);
    const imgs = container.querySelectorAll('.grid__img');

    expect(imgs).toHaveLength(photos.length);
    for (const img of imgs) {
      expect(img.getAttribute('loading'), `lazy image: ${img.getAttribute('src')}`).not.toBe(
        'lazy',
      );
      expect(img.getAttribute('decoding')).toBe('async');
    }
  });

  it('keeps the ring inside its own clipping box', () => {
    // Tiles sit at -radius along Z, so perspective divides by
    // (distance - radius). That has to stay comfortably positive or the near side
    // of the ring projects past the viewport and overflow: hidden eats the band.
    const nearest = cylinder.perspective - cylinder.radius;
    expect(nearest).toBeGreaterThan(cylinder.radius * 0.4);
  });

  it('darkens the scrim enough for overlaid type', () => {
    const scrim = gridCss.match(/\.grid__scrim\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(scrim).toContain('linear-gradient');
    expect(scrim).toMatch(/var\(--bg\)\s*100%/);
    expect(scrim).toMatch(/84%/);
  });

  it('stops the grid eating vertical scroll on touch devices', () => {
    expect(gridCss).toMatch(/touch-action:\s*pan-y/);
  });

  it('reserves hero height for the grid', () => {
    expect(
      Number.parseFloat(globalCss.match(/--hero-h:\s*([\d.]+)rem/)?.[1] ?? '0'),
    ).toBeGreaterThan(0);
  });
});

describe('photo grid rotation', () => {
  it('rotates on its own', async () => {
    frames = [];
    stubEnvironment();

    const { container } = render(<PhotoGrid />);
    const stage = container.querySelector('.grid__stage') as HTMLElement;

    const first = spinAngle(stage);
    advance(4);
    const later = spinAngle(stage);

    expect(Number.isFinite(first)).toBe(true);
    expect(Math.abs(later - first)).toBeGreaterThan(1);

    vi.unstubAllGlobals();
  });

  it('stays within the sway range over a whole cycle', () => {
    frames = [];
    stubEnvironment();

    const { container } = render(<PhotoGrid />);
    const stage = container.querySelector('.grid__stage') as HTMLElement;

    advance(spin.autoPeriod * 1.2);

    expect(Math.abs(spinAngle(stage))).toBeLessThanOrEqual(spin.autoRange + 1);

    vi.unstubAllGlobals();
  });

  it('turns with the arrow keys', async () => {
    frames = [];
    stubEnvironment();

    const { container } = render(<PhotoGrid />);
    const stage = container.querySelector('.grid__stage') as HTMLElement;

    const before = spinAngle(stage);
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const afterKey = spinAngle(stage);

    expect(Math.abs(afterKey - before)).toBeGreaterThan(1);

    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(spinAngle(stage)).toBeCloseTo(before, 1);

    vi.unstubAllGlobals();
  });

  it('ignores keys it does not use', () => {
    frames = [];
    stubEnvironment();

    const { container } = render(<PhotoGrid />);
    const stage = container.querySelector('.grid__stage') as HTMLElement;

    const before = spinAngle(stage);
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(spinAngle(stage)).toBe(before);

    vi.unstubAllGlobals();
  });

  it('clamps the manual offset no matter how many keys are pressed', () => {
    frames = [];
    stubEnvironment();

    const { container } = render(<PhotoGrid />);
    const stage = container.querySelector('.grid__stage') as HTMLElement;

    for (let i = 0; i < 40; i += 1) {
      stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    }

    expect(Math.abs(spinAngle(stage))).toBeLessThanOrEqual(spin.manualLimit + spin.autoRange + 1);

    vi.unstubAllGlobals();
  });

  it('turns on drag and eases back towards centre afterwards', () => {
    frames = [];
    stubEnvironment();

    const { container } = render(<PhotoGrid />);
    const stage = container.querySelector('.grid__stage') as HTMLElement;

    const down = (x: number) =>
      stage.dispatchEvent(
        Object.assign(new MouseEvent('pointerdown', { bubbles: true, clientX: x }), {
          pointerId: 1,
          pointerType: 'mouse',
        }),
      );
    const move = (x: number) =>
      stage.dispatchEvent(
        Object.assign(new MouseEvent('pointermove', { bubbles: true, clientX: x }), {
          pointerId: 1,
          pointerType: 'mouse',
        }),
      );
    const up = (x: number) =>
      stage.dispatchEvent(
        Object.assign(new MouseEvent('pointerup', { bubbles: true, clientX: x }), {
          pointerId: 1,
          pointerType: 'mouse',
        }),
      );

    down(200);
    move(500);
    const dragged = spinAngle(stage);
    up(500);

    expect(Math.abs(dragged)).toBeGreaterThan(1);

    // Let the offset recentre: |angle| should fall, ignoring the sway itself.
    advance(spin.autoPeriod * 3);
    expect(Math.abs(spinAngle(stage))).toBeLessThanOrEqual(spin.autoRange + 1);

    vi.unstubAllGlobals();
  });

  it('is reachable by keyboard and described', async () => {
    frames = [];
    stubEnvironment();

    const { container } = render(<PhotoGrid />);
    const stage = container.querySelector('.grid__stage') as HTMLElement;

    expect(stage).toHaveAttribute('tabindex', '0');
    expect(stage.getAttribute('aria-label')).toMatch(/arrow keys/i);

    await waitFor(() => expect(frames.length).toBeGreaterThan(0));

    vi.unstubAllGlobals();
  });
});
