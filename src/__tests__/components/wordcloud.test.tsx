import React from 'react';
import { render, screen } from '@testing-library/react';
import WordCloud from '@/components/WordCloud';

describe('WordCloud component', () => {
  test('renders topics and values', () => {
    const formatted = [{ text: 'math', value: 5 }];
    render(<WordCloud formattedTopics={formatted} />);
    expect(screen.getByText('math')).toBeInTheDocument();
  });
});
