import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// import.meta.url is an http URL under the jsdom environment, so resolve from
// the project root instead.
const css = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match?.[1]) throw new Error(`Missing --${name} in global.css`);
  return match[1].trim();
}

/** Parses "#rrggbb" or "rgb(r g b / a%)" into 0-1 channels plus alpha. */
function parseColor(value: string) {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1];
    return {
      channels: [0, 2, 4].map((i) => parseInt(raw.slice(i, i + 2), 16) / 255) as [
        number,
        number,
        number,
      ],
      alpha: 1,
    };
  }

  const rgb = value.match(/rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)(%)?)?\s*\)/);
  if (rgb) {
    const alphaValue = rgb[4] === undefined ? 1 : Number(rgb[4]) / (rgb[5] ? 100 : 1);
    return {
      channels: [rgb[1], rgb[2], rgb[3]].map(Number).map((c) => c / 255) as [
        number,
        number,
        number,
      ],
      alpha: alphaValue,
    };
  }

  throw new Error(`Unparseable colour: ${value}`);
}

function composite(top: number[], bottom: number[], alpha: number): number[] {
  return top.map((channel, i) => channel * alpha + bottom[i] * (1 - alpha));
}

function relativeLuminance([r, g, b]: number[]): number {
  const linear = [r, g, b].map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: number[], background: number[]): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Flattens a possibly-translucent token onto the opaque page background. */
function surface(tokenName: string): number[] {
  const bg = parseColor(token('bg')).channels;
  const { channels, alpha } = parseColor(token(tokenName));
  return composite(channels, bg, alpha);
}

/** Contrast of a token against the page background or a named translucent surface. */
function onBackground(tokenName: string, overToken = 'bg'): number {
  return contrastRatio(surface(tokenName), surface(overToken));
}

describe('dark palette', () => {
  it('uses a near-black background and a single accent', () => {
    expect(token('bg')).toBe('#0d0e10');
    expect(token('accent')).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('declares dark color-scheme so form controls and scrollbars match', () => {
    expect(css).toMatch(/color-scheme:\s*dark/);
  });

  it('has no light theme block, which would be dead CSS', () => {
    expect(css).not.toMatch(/data-theme/);
  });

  const textTokens = ['t-primary', 't-secondary', 't-meta', 't-label'];

  it.each(textTokens)('--%s passes WCAG AA for small text on the background', (name) => {
    expect(onBackground(name)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(textTokens)('--%s stays legible on a hovered row', (name) => {
    expect(onBackground(name, 'row-hover')).toBeGreaterThanOrEqual(4.5);
  });

  it('accent passes WCAG AA on the background and on hovered rows', () => {
    expect(onBackground('accent')).toBeGreaterThanOrEqual(4.5);
    expect(onBackground('accent', 'row-hover')).toBeGreaterThanOrEqual(4.5);
  });

  it('orders the text ladder from most to least prominent', () => {
    const ladder = textTokens.map((name) => onBackground(name));
    const descending = [...ladder].sort((a, b) => b - a);
    expect(ladder).toEqual(descending);
  });

  it('keeps the row hover tint subtle enough to stay a tint', () => {
    // A tint should be perceptible but far below the text contrast threshold.
    expect(contrastRatio(surface('row-hover'), surface('bg'))).toBeLessThan(1.15);
  });

  it('respects reduced-motion preferences', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });
});
