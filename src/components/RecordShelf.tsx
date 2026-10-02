import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { albums, displayCapacity, shelf } from '../records';
import type { Album } from '../types';
import './RecordShelf.css';

type Box = { top: number; left: number; width: number; height: number };

type Flight = {
  id: number;
  album: Album;
  from: Box;
  /** Measured after the state commits, once the destination slot exists. */
  to: Box | null;
};

const boxOf = (rect: DOMRect): Box => ({
  top: rect.top,
  left: rect.left,
  width: rect.width,
  height: rect.height,
});

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * Records in a crate, with two display rails above them.
 *
 * The crate holds everything, filed spine out. Clicking a record lifts it onto a
 * rail at the front; once the rails are full the record at the end of the queue
 * drops back down into the crate. Clicking a record already on a rail makes it
 * the one playing, and clicking the one playing puts it back in the crate.
 *
 * The flight is one rAF loop writing transforms to a fixed overlay layer. State
 * commits immediately, so what is displayed and what is playing are never wrong
 * while an animation is still running; the overlay is decoration on top of that.
 * Under reduced motion the overlay is skipped and the state change is the effect.
 */
export function RecordShelf() {
  const [displayed, setDisplayed] = useState<string[]>(() =>
    albums.slice(0, displayCapacity).map((album) => album.slug),
  );
  const [playing, setPlaying] = useState<string | undefined>(undefined);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [announcement, setAnnouncement] = useState('');

  const layerRef = useRef<HTMLDivElement>(null);
  const flightId = useRef(0);

  const bySlug = new Map(albums.map((album) => [album.slug, album]));
  const onRails = new Set(displayed);

  const lift = (album: Album, source: HTMLElement) => {
    // The rails are full: whatever was at the end goes back down to the crate.
    const dropping = displayed.length >= displayCapacity ? displayed.at(-1) : undefined;

    const next = [album.slug, ...displayed].slice(0, displayCapacity);
    setDisplayed(next);
    setPlaying(album.slug);
    setAnnouncement(
      `${album.title} by ${album.artist} is playing.${
        dropping === undefined
          ? ''
          : ` ${bySlug.get(dropping)?.title ?? ''} went back in the crate.`
      }`,
    );

    if (dropping === undefined) {
      setFlights([]);
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFlights([]);
      return;
    }

    const outgoing = bySlug.get(dropping);
    const tail =
      outgoing === undefined
        ? null
        : (document.querySelector<HTMLElement>(`[data-slot="${dropping}"]`) ?? null);

    setFlights([
      {
        id: (flightId.current += 1),
        album,
        from: boxOf(source.getBoundingClientRect()),
        to: null,
      },
      ...(tail === null || outgoing === undefined
        ? []
        : [
            {
              id: (flightId.current += 1),
              album: outgoing,
              from: boxOf(tail.getBoundingClientRect()),
              to: null,
            },
          ]),
    ]);
  };

  const select = (album: Album, source: HTMLElement) => {
    if (!onRails.has(album.slug)) {
      lift(album, source);
      return;
    }

    if (playing === album.slug) {
      // The one playing goes back in the crate.
      setDisplayed(displayed.filter((slug) => slug !== album.slug));
      setPlaying(undefined);
      setAnnouncement(`${album.title} stopped and went back in the crate.`);
      setFlights([]);
      return;
    }

    setPlaying(album.slug);
    setAnnouncement(`${album.title} by ${album.artist} is playing.`);
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
      const rect = document
        .querySelector<HTMLElement>(`[data-slot="${flight.album.slug}"]`)
        ?.getBoundingClientRect();

      return { ...flight, to: rect !== undefined && rect.width > 0 ? boxOf(rect) : null };
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

        // Going up into a rail grows the sleeve; coming back down shrinks it.
        const scale = 1 + (0.08 - 1) * eased;

        node.style.transform = `translate3d(${
          flight.from.left + (flight.to.left - flight.from.left) * eased
        }px, ${
          flight.from.top + (flight.to.top - flight.from.top) * eased + rise
        }px, 0) scale(${scale})`;
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
  const nowPlaying = playing === undefined ? undefined : bySlug.get(playing);

  const sleeveProps = (album: Album, kind: 'rail' | 'crate') => ({
    className: `shelf__sleeve shelf__sleeve--${kind}`,
    'data-slot': album.slug,
    'data-flying': flying.has(album.slug) ? 'true' : undefined,
    'data-playing': playing === album.slug ? 'true' : undefined,
    'aria-pressed': playing === album.slug,
  });

  return (
    <section className="section" id="records" aria-labelledby="records-heading">
      <h2 className="label section__label" id="records-heading">
        music i like
      </h2>

      <div className="section__body">
        <p className="records__intro">
          i listen to a lot of music. these are some of my favorite albums.
        </p>

        {/* Only shown once a record has been pulled up: there is no idle state to
            fill, and nothing here claims anything is playing. */}
        {nowPlaying !== undefined && (
          <p className="records__meta">
            <span className="records__title">{nowPlaying.title}</span>
            <span className="records__artist">
              {nowPlaying.artist}, {nowPlaying.year}
            </span>
          </p>
        )}

        {/* Rails: two rows of slots, newest first, so slot 0 is top left. */}
        <div className="rails">
          {Array.from({ length: shelf.displayRows }, (_, row) => (
            <ol className="rails__row" key={row} aria-label={`display rail ${row + 1}`}>
              {Array.from({ length: shelf.displayCols }, (_, column) => {
                const slug = displayed[row * shelf.displayCols + column];
                const album = slug === undefined ? undefined : bySlug.get(slug);

                return (
                  <li className="rails__slot" key={slug ?? `empty-${row}-${column}`}>
                    {album === undefined ? (
                      <span className="rails__empty" aria-hidden="true" />
                    ) : (
                      <button
                        type="button"
                        {...sleeveProps(album, 'rail')}
                        aria-label={
                          playing === album.slug
                            ? `Stop ${album.title} by ${album.artist} and put it back in the crate`
                            : `Play ${album.title} by ${album.artist}`
                        }
                        onClick={(event) => select(album, event.currentTarget)}
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
          The crate is the shelf. Every record not on a rail sits face out and
          stacked the way records sit in a crate of LPs: each sleeve overlaps the
          one before it, so only a strip of each cover shows and the stack reads as
          full no matter how many records are in it. A record going up to a rail
          just leaves the stack and the ones behind it close up, rather than the row
          leaving a hole. Hovering a sleeve pulls it out of the stack for a preview.
        */}
        <ul className="crate" aria-label="records in the crate">
          {albums
            .filter((album) => !onRails.has(album.slug))
            .map((album, index) => (
              <li className="crate__slot" key={album.slug}>
                <button
                  type="button"
                  {...sleeveProps(album, 'crate')}
                  aria-label={`Put ${album.title} by ${album.artist} on a rail and play it`}
                  onClick={(event) => lift(album, event.currentTarget)}
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
