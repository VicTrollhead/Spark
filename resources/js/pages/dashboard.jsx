import { useState } from 'react';
import { Head, usePage, useForm } from '@inertiajs/react';
import AppLayout from '../layouts/app-layout';
import PostComponent from './post/post-component';

export default function Dashboard() {
    const { users, posts } = usePage().props;

    // Initialize the useForm hook with all required fields
    const { data, setData, post, errors } = useForm({
        content_: '',
        parent_post_id: null,
        // post_type: 'text',
        media_url: null,
        is_private: false,
    });

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
    ];

    // Handle the form submission
    const handlePostSubmit = (e) => {
        e.preventDefault();
        post('/dashboard', {
            content_: data.content_,
            parent_post_id: data.parent_post_id,
            post_type: data.post_type,
            is_private: data.is_private,
        });
        setData({ content_: '', parent_post_id: null, media_url: null, is_private: false });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="p-6 text-2xl font-extrabold">
                What's new?
            </div>

            <div className="p-4 bg-white dark:bg-neutral-950 border-y dark:border-gray-800">
                <form onSubmit={handlePostSubmit} className="flex flex-col space-y-4">
                    <textarea
                        value={data.content_}
                        onChange={(e) => setData('content_', e.target.value)}
                        rows={3}
                        placeholder="What's on your mind?"
                        className="resize-none p-3 bg-gray-100 dark:bg-neutral-900 rounded-md text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                    />
                    {errors.content_ && <p className="text-red-500 text-sm">{errors.content_}</p>}

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
                        disabled={!data.content_}
                        className={`self-end py-2 px-4 rounded-lg text-white ${
                            data.content_ ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 cursor-not-allowed'
                        }`}
                    >
                        Post
                    </button>
                </form>
            </div>

            <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white px-6 py-2">Posts</h2>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {posts.length > 0 ? (
                        posts
                            .map((post) => <PostComponent key={post.id} post={post} />)
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 px-6 py-4">No posts yet.</p>
                    )}

                </div>
            </div>
        </AppLayout>
    );
}
