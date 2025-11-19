import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { 
  getServiceResources, 
  createServiceResource, 
  updateServiceResource, 
  deleteServiceResource, 
  toggleServiceResourceActive,
  type ServiceResource 
} from '../services/api';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  display_order: number;
  is_active: boolean;
  requires_payment?: boolean;
  has_multiple_resources?: boolean;
  resource_count?: number | null;
}

export function Services() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    display_order: 0,
    requires_payment: true,
    has_multiple_resources: false,
  });
  const [selectedServiceForResources, setSelectedServiceForResources] = useState<Service | null>(null);
  const [resourceFormData, setResourceFormData] = useState({
    name: '',
    display_order: 0,
  });
  const [editingResource, setEditingResource] = useState<string | null>(null);

  const { data: services, isLoading } = useQuery<{ data: Service[] }>({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await api.get('/api/services');
      return response.data;
    },
    retry: 2,
    retryDelay: 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Service>) => {
      const response = await api.post('/api/services', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      const response = await api.put(`/api/services/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowForm(false);
      setEditingService(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/api/services/${id}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  // Queries y mutations para recursos
  const { data: serviceResources } = useQuery<{ data: ServiceResource[] }>({
    queryKey: ['service-resources', selectedServiceForResources?.id],
    queryFn: async () => {
      if (!selectedServiceForResources?.id) return { data: [] };
      return getServiceResources(selectedServiceForResources.id);
    },
    enabled: !!selectedServiceForResources?.id,
  });

  const createResourceMutation = useMutation({
    mutationFn: async (data: { service_id: string; name: string; display_order?: number }) => {
      return createServiceResource(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-resources'] });
      setResourceFormData({ name: '', display_order: 0 });
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; display_order?: number } }) => {
      return updateServiceResource(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-resources'] });
      setEditingResource(null);
      setResourceFormData({ name: '', display_order: 0 });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteServiceResource(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-resources'] });
    },
  });

  const toggleResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      return toggleServiceResourceActive(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-resources'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration_minutes: 30,
      price: 0,
      display_order: 0,
      requires_payment: true,
      has_multiple_resources: false,
    });
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price,
      display_order: service.display_order,
      requires_payment: service.requires_payment !== undefined ? service.requires_payment : true,
      has_multiple_resources: service.has_multiple_resources || false,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Cargando servicios...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Gestión de Servicios</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              resetForm();
              setEditingService(null);
            }
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancelar' : '+ Nuevo Servicio'}
        </button>
      </div>

      {showForm && (
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
        }}>
          <h2>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Duración (min) *</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  required
                  min="1"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                  min="0"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Orden</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  min="0"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.requires_payment}
                  onChange={(e) => setFormData({ ...formData, requires_payment: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Requiere pago para confirmar la reserva</span>
              </label>
              <small style={{ color: '#666', marginLeft: '1.75rem', display: 'block', marginTop: '0.25rem' }}>
                Si está desactivado, la reserva se confirmará automáticamente sin solicitar pago
              </small>
            </div>

            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.has_multiple_resources || false}
                  onChange={(e) => setFormData({ ...formData, has_multiple_resources: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <strong>🏢 Multigestión (Recursos Múltiples)</strong>
              </label>
              <small style={{ color: '#666', marginLeft: '1.75rem', display: 'block', marginTop: '0.25rem' }}>
                Activa esta opción si tu servicio tiene múltiples unidades (ej: canchas de padel, salas, etc.). 
                El sistema asignará automáticamente una unidad disponible cuando un cliente reserve. 
                Después de activar, podrás gestionar las unidades desde el botón "🏢 Recursos" en la tabla.
              </small>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {editingService ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                  setEditingService(null);
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
            </div>
          </form>
        </div>
      )}

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Nombre</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Duración</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Precio</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Estado</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services?.data?.map((service) => (
              <tr key={service.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '1rem' }}>
                  <strong>{service.name}</strong>
                  {service.description && (
                    <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                      {service.description}
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>{service.duration_minutes} min</td>
                <td style={{ padding: '1rem' }}>
                  ${Number(service.price).toFixed(2)}
                  {service.requires_payment === false && (
                    <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' }}>
                      Sin pago
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: service.is_active ? '#d4edda' : '#f8d7da',
                      color: service.is_active ? '#155724' : '#721c24',
                      fontSize: '0.875rem',
                    }}>
                      {service.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                    {service.requires_payment === false && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: '#e7f3ff',
                        color: '#084298',
                        fontSize: '0.75rem',
                      }}>
                        Sin pago
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleEdit(service)}
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
                    <button
                      onClick={() => toggleMutation.mutate(service.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: service.is_active ? '#dc3545' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      {service.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de eliminar este servicio?')) {
                          deleteMutation.mutate(service.id);
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
            ))}
          </tbody>
        </table>
        {services?.data?.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No hay servicios registrados. Crea tu primer servicio.
          </div>
        )}
      </div>

      {/* Modal para gestionar recursos */}
      {selectedServiceForResources && (
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>🏢 Recursos: {selectedServiceForResources.name}</h2>
              <button
                onClick={() => {
                  setSelectedServiceForResources(null);
                  setResourceFormData({ name: '', display_order: 0 });
                  setEditingResource(null);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
                {editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingResource) {
                  updateResourceMutation.mutate({
                    id: editingResource,
                    data: resourceFormData,
                  });
                } else {
                  createResourceMutation.mutate({
                    service_id: selectedServiceForResources.id,
                    name: resourceFormData.name,
                    display_order: resourceFormData.display_order,
                  });
                }
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre *</label>
                    <input
                      type="text"
                      value={resourceFormData.name}
                      onChange={(e) => setResourceFormData({ ...resourceFormData, name: e.target.value })}
                      required
                      placeholder="Ej: Cancha 1, Sala A"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Orden</label>
                    <input
                      type="number"
                      value={resourceFormData.display_order}
                      onChange={(e) => setResourceFormData({ ...resourceFormData, display_order: parseInt(e.target.value) || 0 })}
                      min="0"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={createResourceMutation.isPending || updateResourceMutation.isPending}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {editingResource ? 'Actualizar' : 'Crear'}
                  </button>
                  {editingResource && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingResource(null);
                        setResourceFormData({ name: '', display_order: 0 });
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem' }}>Recursos Disponibles</h3>
              {serviceResources?.data && serviceResources.data.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nombre</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Estado</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceResources.data.map((resource) => (
                      <tr key={resource.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '0.75rem' }}>{resource.name}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: resource.is_active ? '#d4edda' : '#f8d7da',
                            color: resource.is_active ? '#155724' : '#721c24',
                            fontSize: '0.875rem',
                          }}>
                            {resource.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setEditingResource(resource.id);
                                setResourceFormData({
                                  name: resource.name,
                                  display_order: resource.display_order,
                                });
                              }}
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
                            <button
                              onClick={() => toggleResourceMutation.mutate(resource.id)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: resource.is_active ? '#dc3545' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                              }}
                            >
                              {resource.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('¿Estás seguro de eliminar este recurso?')) {
                                  deleteResourceMutation.mutate(resource.id);
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
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                  No hay recursos configurados. Agrega recursos para que el sistema pueda asignarlos automáticamente.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

