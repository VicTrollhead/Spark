import { useEffect, useState } from 'react';
import { Head, usePage, useForm, router } from '@inertiajs/react';
import AppLayout from '../layouts/app-layout';
import PostComponent from './post/post-component';
import {RefreshCw} from 'lucide-react';

export default function Dashboard() {
    const { users, posts, sort } = usePage().props;
    const [sortOption, setSortOption] = useState(sort || 'latest');
    const [isLoading, setIsLoading] = useState(false);


    const { data, setData, post, errors } = useForm({
        content: '',
        parent_post_id: null,
        media_url: null,
        is_private: false,
    });

    const handleSortChange = (e) => {
        const selectedSort = e.target.value;
        setSortOption(selectedSort);
        router.get('/dashboard', { sort: selectedSort }, { preserveScroll: true });
    };

    const handlePostSubmit = (e) => {
        e.preventDefault();

        const extractedTags = data.content.match(/#(\w+)/g)?.map(tag => tag.slice(1)) || [];
        post('/dashboard', {
            content: data.content,
            parent_post_id: data.parent_post_id,
            post_type: data.post_type,
            is_private: data.is_private
        });
        setData({ content: '', parent_post_id: null, media_url: null, is_private: false });
    };

    const handleReload = () => {
        setIsLoading(true);
        router.reload({ only: ['posts'] });
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    };
    //
    // useEffect(() => {
    //     setInterval(() => {
    //         router.reload({ only: ['posts'] });
    //     }, 120000)
    // });


    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Dashboard" />

            <div className="p-6 text-2xl font-extrabold">What's new?</div>

            <div className="p-4 bg-white dark:bg-neutral-950 border-y dark:border-gray-800">
                <form onSubmit={handlePostSubmit} className="flex flex-col space-y-4">
                    <textarea
                        value={data.content}
                        onChange={(e) => setData('content', e.target.value)}
                        rows={3}
                        placeholder="What's on your mind?"
                        className="resize-none p-3 bg-gray-100 dark:bg-neutral-900 rounded-md text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                    />
                    {errors.content && <p className="text-red-500 text-sm">{errors.content}</p>}

                    <label>
                        <input
                            type="checkbox"
                            checked={data.is_private}
                            onChange={(e) => setData('is_private', e.target.checked)}
                            className="mx-2"
                        />
                        Private (Only for subscribers)
                    </label>
                    <button
                        type="submit"
                        disabled={!data.content}
                        className={`self-end py-2 px-4 mr-0.5 rounded-lg text-white ${
                            data.content ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 cursor-not-allowed'
                        }`}
                    >
                        Post
                    </button>
                </form>
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-950 border-b dark:border-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Posts</h2>
                <div className="flex items-center gap-2">
                    <select
                        value={sortOption}
                        onChange={handleSortChange}
                        className="p-2 border rounded-md bg-gray-100 dark:bg-neutral-900 text-neutral-950 dark:text-white"
                    >
                        <option value="latest">Latest</option>
                        <option value="oldest">Oldest</option>
                        <option value="likes">Most Liked</option>
                        <option value="friends">Friends' Posts</option>
                    </select>
                    <button
                        onClick={handleReload}
                        className="p-2 text-sm font-semibold dark:text-white text-gray-800 border rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 transition flex items-center"
                    >
                        <RefreshCw
                            className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`}
                        />
                    </button>
                </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {posts.length > 0 ? (
                    posts.map((post) => <PostComponent key={post.id} post={post} />)
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 px-6 py-4">No posts yet.</p>
                )}
            </div>
        </AppLayout>
    );
}
