import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Wallet from './pages/Wallet';
import Transfer from './pages/Transfer';
import Transactions from './pages/Transactions';
import Holds from './pages/Holds';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public auth routes — redirect to dashboard if already logged in */}
        <Route
          path="/login"
          element={
            !loading && isAuthenticated
              ? <Navigate to="/" replace />
              : <Login />
          }
        />
        <Route
          path="/register"
          element={
            !loading && isAuthenticated
              ? <Navigate to="/" replace />
              : <Register />
          }
        />

        {/* Protected application routes — wrapped in Layout + ProtectedRoute */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/transfer" element={<Transfer />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/holds" element={<Holds />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute adminOnly={true}>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  {/* Catch-all redirects to dashboard */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
