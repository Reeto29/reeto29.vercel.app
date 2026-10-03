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
    trackName: 'Stay Down',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d7/f3/b4/d7f3b4d7-9201-9644-f160-0bd536637cc0/mzaf_1826870790552813855.plus.aac.p.m4a',
  },
  {
    slug: 'into',
    title: 'Into',
    artist: 'Sonder',
    year: 2017,
    cover: '/albums/into.jpg',
    trackName: 'Searchin',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/08/1c/a1/081ca17f-548c-7522-4f4e-b57416807c45/mzaf_14981405246512816413.plus.aac.p.m4a',
  },
  {
    slug: 'pnd1',
    title: 'PARTYNEXTDOOR',
    artist: 'PARTYNEXTDOOR',
    year: 2013,
    cover: '/albums/pnd1.jpg',
    trackName: 'Right Now',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/49/8f/52/498f528e-b268-1a80-ce2a-ca91c86ac516/mzaf_12202456062328802935.plus.aac.p.m4a',
  },
  {
    slug: 'pnd2',
    title: 'PARTYNEXTDOOR 2',
    artist: 'PARTYNEXTDOOR',
    year: 2014,
    cover: '/albums/pnd2.jpg',
    trackName: 'FWU',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c6/a5/a1/c6a5a179-87fd-0815-be3b-7d954960b29c/mzaf_16967879037635845373.plus.aac.p.m4a',
  },
  {
    slug: 'swimming',
    title: 'Swimming',
    artist: 'Mac Miller',
    year: 2018,
    cover: '/albums/swimming.jpg',
    trackName: 'Self Care',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/54/df/a2/54dfa2fe-38f3-bb0f-dbf9-8171475110ee/mzaf_9760428484907124190.plus.aac.p.m4a',
  },
  {
    slug: 'nwts',
    title: 'Nothing Was the Same',
    artist: 'Drake',
    year: 2014,
    cover: '/albums/nwts.jpg',
    trackName: 'From Time (feat. Jhene Aiko)',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/91/eb/05/91eb05fc-fc69-d9bd-21f6-301d5836fe70/mzaf_16035053226100838608.plus.aac.p.m4a',
  },
  {
    slug: 'trapsoul',
    title: 'Trapsoul',
    artist: 'Bryson Tiller',
    year: 2015,
    cover: '/albums/trapsoul.jpg',
    trackName: 'Exchange',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b9/8a/d6/b98ad678-7232-33b7-e8eb-ae49a45ebde8/mzaf_12583855183493364089.plus.aac.p.m4a',
  },
  {
    slug: 'nahwc',
    title: 'Not All Heroes Wear Capes',
    artist: 'Metro Boomin',
    year: 2016,
    cover: '/albums/nahwc.jpg',
    trackName: 'Only 1 (Interlude) [feat. Travis Scott]',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b6/4f/49/b64f490a-eee7-541e-4021-995703da7f28/mzaf_8724686883620569162.plus.aac.p.m4a',
  },
  {
    slug: 'never-enough',
    title: 'Never Enough',
    artist: 'Daniel Caesar',
    year: 2023,
    cover: '/albums/never-enough.jpg',
    trackName: 'Toronto 2014',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/19/b6/4e/19b64ec2-5955-b069-de51-22bff9406b1a/mzaf_15261876396802691284.plus.aac.p.m4a',
  },
  {
    slug: 'freudian',
    title: 'Freudian',
    artist: 'Daniel Caesar',
    year: 2018,
    cover: '/albums/freudian.jpg',
    trackName: 'Transform (feat. Charlotte Day Wilson)',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/82/4b/12824bb3-0045-356d-98cc-0d516ecd6121/mzaf_4685624648406533826.plus.aac.p.m4a',
  },
  {
    slug: 'the-lo-fis',
    title: 'The Lo-Fis',
    artist: 'Steve Lacy',
    year: 2020,
    cover: '/albums/the-lo-fis.jpg',
    trackName: 'Out of Me Head',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ce/14/7e/ce147e5c-58d1-e15a-d399-7061e04e04af/mzaf_6711123655898067925.plus.aac.p.m4a',
  },
  {
    slug: 'forest-hills-drive',
    title: '2014 Forest Hills Drive',
    artist: 'J. Cole',
    year: 2014,
    cover: '/albums/forest-hills-drive.jpg',
    trackName: 'Love Yourz',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/4b/c1/74/4bc17432-6ba9-0ea4-fa84-d6525bbbb5ec/mzaf_3225873646886740243.plus.aac.p.m4a',
  },
  {
    slug: '4-your-eyez-only',
    title: '4 Your Eyez Only',
    artist: 'J. Cole',
    year: 2013,
    cover: '/albums/4-your-eyez-only.jpg',
    trackName: '4 Your Eyez Only',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/49/a9/3f/49a93fef-070e-25bf-cb88-4ca74b35edbc/mzaf_6277794416083812387.plus.aac.p.m4a',
  },
  {
    slug: 'damn',
    title: 'DAMN.',
    artist: 'Kendrick Lamar',
    year: 2017,
    cover: '/albums/damn.jpg',
    trackName: 'LOYALTY. (feat. Rihanna)',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/88/b4/21/88b42176-068f-63cf-4bd7-4ce048efcfda/mzaf_6858930629601595049.plus.aac.p.m4a',
  },
  {
    slug: 'take-care',
    title: 'Take Care',
    artist: 'Drake',
    year: 2011,
    cover: '/albums/take-care.jpg',
    trackName: "Look What You've Done",
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/6b/e4/45/6be44545-3907-90b1-8beb-d6cca35ce826/mzaf_6522976757940714707.plus.aac.p.m4a',
  },
  {
    slug: 'tpab',
    title: 'To Pimp a Butterfly',
    artist: 'Kendrick Lamar',
    year: 2015,
    cover: '/albums/tpab.jpg',
    trackName: 'Institutionalized (feat. Bilal, Anna Wise & Snoop Dogg)',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d3/b8/12/d3b812d0-0610-af62-114d-b960b5ff7471/mzaf_9470580130824056266.plus.aac.p.m4a',
  },
  {
    slug: 'mirage',
    title: 'Mirage',
    artist: 'Avenoir',
    year: 2025,
    cover: '/albums/mirage.jpg',
    trackName: 'Alone',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/4b/02/cd/4b02cdc3-0b5b-b803-82a7-18a2b9717fad/mzaf_9937627911532951900.plus.aac.p.m4a',
  },
];

/**
 * Shelf behaviour.
 *
 * Records sit in one of three places. The queue is the main shelf, a fixed number
 * of slots in display order. The deck is the turntable, which holds exactly one
 * record and plays it. Everything else is in the bottom shelf.
 *
 * Clicking a record in the queue moves it to the deck, and whatever the deck was
 * holding takes the slot the record came from, so a swap never changes the queue's
 * length. Clicking the record on the deck returns it to the front of the queue, and
 * when the queue is already full the record at the end of it falls to the bottom
 * shelf. Clicking a record in the bottom shelf promotes it the same way, which is
 * the only way anything ever gets back onto a full queue.
 */
export const shelf = {
  /** Rows of slots on the main shelf. */
  displayRows: 2,
  /** Slots per row. The product of the two is the queue capacity. */
  displayCols: 3,
  /** Milliseconds a record spends travelling between shelves and the deck. */
  flightMs: 620,
} as const;

/** Total number of records the main shelf holds at once. */
export const displayCapacity = shelf.displayRows * shelf.displayCols;
