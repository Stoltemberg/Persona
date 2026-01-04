import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
    const location = useLocation();

    return (
        <div className="app-layout">
            {/* Sidebar Area - Desktop */}
            <div className="sidebar-container">
                <div style={{ position: 'fixed', width: '280px', height: '100vh', padding: '0 0 0 1rem' }}>
                    <Sidebar />
                </div>
            </div>

            {/* Mobile Top Bar (Visible only when sidebar is hidden via CSS) */}
            <div style={{
                display: 'none', // Overridden by media query if needed
                padding: '1rem',
                borderBottom: '1px solid var(--glass-border)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
            }} className="mobile-header">
                <h1 className="text-gradient" style={{ fontSize: '1.5rem' }}>Persona</h1>
            </div>

            <style>{`
        @media (max-width: 1023px) {
           .mobile-header { display: flex !important; }
        }
      `}</style>

            {/* Main Content Area */}
            <main className="main-content">
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
