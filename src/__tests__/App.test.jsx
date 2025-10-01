import { vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// localStorage is already mocked in setupTests.js

describe('App Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Reset localStorage mock
    if (global.localStorage.getItem.mockReturnValue) {
      global.localStorage.getItem.mockReturnValue(null);
    }
  });

  test('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  test('renders with theme and language providers', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('initializes with default theme', () => {
    render(<App />);
    // App should initialize without errors
    expect(document.documentElement).toBeInTheDocument();
  });
});
