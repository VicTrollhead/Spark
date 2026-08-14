import Icon from '../components/ui/logo-icon.jsx';

export default function AppLogo() {
    return (
        <div className="flex items-center justify-start gap-x-2 py-2">
            <Icon />
            <div className="grid flex-1 text-left text-xl font-bold">
                <span className="leading-none">Spark</span>
            </div>
        </div>
    );
}
