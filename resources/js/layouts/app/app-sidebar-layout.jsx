import { AppHeader } from '@/components/app-header.jsx';
import { Toaster } from 'sonner';
import { AppContent } from '../../components/app-content';
import { AppExtraSidebar } from '../../components/app-extra-sidebar';
import { AppShell } from '../../components/app-shell';
import { AppSidebar } from '../../components/app-sidebar';
import { ErrorBoundary } from '../../components/error-boundary';
import { MobileNav } from '../../components/mobile-nav';
import { ScrollToTop } from '../../components/scroll-to-top';
import { UnreadCountsProvider } from '../../contexts/unread-counts-context';

export default function AppSidebarLayout({ children, breadcrumbs = [] }) {
    return (
        <UnreadCountsProvider>
            <div className="flex flex-col">
                <AppHeader breadcrumbs={breadcrumbs} />
                {/* Top gradient fade below fixed header (mobile only) */}
                <div className="from-background pointer-events-none fixed top-16 right-0 left-0 z-40 h-6 bg-gradient-to-b to-transparent lg:hidden" />
                <AppShell variant="sidebar">
                    <AppSidebar />
                    <AppContent variant="sidebar" breadcrumbs={breadcrumbs} className="container mx-auto pt-16 pb-16 lg:mx-[17.1rem] lg:pb-0">
                        <ErrorBoundary>{children}</ErrorBoundary>
                    </AppContent>
                    <AppExtraSidebar />
                </AppShell>
                {/* Bottom gradient fade above fixed mobile nav (mobile only) */}
                <div className="from-background pointer-events-none fixed right-0 bottom-16 left-0 z-40 h-6 bg-gradient-to-t to-transparent lg:hidden" />
                <MobileNav />
            </div>
            <ScrollToTop />
            <Toaster
                position="bottom-right"
                richColors
                toastOptions={{
                    className: 'font-medium',
                    style: { fontSize: '14px' },
                }}
                closeButton
                gap={8}
            />
        </UnreadCountsProvider>
    );
}
