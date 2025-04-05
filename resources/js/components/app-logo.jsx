import AppLogoIcon from './app-logo-icon';
import AppearanceToggle from '@/components/appearance-toggle.jsx';

export default function AppLogo() {
    return (<div className="flex items-center gap-x-2 justify-start py-2">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-9 items-center justify-center rounded-md">
                <AppLogoIcon className="size-6 fill-current text-white dark:text-black"/>
            </div>
            <div className="grid flex-1 text-left text-xl font-extrabold">
                <span className="leading-none ">Spark</span>
            </div>
            <div>
                <AppearanceToggle className="justify-center p-2.5"/>
            </div>
        </div>);
}

