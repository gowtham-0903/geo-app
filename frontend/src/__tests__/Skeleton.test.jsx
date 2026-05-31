import { render, screen } from '@testing-library/react';
import {
  SkeletonCard, SkeletonHero, SkeletonList, SkeletonPage,
} from '../components/Skeleton';

describe('SkeletonCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders extra row divs based on rows prop', () => {
    const { container } = render(<SkeletonCard rows={5} />);
    // rows prop: 1 title + 1 subtitle + (rows-1) body rows = 5 total skeleton divs
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});

describe('SkeletonHero', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonHero />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('SkeletonList', () => {
  it('renders the correct number of cards', () => {
    const { container } = render(<SkeletonList count={3} />);
    // Each SkeletonCard has a bg-white wrapper
    const cards = container.querySelectorAll('.bg-white');
    expect(cards.length).toBe(3);
  });

  it('defaults to 4 cards', () => {
    const { container } = render(<SkeletonList />);
    const cards = container.querySelectorAll('.bg-white');
    expect(cards.length).toBe(4);
  });
});

describe('SkeletonPage', () => {
  it('renders hero and list sections', () => {
    const { container } = render(<SkeletonPage />);
    expect(container.firstChild).toBeInTheDocument();
    // Should have at least 1 card from the list
    expect(container.querySelectorAll('.bg-white').length).toBeGreaterThan(0);
  });
});
