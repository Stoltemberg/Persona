import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import React, { Suspense } from 'react';
import { Layout } from './components/Layout';

// Lazy Load Pages
// Eager Load Pages (Core App)
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Goals from './pages/Goals';
import Analysis from './pages/Analysis';
import Wallets from './pages/Wallets';
import Budgets from './pages/Budgets';
import Recurring from './pages/Recurring';
import Simulator from './pages/Simulator';

// Lazy Load Pages (Secondary / Auth)
const Login = React.lazy(() => import('./pages/Login'));
const Landing = React.lazy(() => import('./pages/Landing'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Admin = React.lazy(() => import('./pages/Admin'));

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

  if (loading) return <LoadingScreen />;

  return user ? <Outlet /> : <Navigate to="/login" />;
};

// Root Route Logic
const Home = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" /> : <Landing />;
}

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <AnimatedRoutes />
      </Suspense>
    </Router>
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
            <Route path="/categories" element={
              <PageTransition>
                <Categories />
              </PageTransition>
            } />
            <Route path="/analysis" element={
              <PageTransition>
                <Analysis />
              </PageTransition>
            } />
            <Route path="/recurring" element={
              <PageTransition>
                <Recurring />
              </PageTransition>
            } />

            <Route path="/budgets" element={
              <PageTransition>
                <Budgets />
              </PageTransition>
            } />
            <Route path="/goals" element={
              <PageTransition>
                <Goals />
              </PageTransition>
            } />
            <Route path="/wallets" element={
              <PageTransition>
                <Wallets />
              </PageTransition>
            } />
            <Route path="/simulator" element={
              <PageTransition>
                <Simulator />
              </PageTransition>
            } />
            <Route path="/settings" element={
              <PageTransition>
                <Settings />
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
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    style={{ width: '100%' }}
  >
    {children}
  </motion.div>
);


export default App;
