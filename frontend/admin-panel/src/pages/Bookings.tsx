import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface Booking {
  id: string;
  service_id: string;
  service_name: string;
  customer_phone: string;
  customer_name?: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded';
  amount: number;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

interface BookingsResponse {
  data: Booking[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function Bookings() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    search: '',
    page: 1,
  });
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editFormData, setEditFormData] = useState({
    service_id: '',
    booking_date: '',
    booking_time: '',
  });
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const { data: bookingsResponse, isLoading } = useQuery<BookingsResponse>({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.date) params.append('date', filters.date);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page.toString());
      params.append('limit', '20'); // 20 por página
      const response = await api.get(`/bookings?${params.toString()}`);
      return response.data;
    },
  });

  // Compatibilidad con formato anterior (sin paginación)
  const bookings = bookingsResponse?.data || [];
  const pagination = bookingsResponse?.pagination;

  const { data: services } = useQuery<{ data: Service[] }>({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await api.get('/api/services');
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

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Booking> }) => {
      const response = await api.put(`/bookings/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setEditingBooking(null);
      setEditFormData({ service_id: '', booking_date: '', booking_time: '' });
      setAvailableTimes([]);
    },
  });

  const fetchAvailableTimes = async (date: string, serviceId: string) => {
    if (!date || !serviceId) {
      setAvailableTimes([]);
      return;
    }

    setLoadingTimes(true);
    try {
      const service = services?.data?.find((s) => s.id === serviceId);
      const serviceDuration = service?.duration_minutes || 30;
      
      const response = await api.get(
        `/api/availability/available-times?date=${date}&service_duration=${serviceDuration}`
      );
      setAvailableTimes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching available times:', error);
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setEditFormData({
      service_id: booking.service_id,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time.substring(0, 5),
    });
    fetchAvailableTimes(booking.booking_date, booking.service_id);
  };

  const handleDateChange = (date: string) => {
    setEditFormData({ ...editFormData, booking_date: date, booking_time: '' });
    if (date && editFormData.service_id) {
      fetchAvailableTimes(date, editFormData.service_id);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setEditFormData({ ...editFormData, service_id: serviceId, booking_time: '' });
    if (editFormData.booking_date && serviceId) {
      fetchAvailableTimes(editFormData.booking_date, serviceId);
    }
  };

  const handleSaveEdit = () => {
    if (!editingBooking) return;
    
    if (!editFormData.service_id || !editFormData.booking_date || !editFormData.booking_time) {
      alert('Por favor completa todos los campos');
      return;
    }

    updateBookingMutation.mutate({
      id: editingBooking.id,
      data: {
        service_id: editFormData.service_id,
        booking_date: editFormData.booking_date,
        booking_time: editFormData.booking_time + ':00',
      },
    });
  };

  const exportToCSV = () => {
    const bookingsToExport = bookings || [];
    if (bookingsToExport.length === 0) {
      alert('No hay reservas para exportar');
      return;
    }

    const headers = ['Cliente', 'Teléfono', 'Servicio', 'Fecha', 'Hora', 'Monto', 'Estado', 'Pago'];
    const rows = bookingsToExport.map((booking) => [
      booking.customer_name || 'Sin nombre',
      booking.customer_phone,
      booking.service_name,
      new Date(booking.booking_date).toLocaleDateString('es-ES'),
      booking.booking_time.substring(0, 5),
      `$${Number(booking.amount || 0).toFixed(2)}`,
      booking.status,
      booking.payment_status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reservas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#d4edda', color: '#155724' };
      case 'pending':
      case 'pending_payment':
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
        <button
          onClick={exportToCSV}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          📥 Exportar a CSV
        </button>
      </div>

      {/* Edit Modal */}
      {editingBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Editar Reserva</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Servicio *</label>
              <select
                value={editFormData.service_id}
                onChange={(e) => handleServiceChange(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              >
                <option value="">Seleccionar servicio</option>
                {services?.data?.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.duration_minutes} min)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Fecha *</label>
              <input
                type="date"
                value={editFormData.booking_date}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Hora *</label>
              {loadingTimes ? (
                <div style={{ padding: '0.5rem', color: '#666' }}>Cargando horarios disponibles...</div>
              ) : availableTimes.length > 0 ? (
                <select
                  value={editFormData.booking_time}
                  onChange={(e) => setEditFormData({ ...editFormData, booking_time: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                >
                  <option value="">Seleccionar hora</option>
                  {availableTimes.map((time) => (
                    <option key={time} value={time.substring(0, 5)}>
                      {time.substring(0, 5)}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ padding: '0.5rem', color: '#dc3545' }}>
                  No hay horarios disponibles para esta fecha y servicio
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditingBooking(null);
                  setEditFormData({ service_id: '', booking_date: '', booking_time: '' });
                  setAvailableTimes([]);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateBookingMutation.isPending || !editFormData.service_id || !editFormData.booking_date || !editFormData.booking_time}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: updateBookingMutation.isPending || !editFormData.service_id || !editFormData.booking_date || !editFormData.booking_time ? 0.6 : 1,
                }}
              >
                {updateBookingMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Filtros y Búsqueda</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="pending_payment">Pago Pendiente</option>
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
              onChange={(e) => setFilters({ ...filters, date: e.target.value, page: 1 })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Buscar (nombre o teléfono)</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              placeholder="Buscar por nombre o teléfono..."
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
              <th style={{ padding: '1rem', textAlign: 'left' }}>Recurso</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Fecha</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Hora</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Monto</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Estado</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Pago</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bookings && bookings.length > 0 ? (
              bookings.map((booking) => {
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
                  <td style={{ padding: '1rem' }}>${Number(booking.amount || 0).toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      fontSize: '0.875rem',
                    }}>
                      {booking.status === 'pending' && 'Pendiente'}
                      {booking.status === 'pending_payment' && 'Pago Pendiente'}
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
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleEdit(booking)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#ffc107',
                          color: 'black',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        Editar
                      </button>
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <select
                          value={booking.status}
                          onChange={(e) => {
                            if (window.confirm(`¿Cambiar el estado a "${e.target.value}"?`)) {
                              updateStatusMutation.mutate({ id: booking.id, status: e.target.value });
                            }
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                          }}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="pending_payment">Pago Pendiente</option>
                          <option value="confirmed">Confirmar</option>
                          <option value="cancelled">Cancelar</option>
                          <option value="completed">Completar</option>
                        </select>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm('⚠️ ¿Estás seguro de eliminar esta reserva?\n\nEsta acción no se puede deshacer.')) {
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
            }))
            : (
              <tr>
                <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                  No hay reservas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
          }}>
            <div style={{ color: '#6c757d', fontSize: '0.875rem' }}>
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} reservas
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                disabled={!pagination.hasPrevPage}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: pagination.hasPrevPage ? '#007bff' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed',
                  opacity: pagination.hasPrevPage ? 1 : 0.6,
                }}
              >
                ← Anterior
              </button>
              <span style={{ padding: '0 1rem', color: '#6c757d' }}>
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                disabled={!pagination.hasNextPage}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: pagination.hasNextPage ? '#007bff' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                  opacity: pagination.hasNextPage ? 1 : 0.6,
                }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
        
        {(!pagination && bookings?.length === 0) && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No hay reservas registradas.
          </div>
        )}
      </div>
    </div>
  );
}

