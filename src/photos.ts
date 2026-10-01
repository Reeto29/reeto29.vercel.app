/**
 * The photo grid behind the masthead.
 *
 * These are generated placeholders. Replace the files in `public/photos/` and
 * point `src` at them; regenerate the stand-ins with
 * `python3 scripts/make_placeholders.py`.
 *
 * Sized so there is exactly one photo per tile, which means nothing repeats.
 * Keep this in step with grid.columns * grid.rows; a test enforces it.
 */
const COUNT = 8;

const SUBJECTS = [
  'a ridgeline at dusk',
  'a coastline at blue hour',
  'a canyon in late afternoon',
  'city lights at night',
  'a lake before dawn',
  'cliffs above the sea',
  'a plateau at sunset',
  'a harbour under moonlight',
];

export const photos: { src: string; alt: string }[] = Array.from({ length: COUNT }, (_, i) => ({
  src: `/photos/placeholder-${i + 1}.jpg`,
  alt: `Placeholder: ${SUBJECTS[i]}`,
}));

/**
 * Grid geometry: one row of large tiles spanning the viewport.
 *
 * The band is a fixed height, so tile size and tile count trade directly against
 * each other. These are set big enough that the photos read as photographs
 * rather than as texture, which leaves a single row to sweep through.
 */
export const grid = {
  columns: 8,
  rows: 1,
  tile: 360,
  gap: 20,
} as const;

/**
 * Rotation. The default motion is a slow sway rather than a full spin: spinning a
 * flat grid a full turn about Y takes it edge-on twice per cycle, where every
 * tile collapses to a line and the panel disappears. A bounded sweep reads the
 * same as a carousel turning but never degenerates.
 */
export const spin = {
  /** Degrees either side of centre for the automatic sway. */
  autoRange: 22,
  /** Seconds for one full sway cycle. */
  autoPeriod: 26,
  /** Degrees added per keyboard press. */
  keyStep: 12,
  /** Clamp on the manual offset, in degrees. */
  manualLimit: 46,
  /** Manual offset drifts back to centre this many times slower than the sway. */
  recentreRate: 0.35,
} as const;
