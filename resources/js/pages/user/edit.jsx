import { Head, usePage, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '../../layouts/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useInitials } from '../../hooks/use-initials';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export default function Edit() {
    const { user } = usePage().props;
    // console.log(user);
    const getInitials = useInitials();

    const { data, setData, post, processing, errors } = useForm({
        name: user.name,
        username: user.username,
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        date_of_birth: user.date_of_birth || '',
        profile_image: null,
        cover_image: null,
        _method: 'PATCH',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form is being submitted');
        post(route('user.update', user));
    };

    const breadcrumbs= [
        { title: 'My Profile', href: `/user/${user.username}` },
        { title: 'Edit Profile', href: `/user/${user.username}` }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit My Profile`} />
            <div className="p-10 max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Edit Profile</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-900">
                            <AvatarImage src={user.profile_image_url} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <input
                            type="file"
                            onChange={(e) => setData('profile_image', e.target.files[0])}
                            className="text-sm text-gray-500"
                        />
                    </div>

                    <Input
                        label="Name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        error={errors.name}
                    />

                    <Input
                        label="Username"
                        value={data.username}
                        onChange={(e) => setData('username', e.target.value)}
                        error={errors.username}
                    />

                    <Input
                        label="Bio"
                        value={data.bio}
                        onChange={(e) => setData('bio', e.target.value)}
                        error={errors.bio}
                    />

                    <Input
                        label="Location"
                        value={data.location}
                        onChange={(e) => setData('location', e.target.value)}
                        error={errors.location}
                    />

                    <Input
                        label="Website"
                        value={data.website}
                        onChange={(e) => setData('website', e.target.value)}
                        error={errors.website}
                    />

                    <Input
                        type="date"
                        label="Date of Birth"
                        value={data.date_of_birth}
                        onChange={(e) => setData('date_of_birth', e.target.value)}
                        error={errors.date_of_birth}
                    />

                    <div className="flex justify-end gap-2">
                        <Link href={`/user/${user.username}`} className="bg-gray-300 hover:bg-gray-400 text-gray-900 dark:hover:bg-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 rounded-md">
                            Cancel
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-5 rounded-md">
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
//bg-gray-600 hover:bg-gray-700 text-white dark:bg-gray-300 dark:hover:bg-gray-400 dark:text-black
