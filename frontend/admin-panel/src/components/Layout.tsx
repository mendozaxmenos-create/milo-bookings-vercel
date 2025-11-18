import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isSuperAdmin = user?.is_system_user && user?.role === 'super_admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        backgroundColor: '#343a40',
        color: 'white',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Milo Bookings</h2>
        
        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {isSuperAdmin ? (
              <li style={{ marginBottom: '0.5rem' }}>
                <Link
                  to="/admin/businesses"
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: isActive('/admin/businesses') ? '#fff' : '#adb5bd',
                    backgroundColor: isActive('/admin/businesses') ? '#495057' : 'transparent',
                  }}
                >
                  🏢 Negocios
                </Link>
              </li>
            ) : (
              <>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link
                    to="/dashboard"
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: isActive('/dashboard') ? '#fff' : '#adb5bd',
                      backgroundColor: isActive('/dashboard') ? '#495057' : 'transparent',
                    }}
                  >
                    📊 Dashboard
                  </Link>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link
                    to="/services"
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: isActive('/services') ? '#fff' : '#adb5bd',
                      backgroundColor: isActive('/services') ? '#495057' : 'transparent',
                    }}
                  >
                    🛎️ Servicios
                  </Link>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link
                    to="/bookings"
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: isActive('/bookings') ? '#fff' : '#adb5bd',
                      backgroundColor: isActive('/bookings') ? '#495057' : 'transparent',
                    }}
                  >
                    📅 Reservas
                  </Link>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link
                    to="/availability"
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: isActive('/availability') ? '#fff' : '#adb5bd',
                      backgroundColor: isActive('/availability') ? '#495057' : 'transparent',
                    }}
                  >
                    ⏰ Horarios
                  </Link>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link
                    to="/settings"
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: isActive('/settings') ? '#fff' : '#adb5bd',
                      backgroundColor: isActive('/settings') ? '#495057' : 'transparent',
                    }}
                  >
                    ⚙️ Configuración
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #495057' }}>
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#adb5bd' }}>
            <div>{user?.email || user?.phone}</div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {isSuperAdmin && '👑 Super Administrador'}
              {!isSuperAdmin && user?.role === 'owner' && '👑 Propietario'}
              {!isSuperAdmin && user?.role === 'admin' && '⚙️ Administrador'}
              {!isSuperAdmin && user?.role === 'staff' && '👤 Staff'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <Outlet />
      </main>
    </div>
  );
}

