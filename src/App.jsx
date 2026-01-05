import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Goals from './pages/Goals';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import { Layout } from './components/Layout';

// ... (ProtectedRoute etc)

// In Routes:
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/settings" element={<Settings />} />
          </Route >
        </Route >
      </Routes >
    </Router >
  );
}

export default App;
