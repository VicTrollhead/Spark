import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import PostComponent from '../post/post-component';

export default function Favorites() {
    const { user, posts, translations, filters } = usePage().props;

    const handleSortChange = (e) => {
        router.get(route('user.favorites', { username: user.username }), {
            sort: e.target.value,
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <AppLayout>
            <Head title={translations['Favorites']} />

            <div className="flex justify-between items-center p-6">
                <h1 className="text-2xl font-extrabold">{translations['Favorites']}</h1>

                <select
                    className="ml-4 px-3 py-1 border rounded-md dark:bg-neutral-900 dark:text-white"
                    value={filters.sort}
                    onChange={handleSortChange}
                >
                    <option value="latest">{translations['Latest']}</option>
                    <option value="oldest">{translations['Oldest']}</option>
                    <option value="most_liked">{translations['Most Liked']}</option>
                    <option value="reposted_friends">{translations['People I Follow']}</option>
                </select>
            </div>

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
