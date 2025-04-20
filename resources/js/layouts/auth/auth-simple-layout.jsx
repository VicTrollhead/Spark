import AppLogoIcon from '../../components/app-logo-icon';
import { Link } from '@inertiajs/react';
import { Globe } from "lucide-react";
import AppearanceToggle from "../../components/appearance-toggle";
import Icon from "../../components/ui/logo-icon.jsx";


export default function AuthSimpleLayout({ children, title, description, imageSrc, titleSrc }) {
    return (
        <div className="bg-background flex min-h-svh">
            <div
                className="relative hidden md:w-5/12 md:flex md:items-start md:justify-center lg:w-1/2 bg-cover bg-center "
                style={{ backgroundImage: `url(${imageSrc})` }}
            >
                <img src={titleSrc} alt="Title" className="mt-20 w-3/4 object-fill" />
            </div>

            <div className="flex w-full flex-col p-6 md:w-7/12 md:p-10">
                <div className="mb-6 flex w-full items-center justify-between">
                    <Icon />

                    <div className="flex items-center gap-2">
                        <AppearanceToggle className="justify-center p-2.5" />
                        <button className="bg-neutral dark:bg-neutral', 'hover:bg-neutral-300 ml-1 flex items-center gap-2 rounded-full p-2.5 transition dark:hover:bg-neutral-700">
                            <Globe className="h-4 w-4" />
                            EN
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center">
                    <span className="mb-4 text-6xl font-extrabold sm:text-6xl md:text-5xl lg:text-6xl">
                        In The Comfort
                        <br />
                        Zone
                    </span>

                    <div className="w-full max-w-sm">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col items-start gap-4">
                                <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
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
                </div>

                <footer className="mt-8 flex flex-wrap gap-4 justify-center text-center text-sm text-gray-500"><a href="#" className="hover:underline">Про нас </a>
                    <a href="#" className="hover:underline">Умови надання послуг </a>
                    <a href="#" className="hover:underline">Політика конфіденційності </a>
                    <a href="#" className="hover:underline">Політика щодо файлів cookie </a>
                    <a href="#" className="hover:underline">Контактні та реєстраційні дані </a>
                    <a href="#" className="hover:underline">Спеціальні можливості </a>
                    <a href="#" className="hover:underline">Інформація про рекламу </a>
                    <a href="#" className="hover:underline">Блог </a>
                    <a href="#" className="hover:underline">Реклама </a>
                    <a href="#" className="hover:underline">Налаштування </a>
                    © 2025 SparkCorp.</footer>
            </div>
        </div>
    );
}












