import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Goals from './pages/Goals';
import Analysis from './pages/Analysis';
import Wallets from './pages/Wallets';
import Settings from './pages/Settings';
import Budgets from './pages/Budgets';
import Recurring from './pages/Recurring';
import Subscriptions from './pages/Subscriptions';
import Simulator from './pages/Simulator';
import Landing from './pages/Landing';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import Admin from './pages/Admin';
import { Layout } from './components/Layout';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

  return user ? <Outlet /> : <Navigate to="/login" />;
};

// Root Route Logic
const Home = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  return user ? <Navigate to="/dashboard" /> : <Landing />;
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
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
            <Route path="/subscriptions" element={
              <PageTransition>
                <Subscriptions />
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
