import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import PostComponent from '../post/post-component';

export default function FollowingPosts() {
    const { user, posts, translations, filters } = usePage().props;

    const handleSortChange = (e) => {
        router.get(route('user.followingPosts', { username: user.username }), {
            sort: e.target.value,
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <AppLayout>
            <Head title={translations['Following posts']} />

            <div className="flex justify-between items-center p-6">
                <h1 className="text-2xl font-extrabold">{translations['Following posts']}</h1>

                <select
                    className="ml-4 px-3 py-1 border rounded-md dark:bg-neutral-900 dark:text-white"
                    value={filters.sort}
                    onChange={handleSortChange}
                >
                    <option value="latest">{translations['Latest']}</option>
                    <option value="oldest">{translations['Oldest']}</option>
                    <option value="most_liked">{translations['Most Liked']}</option>
                </select>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-neutral-800">
                {posts.length > 0 ? (
                    posts.map((post) => <PostComponent key={post.id} post={post} />)
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 px-6 py-4">{translations['No following posts yet.']}</p>
                )}
            </div>
        </AppLayout>
    );
}
