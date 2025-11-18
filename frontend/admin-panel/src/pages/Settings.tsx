import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getPaymentConfig, updatePaymentConfig } from '../services/api';

interface BusinessSettings {
  welcome_message: string;
  booking_confirmation_message: string;
  payment_instructions_message: string;
  reminder_message: string;
}

const DEFAULT_SETTINGS: BusinessSettings = {
  welcome_message: '',
  booking_confirmation_message: '',
  payment_instructions_message: '',
  reminder_message: '',
};

const FORM_FIELDS: Array<{
  key: keyof BusinessSettings;
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
      const response = await api.get('/settings');
      return response.data;
    },
  });

  const { data: paymentConfig, isLoading: paymentLoading } = useQuery({
    queryKey: ['payment-config'],
    queryFn: getPaymentConfig,
  });

  useEffect(() => {
    if (data?.data) {
      setFormData({
        welcome_message: data.data.welcome_message || '',
        booking_confirmation_message: data.data.booking_confirmation_message || '',
        payment_instructions_message: data.data.payment_instructions_message || '',
        reminder_message: data.data.reminder_message || '',
      });
    }
  }, [data]);

  useEffect(() => {
    if (paymentConfig?.data) {
      setPaymentSource(paymentConfig.data.source);
      setPaymentForm((prev) => ({
        ...prev,
        publicKey: paymentConfig.data.publicKey,
      }));
    } else {
      setPaymentSource(null);
    }
  }, [paymentConfig]);

  const updateMutation = useMutation({
    mutationFn: async (payload: BusinessSettings) => {
      const response = await api.put('/settings', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      setLastUpdated(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
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

  const handleChange = (field: keyof BusinessSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateMutation.mutate(formData);
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
                value={formData[field.key]}
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
    </div>
  );
}


