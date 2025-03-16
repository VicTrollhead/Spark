import AppLogoIcon from '../../components/app-logo-icon';
import { Link } from '@inertiajs/react';

export default function AuthSimpleLayout({ children, title, description, imageSrc }) {
    return (
        <div className="bg-background min-h-svh flex">
            <div className="hidden md:flex lg:w-5/12  md:items-center md:justify-center">
                {imageSrc && <img src={imageSrc} alt="Login image" className="object-fill w-full h-screen" />}
            </div>
            <div className="flex w-full md:w-7/12 items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                                <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                    <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
                                </div>
                                <span className="sr-only">{title}</span>
                            </Link>

                            <div className="space-y-2 text-center">
                                <h1 className="text-xl font-medium">{title}</h1>
                                <p className="text-muted-foreground text-center text-sm">{description}</p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

