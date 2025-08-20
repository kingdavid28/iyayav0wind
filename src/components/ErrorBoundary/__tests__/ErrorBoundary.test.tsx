import React from 'react';
import { render, screen, fireEvent } from '../../test-utils';
import ErrorBoundary from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  // A component that throws an error to test the ErrorBoundary
  const ErrorComponent = () => {
    throw new Error('Test error');
  };

  const consoleError = console.error;
  beforeAll(() => {
    // Suppress error logs during test
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = consoleError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Child</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test Child')).toBeTruthy();
  });

  it('displays error message when child throws', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText(/Test error/)).toBeTruthy();
  });

  it('calls onReset when reset button is clicked', () => {
    const onReset = jest.fn();
    
    render(
      <ErrorBoundary onReset={onReset}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    const resetButton = screen.getByTestId('error-boundary-reset-button');
    fireEvent.press(resetButton);
    
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('renders custom fallback when provided', () => {
    const Fallback = () => <div>Custom Fallback</div>;
    
    render(
      <ErrorBoundary fallback={<Fallback />}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom Fallback')).toBeTruthy();
  });
});
