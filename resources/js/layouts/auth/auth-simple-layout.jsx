import AppLogoIcon from '../../components/app-logo-icon';
import { Link } from '@inertiajs/react';
import AppearanceToggle from "../../components/appearance-toggle";

export default function AuthSimpleLayout({ children, title, description, imageSrc }) {
    return (
        <div className="bg-background min-h-svh flex">
            <div className="hidden md:flex lg:w-5/12  md:items-center md:justify-center">
                {imageSrc && <img src={imageSrc} alt="Login image" className="object-fill w-full h-screen" />}
            </div>
            <div className="flex flex-col w-full md:w-7/12 items-center justify-center p-6 md:p-10">
                <span className="lg:text-6xl md:text-5xl sm:text-6xl text-6xl font-extrabold mb-4">In The Comfort<br/> Zone</span>
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col items-start gap-4">
                            <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                                {/*<div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">*/}
                                {/*    /!*<AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />*!/*/}
                                {/*</div>*/}
                                <span className="sr-only">{title}</span>
                            </Link>

                            <div className="space-y-2 text-start">
                                <h1 className="text-xl font-medium">{title}</h1>
                                <p className="text-muted-foreground text-center text-sm">{description}</p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
                <footer className=" mx-auto break-keep 2025 SparkCorp. w-1/2 bg-transparent pt-4 text-center text-sm text-gray-500">
                    © 2025 SparkCorp.
                </footer>

            </div>
        </div>
    );
}

