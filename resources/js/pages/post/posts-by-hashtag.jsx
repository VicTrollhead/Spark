import { Head, usePage } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout.jsx';
import PostComponent from './post-component.jsx';

export default function PostsByHashtag() {
    const { user, posts, hashtag } = usePage().props;

    return (
        <AppLayout breadcrumbs={[{ title: 'My Profile', href: '/user' },{ title: `Posts by hashtag #${hashtag}`, href: '/posts-by-hashtag'}]}>
            <Head title={`Posts by hashtag #${hashtag}`} />

            <div className="p-6 text-2xl font-extrabold">{`Posts by hashtag #${hashtag}`}</div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {posts.length > 0 ? (
                    posts.map((post) => <PostComponent key={post.id} post={post} />)
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 px-6 py-4">No posts by hashtag yet.</p>
                )}
            </div>
        </AppLayout>
    );
}
