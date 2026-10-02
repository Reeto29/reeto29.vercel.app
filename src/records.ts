import type { Album } from './types';

/**
 * The record shelf.
 *
 * Covers in `public/albums/` are the real front covers, fetched from the
 * Internet Archive Cover Art Archive (or the iTunes artwork CDN where
 * MusicBrainz has no release) at 500 to 600px. Replace a file and keep the
 * filename to swap the art without touching code.
 *
 * Years are the original release, not whatever edition the artwork came from:
 * MusicBrainz files 4 Your Eyez Only under a 2016 reissue, and the deluxe and
 * expanded editions of several others carry their own dates.
 */
export const albums: Album[] = [
  {
    slug: 'sonder-son',
    title: 'Sonder Son',
    artist: 'Brent Faiyaz',
    year: 2021,
    cover: '/albums/sonder-son.jpg',
  },
  {
    slug: 'into',
    title: 'Into',
    artist: 'Sonder',
    year: 2017,
    cover: '/albums/into.jpg',
  },
  {
    slug: 'pnd1',
    title: 'PARTYNEXTDOOR 1',
    artist: 'PARTYNEXTDOOR',
    year: 2014,
    cover: '/albums/pnd1.jpg',
  },
  {
    slug: 'pnd2',
    title: 'PARTYNEXTDOOR 2',
    artist: 'PARTYNEXTDOOR',
    year: 2014,
    cover: '/albums/pnd2.jpg',
  },
  {
    slug: 'swimming',
    title: 'Swimming',
    artist: 'Mac Miller',
    year: 2018,
    cover: '/albums/swimming.jpg',
  },
  {
    slug: 'nwts',
    title: 'Nothing Was the Same',
    artist: 'Drake',
    year: 2014,
    cover: '/albums/nwts.jpg',
  },
  {
    slug: 'trapsoul',
    title: 'Trapsoul',
    artist: 'Bryson Tiller',
    year: 2015,
    cover: '/albums/trapsoul.jpg',
  },
  {
    slug: 'nahwc',
    title: 'Not All Heroes Wear Capes',
    artist: 'Metro Boomin',
    year: 2016,
    cover: '/albums/nahwc.jpg',
  },
  {
    slug: 'never-enough',
    title: 'Never Enough',
    artist: 'Daniel Caesar',
    year: 2023,
    cover: '/albums/never-enough.jpg',
  },
  {
    slug: 'freudian',
    title: 'Freudian',
    artist: 'Daniel Caesar',
    year: 2018,
    cover: '/albums/freudian.jpg',
  },
  {
    slug: 'the-lo-fis',
    title: 'The Lo-Fis',
    artist: 'Steve Lacy',
    year: 2020,
    cover: '/albums/the-lo-fis.jpg',
  },
  {
    slug: 'forest-hills-drive',
    title: '2014 Forest Hills Drive',
    artist: 'J. Cole',
    year: 2014,
    cover: '/albums/forest-hills-drive.jpg',
  },
  {
    slug: '4-your-eyez-only',
    title: '4 Your Eyez Only',
    artist: 'J. Cole',
    year: 2013,
    cover: '/albums/4-your-eyez-only.jpg',
  },
  {
    slug: 'damn',
    title: 'DAMN.',
    artist: 'Kendrick Lamar',
    year: 2017,
    cover: '/albums/damn.jpg',
  },
  {
    slug: 'take-care',
    title: 'Take Care',
    artist: 'Drake',
    year: 2011,
    cover: '/albums/take-care.jpg',
  },
  {
    slug: 'tpab',
    title: 'To Pimp a Butterfly',
    artist: 'Kendrick Lamar',
    year: 2015,
    cover: '/albums/tpab.jpg',
  },
  {
    slug: 'mirage',
    title: 'Mirage',
    artist: 'Avenoir',
    year: 2025,
    cover: '/albums/mirage.jpg',
  },
];

/**
 * Shelf behaviour.
 *
 * Every record lives on the shelf at the bottom until it is displayed. Displaying
 * one lifts it up onto a rail; the rails hold a fixed number, and the record at the
 * end of the queue goes back down to the shelf when a new one goes up.
 *
 * Three states per record: on the shelf, on a rail, and playing. Promoting a
 * record from the shelf puts it on a rail at the front. Clicking a record already
 * on a rail makes it the one playing. Clicking the one playing puts it back on the
 * shelf.
 */
export const shelf = {
  /** Rails of slots above the shelf. */
  displayRows: 2,
  /** Slots per rail. The product of the two is the display capacity. */
  displayCols: 3,
  /** Milliseconds a record spends travelling between the shelf and a rail. */
  flightMs: 620,
} as const;

/** Total number of records that can be displayed at once. */
export const displayCapacity = shelf.displayRows * shelf.displayCols;
