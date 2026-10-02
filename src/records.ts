import type { Album } from './types';

/**
 * The record shelf.
 *
 * One `spine` colour per album so the shelf reads as a shelf of distinct
 * records rather than a row of identical bars. These are artwork colours, not
 * theme colours, so they live here rather than in `styles/global.css` with the
 * contrast-checked palette tokens.
 *
 * Covers in `public/albums/` are the real front covers, fetched from the
 * Internet Archive Cover Art Archive (or the iTunes artwork CDN where
 * MusicBrainz has no release) at 500 to 600px. Replace a file and keep the
 * filename to swap the art without touching code.
 */
export const albums: Album[] = [
  {
    slug: 'sonder-son',
    title: 'Sonder Son',
    artist: 'Brent Faiyaz',
    year: 2021,
    cover: '/albums/sonder-son.jpg',
    spine: '#7a3226',
  },
  {
    slug: 'into',
    title: 'Into',
    artist: 'Sonder',
    year: 2017,
    cover: '/albums/into.jpg',
    spine: '#4a3a55',
  },
  {
    slug: 'pnd1',
    title: 'PARTYNEXTDOOR 1',
    artist: 'PARTYNEXTDOOR',
    year: 2014,
    cover: '/albums/pnd1.jpg',
    spine: '#25413c',
  },
  {
    slug: 'pnd2',
    title: 'PARTYNEXTDOOR 2',
    artist: 'PARTYNEXTDOOR',
    year: 2014,
    cover: '/albums/pnd2.jpg',
    spine: '#2c3050',
  },
  {
    slug: 'swimming',
    title: 'Swimming',
    artist: 'Mac Miller',
    year: 2018,
    cover: '/albums/swimming.jpg',
    spine: '#1f3b54',
  },
  {
    slug: 'nwts',
    title: 'Nothing Was the Same',
    artist: 'Drake',
    year: 2014,
    cover: '/albums/nwts.jpg',
    spine: '#3d3122',
  },
  {
    slug: 'trapsoul',
    title: 'Trapsoul',
    artist: 'Bryson Tiller',
    year: 2015,
    cover: '/albums/trapsoul.jpg',
    spine: '#4d3c1d',
  },
  {
    slug: 'nahwc',
    title: 'Not All Heroes Wear Capes',
    artist: 'Metro Boomin',
    year: 2016,
    cover: '/albums/nahwc.jpg',
    spine: '#3b2133',
  },
  {
    slug: 'never-enough',
    title: 'Never Enough',
    artist: 'Daniel Caesar',
    year: 2023,
    cover: '/albums/never-enough.jpg',
    spine: '#2b2b58',
  },
  {
    slug: 'freudian',
    title: 'Freudian',
    artist: 'Daniel Caesar',
    year: 2018,
    cover: '/albums/freudian.jpg',
    spine: '#4d1f24',
  },
  {
    slug: 'the-lo-fis',
    title: 'The Lo-Fis',
    artist: 'Steve Lacy',
    year: 2020,
    cover: '/albums/the-lo-fis.jpg',
    spine: '#3a3a3a',
  },
];

/**
 * Deck behaviour.
 *
 * The queue holds `queueSize` records. Picking one off the shelf puts it at the
 * front and, if the queue is already full, the record at the end is the one that
 * goes back to the bottom of the shelf. That is the whole mechanic.
 */
export const deck = {
  /** How many records the queue holds before the tail is returned. */
  queueSize: 6,
  /** Records pre-loaded into the queue so the deck is not empty on arrival. */
  seed: 3,
  /** Milliseconds a record spends travelling between the shelf and the queue. */
  flightMs: 520,
  /**
   * Shelf jitter, in px.
   *
   * Spines stand at slightly different heights so the row does not look ruled, as
   * if hand-shelved. The width and height live in RecordShelf.css rather than
   * here because the media query has to be able to override them; a test asserts
   * the two stay consistent with the longest title.
   */
  spineJitter: 9,
} as const;
