import { AppContent } from '../../components/app-content';
import { AppShell } from '../../components/app-shell';
import { AppSidebar } from '../../components/app-sidebar';
import { AppExtraSidebar} from '../../components/app-extra-sidebar';
import { AppHeader } from '@/components/app-header.jsx';

export default function AppSidebarLayout({ children, breadcrumbs = [] }) {
    return (<>
        <div className="flex flex-col">
            <AppHeader/>
            <AppShell variant="sidebar">
                <AppSidebar />
                <AppContent variant="sidebar" breadcrumbs={breadcrumbs}>
                    {children}
                </AppContent>
                <AppExtraSidebar />
            </AppShell>
        </div>
    </>);
}

