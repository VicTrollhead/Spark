import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PostSkeleton } from '../components/post-skeleton';

describe('PostSkeleton', () => {
    it('renders without crashing', () => {
        const { container } = render(<PostSkeleton />);
        expect(container.firstChild).toBeTruthy();
    });

    it('has animate-pulse class for loading animation', () => {
        const { container } = render(<PostSkeleton />);
        expect(container.firstChild).toHaveClass('animate-pulse');
    });

    it('renders placeholder elements', () => {
        const { container } = render(<PostSkeleton />);
        const placeholders = container.querySelectorAll('.bg-gray-200');
        expect(placeholders.length).toBeGreaterThan(0);
    });

    it('renders avatar placeholder', () => {
        const { container } = render(<PostSkeleton />);
        const avatar = container.querySelector('.rounded-full');
        expect(avatar).toBeTruthy();
    });
});
