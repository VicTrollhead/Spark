import { Head, useForm, usePage, Link } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { useState } from 'react';
import { HashtagInput } from '../../components/hashtag-input.jsx';
import { X } from 'lucide-react';

export default function EditPost() {
    const { post, auth } = usePage().props;

    const [removedMediaPaths, setRemovedMediaPaths] = useState([]);

    const { data, setData, post: submit, processing, errors } = useForm({
        content: post.content || '',
        is_private: post.is_private || false,
        media: null,
        remove_media: [],
        hashtags: (post.hashtags || []).map((h) => h.hashtag),
        _method: 'PATCH',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('content', data.content);
        formData.append('is_private', data.is_private ? '1' : '0');
        formData.append('_method', 'PATCH');

        removedMediaPaths.forEach(path => {
            formData.append('remove_media[]', path);
        });

        data.hashtags.forEach(tag => {
            formData.append('hashtags[]', tag);
        });

        if (data.media) {
            for (let i = 0; i < data.media.length; i++) {
                formData.append('media[]', data.media[i]);
            }
        }

        submit(route('post.update', post.id), {
            data: formData,
            forceFormData: true,
        });
    };

    const clearMediaInput = () => {
        setData('media', null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'My Posts', href: `/user/${auth.user.username}` },
                { title: 'Edit Post', href: `/posts/${post.id}` },
            ]}
        >
            <Head title="Edit Post" />
            <div className="mx-auto w-11/12 max-w-3xl py-4">
                <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Edit Post</h1>

                <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
                    <div>
                        <label className="mb-2 block text-gray-700 dark:text-gray-200">Content</label>
                        <textarea
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            rows={5}
                            className={`w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.content ? 'border-red-500' : ''
                            }`}
                        />
                        {errors.content && <div className="mt-1 text-red-500 text-sm">{errors.content}</div>}
                    </div>

                    {post.media?.length > 0 && (
                        <div className="space-y-2">
                            <label className="block text-gray-700 dark:text-gray-200">Current Media</label>
                            <div className="grid grid-cols-2 gap-4">
                                {post.media
                                    .filter((m) => !removedMediaPaths.includes(m.file_path))
                                    .map((m) => (
                                        <div key={m.file_path} className="relative rounded-md overflow-hidden border dark:border-gray-700 group">
                                            {m.file_type.includes('image') ? (
                                                <img
                                                    src={`/storage/${m.file_path}`}
                                                    alt=""
                                                    className="h-40 w-full object-contain bg-gray-100 dark:bg-gray-800"
                                                />
                                            ) : (
                                                <video
                                                    src={`/storage/${m.file_path}`}
                                                    controls
                                                    className="h-40 w-full object-contain bg-gray-100 dark:bg-gray-800"
                                                />
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setRemovedMediaPaths([...removedMediaPaths, m.file_path])}
                                                className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs hover:bg-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-gray-700 dark:text-gray-200">Upload New Media</label>
                        <div className="relative">
                            <Input
                                type="file"
                                multiple
                                onChange={(e) => setData('media', e.target.files)}
                                className="pr-10"
                            />
                            {data.media && (
                                <button
                                    type="button"
                                    onClick={clearMediaInput}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600 rounded-full p-1 bg-gray-200 dark:bg-gray-700"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-gray-700 dark:text-gray-200">Hashtags</label>
                        <HashtagInput
                            initialHashtags={(post.hashtags || []).map((h) => h.hashtag)}
                            value={data.hashtags}
                            onChange={(hashtags) => setData('hashtags', hashtags)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-gray-700 dark:text-gray-200">
                            Private Post <span className="text-gray-500">({data.is_private ? 'Yes' : 'No'})</span>
                        </label>
                        <Switch checked={data.is_private} onChange={(val) => setData('is_private', val)} />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Link
                            href={`/post/${post.id}`}
                            className="rounded-md bg-gray-300 px-4 py-2 text-gray-900 hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                        >
                            Cancel
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-blue-600 px-4 py-5 hover:bg-blue-700 text-white">
                            Update Post
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
