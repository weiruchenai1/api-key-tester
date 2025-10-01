import { vi } from 'vitest';
/**
 * Button组件测试
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../../components/common/Button';

describe('Button Component', () => {
  test('should render with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn-base', 'btn-primary');
    expect(button).not.toBeDisabled();
  });

  test('should render with custom variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-base', 'btn-secondary');
  });

  test('should render all variant types correctly', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'];
    
    variants.forEach(variant => {
      const { unmount } = render(<Button variant={variant}>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(`btn-${variant}`);
      unmount();
    });
  });

  test('should default to primary variant for unknown variant', () => {
    render(<Button variant="unknown">Test</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });

  test('should render with custom size', () => {
    render(<Button size="small">Small Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-base', 'btn-primary', 'btn-sm');
  });

  test('should render all size types correctly', () => {
    const { rerender } = render(<Button size="small">Test</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('btn-sm');
    
    rerender(<Button size="medium">Test</Button>);
    button = screen.getByRole('button');
    expect(button).not.toHaveClass('btn-sm');
    expect(button).not.toHaveClass('btn-lg');
    
    rerender(<Button size="large">Test</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('btn-lg');
  });

  test('should handle click events', () => {
    const mockOnClick = vi.fn();
    render(<Button onClick={mockOnClick}>Clickable</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('should be disabled when disabled prop is true', () => {
    const mockOnClick = vi.fn();
    render(
      <Button disabled onClick={mockOnClick}>
        Disabled Button
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  test('should show loading state', () => {
    render(<Button loading>Loading Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    const spinner = button.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  test('should be disabled during loading', () => {
    const mockOnClick = vi.fn();
    render(
      <Button loading onClick={mockOnClick}>
        Loading Button
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  test('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-base', 'btn-primary', 'custom-class');
  });

  test('should pass through additional props', () => {
    render(
      <Button data-testid="custom-button" aria-label="Custom button">
        Custom Props
      </Button>
    );
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('aria-label', 'Custom button');
  });

  test('should render children content', () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );
    
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  test('should combine loading and children content', () => {
    render(<Button loading>Save</Button>);
    
    const button = screen.getByRole('button');
    expect(button.querySelector('.loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  test('should filter out falsy class names', () => {
    render(<Button size="medium" className="">Test</Button>);
    
    const button = screen.getByRole('button');
    // Should only have base and variant classes, no size or empty className
    expect(button.className).toBe('btn-base btn-primary');
  });

  test('should handle complex className combinations', () => {
    render(
      <Button 
        variant="danger" 
        size="large" 
        className="custom-class another-class"
      >
        Complex
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'btn-base',
      'btn-danger',
      'btn-lg',
      'custom-class',
      'another-class'
    );
  });
});