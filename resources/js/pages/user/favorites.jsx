import { Head, usePage } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import PostComponent from '../post/post-component';

export default function Favorites() {
    const { user,posts } = usePage().props;

    return (
        <AppLayout breadcrumbs={[{ title: 'My Profile', href: '/user' },{ title: 'Favorites', href: '/user/favorites'}]}>
            <Head title="Favorites" />

            <div className="p-6 text-2xl font-extrabold">Favorite Posts</div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {posts.length > 0 ? (
                    posts.map((post) => <PostComponent key={post.id} post={post} />)
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 px-6 py-4">No favorite posts yet.</p>
                )}
            </div>
        </AppLayout>
    );
}
