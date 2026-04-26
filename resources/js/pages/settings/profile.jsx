import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

export default function Profile({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: auth.user.name,
        username: auth.user.username,
        email: auth.user.email,
    });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };
    const { translations } = usePage().props;
    return (<AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings"/>

            <SettingsLayout>
                <div className="space-y-4">
                    <HeadingSmall title={translations["Profile information"] || "Profile information"} description={translations["Update your name, username, and email address"] || "Update your name, username, and email address"}/>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="name">{translations["Name"] || "Name"}</Label>
                            <Input id="name" className="block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoComplete="name" placeholder="Full name"/>
                            <InputError message={errors.name}/>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="username">{translations["Username"] || "Username"}</Label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400">@</span>
                                <Input id="username" className="block w-full pl-7" value={data.username} onChange={(e) => setData('username', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} required maxLength={30} placeholder="username"/>
                            </div>
                            <p className="text-xs text-muted-foreground">{translations["Letters, numbers, and underscores only"] || "Letters, numbers, and underscores only"}</p>
                            <InputError message={errors.username}/>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="email">{translations["Email Address"] || "Email Address"}</Label>
                            <Input id="email" type="email" className="block w-full" value={data.email} onChange={(e) => setData('email', e.target.value)} required autoComplete="username" placeholder="Email address"/>
                            <InputError message={errors.email}/>
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (<div>
                                <p className="-mt-4 text-sm text-muted-foreground">
                                    {translations["Your email address is unverified."]}{' '}
                                    <Link href={route('verification.send')} method="post" as="button" className="hover:decoration-current! text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out dark:decoration-neutral-500">
                                        {translations["Click here to resend the verification email."]}
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (<div className="mt-2 text-sm font-medium text-green-600">
                                    {translations["A new verification link has been sent to your email address."]}
                                    </div>)}
                            </div>)}

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>{translations["Save"]}</Button>

                            <Transition show={recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0">
                                <p className="text-sm text-neutral-600">{translations["Saved"]}</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                <div className="my-6 border-t border-border" />
                <DeleteUser />
            </SettingsLayout>
        </AppLayout>);
}

