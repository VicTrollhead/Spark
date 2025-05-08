import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { useInitials } from '../../hooks/use-initials';
import AppLayout from '../../layouts/app-layout';
import { getProfileImageUrl, getCoverImageUrl } from '../../lib/utils';

export default function Edit() {
    const { user, translations } = usePage().props;
    const getInitials = useInitials();

    const { data, setData, post, processing, errors } = useForm({
        name: user.name,
        username: user.username,
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        date_of_birth: user.date_of_birth || '',
        is_private: user.is_private || false,
        status: user.status || 'active',
        profile_image: user.profile_image_url || null,
        cover_image: user.cover_image_url || null,
        _method: 'PATCH',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('user.update', user));
    };

    // const getProfileImageUrl = (user) => {
    //     if (user?.profile_image?.disk === 's3') {
    //         return user.profile_image?.url;
    //     } else if (user?.profile_image?.file_path) {
    //         return `/storage/${user.profile_image?.file_path}`;
    //     }
    //     return null;
    // };
    //
    // const getCoverImageUrl = (user) => {
    //     if (user?.cover_image?.disk === 's3') {
    //         return user.cover_image.url;
    //     } else if (user?.cover_image?.file_path) {
    //         return `/storage/${user.cover_image.file_path}`;
    //     }
    //     return null;
    // };

    return (
        <AppLayout>
            <Head title={translations['Edit My Profile']} />
            <div className="mx-auto w-11/12 max-w-7xl py-2">
                <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">{translations['Edit Profile']}</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-900">
                            <AvatarImage src={getProfileImageUrl(user)} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <label className="mb-2 block text-gray-700 dark:text-gray-200">
                                {translations['Profile Image']}
                                <span className="text-gray-500 break-all"> ({user.profile_image?.url  || translations['Not Set']})</span>
                            </label>
                            <input
                                type="file"
                                onChange={(e) => setData('profile_image', e.target.files[0])}
                                className="text-sm text-gray-500 truncate"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <img src={getCoverImageUrl(user)} className="h-16 w-fit"/>
                        <div>
                            <label className="mb-2 block text-gray-700 dark:text-gray-200">
                                {translations['Cover Image']}
                                <span className="text-gray-500 break-all"> ({user.cover_image?.url  || translations['Not Set']})</span>
                            </label>
                            <input
                                type="file"
                                onChange={(e) => setData('cover_image', e.target.files[0])}
                                className="text-sm text-gray-500 truncate"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-gray-700 dark:text-gray-200">
                            {translations['Name']} <span className="text-gray-500">({user.name})</span>
                        </label>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} />
                    </div>

                    {/* Username */}
                    <div>
                        <label className="mb-2 block text-gray-700 dark:text-gray-200">
                            {translations['Username']} <span className="text-gray-500">({user.username})</span>
                        </label>
                        <Input value={data.username} onChange={(e) => setData('username', e.target.value)} error={errors.username} />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="mb-2 block text-gray-700 dark:text-gray-200">
                            {translations['Bio']} <span className="text-gray-500">({user.bio || translations['Not Set']})</span>
                        </label>
                        <Input value={data.bio} onChange={(e) => setData('bio', e.target.value)} error={errors.bio} />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="mb-2 block text-gray-700 dark:text-gray-200">
                            {translations['Location']} <span className="text-gray-500">({user.location || translations['Not Set']})</span>
                        </label>
                        <Input value={data.location} onChange={(e) => setData('location', e.target.value)} error={errors.location} />
                    </div>

                    {/* Website */}
                    <div>
                        <label className="mb-2 block text-gray-700 dark:text-gray-200">
                            {translations['Website']} <span className="text-gray-500">({user.website || translations['Not Set']})</span>
                        </label>
                        <Input value={data.website} onChange={(e) => setData('website', e.target.value)} error={errors.website} />
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <label className="mb-2 block text-gray-700 dark:text-gray-200">
                            {translations['Date of Birth']}{' '}
                            <span className="text-gray-500">
                                ({user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : translations['Not Set']})
                            </span>
                        </label>
                        <Input
                            type="date"
                            value={data.date_of_birth}
                            onChange={(e) => setData('date_of_birth', e.target.value)}
                            error={errors.date_of_birth}
                        />
                    </div>

                    {/* Private Account Toggle */}
                    <div className="flex items-center justify-start">
                        <label className="text-gray-700 dark:text-gray-200">
                            {translations['Private Account']} <span className="text-gray-500">({user.is_private ? translations['Yes'] : translations['No']})</span>
                        </label>
                        <Switch checked={data.is_private} onChange={(value) => setData('is_private', value)} />
                    </div>


                    <div>
                        <label className="mb-1 block text-gray-700 dark:text-gray-300">
                            {translations['Status']} <span className="text-gray-500">({translations[user.status]})</span>
                        </label>
                        <Select value={data.status} onValueChange={(value) => setData('status', value)}>
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

                    <div className="flex justify-end gap-2">
                        <Link
                            href={`/user/${user.username}`}
                            className="rounded-md bg-gray-300 px-4 py-2 text-gray-900 hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                        >
                            {translations['Cancel']}
                        </Link>
                        <Button type="submit" disabled={processing} className="rounded-md bg-blue-600 px-4 py-5 text-white hover:bg-blue-700">
                            {translations['Save Changes']}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
