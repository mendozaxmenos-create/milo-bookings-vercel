import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { 
  getPaymentConfig, 
  updatePaymentConfig,
  getInsuranceProviders,
  createInsuranceProvider,
  updateInsuranceProvider,
  deleteInsuranceProvider,
  toggleInsuranceProvider,
  type InsuranceProvider,
  type CreateInsuranceProviderRequest,
} from '../services/api';

interface BusinessSettings {
  welcome_message: string;
  booking_confirmation_message: string;
  payment_instructions_message: string;
  reminder_message: string;
  insurance_enabled?: boolean;
  reminders_enabled?: boolean;
  reminder_hours_before?: number;
}

const DEFAULT_SETTINGS: BusinessSettings = {
  welcome_message: '',
  booking_confirmation_message: '',
  payment_instructions_message: '',
  reminder_message: '',
};

type StringSettingsKey = 'welcome_message' | 'booking_confirmation_message' | 'payment_instructions_message' | 'reminder_message';

const FORM_FIELDS: Array<{
  key: StringSettingsKey;
  label: string;
  helper: string;
}> = [
  {
    key: 'welcome_message',
    label: 'Mensaje de bienvenida',
    helper: 'Se envía cuando el cliente inicia una conversación con el bot.',
  },
  {
    key: 'booking_confirmation_message',
    label: 'Mensaje de confirmación',
    helper: 'Se envía luego de crear la reserva desde WhatsApp.',
  },
  {
    key: 'payment_instructions_message',
    label: 'Instrucciones de pago',
    helper: 'Puedes detallar métodos de pago o enlaces a MercadoPago.',
  },
  {
    key: 'reminder_message',
    label: 'Mensaje de recordatorio',
    helper: 'Recordatorio automático previo a la cita (cuando esté habilitado).',
  },
];

