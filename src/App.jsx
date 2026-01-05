import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Budgets from './pages/Budgets';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Goals from './pages/Goals';
import Analysis from './pages/Analysis';
import Wallets from './pages/Wallets';
import Settings from './pages/Settings';
import { Layout } from './components/Layout';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

  return user ? <Outlet /> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/wallets" element={<Wallets />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
