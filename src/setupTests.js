// vitest-dom adds custom vitest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { vi } from 'vitest';

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
global.fetch = vi.fn();

// Mock Blob.prototype.text() for Web API compatibility
if (!global.Blob.prototype.text) {
  global.Blob.prototype.text = vi.fn(function() {
    return Promise.resolve(new TextDecoder().decode(this));
  });
}

// Enhanced mock Blob for testing
const originalBlob = global.Blob;
global.Blob = class MockBlob extends originalBlob {
  constructor(parts = [], options) {
    super(parts, options);
    const normalizedParts = parts == null ? [] : Array.from(parts);
    this._parts = normalizedParts;
  }
  
  text() {
    // Convert parts array to string
    const content = this._parts.join('');
    return Promise.resolve(content);
  }
  
  arrayBuffer() {
    const content = this._parts.join('');
    const encoder = new TextEncoder();
    return Promise.resolve(encoder.encode(content).buffer);
  }
};

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Don't mock DOM methods globally - they interfere with React Testing Library
// Instead, individual tests that need DOM mocking should set up their own mocks

// Mock window.matchMedia
global.matchMedia = global.matchMedia || function (query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: global.matchMedia,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
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
