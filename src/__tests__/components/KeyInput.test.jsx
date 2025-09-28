/**
 * KeyInput组件测试
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import KeyInput from '../../../components/features/KeyInput';

// Mock dependencies
jest.mock('../../../contexts/AppStateContext', () => ({
  useAppState: jest.fn()
}));

jest.mock('../../../hooks/useLanguage', () => ({
  useLanguage: jest.fn()
}));

jest.mock('../../../components/features/KeyInput/FileImport', () => {
  return function MockFileImport() {
    return <div data-testid="file-import">File Import</div>;
  };
});

jest.mock('../../../components/features/KeyInput/PasteButton', () => {
  return function MockPasteButton() {
    return <div data-testid="paste-button">Paste Button</div>;
  };
});

import { useAppState } from '../../../contexts/AppStateContext';
import { useLanguage } from '../../../hooks/useLanguage';

describe('KeyInput Component', () => {
  const mockDispatch = jest.fn();
  const mockState = {
    apiKeysText: '',
    isTesting: false
  };
  const mockT = jest.fn((key) => {
    const translations = {
      apiKeys: 'API Keys',
      apiKeysPlaceholder: 'Enter your API keys here...'
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useAppState.mockReturnValue({
      state: mockState,
      dispatch: mockDispatch
    });
    useLanguage.mockReturnValue({
      t: mockT
    });
  });

  test('should render with default state', () => {
    render(<KeyInput />);
    
    expect(screen.getByLabelText('API Keys')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your API keys here...')).toBeInTheDocument();
    expect(screen.getByTestId('file-import')).toBeInTheDocument();
    expect(screen.getByTestId('paste-button')).toBeInTheDocument();
  });

  test('should display current API keys text', () => {
    useAppState.mockReturnValue({
      state: { ...mockState, apiKeysText: 'sk-test123\nsk-test456' },
      dispatch: mockDispatch
    });
    
    render(<KeyInput />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('sk-test123\nsk-test456');
  });

  test('should handle textarea change', () => {
    render(<KeyInput />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'new-api-key' } });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_API_KEYS_TEXT',
      payload: 'new-api-key'
    });
  });

  test('should disable textarea when testing', () => {
    useAppState.mockReturnValue({
      state: { ...mockState, isTesting: true },
      dispatch: mockDispatch
    });
    
    render(<KeyInput />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  test('should enable textarea when not testing', () => {
    useAppState.mockReturnValue({
      state: { ...mockState, isTesting: false },
      dispatch: mockDispatch
    });
    
    render(<KeyInput />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).not.toBeDisabled();
  });

  test('should have correct CSS classes', () => {
    render(<KeyInput />);
    
    const container = screen.getByRole('textbox').closest('div.relative');
    expect(container).toBeInTheDocument();
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('form-field', 'min-h-32', 'pr-12');
  });

  test('should handle empty translation gracefully', () => {
    const mockTEmpty = jest.fn((key) => key); // Return key as-is
    useLanguage.mockReturnValue({ t: mockTEmpty });
    
    render(<KeyInput />);
    
    expect(screen.getByLabelText('apiKeys')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('apiKeysPlaceholder')).toBeInTheDocument();
  });

  test('should handle multiple textarea changes', () => {
    render(<KeyInput />);
    
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'first' } });
    fireEvent.change(textarea, { target: { value: 'second' } });
    fireEvent.change(textarea, { target: { value: 'third' } });
    
    expect(mockDispatch).toHaveBeenCalledTimes(3);
    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'SET_API_KEYS_TEXT',
      payload: 'first'
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: 'SET_API_KEYS_TEXT',
      payload: 'second'
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: 'SET_API_KEYS_TEXT',
      payload: 'third'
    });
  });

  test('should maintain textarea focus during typing', () => {
    render(<KeyInput />);
    
    const textarea = screen.getByRole('textbox');
    textarea.focus();
    
    expect(textarea).toHaveFocus();
    
    fireEvent.change(textarea, { target: { value: 'typing...' } });
    
    // Textarea should still be focused after change
    expect(textarea).toHaveFocus();
  });

  test('should handle large text input', () => {
    render(<KeyInput />);
    
    const textarea = screen.getByRole('textbox');
    const largeText = 'sk-' + 'x'.repeat(1000) + '\n'.repeat(100);
    
    fireEvent.change(textarea, { target: { value: largeText } });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_API_KEYS_TEXT',
      payload: largeText
    });
  });

  test('should preserve textarea cursor position', () => {
    render(<KeyInput />);
    
    const textarea = screen.getByRole('textbox');
    
    // Set initial value
    fireEvent.change(textarea, { target: { value: 'sk-test123' } });
    
    // Set cursor position
    textarea.setSelectionRange(3, 3);
    
    // Add more text
    fireEvent.change(textarea, { target: { value: 'sk-new-test123' } });
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_API_KEYS_TEXT',
      payload: 'sk-new-test123'
    });
  });
});