/**
 * The photo ring behind the masthead.
 *
 * Ten photographs, one per tile, so nothing repeats.
 *
 * Ordered by whether anyone is in the frame: the five shots with people in them
 * lead, starting with the two of the photographer and their friends, and the
 * places follow. That is the order the reader asked for, and it is worth more
 * than the tidier landscape/portrait alternation this list used to follow --
 * a ring that opens on the same two people in every direction is a worse first
 * impression than three landscapes in a row.
 *
 * The tiles are square, so a portrait frame is cropped against its sides and a
 * landscape one against top and bottom. Once the first photo is fixed the
 * alternation is no longer free, so no test enforces it.
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
    src: '/photos/elevator.jpg',
    alt: 'three friends crowded into an elevator, arms around each other',
  },
  {
    src: '/photos/manhattan-bridge.jpg',
    alt: 'the Manhattan Bridge walkway on a foggy morning, cables converging into grey',
  },
  {
    src: '/photos/autumn-trail.jpg',
    alt: 'two people walking a leaf-covered trail under yellow and green maples',
  },
  {
    src: '/photos/summit-ridge.jpg',
    alt: 'a granite summit ridge above a mountain lake, with a forested valley beyond',
  },
  {
    src: '/photos/golden-gate.jpg',
    alt: 'the Golden Gate Bridge from the Marin side at dusk, the towers lit against a fading sky',
  },
  {
    src: '/photos/palace-of-fine-arts.jpg',
    alt: 'the rotunda at the Palace of Fine Arts lit at night, with people and bikes below',
  },
  {
    src: '/photos/san-francisco-street.jpg',
    alt: 'a San Francisco street at dusk, two contrails crossing above the rooftops',
  },
  {
    src: '/photos/tahoe-shore.jpg',
    alt: 'clear water over granite at Lake Tahoe, seen through a pine branch',
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
 * Rotation. The ring turns one way at a steady speed, forever.
 *
 * It is not a full circle: the band covers about a hundred degrees of ring, so
 * turning it a full revolution would carry every photo off one side and leave
 * the frame empty, and take each tile edge-on, where it collapses to a line. So
 * each tile wraps instead. Once it has turned past the end of the band, which is
 * outside the visible frame and under the edge mask, it is moved one band-width
 * back to the far end. The band reads as an endless ring, and no tile is ever
 * turned more than about fifty degrees from the viewer.
 */
export const spin = {
  /**
   * Steady speed, in degrees per second.
   *
   * Slow on purpose: a photo takes around half a minute to cross the frame, so the
   * motion reads as a drift rather than as a carousel on a timer.
   */
  speed: 2,
  /** Degrees added per keyboard press. */
  keyStep: 6,
  /** A full-width drag turns the ring this many degrees. */
  dragRange: 104,
  /** Cap on how fast a fling can send the ring, in degrees per second. */
  flingLimit: 60,
  /**
   * How quickly a fling settles back to the steady speed, per second. At 1.5 a
   * fling has mostly worn off within a couple of seconds.
   */
  settleRate: 1.5,
} as const;

/** Degrees of ring one full band covers, and so the distance a tile wraps by. */
export function bandSpan(step: number): number {
  return photos.length * step;
}
