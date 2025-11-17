import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface Booking {
  id: string;
  service_name: string;
  customer_phone: string;
  customer_name?: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded';
  amount: number;
}

export function Bookings() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '',
    date: '',
  });

  const { data: bookings, isLoading } = useQuery<{ data: Booking[] }>({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.date) params.append('date', filters.date);
      const response = await api.get(`/bookings?${params.toString()}`);
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/bookings/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bookings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#d4edda', color: '#155724' };
      case 'pending':
        return { bg: '#fff3cd', color: '#856404' };
      case 'cancelled':
        return { bg: '#f8d7da', color: '#721c24' };
      case 'completed':
        return { bg: '#d1ecf1', color: '#0c5460' };
      default:
        return { bg: '#e2e3e5', color: '#383d41' };
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: '#d4edda', color: '#155724' };
      case 'pending':
        return { bg: '#fff3cd', color: '#856404' };
      case 'refunded':
        return { bg: '#f8d7da', color: '#721c24' };
      default:
        return { bg: '#e2e3e5', color: '#383d41' };
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Cargando reservas...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Gestión de Reservas</h1>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Filtros</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Cancelada</option>
              <option value="completed">Completada</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Fecha</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Cliente</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Servicio</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Fecha</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Hora</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Monto</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Estado</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Pago</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bookings?.data?.map((booking) => {
              const statusStyle = getStatusColor(booking.status);
              const paymentStyle = getPaymentStatusColor(booking.payment_status);
              
              return (
                <tr key={booking.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <strong>{booking.customer_name || 'Sin nombre'}</strong>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>
                        {booking.customer_phone}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>{booking.service_name}</td>
                  <td style={{ padding: '1rem' }}>
                    {new Date(booking.booking_date).toLocaleDateString('es-ES')}
                  </td>
                  <td style={{ padding: '1rem' }}>{booking.booking_time}</td>
                  <td style={{ padding: '1rem' }}>${booking.amount.toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      fontSize: '0.875rem',
                    }}>
                      {booking.status === 'pending' && 'Pendiente'}
                      {booking.status === 'confirmed' && 'Confirmada'}
                      {booking.status === 'cancelled' && 'Cancelada'}
                      {booking.status === 'completed' && 'Completada'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: paymentStyle.bg,
                      color: paymentStyle.color,
                      fontSize: '0.875rem',
                    }}>
                      {booking.payment_status === 'pending' && 'Pendiente'}
                      {booking.payment_status === 'paid' && 'Pagado'}
                      {booking.payment_status === 'refunded' && 'Reembolsado'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <select
                          value={booking.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: booking.id, status: e.target.value })}
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                          }}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmar</option>
                          <option value="cancelled">Cancelar</option>
                          <option value="completed">Completar</option>
                        </select>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm('¿Estás seguro de eliminar esta reserva?')) {
                            deleteMutation.mutate(booking.id);
                          }
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {bookings?.data?.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No hay reservas registradas.
          </div>
        )}
      </div>
    </div>
  );
}

