import React from 'react';
import { render, screen } from '@testing-library/react';
import HotTopicsCard from '@/components/dashboard/HotTopicsCard';

jest.mock('@/server/services/topicReadService', () => ({
  getHotTopics: jest.fn().mockResolvedValue([{ topic: 'math', count: 5 }]),
}));

describe('HotTopicsCard', () => {
  test('renders formatted topic from service', async () => {
    const element = await HotTopicsCard();
    render(element as any);
    expect(screen.getByText('math')).toBeInTheDocument();
  });
});
