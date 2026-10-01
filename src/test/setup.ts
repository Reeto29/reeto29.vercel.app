import '@testing-library/jest-dom/vitest';

/**
 * Node 26 exposes an experimental `localStorage` global that resolves to
 * `undefined` unless `--localstorage-file` is passed. Vitest sees the key
 * already present on globalThis and therefore skips copying jsdom's working
 * implementation, leaving `window.localStorage` undefined. Install a minimal
 * in-memory Storage so storage-dependent code paths are testable.
 */
function createMemoryStorage(): Storage {
  let store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    getItem(key: string) {
      return store.get(String(key)) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(String(key), String(value));
    },
    removeItem(key: string) {
      store.delete(String(key));
    },
    clear() {
      store = new Map();
    },
  };
}

if (!window.localStorage) {
  Object.defineProperty(window, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  });
}

// jsdom implements neither scrollIntoView nor IntersectionObserver. Stub both so
// effects that scroll or observe stay inert instead of throwing during render.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// jsdom implements the Pointer Events methods on Element.prototype only as
// throwers, and omits the capture pair entirely. Drag handlers call
// setPointerCapture on pointerdown, so stub both to no-ops; capture is a
// browser convenience for tracking a pointer outside the element and is not
// load-bearing for the handlers themselves.
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function setPointerCapture() {};
  Element.prototype.releasePointerCapture = function releasePointerCapture() {};
  Element.prototype.hasPointerCapture = function hasPointerCapture() {
    return false;
  };
}

// jsdom does not implement IntersectionObserver; a no-op keeps scroll-spy
// effects inert instead of throwing during render.
if (!window.IntersectionObserver) {
  class NoopIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    value: NoopIntersectionObserver,
    configurable: true,
    writable: true,
  });
}

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    value: () => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
    configurable: true,
    writable: true,
  });
}
