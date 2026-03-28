import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import React, { Suspense } from 'react';
import { Layout } from './components/Layout';

// Lazy Load Pages
// Eager Load Pages (Core App)
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Recurring from './pages/Recurring';
import Planning from './pages/Planning';
import Settings from './pages/Settings';
import Wallets from './pages/Wallets';
import Categories from './pages/Categories';
import Admin from './pages/Admin';
import Budgets from './pages/Budgets';

// Lazy Load Pages (Secondary / Auth)
const Login = React.lazy(() => import('./pages/Login'));
const Landing = React.lazy(() => import('./pages/Landing'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Loading Fallback
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen w-full bg-background flex-col gap-6">
    <motion.div 
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: [0.3, 1, 0.3] 
      }}
      transition={{ 
        duration: 2, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className="w-16 h-16 rounded-3xl bg-brand/10 border border-brand/20 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.1)]"
    >
      <div className="w-8 h-8 border-3 border-brand border-t-transparent animate-spin rounded-full" />
    </motion.div>
    <p className="text-sm font-medium text-text-muted tracking-[0.2em] uppercase opacity-50">Carregando Persona</p>
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
    initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
    transition={{ 
      duration: 0.5, 
      ease: [0.16, 1, 0.3, 1],
      opacity: { duration: 0.4 }
    }}
    className="w-full will-change-[transform,opacity,filter]"
  >
    {children}
  </motion.div>
);


export default App;
