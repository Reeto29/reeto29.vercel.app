import { render, waitFor } from '@testing-library/react';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { PhotoGrid } from '../components/PhotoGrid';
import { grid, photos, spin } from '../photos';

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

describe('photo grid', () => {
  it('has one photo per tile so nothing repeats', () => {
    expect(photos.length).toBe(grid.columns * grid.rows);
    expect(new Set(photos.map((photo) => photo.src)).size).toBe(photos.length);
  });

  it('is wider than it is tall, sized to span the viewport', () => {
    const fieldWidth = grid.columns * grid.tile + (grid.columns - 1) * grid.gap;
    const fieldHeight = grid.rows * grid.tile + (grid.rows - 1) * grid.gap;

    expect(grid.columns).toBeGreaterThan(grid.rows);
    // Wide enough to read as a band across the page rather than a block of tiles.
    expect(fieldWidth).toBeGreaterThan(1000);
    expect(fieldHeight).toBeLessThan(fieldWidth);
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

  it('alternates orientation so a square crop does not read as one repeated shape', () => {
    // The tiles are square, so portrait frames crop against their sides and
    // landscape against top and bottom. Strict alternation is impossible with
    // six landscape and four portrait photos, so the achievable rule is that no
    // three in a row share an orientation.
    const isPortrait = (photo: { src: string }) =>
      /\/(manhattan-bridge|tahoe-shore|autumn-trail|elevator)\./.test(photo.src);

    expect(photos.filter(isPortrait).length).toBe(4);

    for (let i = 0; i + 2 < photos.length; i += 1) {
      const run = [photos[i], photos[i + 1], photos[i + 2]].map(isPortrait);
      expect(
        run.every((same) => same === run[0]),
        `photos ${i}-${i + 2} are all the same orientation`,
      ).toBe(false);
    }
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

  it('keeps the column count in the markup and the stylesheet in agreement', () => {
    expect(gridCss).toContain(`repeat(${grid.columns}, ${grid.tile}px)`);
  });

  it('stacks the grid behind the type, not in front of it', () => {
    expect(layoutCss).toMatch(/\.hero\s*\{[^}]*isolation:\s*isolate/);
    expect(gridCss).toMatch(/\.grid__viewport\s*\{[^}]*z-index:\s*-2/);
    expect(gridCss).toMatch(/\.grid__scrim\s*\{[^}]*z-index:\s*-1/);
  });

  it('rotates the field rather than the whole stage', () => {
    // Rotating the stage would carry the scrim and the mask around with it.
    expect(gridCss).toMatch(/\.grid__field\s*\{[^}]*rotateY\(var\(--spin/);
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
    expect(fieldBlock, '.grid__field redeclares --shift').not.toMatch(/--shift\s*:/);

    // The transform must carry a default so the field is still valid before the
    // loop paints its first frame.
    expect(gridCss).toMatch(/rotateY\(var\(--spin,\s*0deg\)\)/);
    expect(gridCss).toMatch(/var\(--shift,\s*0px\)/);
  });

  it('writes the animation properties to the stage the field inherits from', () => {
    // Guards the write target itself: the loop's node and the field's parent
    // have to be the same element, or the coupling above is broken again.
    expect(gridCss).toMatch(/\.grid__field\s*\{[^}]*position:\s*absolute/);
    expect(gridCss).toMatch(/\.grid__viewport\s*\{[^}]*position:\s*absolute/);
    // --shift exists only on the stage, so if the field is inside the viewport
    // inside the stage, the inheritance chain is stage -> viewport -> field.
    expect(gridCss).not.toMatch(/\.grid__viewport\s*\{[^}]*--spin\s*:/);
    expect(gridCss).not.toMatch(/\.grid__viewport\s*\{[^}]*--shift\s*:/);
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

  it('travels horizontally as it turns, since rotation alone barely moves the band', () => {
    // A rotateY is mostly a scaling effect, so without this coupling the sweep
    // slides the photos a few dozen pixels and reads as a wobble.
    expect(spin.shiftPerDegree).toBeGreaterThan(0);
    // A third of a tile per degree: enough travel to read, not so much that the
    // band races off frame at the extremes.
    expect(spin.shiftPerDegree * spin.autoRange).toBeGreaterThan(300);
    expect(spin.shiftPerDegree * spin.autoRange).toBeLessThan(900);

    // The stylesheet has to consume it, or the coupling is dead code.
    expect(gridCss).toMatch(/translate3d\(calc\(-50% \+ var\(--shift/);
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

  it('keeps the tile depth small enough to stay inside its clipping box', () => {
    // Perspective scales a tile by P / (P - depth); too much depth pushes tiles
    // past the viewport and overflow: hidden eats the middle of the grid.
    const depth = Number(
      gridCss.match(/--depth:[\s\S]{0,120}?\*\s*(\d+(?:\.\d+)?)px/)?.[1] ?? '999',
    );
    const perspective = Number(gridCss.match(/perspective:\s*(\d+)px/)?.[1] ?? '1');

    expect(depth).toBeLessThan(perspective * 0.2);
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
