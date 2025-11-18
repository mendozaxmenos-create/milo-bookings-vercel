import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface BusinessHour {
  id?: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_open: boolean;
}

interface AvailabilitySlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
  service_id?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

export function Availability() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'hours' | 'blocks'>('hours');
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockFormData, setBlockFormData] = useState({
    date: '',
    start_time: '09:00',
    end_time: '18:00',
  });

  // Obtener horarios de trabajo
  const { data: hoursData, isLoading: hoursLoading } = useQuery<{ data: BusinessHour[] }>({
    queryKey: ['business-hours'],
    queryFn: async () => {
      const response = await api.get('/availability/hours');
      return response.data;
    },
  });

  // Obtener bloques de disponibilidad
  const { data: slotsData, isLoading: slotsLoading } = useQuery<{ data: AvailabilitySlot[] }>({
    queryKey: ['availability-slots'],
    queryFn: async () => {
      const response = await api.get('/availability/slots');
      return response.data;
    },
  });

  // Inicializar horarios si no existen
  const hours = hoursData?.data || [];
  const hoursMap = new Map(hours.map(h => [h.day_of_week, h]));

  // Mutación para actualizar horarios
  const updateHoursMutation = useMutation({
    mutationFn: async ({ dayOfWeek, data }: { dayOfWeek: number; data: Partial<BusinessHour> }) => {
      const response = await api.put(`/availability/hours/${dayOfWeek}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-hours'] });
    },
  });

  // Mutación para crear bloque
  const createBlockMutation = useMutation({
    mutationFn: async (data: { date: string; start_time: string; end_time: string }) => {
      const response = await api.post('/availability/slots', {
        ...data,
        is_blocked: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-slots'] });
      setShowBlockForm(false);
      setBlockFormData({ date: '', start_time: '09:00', end_time: '18:00' });
    },
  });

  // Mutación para eliminar bloque
  const deleteBlockMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/availability/slots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-slots'] });
    },
  });

  type BusinessHourField = 'is_open' | 'open_time' | 'close_time';

  const handleUpdateHour = (
    dayOfWeek: number,
    field: BusinessHourField,
    value: boolean | string
  ) => {
    const currentHour = hoursMap.get(dayOfWeek) || {
      day_of_week: dayOfWeek,
      open_time: '09:00:00',
      close_time: '18:00:00',
      is_open: true,
    };

    updateHoursMutation.mutate({
      dayOfWeek,
      data: {
        ...currentHour,
        [field]: value,
      },
    });
  };

  const handleSubmitBlock = (e: React.FormEvent) => {
    e.preventDefault();
    createBlockMutation.mutate({
      date: blockFormData.date,
      start_time: `${blockFormData.start_time}:00`,
      end_time: `${blockFormData.end_time}:00`,
    });
  };

  if (hoursLoading || slotsLoading) {
    return <div style={{ padding: '2rem' }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Gestión de Horarios y Disponibilidad</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #dee2e6' }}>
        <button
          onClick={() => setActiveTab('hours')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'hours' ? '2px solid #007bff' : '2px solid transparent',
            color: activeTab === 'hours' ? '#007bff' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'hours' ? 'bold' : 'normal',
          }}
        >
          📅 Horarios de Trabajo
        </button>
        <button
          onClick={() => setActiveTab('blocks')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'blocks' ? '2px solid #007bff' : '2px solid transparent',
            color: activeTab === 'blocks' ? '#007bff' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'blocks' ? 'bold' : 'normal',
          }}
        >
          🚫 Bloques de Disponibilidad
        </button>
      </div>

      {/* Tab: Horarios de Trabajo */}
      {activeTab === 'hours' && (
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Configurar Horarios por Día</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Configura los horarios de trabajo para cada día de la semana. El bot usará estos horarios para mostrar disponibilidad a los clientes.
          </p>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {DAYS_OF_WEEK.map((day) => {
              const hour = hoursMap.get(day.value);
              const isOpen = hour?.is_open ?? true;
              const openTime = hour?.open_time?.substring(0, 5) || '09:00';
              const closeTime = hour?.close_time?.substring(0, 5) || '18:00';

              return (
                <div
                  key={day.value}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '150px 1fr 1fr 1fr auto',
                    gap: '1rem',
                    alignItems: 'center',
                    padding: '1rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{day.label}</div>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={isOpen}
                      onChange={(e) => handleUpdateHour(day.value, 'is_open', e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Abierto</span>
                  </label>

                  {isOpen && (
                    <>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                          Apertura
                        </label>
                        <input
                          type="time"
                          value={openTime}
                          onChange={(e) => handleUpdateHour(day.value, 'open_time', `${e.target.value}:00`)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                          Cierre
                        </label>
                        <input
                          type="time"
                          value={closeTime}
                          onChange={(e) => handleUpdateHour(day.value, 'close_time', `${e.target.value}:00`)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </>
                  )}

                  {!isOpen && (
                    <div style={{ gridColumn: 'span 2', color: '#dc3545', fontStyle: 'italic' }}>
                      Cerrado
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
            <strong>💡 Tip:</strong> Los cambios se guardan automáticamente. El bot usará estos horarios para mostrar disponibilidad a los clientes.
          </div>
        </div>
      )}

      {/* Tab: Bloques de Disponibilidad */}
      {activeTab === 'blocks' && (
        <div>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Bloquear Horarios Específicos</h2>
              <button
                onClick={() => setShowBlockForm(!showBlockForm)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: showBlockForm ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {showBlockForm ? 'Cancelar' : '+ Bloquear Horario'}
              </button>
            </div>

            {showBlockForm && (
              <form onSubmit={handleSubmitBlock} style={{
                padding: '1.5rem',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Fecha *</label>
                    <input
                      type="date"
                      value={blockFormData.date}
                      onChange={(e) => setBlockFormData({ ...blockFormData, date: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Hora Inicio *</label>
                    <input
                      type="time"
                      value={blockFormData.start_time}
                      onChange={(e) => setBlockFormData({ ...blockFormData, start_time: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Hora Fin *</label>
                    <input
                      type="time"
                      value={blockFormData.end_time}
                      onChange={(e) => setBlockFormData({ ...blockFormData, end_time: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={createBlockMutation.isPending}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {createBlockMutation.isPending ? 'Guardando...' : 'Bloquear Horario'}
                </button>
              </form>
            )}

            <p style={{ color: '#666', fontSize: '0.875rem' }}>
              Bloquea horarios específicos (feriados, días cerrados, etc.). Estos horarios no estarán disponibles para reservas.
            </p>
          </div>

          {/* Lista de bloques */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Horarios Bloqueados</h3>
            
            {slotsData?.data && slotsData.data.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {slotsData.data
                  .filter(slot => slot.is_blocked)
                  .map((slot) => {
                    const dateObj = new Date(slot.date);
                    const formattedDate = dateObj.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });

                    return (
                      <div
                        key={slot.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{formattedDate}</div>
                          <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de eliminar este bloqueo?')) {
                              deleteBlockMutation.mutate(slot.id);
                            }
                          }}
                          style={{
                            padding: '0.5rem 1rem',
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
                    );
                  })}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                No hay horarios bloqueados. Usa el botón &quot;+ Bloquear Horario&quot; para agregar uno.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

