import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const { getByText, getByTestId } = render(<LoadingSpinner />);
    
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders with custom message', () => {
    const customMessage = 'Please wait...';
    const { getByText } = render(<LoadingSpinner message={customMessage} />);
    
    expect(getByText(customMessage)).toBeTruthy();
  });

  it('renders without message when message is null', () => {
    const { queryByText } = render(<LoadingSpinner message={null} />);
    
    expect(queryByText('Loading...')).toBeNull();
  });

  it('applies overlay styles when overlay prop is true', () => {
    const { getByTestId } = render(<LoadingSpinner overlay={true} testID="spinner-container" />);
    const container = getByTestId('spinner-container');
    
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ position: 'absolute' })
      ])
    );
  });
});
