import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';

type ServiceSummary = {
  id: string;
  is_active: boolean;
};

type BookingStatus = 'pending' | 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';

type BookingSummary = {
  id: string;
  service_name: string;
  customer_name?: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
};

export function Dashboard() {
  const { data: services, isLoading: servicesLoading, error: servicesError } = useQuery<{ data: ServiceSummary[] }>({
    queryKey: ['services'],
    queryFn: async () => {
      console.log('[Dashboard] Fetching services...');
      try {
        const response = await api.get('/services');
        console.log('[Dashboard] Services response:', {
          data: response.data,
          count: response.data?.data?.length || 0,
        });
        return response.data;
      } catch (error) {
        console.error('[Dashboard] Error fetching services:', error);
        throw error;
      }
    },
  });

  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useQuery<{ data: BookingSummary[] }>({
    queryKey: ['bookings'],
    queryFn: async () => {
      console.log('[Dashboard] Fetching bookings...');
      try {
        const response = await api.get('/bookings');
        console.log('[Dashboard] Bookings response:', {
          data: response.data,
          count: response.data?.data?.length || 0,
          statuses: response.data?.data?.map((b: BookingSummary) => b.status) || [],
        });
        return response.data;
      } catch (error) {
        console.error('[Dashboard] Error fetching bookings:', error);
        throw error;
      }
    },
  });

  const stats = {
    totalServices: services?.data?.length || 0,
    activeServices: services?.data?.filter((service) => service.is_active).length || 0,
    totalBookings: bookings?.data?.length || 0,
    pendingBookings: bookings?.data?.filter((booking) => 
      booking.status === 'pending' || booking.status === 'pending_payment'
    ).length || 0,
    confirmedBookings: bookings?.data?.filter((booking) => booking.status === 'confirmed').length || 0,
  };

  // Log de estadísticas calculadas
  console.log('[Dashboard] Calculated stats:', stats);
  console.log('[Dashboard] Raw data:', {
    servicesCount: services?.data?.length,
    bookingsCount: bookings?.data?.length,
    bookingsStatuses: bookings?.data?.map(b => b.status) || [],
  });

  if (servicesLoading || bookingsLoading) {
    return <div style={{ padding: '2rem' }}>Cargando estadísticas...</div>;
  }

  if (servicesError || bookingsError) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          Error al cargar datos: {servicesError?.message || bookingsError?.message}
        </div>
      </div>
    );
  }

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
        {bookings?.data?.slice(0, 5).map((booking) => (
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
                {booking.status === 'pending_payment' && 'Pago Pendiente'}
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

