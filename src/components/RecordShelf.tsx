import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { albums, deck } from '../records';
import type { Album } from '../types';
import './RecordShelf.css';

type Box = { top: number; left: number; width: number; height: number };

type Flight = {
  id: number;
  slug: string;
  from: Box;
  /** Measured after the state commits, once the destination exists in the DOM. */
  to: Box | null;
};

const boxOf = (rect: DOMRect): Box => ({
  top: rect.top,
  left: rect.left,
  width: rect.width,
  height: rect.height,
});

/** Fast out of the gate, settling into the slot. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * A shelf of records you can queue from.
 *
 * The mechanic is a six-slot queue above a shelf of spines. Clicking a spine
 * lifts that record into the front of the queue; once the queue is full, the
 * record at the end of it drops back to the bottom of the shelf.
 *
 * The flight is one rAF loop writing transforms onto a fixed overlay layer. The
 * state commits immediately so the queue is never wrong about what it holds, and
 * the overlay is purely decorative on top of that: the real shelf and queue
 * elements are hidden for the duration and revealed when the record lands. Under
 * `prefers-reduced-motion` the overlay is skipped and the state change is the
 * whole effect.
 */
export function RecordShelf() {
  const bySlug = new Map<string, Album>(albums.map((album) => [album.slug, album]));

  const [shelf, setShelf] = useState<string[]>(() =>
    albums.slice(deck.seed).map((album) => album.slug),
  );
  const [queue, setQueue] = useState<string[]>(() =>
    albums.slice(0, deck.seed).map((album) => album.slug),
  );
  const [flights, setFlights] = useState<Flight[]>([]);
  const [announcement, setAnnouncement] = useState('');

  const layerRef = useRef<HTMLDivElement>(null);
  const flightId = useRef(0);

  const pick = (slug: string, source: HTMLElement) => {
    const index = shelf.indexOf(slug);
    if (index < 0) return;

    const nextShelf = [...shelf];
    nextShelf.splice(index, 1);

    const nextQueue = [slug, ...queue];

    // The queue is full, so the record at the end of it is the one that leaves.
    const returned = nextQueue.length > deck.queueSize ? (nextQueue.pop() ?? null) : null;
    if (returned !== null) nextShelf.push(returned);

    const picked = bySlug.get(slug);

    setShelf(nextShelf);
    setQueue(nextQueue);
    setAnnouncement(
      [
        picked && `${picked.title} by ${picked.artist} is playing.`,
        returned && bySlug.get(returned)?.title,
        returned && 'went back to the shelf.',
      ]
        .filter(Boolean)
        .join(' '),
    );

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const started: Flight[] = [
      {
        id: (flightId.current += 1),
        slug,
        from: boxOf(source.getBoundingClientRect()),
        to: null,
      },
    ];

    if (returned !== null) {
      const tail = document.querySelector<HTMLElement>(`[data-slot="${returned}"]`);
      if (tail) {
        started.push({
          id: (flightId.current += 1),
          slug: returned,
          from: boxOf(tail.getBoundingClientRect()),
          to: null,
        });
      }
    }

    setFlights(started);
  };

  /*
    Measure the destinations only after React has committed, since the slot a
    record is flying into does not exist until it does. A destination that
    measures zero means the element is not laid out (jsdom, or a hidden tree);
    the overlay then fades rather than flies, and the committed state still holds.
  */
  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (layer === null || flights.length === 0) return;

    const measured = flights.map((flight) => {
      const dest = document.querySelector<HTMLElement>(`[data-slot="${flight.slug}"]`);
      const rect = dest?.getBoundingClientRect();
      const to = rect !== undefined && rect.width > 0 ? boxOf(rect) : null;
      return { ...flight, to };
    });

    /*
      The clock is the first frame's own timestamp rather than
      `performance.now()`. Frame callbacks carry the time the frame was
      scheduled, which keeps the flight consistent with whatever clock the host
      is using and avoids a long first frame reading as instant progress.
    */
    let startedAt: number | null = null;
    let frame = 0;

    const paint = (now: number) => {
      startedAt ??= now;

      const t = Math.min(1, Math.max(0, (now - startedAt) / deck.flightMs));
      const eased = easeOut(t);

      for (const flight of measured) {
        const node = layer.querySelector<HTMLElement>(`[data-overlay="${flight.id}"]`);
        if (node === null) continue;

        if (flight.to === null) {
          node.style.opacity = '0';
          continue;
        }

        // Records are lifted, not teleported: rise above the straight line by a
        // fraction of the distance travelled, capped so a short hop stays small.
        const rise =
          -Math.sin(Math.PI * eased) *
          Math.min(48, Math.abs(flight.to.top - flight.from.top) * 0.2);

        node.style.transform = `translate3d(${flight.from.left + (flight.to.left - flight.from.left) * eased}px, ${
          flight.from.top + (flight.to.top - flight.from.top) * eased + rise
        }px, 0)`;
        node.style.width = `${flight.from.width + (flight.to.width - flight.from.width) * eased}px`;
        node.style.height = `${flight.from.height + (flight.to.height - flight.from.height) * eased}px`;
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

  const flying = new Set(flights.map((flight) => flight.slug));
  const playing = queue[0] === undefined ? undefined : bySlug.get(queue[0]);

  return (
    <section className="section" id="records" aria-labelledby="records-heading">
      <h2 className="label section__label" id="records-heading">
        records
      </h2>

      <div className="section__body">
        <p className="records__intro">
          {albums.length} records on a shelf. click one and it starts playing; the queue holds{' '}
          {deck.queueSize}, and whatever reaches the end of it goes back on the shelf.
        </p>

        <ol className="deck" aria-label="record queue">
          {Array.from({ length: deck.queueSize }, (_, index) => {
            const slug = queue[index];
            const album = slug === undefined ? undefined : bySlug.get(slug);

            return (
              <li className="deck__slot" key={slug ?? `empty-${index}`} data-slot={slug}>
                {album === undefined ? (
                  <span className="deck__empty" aria-hidden="true" />
                ) : (
                  <div
                    className={index === 0 ? 'deck__sleeve deck__sleeve--playing' : 'deck__sleeve'}
                    data-flying={flying.has(album.slug) ? 'true' : undefined}
                  >
                    <img
                      className="deck__cover"
                      src={album.cover}
                      alt=""
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {playing !== undefined && (
          <p className="deck__meta">
            <span className="deck__now">now playing</span>
            <span className="deck__title">{playing.title}</span>
            <span className="deck__artist">
              {playing.artist}, {playing.year}
            </span>
          </p>
        )}

        <ul className="shelf" aria-label="records on the shelf">
          {shelf.map((slug, index) => {
            const album = bySlug.get(slug);
            if (album === undefined) return null;

            return (
              <li
                className="shelf__slot"
                key={slug}
                style={{ '--jitter': `${(index % 4) * (deck.spineJitter / 4)}px` } as CSSProperties}
              >
                <button
                  type="button"
                  className="shelf__spine"
                  data-slot={slug}
                  data-flying={flying.has(slug) ? 'true' : undefined}
                  style={{ '--spine': album.spine } as CSSProperties}
                  aria-label={`Play ${album.title} by ${album.artist}`}
                  onClick={(event) => pick(slug, event.currentTarget)}
                >
                  <span className="shelf__title" aria-hidden="true">
                    {album.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="records__foot">{shelf.length} records on the shelf</p>

        <div className="records__flights" ref={layerRef} aria-hidden="true">
          {flights.map((flight) => {
            const album = bySlug.get(flight.slug);
            if (album === undefined) return null;

            return (
              <img
                key={flight.id}
                className="records__flight"
                data-overlay={flight.id}
                src={album.cover}
                alt=""
                decoding="async"
                style={{
                  transform: `translate3d(${flight.from.left}px, ${flight.from.top}px, 0)`,
                  width: `${flight.from.width}px`,
                  height: `${flight.from.height}px`,
                }}
              />
            );
          })}
        </div>

        <p className="visually-hidden" role="status">
          {announcement}
        </p>
      </div>
    </section>
  );
}
