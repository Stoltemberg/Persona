import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import React, { Suspense } from 'react';
import { Layout } from './components/Layout';
import { HelmetProvider } from 'react-helmet-async';

// Lazy Load Pages
// Lazy Load Pages (Core App)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Transactions = React.lazy(() => import('./pages/Transactions'));
const Recurring = React.lazy(() => import('./pages/Recurring'));
const Planning = React.lazy(() => import('./pages/Planning'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Wallets = React.lazy(() => import('./pages/Wallets'));
const Categories = React.lazy(() => import('./pages/Categories'));
const Admin = React.lazy(() => import('./pages/Admin'));

// Lazy Load Pages (Secondary / Auth)
const Login = React.lazy(() => import('./pages/Login'));
const Landing = React.lazy(() => import('./pages/Landing'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Loading Fallback
const LoadingScreen = () => (
  <div className="flex-center" style={{ minHeight: '100vh', width: '100%', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
    <div className="spinner" />
    <div style={{ display: 'grid', gap: '0.75rem', width: 'min(460px, 100%)' }}>
      <div className="glass-card" style={{ padding: '1rem', opacity: 0.7 }}>
        <div style={{ width: '40%', height: '14px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', marginBottom: '0.75rem' }} />
        <div style={{ width: '100%', height: '12px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', marginBottom: '0.5rem' }} />
        <div style={{ width: '78%', height: '12px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div className="glass-card" style={{ padding: '1rem', opacity: 0.45 }}>
        <div style={{ width: '52%', height: '12px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', marginBottom: '0.5rem' }} />
        <div style={{ width: '88%', height: '12px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)' }} />
      </div>
    </div>
    <p style={{ opacity: 0.55 }}>Carregando sua experiencia...</p>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <LoadingScreen />;

  return user ? <Outlet /> : null;
};

// Root Route Logic
const Home = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" /> : <Landing />;
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <AnimatedRoutes />
        </Suspense>
      </Router>
    </HelmetProvider>
  );
}

const AnimatedRoutes = () => {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const routeKey = location.pathname;

  const pageTransition = {
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.992 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.992 },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={routeKey}>
        <Route path="/" element={<PageTransition variants={pageTransition}><Home /></PageTransition>} />
        <Route path="/login" element={<PageTransition variants={pageTransition}><Login /></PageTransition>} />
        <Route path="/terms" element={<PageTransition variants={pageTransition}><Terms /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition variants={pageTransition}><Privacy /></PageTransition>} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/recurring" element={<Recurring />} />

            <Route path="/planning" element={<Planning />} />
            <Route path="/analysis" element={<Navigate to="/planning?tab=analysis" replace />} />
            <Route path="/goals" element={<Navigate to="/planning?tab=goals" replace />} />
            <Route path="/budgets" element={<Navigate to="/planning?tab=budgets" replace />} />
            <Route path="/simulator" element={<Navigate to="/planning?tab=simulator" replace />} />

            <Route path="/settings" element={<Settings />} />
            <Route path="/wallets" element={<Wallets />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>

        <Route path="*" element={<PageTransition variants={pageTransition}><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const PageTransition = ({ children, variants }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={variants}
    transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.9 }}
    style={{ width: '100%', willChange: 'transform, opacity' }}
  >
    {children}
  </motion.div>
);


export default App;