export function Settings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    publicKey: '',
    accessToken: '',
    refreshToken: '',
    userId: '',
  });
  const [paymentSource, setPaymentSource] = useState<'business' | 'env' | null>(null);

  const { data, isLoading, isFetching } = useQuery<{ data: BusinessSettings }>({
    queryKey: ['business-settings'],
    queryFn: async () => {
      const response = await api.get('/api/settings');
      return response.data;
    },
  });

  const { data: paymentConfig, isLoading: paymentLoading } = useQuery({
    queryKey: ['payment-config'],
    queryFn: getPaymentConfig,
  });

  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [insuranceProviders, setInsuranceProviders] = useState<InsuranceProvider[]>([]);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<InsuranceProvider | null>(null);
  const [insuranceForm, setInsuranceForm] = useState({ name: '', copay_amount: '' });
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderHoursBefore, setReminderHoursBefore] = useState(24);

  const { data: insuranceData, isLoading: insuranceLoading } = useQuery({
    queryKey: ['insurance-providers'],
    queryFn: getInsuranceProviders,
    enabled: insuranceEnabled,
  });

  useEffect(() => {
    if (data?.data) {
      setFormData({
        welcome_message: data.data.welcome_message || '',
        booking_confirmation_message: data.data.booking_confirmation_message || '',
        payment_instructions_message: data.data.payment_instructions_message || '',
        reminder_message: data.data.reminder_message || '',
        insurance_enabled: data.data.insurance_enabled || false,
        reminders_enabled: data.data.reminders_enabled || false,
        reminder_hours_before: data.data.reminder_hours_before || 24,
      });
      setInsuranceEnabled(data.data.insurance_enabled || false);
      setRemindersEnabled(data.data.reminders_enabled || false);
      setReminderHoursBefore(data.data.reminder_hours_before || 24);
    }
  }, [data]);

  useEffect(() => {
    if (insuranceData?.data) {
      setInsuranceProviders(insuranceData.data);
    }
  }, [insuranceData]);

  useEffect(() => {
    if (paymentConfig?.data) {
      setPaymentSource(paymentConfig.data.source);
      setPaymentForm((prev) => ({
        ...prev,
        publicKey: paymentConfig.data?.publicKey || '',
      }));
    } else {
      setPaymentSource(null);
    }
  }, [paymentConfig]);

  const updateMutation = useMutation({
    mutationFn: async (payload: BusinessSettings) => {
      const response = await api.put('/api/settings', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      setLastUpdated(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
    },
  });

  const insuranceMutation = useMutation({
    mutationFn: async (data: CreateInsuranceProviderRequest) => {
      if (editingProvider) {
        return updateInsuranceProvider(editingProvider.id, data);
      }
      return createInsuranceProvider(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-providers'] });
      setShowInsuranceForm(false);
      setEditingProvider(null);
      setInsuranceForm({ name: '', copay_amount: '' });
    },
  });

  const deleteInsuranceMutation = useMutation({
    mutationFn: deleteInsuranceProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-providers'] });
    },
  });

  const toggleInsuranceMutation = useMutation({
    mutationFn: toggleInsuranceProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-providers'] });
    },
  });

  const isSaving = updateMutation.isPending;
  const isBusy = isSaving || isFetching;
  const paymentMutation = useMutation({
    mutationFn: updatePaymentConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-config'] });
    },
  });

  const previewMessages = useMemo(() => {
    return [
      {
        title: '👋 Bienvenida',
        content: formData.welcome_message || 'Configura un mensaje para tus clientes.',
      },
      {
        title: '✅ Confirmación',
        content: formData.booking_confirmation_message || 'Confirma la reserva y da las gracias.',
      },
      {
        title: '💳 Pago',
        content: formData.payment_instructions_message || 'Explica cómo se completa el pago.',
      },
      {
        title: '⏰ Recordatorio',
        content: formData.reminder_message || 'Recordatorio previo a la cita.',
      },
    ];
  }, [formData]);

  const handleChange = (field: StringSettingsKey, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInsuranceToggle = (enabled: boolean) => {
    setInsuranceEnabled(enabled);
    updateMutation.mutate({ ...formData, insurance_enabled: enabled });
  };

  const handleInsuranceSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    insuranceMutation.mutate({
      name: insuranceForm.name,
      copay_amount: parseFloat(insuranceForm.copay_amount) || 0,
    });
  };

  const handleEditProvider = (provider: InsuranceProvider) => {
    setEditingProvider(provider);
    setInsuranceForm({ name: provider.name, copay_amount: provider.copay_amount.toString() });
    setShowInsuranceForm(true);
  };

  const handleCancelInsuranceForm = () => {
    setShowInsuranceForm(false);
    setEditingProvider(null);
    setInsuranceForm({ name: '', copay_amount: '' });
  };

  if ((isLoading && !data) || paymentLoading) {
    return <div style={{ padding: '2rem' }}>Cargando configuración...</div>;
  }

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h1>Mensajes y Configuración del Bot</h1>
        <p style={{ color: '#666', maxWidth: '720px' }}>
          Personaliza los textos que ve el cliente durante el flujo de WhatsApp. Puedes actualizarlos cuando quieras; el bot
          recargará la configuración en los próximos mensajes.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {FORM_FIELDS.map((field) => (
            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor={field.key} style={{ fontWeight: 600 }}>
                  {field.label}
                </label>
                <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>WhatsApp soporta emojis ✅</span>
              </div>
              <textarea
                id={field.key}
                value={formData[field.key] || ''}
                onChange={(event) => handleChange(field.key, event.target.value)}
                rows={4}
                placeholder="Escribe tu mensaje..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                required
              />
              <small style={{ color: '#6c757d' }}>{field.helper}</small>
            </div>
          ))}

          {/* Sección de Recordatorios */}
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginTop: '1rem'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>⏰ Recordatorios Automáticos</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="checkbox"
                  id="reminders_enabled"
                  checked={remindersEnabled}
                  onChange={(e) => setRemindersEnabled(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="reminders_enabled" style={{ cursor: 'pointer', fontWeight: 500 }}>
                  Habilitar recordatorios automáticos
                </label>
              </div>
              
              {remindersEnabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '2rem' }}>
                  <label htmlFor="reminder_hours_before" style={{ fontWeight: 500 }}>
                    Enviar recordatorio:
                  </label>
                  <input
                    type="number"
                    id="reminder_hours_before"
                    value={reminderHoursBefore}
                    onChange={(e) => setReminderHoursBefore(parseInt(e.target.value) || 24)}
                    min="1"
                    max="168"
                    style={{
                      width: '80px',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6',
                      fontSize: '1rem',
                    }}
                  />
                  <span style={{ color: '#666' }}>horas antes de la cita</span>
                </div>
              )}
              
              <small style={{ color: '#6c757d', marginLeft: '2rem' }}>
                Los recordatorios se enviarán automáticamente a los clientes con reservas confirmadas.
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
              {lastUpdated ? `Última actualización ${lastUpdated}` : 'Sin cambios recientes'}
            </div>
            <button
              type="submit"
              disabled={isBusy}
              style={{
                padding: '0.85rem 1.75rem',
                backgroundColor: isBusy ? '#6c757d' : '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isBusy ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                minWidth: '180px',
              }}
            >
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>

        <div
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <h2 style={{ margin: 0 }}>Vista previa</h2>
          <p style={{ color: '#6c757d', fontSize: '0.95rem' }}>
            Así verían los mensajes tus clientes. Úsalo para revisar tono y consistencia.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {previewMessages.map((message) => (
              <div
                key={message.title}
                style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '10px',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>{message.title}</div>
                <div style={{ whiteSpace: 'pre-line', color: '#495057' }}>{message.content}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 'auto',
              padding: '1rem',
              backgroundColor: '#e7f3ff',
              borderRadius: '10px',
              fontSize: '0.9rem',
              color: '#084298',
            }}
          >
            Tip: Usa variables como el nombre del negocio en tus mensajes para dar más contexto. En la próxima iteración
            agregaremos plantillas con variables dinámicas.
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Pagos con MercadoPago</h2>
          <p style={{ color: '#666', margin: 0 }}>
            Carga tus credenciales para habilitar el cobro automático. Si no configurás nada, usaremos las de Milo para pruebas.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '1.5rem', border: '1px dashed #ced4da' }}>
            <h3 style={{ marginTop: 0 }}>Estado actual</h3>
            {paymentSource ? (
              <>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Fuente:</strong> {paymentSource === 'env' ? 'Credenciales globales' : 'Credenciales del negocio'}
                </p>
                <p style={{ marginBottom: 0 }}>
                  <strong>Public Key:</strong><br />
                  <code style={{ wordBreak: 'break-all' }}>{paymentForm.publicKey || '—'}</code>
                </p>
              </>
            ) : (
              <p style={{ color: '#dc3545' }}>Pagos deshabilitados. Completa tus credenciales para activar el cobro automático.</p>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              paymentMutation.mutate({
                publicKey: paymentForm.publicKey,
                accessToken: paymentForm.accessToken,
                refreshToken: paymentForm.refreshToken || undefined,
                userId: paymentForm.userId || undefined,
                isActive: true,
              });
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Public Key *</label>
              <input
                type="text"
                value={paymentForm.publicKey}
                onChange={(event) => setPaymentForm({ ...paymentForm, publicKey: event.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ced4da' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Access Token *</label>
              <input
                type="password"
                value={paymentForm.accessToken}
                onChange={(event) => setPaymentForm({ ...paymentForm, accessToken: event.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ced4da' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Refresh Token</label>
                <input
                  type="text"
                  value={paymentForm.refreshToken}
                  onChange={(event) => setPaymentForm({ ...paymentForm, refreshToken: event.target.value })}
                  placeholder="Opcional"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>User ID</label>
                <input
                  type="text"
                  value={paymentForm.userId}
                  onChange={(event) => setPaymentForm({ ...paymentForm, userId: event.target.value })}
                  placeholder="Opcional"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
              <span>⚠️</span>
              <span>Usá credenciales de test en desarrollo. En producción cada negocio debe ingresar las suyas.</span>
            </div>

            <button
              type="submit"
              disabled={paymentMutation.isPending}
              style={{
                padding: '0.85rem 1.5rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: paymentMutation.isPending ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {paymentMutation.isPending ? 'Guardando...' : 'Guardar credenciales'}
            </button>
          </form>
        </div>
      </div>

      {/* Sección de Obras Sociales y Coseguro */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>🏥 Sistema de Coseguro (Plan Plus)</h2>
          <p style={{ color: '#666', margin: 0 }}>
            Habilita el sistema de coseguro para consultorios médicos. Cuando esté activo, el bot preguntará a los clientes por su obra social y aplicará el coseguro correspondiente.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={insuranceEnabled}
              onChange={(e) => handleInsuranceToggle(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <span>Habilitar sistema de coseguro</span>
          </label>
        </div>

        {insuranceEnabled && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Obras Sociales Configuradas</h3>
              <button
                type="button"
                onClick={() => {
                  setEditingProvider(null);
                  setInsuranceForm({ name: '', copay_amount: '' });
                  setShowInsuranceForm(true);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + Agregar Obra Social
              </button>
            </div>

            {showInsuranceForm && (
              <form
                onSubmit={handleInsuranceSubmit}
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <h4 style={{ margin: 0 }}>{editingProvider ? 'Editar' : 'Nueva'} Obra Social</h4>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Nombre de la Obra Social *
                  </label>
                  <input
                    type="text"
                    value={insuranceForm.name}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, name: e.target.value })}
                    placeholder="Ej: OSDE, Swiss Medical, etc."
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Coseguro (ARS) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={insuranceForm.copay_amount}
                    onChange={(e) => setInsuranceForm({ ...insuranceForm, copay_amount: e.target.value })}
                    placeholder="0.00"
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                  <small style={{ color: '#6c757d' }}>Monto que el paciente debe abonar además del servicio</small>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={insuranceMutation.isPending}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: insuranceMutation.isPending ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {insuranceMutation.isPending ? 'Guardando...' : editingProvider ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelInsuranceForm}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {insuranceLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando obras sociales...</div>
            ) : insuranceProviders.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                No hay obras sociales configuradas. Agrega una para comenzar.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Obra Social</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Coseguro</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Estado</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insuranceProviders.map((provider) => (
                      <tr key={provider.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '0.75rem' }}>{provider.name}</td>
                        <td style={{ padding: '0.75rem' }}>${Number(provider.copay_amount || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: provider.is_active ? '#d4edda' : '#f8d7da',
                            color: provider.is_active ? '#155724' : '#721c24',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}>
                            {provider.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleEditProvider(provider)}
                              style={{
                                padding: '0.4rem 0.8rem',
                                backgroundColor: '#ffc107',
                                color: '#000',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                              }}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleInsuranceMutation.mutate(provider.id)}
                              disabled={toggleInsuranceMutation.isPending}
                              style={{
                                padding: '0.4rem 0.8rem',
                                backgroundColor: provider.is_active ? '#dc3545' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: toggleInsuranceMutation.isPending ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                              }}
                            >
                              {provider.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`¿Estás seguro de eliminar ${provider.name}?`)) {
                                  deleteInsuranceMutation.mutate(provider.id);
                                }
                              }}
                              disabled={deleteInsuranceMutation.isPending}
                              style={{
                                padding: '0.4rem 0.8rem',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: deleteInsuranceMutation.isPending ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


