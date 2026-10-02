/**
 * The photo grid behind the masthead.
 *
 * Ten photographs, one per tile, so nothing repeats. Keep the list length equal to
 * grid.columns * grid.rows; a test enforces it.
 *
 * Order alternates landscape and portrait on purpose. The tiles are square, so a
 * portrait frame is cropped hard against its sides while a landscape one is
 * cropped top and bottom, and mixing the two up stops the sweep from reading as a
 * single repeated shape.
 *
 * Alt text is written per photo but is not what a screen reader announces. The
 * grid is decorative and described once by a single label on the stage, because it
 * moves on its own; describing ten photographs individually would make a moving
 * decoration the noisiest thing on the page. The copy here is what the one label
 * and the source file are for.
 */
export const photos: { src: string; alt: string }[] = [
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
    src: '/photos/sunset-friends.jpg',
    alt: 'three friends laughing together at sunset on a hillside',
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
 * Rotation. The default motion is a slow sway rather than a full spin: spinning a
 * flat grid a full turn about Y takes it edge-on twice per cycle, where every
 * tile collapses to a line and the panel disappears. A bounded sweep reads the
 * same as a carousel turning but never degenerates.
 */
export const spin = {
  /**
   * Degrees either side of centre for the automatic sway.
   *
   * This was 22 while the field was silently pinned at zero rotation, so the
   * amplitude had never actually been seen. Measured in a browser at 22, the
   * band changed tile width by about four percent across a whole cycle, which
   * does not read as motion. At 34 the outermost tiles turn visibly away from
   * the viewer while the centre pair stay square to it.
   */
  autoRange: 34,
  /** Seconds for one full sway cycle. */
  autoPeriod: 26,
  /**
   * Horizontal travel in px per degree of rotation.
   *
   * Rotation on its own is largely a scaling effect, so the band needs this to
   * actually travel across the frame. Roughly one tile width per 20 degrees.
   */
  shiftPerDegree: 18,
  /** Degrees added per keyboard press. */
  keyStep: 12,
  /** Clamp on the manual offset, in degrees. */
  manualLimit: 52,
  /** Manual offset drifts back to centre this many times slower than the sway. */
  recentreRate: 0.35,
} as const;
