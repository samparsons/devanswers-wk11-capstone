import '@testing-library/jest-dom'; // for custom matchers
import { server } from './mocks/server';
import { beforeAll, afterEach, afterAll } from 'vitest';

// Some jsdom/Node combinations don't expose a working `localStorage` at module-collection
// time, which crashes any test file that imports the Redux store (its slices read
// localStorage at import). Install a minimal in-memory shim before test modules load.
const ensureLocalStorage = () => {
  const hasValidLocalStorage =
    typeof globalThis.localStorage !== 'undefined' &&
    typeof globalThis.localStorage.getItem === 'function' &&
    typeof globalThis.localStorage.setItem === 'function' &&
    typeof globalThis.localStorage.removeItem === 'function' &&
    typeof globalThis.localStorage.clear === 'function';

  if (hasValidLocalStorage) {
    return;
  }

  const storage = new Map();
  const shim = {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => {
      storage.set(key, String(value));
    },
    removeItem: (key) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: shim,
    configurable: true,
    writable: true,
  });

  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: shim,
      configurable: true,
      writable: true,
    });
  }
};

ensureLocalStorage();

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset any request handlers that we may add during tests
afterEach(() => server.resetHandlers());

// Clean up after tests are finished
afterAll(() => server.close());