import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', maxWidth: '1600px', margin: '0 auto' }}>
            {/* Sidebar Area */}
            <div style={{ width: '300px', flexShrink: 0, display: 'none', '@media(min-width: 768px)': { display: 'block' } }}>
                {/* Desktop Sidebar */}
                <div className="desktop-sidebar" style={{ position: 'fixed', width: '300px' }}>
                    <Sidebar />
                </div>
            </div>

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '1rem', overflowX: 'hidden' }}>
                <style>{`
          @media (min-width: 1024px) {
            main { padding: 2rem; }
            .desktop-sidebar { display: block; }
          }
          @media (max-width: 1023px) {
            .desktop-sidebar { display: none; }
            /* We will need a mobile menu later, for now we assume desktop focus for "professional" */
          }
        `}</style>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>

            {/* Mobile Nav could be added here later */}
        </div>
    );
}
