import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
const Budgets = React.lazy(() => import('./pages/Budgets'));

// Lazy Load Pages (Secondary / Auth)
const Login = React.lazy(() => import('./pages/Login'));
const Landing = React.lazy(() => import('./pages/Landing'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Loading Fallback
const LoadingScreen = () => (
  <div className="flex-center" style={{ height: '100vh', width: '100%', flexDirection: 'column', gap: '1rem' }}>
    <div className="spinner"></div>
    <p style={{ opacity: 0.5 }}>Carregando...</p>
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

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={
              <PageTransition>
                <Dashboard />
              </PageTransition>
            } />
            <Route path="/transactions" element={
              <PageTransition>
                <Transactions />
              </PageTransition>
            } />
            <Route path="/recurring" element={
              <PageTransition>
                <Recurring />
              </PageTransition>
            } />

            <Route path="/planning" element={
              <PageTransition>
                <Planning />
              </PageTransition>
            } />


            <Route path="/settings" element={
              <PageTransition>
                <Settings />
              </PageTransition>
            } />
            <Route path="/wallets" element={
              <PageTransition>
                <Wallets />
              </PageTransition>
            } />
            <Route path="/categories" element={
              <PageTransition>
                <Categories />
              </PageTransition>
            } />
            <Route path="/admin" element={
              <PageTransition>
                <Admin />
              </PageTransition>
            } />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }}
    style={{ width: '100%', willChange: 'transform, opacity' }}
  >
    {children}
  </motion.div>
);


export default App;
