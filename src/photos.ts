/**
 * The photo ring behind the masthead.
 *
 * Ten photographs, one per tile, so nothing repeats.
 *
 * Order alternates landscape and portrait on purpose. The tiles are square, so a
 * portrait frame is cropped hard against its sides while a landscape one is
 * cropped top and bottom, and mixing the two up stops the sweep from reading as a
 * single repeated shape.
 *
 * Alt text is written per photo but is not what a screen reader announces. The
 * ring is decorative and described once by a single label on the stage, because it
 * moves on its own; describing ten photographs individually would make a moving
 * decoration the noisiest thing on the page. The copy here is what the one label
 * and the source file are for.
 */
export const photos: { src: string; alt: string }[] = [
  {
    src: '/photos/sunset-friends.jpg',
    alt: 'three friends laughing together at sunset on a hillside',
  },
  {
    src: '/photos/golden-gate.jpg',
    alt: 'the Golden Gate Bridge from the Marin side at dusk, the towers lit against a fading sky',
  },
  {
    src: '/photos/manhattan-bridge.jpg',
    alt: 'the Manhattan Bridge walkway on a foggy morning, cables converging into grey',
  },
  {
    src: '/photos/palace-of-fine-arts.jpg',
    alt: 'the rotunda at the Palace of Fine Arts lit at night, with people and bikes below',
  },
  {
    src: '/photos/tahoe-shore.jpg',
    alt: 'clear water over granite at Lake Tahoe, seen through a pine branch',
  },
  {
    src: '/photos/san-francisco-street.jpg',
    alt: 'a San Francisco street at dusk, two contrails crossing above the rooftops',
  },
  {
    src: '/photos/summit-ridge.jpg',
    alt: 'a granite summit ridge above a mountain lake, with a forested valley beyond',
  },
  {
    src: '/photos/autumn-trail.jpg',
    alt: 'two people walking a leaf-covered trail under yellow and green maples',
  },
  {
    src: '/photos/elevator.jpg',
    alt: 'three friends crowded into an elevator, arms around each other',
  },
  {
    src: '/photos/vintage-tvs.jpg',
    alt: 'a wall of old CRT televisions in a vintage shop, all showing the same group photo',
  },
];

/**
 * Grid geometry: one row of large tiles spanning the viewport.
 *
 * The band is a fixed height, so tile size and tile count trade directly against
 * each other. These are set big enough that the photos read as photographs
 * rather than as texture, which leaves a single row to sweep through.
 */
export const grid = {
  columns: 10,
  rows: 1,
  tile: 360,
  gap: 20,
} as const;

/**
 * Cylinder geometry.
 *
 * The band is a ring of photos on a cylinder rather than one flat plane. A flat
 * plane rotated about Y is mostly a scaling effect: every tile foreshortens by the
 * same amount, so the row reads as a slab squishing side to side instead of
 * turning. On a cylinder each tile keeps its own angle and travels its own arc,
 * which is what makes it look like it is spinning.
 */
export const cylinder = {
  /** Ring radius in px. Larger is a flatter, subtler curve. */
  radius: 2050,
  /**
   * Perspective in px. Deliberately well beyond the ring: perspective divides by
   * (distance - z), and tiles sit at -radius, so a near-side value sends the
   * closest tile past the vanishing point. At 3400 against a 2050 ring the
   * centre tile scales by about 0.63 and the outermost by about 0.71, so depth
   * reads without a fish-eye.
   */
  perspective: 3400,
} as const;

/**
 * Angle between neighbouring tiles, in degrees.
 *
 * Derived rather than hand-set, so that changing the radius or the tile size
 * cannot leave the band overlapping or gapping.
 *
 * This uses the small-angle form, arc = r · θ, rather than solving the chord
 * exactly (2r·sin(θ/2) = w + gap). The two differ by about 0.015 degrees here,
 * which at this radius is roughly half a pixel across a tile, so the exact form
 * buys nothing visible. It matters that the exact form is *not* used in CSS: it
 * needs asin(), which this Chrome build does not support, and a custom property
 * holding an unsupported function is not dropped the way an invalid declaration
 * on a normal property is. It substitutes as a token stream and quietly poisons
 * every transform that reads it, which is exactly what happened.
 *
 * `--step-deg` in PhotoGrid.css holds the same number per breakpoint. A test
 * asserts the two agree.
 */
export function ringStep(tile: number, gap: number): number {
  return ((tile + gap) / cylinder.radius) * (180 / Math.PI);
}

/** Total degrees of ring the band covers, centre tile excluded. */
export const RING_SPAN = ((photos.length - 1) / 2) * ringStep(grid.tile, grid.gap);

/**
 * Rotation. The default motion is a slow drift rather than a full spin: taking
 * the ring a full turn about Y takes every tile edge-on twice per cycle, where
 * they collapse to a line and the band disappears. A bounded sway reads the same
 * as a carousel turning but never degenerates.
 */
export const spin = {
  /**
   * Degrees either side of centre for the automatic sway.
   *
   * A little over three ring steps, so the outermost tiles travel a visible arc
   * while the centre pair stay square to the viewer.
   */
  autoRange: 34,
  /**
   * Seconds for one full sway cycle.
   *
   * Slow on purpose. The ring turns once every 96 seconds, so a photo crosses the
   * frame over roughly half a minute and the motion reads as the band breathing
   * rather than as a carousel on a timer.
   */
  autoPeriod: 96,
  /** Degrees added per keyboard press. */
  keyStep: 6,
  /** Clamp on the manual offset, in degrees. */
  manualLimit: 52,
  /** Manual offset drifts back to centre this many times slower than the sway. */
  recentreRate: 0.35,
} as const;
