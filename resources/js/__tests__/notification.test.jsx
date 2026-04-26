import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock Inertia
vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    router: {
        patch: vi.fn(),
    },
    usePage: () => ({
        props: {
            translations: {
                'liked your post.': 'liked your post.',
                'reposted your post.': 'reposted your post.',
                'commented on your post:': 'commented on your post:',
                'followed you.': 'followed you.',
                'favorited your post.': 'favorited your post.',
                'interacted with you.': 'interacted with you.',
                'has sent you a follow request.': 'has sent you a follow request.',
                'accepted your follow request.': 'accepted your follow request.',
                'rejected your follow request.': 'rejected your follow request.',
                Accept: 'Accept',
                Decline: 'Decline',
                'sent you a message:': 'sent you a message:',
                'liked your comment.': 'liked your comment.',
                'mentioned you.': 'mentioned you.',
                Someone: 'Someone',
            },
        },
    }),
}));

// Mock the hooks
vi.mock('../hooks/use-initials.jsx', () => ({
    useInitials: () => (name) => name ? name.split(' ').map((n) => n[0]).join('') : '?',
}));

vi.mock('../lib/utils', () => ({
    getProfileImageUrl: (img) => img?.file_path || '/default-avatar.png',
}));

import { Notification } from '../components/notification';

const baseNotification = {
    id: 1,
    is_read: false,
    type: 'like',
    post: { id: 1 },
    source_user: {
        id: 2,
        name: 'John Doe',
        username: 'johndoe',
        profile_image: null,
        is_verified: false,
    },
    extra_data: null,
};

describe('Notification', () => {
    it('renders like notification', () => {
        render(<Notification notification={{ ...baseNotification, type: 'like' }} />);
        expect(screen.getByText('liked your post.')).toBeTruthy();
    });

    it('renders user name and username', () => {
        render(<Notification notification={baseNotification} />);
        expect(screen.getByText(/John Doe/)).toBeTruthy();
        expect(screen.getByText(/johndoe/)).toBeTruthy();
    });

    it('renders follow notification', () => {
        render(
            <Notification
                notification={{ ...baseNotification, type: 'follow', post: null, extra_data: null }}
            />,
        );
        expect(screen.getByText('followed you.')).toBeTruthy();
    });

    it('renders comment notification with extra data', () => {
        render(
            <Notification
                notification={{ ...baseNotification, type: 'comment', extra_data: 'Great post!' }}
            />,
        );
        expect(screen.getByText('commented on your post:')).toBeTruthy();
    });
});
