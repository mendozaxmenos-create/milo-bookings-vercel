import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export function Dashboard() {
  const { user } = useAuthStore();

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await api.get('/services');
      return response.data;
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await api.get('/bookings');
      return response.data;
    },
  });

  const stats = {
    totalServices: services?.data?.length || 0,
    activeServices: services?.data?.filter((s: any) => s.is_active).length || 0,
    totalBookings: bookings?.data?.length || 0,
    pendingBookings: bookings?.data?.filter((b: any) => b.status === 'pending').length || 0,
    confirmedBookings: bookings?.data?.filter((b: any) => b.status === 'confirmed').length || 0,
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>
      
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
            {stats.totalServices}
          </div>
          <div style={{ color: '#666', marginTop: '0.5rem' }}>Total Servicios</div>
          <div style={{ fontSize: '0.875rem', color: '#28a745', marginTop: '0.5rem' }}>
            {stats.activeServices} activos
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
            {stats.totalBookings}
          </div>
          <div style={{ color: '#666', marginTop: '0.5rem' }}>Total Reservas</div>
          <div style={{ fontSize: '0.875rem', color: '#ffc107', marginTop: '0.5rem' }}>
            {stats.pendingBookings} pendientes
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8' }}>
            {stats.confirmedBookings}
          </div>
          <div style={{ color: '#666', marginTop: '0.5rem' }}>Reservas Confirmadas</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Acciones Rápidas</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            to="/services"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            + Nuevo Servicio
          </Link>
          <Link
            to="/bookings"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            Ver Reservas
          </Link>
        </div>
      </div>

      {/* Recent Bookings */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Reservas Recientes</h2>
          <Link
            to="/bookings"
            style={{
              color: '#007bff',
              textDecoration: 'none',
            }}
          >
            Ver todas →
          </Link>
        </div>
        {bookings?.data?.slice(0, 5).map((booking: any) => (
          <div
            key={booking.id}
            style={{
              padding: '1rem',
              borderBottom: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>{booking.service_name}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {booking.customer_name || booking.customer_phone} - {new Date(booking.booking_date).toLocaleDateString('es-ES')} {booking.booking_time}
              </div>
            </div>
            <div>
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: booking.status === 'confirmed' ? '#d4edda' : '#fff3cd',
                color: booking.status === 'confirmed' ? '#155724' : '#856404',
                fontSize: '0.875rem',
              }}>
                {booking.status === 'pending' && 'Pendiente'}
                {booking.status === 'confirmed' && 'Confirmada'}
                {booking.status === 'cancelled' && 'Cancelada'}
                {booking.status === 'completed' && 'Completada'}
              </span>
            </div>
          </div>
        ))}
        {bookings?.data?.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No hay reservas recientes.
          </div>
        )}
      </div>
    </div>
  );
}

