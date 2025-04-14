import { Head, usePage } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import PostComponent from '../post/post-component';

export default function Favorites() {
    const { user, posts, translations } = usePage().props;

    return (
        <AppLayout>
            <Head title={translations['Favorites']} />

            <div className="p-6 text-2xl font-extrabold">{translations['Favorites']}</div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {posts.length > 0 ? (
                    posts.map((post) => <PostComponent key={post.id} post={post} />)
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 px-6 py-4">{translations['No favorite posts yet.']}</p>
                )}
            </div>
        </AppLayout>
    );
}
