import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from '../components/empty-state';

// Mock Inertia Link
vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

const MockIcon = (props) => <svg data-testid="mock-icon" {...props} />;

describe('EmptyState', () => {
    it('renders title', () => {
        render(<EmptyState title="No posts yet" />);
        expect(screen.getByText('No posts yet')).toBeTruthy();
    });

    it('renders description when provided', () => {
        render(<EmptyState title="Empty" description="Nothing to show" />);
        expect(screen.getByText('Nothing to show')).toBeTruthy();
    });

    it('does not render description when not provided', () => {
        const { container } = render(<EmptyState title="Empty" />);
        const paragraphs = container.querySelectorAll('p');
        expect(paragraphs.length).toBe(0);
    });

    it('renders icon when provided', () => {
        render(<EmptyState title="Empty" icon={MockIcon} />);
        expect(screen.getByTestId('mock-icon')).toBeTruthy();
    });

    it('renders action link when label and href provided', () => {
        render(<EmptyState title="Empty" actionLabel="Go home" actionHref="/home" />);
        const link = screen.getByText('Go home');
        expect(link).toBeTruthy();
        expect(link.getAttribute('href')).toBe('/home');
    });

    it('does not render action link when only label provided', () => {
        render(<EmptyState title="Empty" actionLabel="Go home" />);
        expect(screen.queryByText('Go home')).toBeNull();
    });
});
