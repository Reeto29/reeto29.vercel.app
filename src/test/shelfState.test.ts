import { describe, expect, it } from 'vitest';
import { albums, displayCapacity } from '../records';
import {
  albumAt,
  emptySlots,
  fromDeck,
  initialShelf,
  locationOf,
  promote,
  toDeck,
  type Shelf,
} from '../components/shelfState';

const [a, b, c, d] = albums.map((album) => album.slug);

/** A queue short by one, so a promotion does not have to bump anything. */
const shortQueue: Shelf = { queue: [a, b, c, d, e0()], deck: undefined };
function e0() {
  return albums[4].slug;
}

describe('initial state', () => {
  it('starts with a full queue and an empty deck', () => {
    expect(initialShelf.queue).toHaveLength(displayCapacity);
    expect(initialShelf.deck).toBeUndefined();
  });

  it('puts the queue in album order', () => {
    expect(initialShelf.queue).toEqual(albums.slice(0, displayCapacity).map((album) => album.slug));
  });

  it('reports how many queue slots are empty', () => {
    expect(emptySlots(initialShelf.queue, 2, 3)).toBe(0);
    expect(emptySlots([a], 2, 3)).toBe(5);
  });
});

describe('promote', () => {
  it('puts a record at the front of the queue', () => {
    const next = promote(initialShelf, albums.at(-1)!.slug);
    expect(next.queue[0]).toBe(albums.at(-1)!.slug);
  });

  it('bumps the last record down when the queue is full', () => {
    const last = initialShelf.queue.at(-1);
    const spare = albums.at(-1)!.slug;

    const next = promote(initialShelf, spare);

    expect(next.queue).toHaveLength(displayCapacity);
    expect(next.queue).not.toContain(last);
  });

  it('bumps nothing when the queue has room', () => {
    const last = shortQueue.queue.at(-1);
    const next = promote(shortQueue, albums.at(-1)!.slug);

    expect(next.queue).toHaveLength(displayCapacity);
    expect(next.queue).toContain(last);
  });

  it('ignores a record that is already on the queue', () => {
    expect(promote(initialShelf, a)).toBe(initialShelf);
  });

  it('leaves the deck alone', () => {
    const withDeck: Shelf = { queue: [a, b], deck: c };
    expect(promote(withDeck, d).deck).toBe(c);
  });
});

describe('toDeck', () => {
  it('empties the slot when the deck is empty', () => {
    const next = toDeck(initialShelf, a, 0);

    expect(next.deck).toBe(a);
    expect(next.queue).toHaveLength(displayCapacity - 1);
    // The record is on the deck, not also sitting in a queue slot.
    expect(next.queue).not.toContain(a);
  });

  it('leaves the queue order otherwise untouched', () => {
    const rest = initialShelf.queue.slice(1);
    expect(toDeck(initialShelf, a, 0).queue).toEqual(rest);
  });

  it('trades places with the record already on the deck', () => {
    const withDeck: Shelf = { queue: [a, b, c], deck: d };

    const next = toDeck(withDeck, b, 1);

    // The deck's occupant takes the clicked slot; the queue neither grows nor
    // shrinks, so swapping two records on the main shelf is not a bump.
    expect(next.deck).toBe(b);
    expect(next.queue).toEqual([a, d, c]);
  });

  it('never puts a record in two places', () => {
    const withDeck: Shelf = { queue: [a, b, c], deck: d };
    const next = toDeck(withDeck, b, 1);

    expect(new Set([...next.queue, next.deck]).size).toBe(next.queue.length + 1);
  });

  it('ignores a slug that is not in the given slot', () => {
    expect(toDeck(initialShelf, a, 3)).toBe(initialShelf);
  });
});

describe('fromDeck', () => {
  it('puts the deck back at the front of the queue', () => {
    const next = fromDeck({ queue: [b, c], deck: a });

    expect(next.deck).toBeUndefined();
    expect(next.queue[0]).toBe(a);
  });

  it('bumps the last record down onto a full queue', () => {
    const last = initialShelf.queue.at(-1);
    const next = fromDeck({ queue: initialShelf.queue, deck: a });

    expect(next.queue).toHaveLength(displayCapacity);
    expect(next.queue).not.toContain(last);
  });

  it('bumps nothing when the queue has room', () => {
    const next = fromDeck({ queue: [b, c], deck: a });
    expect(next.queue).toEqual([a, b, c]);
  });

  it('does nothing when the deck is empty', () => {
    const empty: Shelf = { queue: [a, b], deck: undefined };
    expect(fromDeck(empty)).toBe(empty);
  });
});

describe('locationOf', () => {
  it('reports all three locations', () => {
    const state: Shelf = { queue: [a, b], deck: c };
    const bottom = albums.at(-1)!.slug;

    expect(locationOf(state, a)).toBe('queue');
    expect(locationOf(state, c)).toBe('deck');
    expect(locationOf(state, bottom)).toBe('bottom');
  });
});

describe('albumAt', () => {
  it('finds a record by slug', () => {
    expect(albumAt(a)?.slug).toBe(a);
  });

  it('returns nothing for an unknown slug', () => {
    expect(albumAt('nope')).toBeUndefined();
  });
});

describe('conservation', () => {
  const everySlug = albums.map((album) => album.slug).sort();

  it('accounts for every record exactly once through a sequence of moves', () => {
    let state: Shelf = initialShelf;

    /*
      Promoting onto a full queue bumps the last record to the bottom shelf, so
      the way to draw the whole collection up is to keep taking one off the deck:
      each return refills a slot, and the next promotion uses it.
    */
    for (const album of albums) {
      if (locationOf(state, album.slug) === 'bottom') {
        state = promote(state, album.slug);
      }

      const index = state.queue.indexOf(album.slug);
      if (index !== -1) state = toDeck(state, album.slug, index);
      if (state.deck !== undefined) state = fromDeck(state);
    }

    const placed = [...state.queue, ...(state.deck === undefined ? [] : [state.deck])];

    // Everything the shelf state knows about is accounted for, and the records it
    // does not hold are simply the ones still on the bottom shelf.
    expect(new Set(placed).size).toBe(placed.length);
    expect(state.queue.length).toBeLessThanOrEqual(displayCapacity);
    expect(everySlug.filter((slug) => !placed.includes(slug)).length).toBe(
      albums.length - displayCapacity,
    );
  });

  it('conserves the queue and deck across a run of swaps', () => {
    let state: Shelf = { queue: [a, b, c, d, albums[4].slug], deck: albums[5].slug };

    // Six swaps back to back: nothing is created, dropped, or duplicated.
    for (let i = 0; i < 6; i += 1) {
      const index = i % state.queue.length;
      const target = state.queue[index];
      state = toDeck(state, target, index);
    }

    expect(state.queue).toHaveLength(5);
    expect(new Set(state.queue).size).toBe(5);
    expect(state.queue).not.toContain(state.deck);
  });
});
