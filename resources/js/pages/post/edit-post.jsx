import { Head, useForm, usePage, Link } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { useState } from 'react';
import { HashtagInput } from '../../components/hashtag-input.jsx';
import { BarChart3, X } from 'lucide-react';
import { getMediaUrl } from '@/lib/utils';

export default function EditPost() {
    const { post, auth, translations } = usePage().props;

    const [removedMediaPaths, setRemovedMediaPaths] = useState([]);
    const [pollRemoved, setPollRemoved] = useState(false);

    const { data, setData, post: submit, processing, errors } = useForm({
        content: post.content || '',
        is_private: post.is_private || false,
        media: null,
        remove_media: [],
        remove_poll: false,
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

        if (pollRemoved) {
            formData.append('remove_poll', '1');
        }

        data.hashtags.forEach(tag => {
            formData.append('hashtags[]', tag);
        });

        if (data.media) {
            for (let i = 0; i < data.media.length; i++) {
                formData.append('media[]', data.media[i]);
            }
        }

        submit(route('post.update', post.slug), {
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

    const canUpdate =
        (data.content && data.content.trim() !== '') ||
        (data.media && data.media.length > 0) ||
        (post.media?.some(m => !removedMediaPaths.includes(m.file_path)));

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'My Posts', href: `/user/${auth.user.username}` },
                { title: 'Edit Post', href: `/post/${post.slug}` },
            ]}
        >
            <Head title={translations['Edit Post']} />

            <div className="border-b border-gray-200 p-6 dark:border-neutral-800">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{translations['Edit Post']}</h1>
            </div>

            <div className="p-6">

                <div className="flex items-center justify-start my-3">
                    <label className="text-sm text-gray-700 dark:text-gray-200">
                        {translations['Private (Only for followers)'] || 'Private (Only for followers)'}
                    </label>
                    <Switch checked={data.is_private} onChange={(val) => setData('is_private', val)} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
                    <div>
                        <label className="mb-2 block text-gray-700 dark:text-gray-200">{translations['Content']}</label>
                        <textarea
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            rows={5}
                            className={`w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.content ? 'border-red-500' : ''
                            }`}
                        />
                        <div className="mt-1 flex items-center justify-between">
                            {errors.content ? <div className="text-red-500 text-sm">{errors.content}</div> : <div />}
                            <span className={`text-xs ${data.content.length > 500 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                {data.content.length}/500
                            </span>
                        </div>
                    </div>

                    {post.poll && !pollRemoved && (
                        <div className="rounded-xl border border-gray-100 p-4 dark:border-neutral-800">
                            <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
                                <BarChart3 className="h-4 w-4" />
                                {translations['Poll'] || 'Poll'}
                                {post.poll.is_expired && (
                                    <span className="ml-1 text-xs text-red-500">({translations['Expired'] || 'Expired'})</span>
                                )}
                                <span className="ml-auto text-xs text-gray-400">
                                    {post.poll.total_votes} {post.poll.total_votes === 1 ? (translations['vote'] || 'vote') : (translations['votes'] || 'votes')}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {post.poll.options.map((option) => {
                                    const percentage = post.poll.total_votes > 0
                                        ? Math.round((option.votes_count / post.poll.total_votes) * 100)
                                        : 0;
                                    return (
                                        <div key={option.id} className="relative overflow-hidden rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-neutral-700">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-blue-100 dark:bg-blue-900/30"
                                                style={{ width: `${percentage}%` }}
                                            />
                                            <div className="relative flex items-center justify-between">
                                                <span className="text-gray-700 dark:text-gray-300">{option.text}</span>
                                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{percentage}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                {post.poll.expires_at && !post.poll.is_expired && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {translations['Ends'] || 'Ends'} {new Date(post.poll.expires_at).toLocaleDateString()}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPollRemoved(true);
                                        setData('remove_poll', true);
                                    }}
                                    className="ml-auto flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                                >
                                    <X size={14} />
                                    {translations['Remove poll'] || 'Remove poll'}
                                </button>
                            </div>
                        </div>
                    )}

                    {post.media?.length > 0 && (
                        <div className="space-y-2">
                            <label className="block text-gray-700 dark:text-gray-200">{translations['Current Media']}</label>
                            <div className="grid grid-cols-2 gap-4">
                                {post.media
                                    .filter((m) => !removedMediaPaths.includes(m.file_path))
                                    .map((m) => (
                                        <div key={m.file_path} className="relative rounded-md overflow-hidden border dark:border-gray-700 group">
                                            {m.file_type.includes('image') ? (
                                                <img
                                                    src={getMediaUrl(m)}
                                                    alt=""
                                                    className="h-40 w-full object-contain bg-gray-100 dark:bg-neutral-800"
                                                />
                                            ) : (
                                                <video
                                                    src={getMediaUrl(m)}
                                                    controls
                                                    className="h-40 w-full object-contain bg-gray-100 dark:bg-neutral-800"
                                                />
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...removedMediaPaths, m.file_path];
                                                    setRemovedMediaPaths(updated);
                                                    setData('remove_media', updated);
                                                }}

                                                className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs hover:bg-red-700"
                                            >
                                                {translations['Remove']}
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-row flex-wrap gap-4 xl:flex-nowrap">
                        <div className="flex w-full flex-col items-start gap-y-2">
                            <label className="block text-sm text-gray-700 dark:text-gray-200">
                                {translations['Hashtags']}
                            </label>
                            <HashtagInput
                                placeholder={translations['Add hashtag...']}
                                initialHashtags={(post.hashtags || []).map((h) => h.hashtag)}
                                value={data.hashtags}
                                onChange={(hashtags) => setData('hashtags', hashtags)}
                            />
                        </div>

                        <div className="flex-1/2">
                            <label className="block text-sm text-gray-700 dark:text-gray-200">
                                {translations['Upload Media (Images or Videos)']}
                            </label>

                            <div className="mt-3 w-full max-w-full flex items-center gap-2">
                                <Input
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
                                    onChange={(e) => setData('media', e.target.files)}
                                    className="w-full break-all"
                                />
                                {data.media && (
                                    <button
                                        type="button"
                                        onClick={clearMediaInput}
                                        className="shrink-0 rounded-full p-2 bg-gray-200 hover:bg-red-100 dark:bg-neutral-700 dark:hover:bg-red-900 text-gray-600 hover:text-red-600 dark:text-gray-200 dark:hover:text-red-400"
                                        title="Clear media"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {data.media && data.media.length > 0 && (
                                <ul className="mt-2 list-disc pl-4 text-sm text-gray-500 space-y-1 overflow-hidden break-all">
                                    {Array.from(data.media).map((file, index) => (
                                        <li key={index} className="max-w-6xl" title={file.name}>
                                            {file.name}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {errors['media.0'] && (
                                <p className="text-sm text-red-500 mt-1">{errors['media.0']}</p>
                            )}
                        </div>
                    </div>


                    <div className="flex justify-end gap-2">
                        <Link
                            href={`/post/${post.slug}`}
                            className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-800"
                        >
                            {translations['Cancel']}
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing || !canUpdate}
                            className={`rounded-full px-5 py-2 text-sm font-medium text-white transition ${!canUpdate ? 'cursor-not-allowed bg-gray-400 dark:bg-neutral-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {translations['Update']}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
