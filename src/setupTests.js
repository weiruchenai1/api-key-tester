// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Web Workers for testing
class MockWorker {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = null;
  }

  postMessage(msg) {
    // Mock worker behavior
    if (this.onmessage) {
      setTimeout(() => {
        this.onmessage({
          data: {
            type: 'RESULT',
            data: { key: 'test-key', status: 'valid', isPaid: null }
          }
        });
      }, 100);
    }
  }

  terminate() {
    // Mock terminate
  }
}

// Mock Worker globally
global.Worker = MockWorker;

// Mock fetch for API testing
global.fetch = jest.fn();

// Mock window.matchMedia
global.matchMedia = global.matchMedia || function (query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: global.matchMedia,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods to reduce test noise
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
