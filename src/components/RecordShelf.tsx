import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { albums, shelf } from '../records';
import type { Album } from '../types';
import { Deck } from './Deck';
import { Videos } from './Videos';
import { albumAt, fromDeck, initialShelf, promote, toDeck, type Shelf } from './shelfState';
import './RecordShelf.css';

type Box = {
  top: number;
  left: number;
  width: number;
  height: number;
  /** The record's centre label on the turntable, which is a circle, not a sleeve. */
  round: boolean;
};

type Flight = {
  id: number;
  album: Album;
  from: Box;
  /** Measured after the state commits, once the destination slot exists. */
  to: Box | null;
};

/**
 * Where a sleeve sits on screen. On the turntable that is the centre label rather
 * than the whole platter: the cover is the label, so a record put on the deck
 * shrinks down onto it as it lands, and one lifted off grows back out of it.
 */
const boxOf = (element: HTMLElement): Box => {
  const rect = element.getBoundingClientRect();
  const label = element.querySelector<HTMLElement>('.deck__label');

  if (label === null) {
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, round: false };
  }

  /*
    The label turns with the record, and a rotated element's bounding box swells
    by up to a half at 45 degrees. So the label's own unrotated size is centred on
    the platter, which never turns, instead of measuring the label directly.
  */
  const size = label.offsetWidth;
  return {
    top: rect.top + (rect.height - size) / 2,
    left: rect.left + (rect.width - size) / 2,
    width: size,
    height: size,
    round: true,
  };
};

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * The record shelf: a main shelf, a turntable, and a bottom shelf.
 *
 * The main shelf is a queue of six slots. Clicking a record there puts it on the
 * turntable, where it spins and plays a thirty second preview; clicking a record on
 * the turntable puts it back at the front of the queue, bumping the last one down
 * when the queue is full. The bottom shelf holds everything else, stacked like a
 * crate of LPs, and clicking one promotes it onto the queue the same way.
 *
 * Swapping two records on the main shelf is a trade rather than a bump: the record
 * you click goes to the turntable and whatever was there takes its slot, so the
 * queue keeps its shape.
 *
 * The flight between any two of those places is one rAF loop writing transforms to
 * a fixed overlay layer. State commits immediately, so what is shown and what is on
 * the turntable are never wrong while an animation is still running; the overlay is
 * decoration on top of that. Under reduced motion the overlay is skipped and the
 * state change is the effect.
 */
