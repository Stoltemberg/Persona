import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import Landing from './pages/Landing';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        <Route element={<ProtectedRoute />}>
          {/* ... existing routes ... */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/recurring" element={<Recurring />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/wallets" element={<Wallets />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch all redirect */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}


export default App;
