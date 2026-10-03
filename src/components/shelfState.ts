import { albums, displayCapacity } from '../records';
import type { Album } from '../types';

/**
 * Where every record is.
 *
 * Three places, and nothing else. `queue` is the main shelf in display order and
 * holds at most `displayCapacity` records. `deck` is the turntable and holds at
 * most one. Everything not named in either is in the bottom shelf.
 *
 * `queue` starts full, so the section opens with a populated main shelf rather
 * than an empty one and something to pull down.
 */
export type Shelf = {
  queue: string[];
  deck: string | undefined;
};

export const initialShelf: Shelf = {
  queue: albums.slice(0, displayCapacity).map((album) => album.slug),
  deck: undefined,
};

/** Slots on the main shelf that are empty, for rendering the placeholder rows. */
export function emptySlots(queue: string[], rows: number, cols: number): number {
  return rows * cols - queue.length;
}

/**
 * Puts a record from the bottom shelf onto the front of the queue.
 *
 * This is the only way the queue grows back to full once it has been drained onto
 * the deck. When it is already at capacity the record at the end of the queue is
 * bumped down to the bottom shelf, which is the queue behaving as a queue: what
 * was promoted longest ago goes.
 */
export function promote(shelf: Shelf, slug: string): Shelf {
  if (shelf.queue.includes(slug)) return shelf;

  const bumped = shelf.queue.length >= displayCapacity ? shelf.queue.at(-1) : undefined;
  const queue = [slug, ...shelf.queue].slice(0, displayCapacity);

  return { ...shelf, queue, deck: bumped === undefined ? shelf.deck : undefined };
}

/**
 * Moves a record from the queue onto the deck.
 *
 * Whatever the deck was holding takes the exact slot the record came from, so the
 * queue keeps its length and its order apart from the one substitution. That is
 * what makes swapping between two records on the main shelf feel like trading
 * places rather than like a bump.
 */
export function toDeck(shelf: Shelf, slug: string, fromIndex: number): Shelf {
  const queue = [...shelf.queue];
  if (queue[fromIndex] !== slug) return shelf;

  const displaced = shelf.deck;

  /*
    The deck holds at most one record, so an empty deck simply leaves a hole where
    the record was. Putting `slug` back into its own slot would leave it on the
    queue and on the deck at once, which is the one state this model does not have.
  */
  if (displaced === undefined) {
    queue.splice(fromIndex, 1);
    return { ...shelf, queue, deck: slug };
  }

  /*
    A full deck is a trade rather than a bump: the record leaving the deck takes
    the exact slot the new one came from, so the queue keeps its length and order.
    If the displaced record is somehow still on the queue too, the duplicate is
    dropped so no record can occupy two slots.
  */
  queue[fromIndex] = displaced;
  const duplicate = queue.indexOf(displaced, fromIndex + 1);
  if (duplicate !== -1) queue.splice(duplicate, 1);

  return { ...shelf, queue, deck: slug };
}

/**
 * Returns the record on the deck to the front of the queue.
 *
 * A full queue bumps its last record down to the bottom shelf, so the deck empties
 * and the main shelf stays at capacity.
 */
export function fromDeck(shelf: Shelf): Shelf {
  const slug = shelf.deck;
  if (slug === undefined) return shelf;

  const queue = [slug, ...shelf.queue].slice(0, displayCapacity);

  return { ...shelf, queue, deck: undefined };
}

/** Where a record currently is, for the aria labels and the tests. */
export function locationOf(shelf: Shelf, slug: string): 'queue' | 'deck' | 'bottom' {
  if (shelf.deck === slug) return 'deck';
  if (shelf.queue.includes(slug)) return 'queue';
  return 'bottom';
}

/** Every record, by its current location. Never mutates `albums`. */
export function albumAt(slug: string): Album | undefined {
  return albums.find((album) => album.slug === slug);
}