export function RecordShelf() {
  const [state, setState] = useState<Shelf>(initialShelf);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [announcement, setAnnouncement] = useState('');

  const layerRef = useRef<HTMLDivElement>(null);
  const flightId = useRef(0);

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Starts the overlay for a record leaving `source` and, optionally, another
   * record leaving its own slot at the same time. A bump moves two records, so
   * both fly together rather than one jumping after the other.
   */
  const fly = (album: Album, source: HTMLElement, leaving?: string) => {
    if (reducedMotion()) {
      setFlights([]);
      return;
    }

    const outbound = leaving === undefined ? undefined : albumAt(leaving);
    const tail =
      outbound === undefined
        ? null
        : (document.querySelector<HTMLElement>(`[data-slot="${leaving}"]`) ?? null);

    setFlights([
      {
        id: (flightId.current += 1),
        album,
        from: boxOf(source),
        to: null,
      },
      ...(tail === null || outbound === undefined
        ? []
        : [
            {
              id: (flightId.current += 1),
              album: outbound,
              from: boxOf(tail),
              to: null,
            },
          ]),
    ]);
  };

  /** A record on the bottom shelf, promoted to the front of the queue. */
  const pullUp = (album: Album, source: HTMLElement) => {
    const bumped =
      state.queue.length >= shelf.displayRows * shelf.displayCols ? state.queue.at(-1) : undefined;

    setState((current) => promote(current, album.slug));
    setAnnouncement(
      `${album.title} by ${album.artist} is on the main shelf.${
        bumped === undefined ? '' : ` ${albumAt(bumped)?.title ?? ''} went to the bottom shelf.`
      }`,
    );
    fly(album, source, bumped);
  };

  /**
   * A record on the main shelf, put on the turntable.
   *
   * Whatever the deck was holding takes the slot this record came from, which is
   * the swap: the queue keeps its length and only one sleeve changes hands.
   */
  const putOnDeck = (album: Album, source: HTMLElement, index: number) => {
    const displaced = state.deck;

    setState((current) => toDeck(current, album.slug, index));
    setAnnouncement(
      `${album.title} by ${album.artist} is on the turntable, playing ${album.trackName}.${
        displaced === undefined
          ? ''
          : ` ${albumAt(displaced)?.title ?? ''} took its place on the main shelf.`
      }`,
    );
    fly(album, source);
  };

  /** The record on the turntable, put back at the front of the queue. */
  const takeOffDeck = (album: Album, source: HTMLElement) => {
    const bumped =
      state.queue.length >= shelf.displayRows * shelf.displayCols ? state.queue.at(-1) : undefined;

    setState(fromDeck);
    setAnnouncement(
      `${album.title} by ${album.artist} is back on the main shelf.${
        bumped === undefined ? '' : ` ${albumAt(bumped)?.title ?? ''} went to the bottom shelf.`
      }`,
    );
    fly(album, source, bumped);
  };

  /*
    A destination slot does not exist until React commits, so it can only be
    measured afterwards. One that measures zero means the tree is not laid out;
    the overlay then fades rather than flies, and the committed state still holds.
  */
  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (layer === null || flights.length === 0) return;

    const measured = flights.map((flight) => {
      const target = document.querySelector<HTMLElement>(`[data-slot="${flight.album.slug}"]`);
      const to = target === null ? null : boxOf(target);

      return { ...flight, to: to !== null && to.width > 0 ? to : null };
    });

    /*
      The clock is the first frame's own timestamp rather than
      `performance.now()`: frame callbacks carry the time the frame was
      scheduled, which keeps the flight on the host's clock and stops a long
      first frame reading as instant progress.
    */
    let startedAt: number | null = null;
    let frame = 0;

    const paint = (now: number) => {
      startedAt ??= now;

      const t = Math.min(1, Math.max(0, (now - startedAt) / shelf.flightMs));
      const eased = easeOut(t);

      for (const flight of measured) {
        const node = layer.querySelector<HTMLElement>(`[data-overlay="${flight.id}"]`);
        if (node === null) continue;

        if (flight.to === null) {
          node.style.opacity = '0';
          continue;
        }

        // Lifted, not teleported: rise above the straight line by a fraction of the
        // distance, capped so a short hop stays small.
        const rise =
          -Math.sin(Math.PI * eased) *
          Math.min(72, Math.abs(flight.to.top - flight.from.top) * 0.28);

        node.style.transform = `translate3d(${
          flight.from.left + (flight.to.left - flight.from.left) * eased
        }px, ${flight.from.top + (flight.to.top - flight.from.top) * eased + rise}px, 0)`;
        // The sleeve takes on the size of wherever it is going, so it lands exactly
        // over the slot it is filling: up into a rail it grows, down into the crate
        // it shrinks, and onto the platter it matches the disc.
        node.style.width = `${flight.from.width + (flight.to.width - flight.from.width) * eased}px`;
        node.style.height = `${flight.from.height + (flight.to.height - flight.from.height) * eased}px`;
        // Square sleeve to round label, or back, over the same flight.
        const roundness = (flight.from.round ? 1 - eased : 0) + (flight.to.round ? eased : 0);
        node.style.borderRadius = `${2 + roundness * 48}%`;
        node.style.opacity = '1';
      }

      if (t < 1) {
        frame = requestAnimationFrame(paint);
      } else {
        setFlights([]);
      }
    };

    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [flights]);

  const flying = new Set(flights.map((flight) => flight.album.slug));
  const queued = new Set(state.queue);
  const onDeck = albumAt(state.deck ?? '');

  const sleeveProps = (album: Album, kind: 'rail' | 'crate') => ({
    className: `shelf__sleeve shelf__sleeve--${kind}`,
    'data-slot': album.slug,
    'data-flying': flying.has(album.slug) ? 'true' : undefined,
    'data-on-deck': state.deck === album.slug ? 'true' : undefined,
  });

  return (
    <section className="section" id="records" aria-labelledby="records-heading">
      <h2 className="label section__label" id="records-heading">
        music i like
      </h2>

      <div className="section__body">
        <p className="records__intro">
          i listen to a lot of music. these are some of my favorite albums. click one to put it on
          the turntable.
        </p>

        {/*
          The deck and the two shelves. On a wide screen the deck takes a column of
          its own to the left and the shelves fill the rest; stacked, it comes first
          so the platter is the thing you meet before the sleeves.
        */}
        <div className="records__layout">
          <Deck
            album={onDeck}
            arriving={onDeck !== undefined && flying.has(onDeck.slug)}
            onLift={(album, source) => takeOffDeck(album, source)}
          />

          {/*
          The main shelf: a queue of slots in display order, newest at the front.
          A slot with nothing in it stays visible so the shelf reads as having a
          fixed capacity rather than shrinking as records are pulled off it.
        */}
          <div className="rails">
            {Array.from({ length: shelf.displayRows }, (_, row) => (
              <ol className="rails__row" key={row} aria-label={`main shelf row ${row + 1}`}>
                {Array.from({ length: shelf.displayCols }, (_, column) => {
                  const index = row * shelf.displayCols + column;
                  const slug = state.queue[index];
                  const album = slug === undefined ? undefined : albumAt(slug);

                  return (
                    <li className="rails__slot" key={slug ?? `empty-${index}`}>
                      {album === undefined ? (
                        <span className="rails__empty" aria-hidden="true" />
                      ) : (
                        <button
                          type="button"
                          {...sleeveProps(album, 'rail')}
                          aria-label={`Put ${album.title} by ${album.artist} on the turntable`}
                          onClick={(event) => putOnDeck(album, event.currentTarget, index)}
                        >
                          <img
                            className="shelf__cover"
                            src={album.cover}
                            alt=""
                            loading={row === 0 && column < 3 ? 'eager' : 'lazy'}
                            decoding="async"
                          />
                          <span className="shelf__spine-label" aria-hidden="true">
                            {album.title}
                          </span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            ))}
          </div>

          {/*
          The bottom shelf. Every record that is neither on the main shelf nor on
          the turntable, stacked the way records sit in a crate of LPs: each sleeve
          overlaps the one before it, so only a strip of each cover shows and the
          stack reads as full however many records are in it. Hovering a sleeve
          pulls it out for a preview.
        */}
          <ul className="crate" aria-label="records on the bottom shelf">
            {albums
              .filter((album) => !queued.has(album.slug) && state.deck !== album.slug)
              .map((album, index) => (
                <li className="crate__slot" key={album.slug}>
                  <button
                    type="button"
                    {...sleeveProps(album, 'crate')}
                    aria-label={`Put ${album.title} by ${album.artist} on the main shelf`}
                    onClick={(event) => pullUp(album, event.currentTarget)}
                    // Front sleeve on top: stacking order comes from the slot index.
                    style={{ '--z': String(albums.length - index) } as CSSProperties}
                  >
                    <img
                      className="shelf__cover"
                      src={album.cover}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                </li>
              ))}
          </ul>
        </div>

        <Videos />

        <div className="records__flights" ref={layerRef} aria-hidden="true">
          {flights.map((flight) => (
            <img
              key={flight.id}
              className="records__flight"
              data-overlay={flight.id}
              src={flight.album.cover}
              alt=""
              decoding="async"
              style={{
                transform: `translate3d(${flight.from.left}px, ${flight.from.top}px, 0)`,
                width: `${flight.from.width}px`,
                height: `${flight.from.height}px`,
              }}
            />
          ))}
        </div>

        <p className="visually-hidden" role="status">
          {announcement}
        </p>
      </div>
    </section>
  );
}
