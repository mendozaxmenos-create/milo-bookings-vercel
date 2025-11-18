import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Services } from './pages/Services';
import { Bookings } from './pages/Bookings';
import { Availability } from './pages/Availability';
import { Settings } from './pages/Settings';
import { AdminBusinesses } from './pages/AdminBusinesses';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/Layout';

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const isSuperAdmin = user?.is_system_user && user?.role === 'super_admin';

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={isSuperAdmin ? "/admin/businesses" : "/dashboard"} replace /> : <Login />}
        />
        {isSuperAdmin ? (
          <Route
            path="/admin"
            element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}
          >
            <Route path="businesses" element={<AdminBusinesses />} />
            <Route index element={<Navigate to="/admin/businesses" replace />} />
          </Route>
        ) : (
          <Route
            path="/"
            element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="services" element={<Services />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="availability" element={<Availability />} />
            <Route path="settings" element={<Settings />} />
            <Route index element={<Navigate to="/dashboard" replace />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}

export default App;

