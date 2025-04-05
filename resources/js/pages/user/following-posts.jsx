import { Head, usePage } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import PostComponent from '../post/post-component';

export default function FollowingPosts() {
    const { user,posts } = usePage().props;

    return (
        <AppLayout breadcrumbs={[{ title: 'My Profile', href: '/user' },{ title: 'Following posts', href: '/user/following-posts'}]}>
            <Head title="Following posts" />

            <div className="p-6 text-2xl font-extrabold">Following posts</div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {posts.length > 0 ? (
                    posts.map((post) => <PostComponent key={post.id} post={post} />)
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 px-6 py-4">No following posts yet.</p>
                )}
            </div>
        </AppLayout>
    );
}
