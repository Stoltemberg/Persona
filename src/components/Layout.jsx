```javascript
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

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
      
      {/* Mobile Top Bar */}
      <div className="mobile-header fade-in" style={{ 
          padding: '1.5rem 1rem',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.5rem',
          textAlign: 'center'
      }}>
         <h1 className="text-gradient" style={{ fontSize: '1.8rem' }}>Persona</h1>
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
           <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="mobile-nav-container">
        <MobileNav />
      </div>

    </div>
  );
}
```
