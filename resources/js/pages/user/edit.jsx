import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';
import { getCoverImageUrl, getProfileImageUrl } from '../../lib/utils';

export default function Edit() {
    const { user, translations } = usePage().props;
    const getInitials = useInitials();
    const [removeProfileImage, setRemoveProfileImage] = useState(false);
    const [removeCoverImage, setRemoveCoverImage] = useState(false);
    const profileInputRef = useRef();
    const coverInputRef = useRef(null);
    const [previewProfileImage, setPreviewProfileImage] = useState(null);
    const [previewCoverImage, setPreviewCoverImage] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        name: user.name,
        username: user.username,
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        date_of_birth: user.date_of_birth ? formatDateForInput(user.date_of_birth) : '',

        is_private: user.is_private || false,
        status: user.status || 'active',
        profile_image: null,
        cover_image: null,
        remove_profile_image: false,
        remove_cover_image: false,
        _method: 'PATCH',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('user.update', user));
    };

    const handleProfileImageUnset = () => {
        setRemoveProfileImage(true);
        setData('profile_image', null);
        setData('remove_profile_image', true);
        setPreviewProfileImage(null);
    };

    const handleCoverImageUnset = () => {
        setRemoveCoverImage(true);
        setData('cover_image', null);
        setData('remove_cover_image', true);
        setPreviewCoverImage(null);
    };

    const handleProfileImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setRemoveProfileImage(false);
            setData('profile_image', file);
            setData('remove_profile_image', false);
            setPreviewProfileImage(URL.createObjectURL(file));
        }
    };

    const handleCoverImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setRemoveCoverImage(false);
            setData('cover_image', file);
            setData('remove_cover_image', false);
            setPreviewCoverImage(URL.createObjectURL(file));
        }
    };

    function formatDateForInput(dateStr) {
        const date = new Date(dateStr);
        if (isNaN(date)) return ''; // Invalid date
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const profileImageStatus = removeProfileImage
        ? translations['Will be removed']
        : previewProfileImage
          ? translations['Will be set']
          : user.profile_image
            ? translations['Set']
            : translations['Not Set'];

    const coverImageStatus = removeCoverImage
        ? translations['Will be removed']
        : previewCoverImage
          ? translations['Will be set']
          : user.cover_image
            ? translations['Set']
            : translations['Not Set'];

    useEffect(() => {
        return () => {
            if (previewProfileImage) URL.revokeObjectURL(previewProfileImage);
            if (previewCoverImage) URL.revokeObjectURL(previewCoverImage);
        };
    }, [previewProfileImage, previewCoverImage]);

    return (
        <AppLayout>
            <Head title={translations['Edit My Profile']} />
            <div className="border-b border-gray-200 p-6 dark:border-neutral-800">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{translations['Edit Profile']}</h1>
            </div>

            <div className="w-full max-w-7xl p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-xl border border-gray-100 p-4 dark:border-neutral-800">
                        <h2 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">{translations['Profile Image']}</h2>
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    {!removeProfileImage && (previewProfileImage || user.profile_image) ? (
                                        <AvatarImage src={previewProfileImage || getProfileImageUrl(user)} alt={user.name} />
                                    ) : (
                                        <AvatarFallback className="bg-gray-200 text-3xl dark:bg-gray-700">{getInitials(user.name)}</AvatarFallback>
                                    )}
                                </Avatar>
                                {removeProfileImage && (
                                    <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                                        <span className="text-sm font-medium">{translations['Removed']}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col items-center">
                                <div className="mb-2 flex w-full items-center">
                                    <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">{translations['Status']}:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{profileImageStatus}</span>
                                </div>
                                <div className="mt-3 flex w-full flex-wrap items-center gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <input
                                                ref={profileInputRef}
                                                type="file"
                                                id="profile-image"
                                                accept="image/jpeg,image/png,image/gif,image/webp"
                                                onChange={handleProfileImageChange}
                                                className="max-w-full min-w-0 truncate text-sm file:mr-4 file:rounded-md file:border-0 file:bg-gray-200 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-300 dark:file:bg-blue-700 dark:hover:file:bg-blue-800"
                                            />
                                            {data.profile_image && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setData('profile_image', null);
                                                        setPreviewProfileImage(null);
                                                        if (profileInputRef.current) profileInputRef.current.value = '';
                                                    }}
                                                    className="shrink-0 rounded-full bg-gray-200 p-2 text-gray-600 hover:bg-red-100 hover:text-red-600 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-red-900 dark:hover:text-red-400"
                                                    title="Clear file"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {user.profile_image && !removeProfileImage && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={handleProfileImageUnset}
                                                className="px-5 dark:bg-red-600 dark:hover:bg-red-700"
                                            >
                                                {translations['Remove']}
                                            </Button>
                                        )}
                                        {removeProfileImage && (
                                            <Button type="button" variant="outline" size="sm" onClick={() => setRemoveProfileImage(false)}>
                                                {translations['Undo']}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-100 p-4 dark:border-neutral-800">
                        <h2 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">{translations['Cover Image']}</h2>
                        <div className="flex flex-col gap-4">
                            <div className="relative h-72 w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                {!removeCoverImage && (previewCoverImage || user.cover_image) ? (
                                    <img
                                        src={previewCoverImage || getCoverImageUrl(user)}
                                        alt="Cover"
                                        className="h-full w-full object-cover object-center"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-600">
                                        <span>{translations['No Cover Image']}</span>
                                    </div>
                                )}
                                {removeCoverImage && user.cover_image && (
                                    <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                                        <span className="text-3xl font-medium">{translations['Removed']}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                                <div className="mb-2 flex items-center sm:mb-0">
                                    <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">{translations['Status']}:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{coverImageStatus}</span>
                                </div>
                                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <input
                                                ref={coverInputRef}
                                                type="file"
                                                id="cover-image"
                                                accept="image/jpeg,image/png,image/gif,image/webp"
                                                onChange={handleCoverImageChange}
                                                className="max-w-full min-w-0 truncate text-sm file:mr-4 file:rounded-md file:border-0 file:bg-gray-200 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-300 dark:file:bg-blue-700 dark:hover:file:bg-blue-800"
                                            />
                                            {data.cover_image && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setData('cover_image', null);
                                                        setPreviewCoverImage(null);
                                                        if (coverInputRef.current) coverInputRef.current.value = '';
                                                    }}
                                                    className="shrink-0 rounded-full bg-gray-200 p-2 text-gray-600 hover:bg-red-100 hover:text-red-600 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-red-900 dark:hover:text-red-400"
                                                    title="Clear file"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {user.cover_image && !removeCoverImage && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={handleCoverImageUnset}
                                                className="px-5 dark:bg-red-600 dark:hover:bg-red-700"
                                            >
                                                {translations['Remove']}
                                            </Button>
                                        )}
                                        {removeCoverImage && (
                                            <Button type="button" variant="outline" size="sm" onClick={() => setRemoveCoverImage(false)}>
                                                {translations['Undo']}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-100 p-4 dark:border-neutral-800">
                        <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">{translations['User Information']}</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {translations['Name']}
                                </label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={user.name}
                                    error={errors.name}
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {translations['Username']}
                                </label>
                                <Input
                                    id="username"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder={user.username}
                                    error={errors.username}
                                />
                                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                            </div>

                            <div>
                                <label htmlFor="bio" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {translations['Bio']}
                                </label>
                                <Input
                                    id="bio"
                                    value={data.bio}
                                    onChange={(e) => setData('bio', e.target.value)}
                                    placeholder={translations['Enter your bio']}
                                    error={errors.bio}
                                />
                                {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
                            </div>

                            <div>
                                <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {translations['Location']}
                                </label>
                                <Input
                                    id="location"
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    placeholder={translations['Enter your location']}
                                    error={errors.location}
                                />
                                {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                            </div>

                            <div>
                                <label htmlFor="website" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {translations['Website']}
                                </label>
                                <Input
                                    id="website"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    placeholder="https://"
                                    error={errors.website}
                                />
                                {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website}</p>}
                            </div>

                            <div>
                                <label htmlFor="date-of-birth" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {translations['Date of Birth']}
                                </label>
                                <Input
                                    id="date-of-birth"
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) => setData('date_of_birth', e.target.value)}
                                    error={errors.date_of_birth}
                                />
                                {errors.date_of_birth && <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-100 p-4 dark:border-neutral-800">
                        <h2 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">{translations['Account Settings']}</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Switch checked={data.is_private} onChange={(value) => setData('is_private', value)} id="private-account" />
                                <div className="flex flex-col">
                                    <label htmlFor="private-account" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {translations['Private Account']}
                                    </label>
                                    <p className="text-xs text-gray-500">{translations['Only approved followers can see your posts']}</p>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {translations['Account Status']}
                                </label>
                                <Select id="status" value={data.status} onValueChange={(value) => setData('status', value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={translations['Select Status']} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{translations['active']}</SelectItem>
                                        <SelectItem value="suspended">{translations['suspended']}</SelectItem>
                                        <SelectItem value="deactivated">{translations['deactivated']}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Link
                            href={`/user/${user.username}`}
                            className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-800"
                        >
                            {translations['Cancel']}
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                            {processing ? translations['Saving...'] : translations['Save Changes']}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
