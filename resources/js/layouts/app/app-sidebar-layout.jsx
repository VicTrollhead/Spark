import { AppContent } from '../../components/app-content';
import { AppShell } from '../../components/app-shell';
import { AppSidebar } from '../../components/app-sidebar';
import { AppExtraSidebar} from '../../components/app-extra-sidebar';
import { AppHeader } from '@/components/app-header.jsx';

export default function AppSidebarLayout({ children, breadcrumbs = [] }) {
    return (
        <>
            <div className="flex flex-col">
                <AppHeader breadcrumbs={breadcrumbs} />
                <AppShell variant="sidebar">

                    <AppSidebar />
                    <AppContent variant="sidebar" breadcrumbs={breadcrumbs} className="container pt-16 sm:mx-auto md:mx-auto lg:mx-70">
                        {/*<AppSidebarHeader breadcrumbs={breadcrumbs}/>*/}
                        {children}
                        <div>HAAAAAAAAAAAAA</div>
                    </AppContent>

                    <AppExtraSidebar />
                </AppShell>
            </div>
        </>
    );
}

