import { useEffect, useRef, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '../layouts/app-layout';
import PostComponent from './post/post-component';
import { RefreshCw } from 'lucide-react';
import { HashtagInput } from '../components/hashtag-input';

export default function Dashboard() {
    const { users, posts, sort, translations } = usePage().props;
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

            <div className="p-6 text-2xl font-extrabold">{translations["What's new?"]}</div>

            <div className="border-y bg-white p-4 dark:border-gray-800 dark:bg-neutral-950">
                <form onSubmit={handlePostSubmit} className="flex flex-col space-y-4">
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={data.is_private}
                            onChange={(e) => setData((prev) => ({ ...prev, is_private: e.target.checked }))}
                            className="mx-2"
                        />
                        {translations['Private (Only for subscribers)']}
                    </label>
                    <textarea
                        value={data.content}
                        onChange={(e) => setData((prev) => ({ ...prev, content: e.target.value }))}
                        rows={3}
                        placeholder={translations["What's on your mind?"]}
                        className="resize-none rounded-md bg-gray-100 p-3 text-neutral-950 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-neutral-900 dark:text-white dark:focus:ring-blue-600"
                    />
                    {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
                    <hr />

                    <div className="flex flex-row flex-wrap gap-4 xl:flex-nowrap">
                        <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-200">
                                {translations['Upload Media (Images or Videos)']}
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleMediaChange}
                                className="mt-2 rounded-md border bg-gray-100 p-2 text-neutral-950 dark:bg-neutral-900 dark:text-white"
                            />
                            {selectedFiles.length > 0 && (
                                <ul className="mt-2 list-disc pl-4 text-sm text-gray-500">
                                    {selectedFiles.map((name, index) => (
                                        <li key={index}>{name}</li>
                                    ))}
                                </ul>
                            )}
                            {errors['media.0'] && <p className="text-sm text-red-500">{errors['media.0']}</p>}
                        </div>
                        <div className="w-full flex flex-col items-start gap-y-1">
                            <label className="block text-sm text-gray-700 dark:text-gray-200">{translations['Hashtags']}</label>
                            <HashtagInput
                                placeholder={translations['Add hashtag...']}
                                ref={hashtagRef}
                                onChange={(hashtags) => setData((prev) => ({ ...prev, hashtags }))}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!data.content}
                        className={`self-end rounded-lg px-4 py-2 text-white transition ${
                            data.content ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-gray-400 dark:bg-gray-600'
                        }`}
                    >
                        {translations['Publish']}
                    </button>
                </form>
            </div>

            <div className="flex items-center justify-between border-b bg-white p-4 dark:border-gray-800 dark:bg-neutral-950">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{translations['Posts']}</h2>
                <div className="flex items-center gap-2">
                    <select
                        value={sortOption}
                        onChange={handleSortChange}
                        className="rounded-md border bg-gray-100 p-2 text-neutral-950 dark:bg-neutral-900 dark:text-white"
                    >
                        <option value="latest">{translations['Latest']}</option>
                        <option value="oldest">{translations['Oldest']}</option>
                        <option value="likes">{translations['Most Liked']}</option>
                        <option value="followees">{translations['People I Follow']}</option>
                        <option value="followers">{translations['People Who Follow Me']}</option>
                        <option value="mutuals">{translations['Mutual Friends']}</option>
                    </select>

                    <button
                        onClick={handleReload}
                        className="flex items-center rounded-md border p-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-200 dark:text-white dark:hover:bg-neutral-800"
                    >
                        <RefreshCw className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {posts.length > 0 ? (
                    posts.map((post) => <PostComponent key={post.id} post={post} />)
                ) : (
                    <p className="px-6 py-4 text-gray-500 dark:text-gray-400">No posts yet.</p>
                )}
            </div>
        </AppLayout>
    );
}
