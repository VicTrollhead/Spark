import { useEffect, useRef, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '../layouts/app-layout';
import PostComponent from './post/post-component';
import { RefreshCw } from 'lucide-react';
import { HashtagInput } from '../components/hashtag-input';

export default function Dashboard() {
    const { users, posts, sort } = usePage().props;
    const [sortOption, setSortOption] = useState(sort || 'latest');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const hashtagRef = useRef();
    const fileInputRef = useRef();

    const [data, setData] = useState({
        content: '',
        parent_post_id: null,
        is_private: false,
        media: [],
        hashtags: [],
    });

    const [errors, setErrors] = useState({});

    const handleSortChange = (e) => {
        const selectedSort = e.target.value;
        setSortOption(selectedSort);
        router.get('/dashboard', { sort: selectedSort }, { preserveScroll: true });
    };

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        setData((prev) => ({ ...prev, media: files }));
        setSelectedFiles(files.map((file) => file.name));
    };

    const handlePostSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('content', data.content);
        formData.append('parent_post_id', data.parent_post_id || '');
        formData.append('is_private', data.is_private ? 1 : 0);

        const contentTags = data.content.match(/#(\w+)/g)?.map(tag => tag.slice(1)) || [];
        const manualTags = data.hashtags || [];

        const combinedTags = Array.from(new Set([...contentTags, ...manualTags]));

        combinedTags.forEach((tag, index) => {
            formData.append(`hashtags[${index}]`, tag);
        });

        if (data.media.length > 0) {
            data.media.forEach((file, index) => {
                formData.append(`media[${index}]`, file);
            });
        }

        router.post('/dashboard', formData, {
            forceFormData: true,
            onSuccess: () => {
                setData({
                    content: '',
                    parent_post_id: null,
                    is_private: false,
                    media: [],
                    hashtags: [],
                });
                setSelectedFiles([]);
                setErrors({});
                hashtagRef.current?.reset();
                fileInputRef.current.value = null;
            },
            onError: (errorBag) => {
                setErrors(errorBag);
            },
        });
    };

    const handleReload = () => {
        setIsLoading(true);
        router.reload({ only: ['posts'] });
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Dashboard" />

            <div className="p-6 text-2xl font-extrabold">What's new?</div>

            <div className="p-4 bg-white dark:bg-neutral-950 border-y dark:border-gray-800">
                <form onSubmit={handlePostSubmit} className="flex flex-col space-y-4">
                    <textarea
                        value={data.content}
                        onChange={(e) => setData((prev) => ({ ...prev, content: e.target.value }))}
                        rows={3}
                        placeholder="What's on your mind?"
                        className="resize-none p-3 bg-gray-100 dark:bg-neutral-900 rounded-md text-neutral-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                    />
                    {errors.content && <p className="text-red-500 text-sm">{errors.content}</p>}

                    <HashtagInput ref={hashtagRef} onChange={(hashtags) => setData((prev) => ({ ...prev, hashtags }))} />

                    <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-200">
                            Upload Media (Images or Videos)
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleMediaChange}
                            className="mt-2 p-2 border rounded-md bg-gray-100 dark:bg-neutral-900 text-neutral-950 dark:text-white"
                        />
                        {selectedFiles.length > 0 && (
                            <ul className="mt-2 text-sm text-gray-500 list-disc pl-4">
                                {selectedFiles.map((name, index) => (
                                    <li key={index}>{name}</li>
                                ))}
                            </ul>
                        )}
                        {errors['media.0'] && <p className="text-red-500 text-sm">{errors['media.0']}</p>}
                    </div>

                    <label className="text-sm text-gray-700 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={data.is_private}
                            onChange={(e) => setData((prev) => ({ ...prev, is_private: e.target.checked }))}
                            className="mx-2"
                        />
                        Private (Only for subscribers)
                    </label>

                    <button
                        type="submit"
                        disabled={!data.content}
                        className={`self-end py-2 px-4 rounded-lg text-white transition ${
                            data.content
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
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
                        <option value="followees">People I Follow</option>
                        <option value="followers">People Who Follow Me</option>
                        <option value="mutuals">Mutual Friends</option>
                    </select>

                    <button
                        onClick={handleReload}
                        className="p-2 text-sm font-semibold dark:text-white text-gray-800 border rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 transition flex items-center"
                    >
                        <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
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
