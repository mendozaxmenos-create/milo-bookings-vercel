import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBusinesses,
  getBusinessQR,
  createBusiness,
  deleteBusiness,
  activateBusiness,
  reconnectBusinessBot,
  getSubscriptionPrice,
  updateSubscriptionPrice,
  type Business,
  type CreateBusinessRequest,
} from '../services/api';
import QRCode from 'qrcode.react';

export function AdminBusinesses() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-businesses'],
    queryFn: getBusinesses,
    refetchInterval: false, // No hacer polling automático
    refetchOnWindowFocus: false, // No refrescar al cambiar de ventana
    staleTime: 5 * 60 * 1000, // Considerar datos válidos por 5 minutos
    retry: 1, // Solo reintentar 1 vez si falla
  });
  
  // Log para debugging - ver qué datos se reciben
  useEffect(() => {
    if (data) {
      console.log('[AdminBusinesses] Datos recibidos:', {
        total: data?.data?.length || 0,
        businesses: data?.data?.map((b: Business) => ({ id: b.id, name: b.name, is_active: b.is_active })) || [],
      });
    }
    if (error) {
      console.error('[AdminBusinesses] Error cargando negocios:', error);
    }
  }, [data, error]);

  const createMutation = useMutation({
    mutationFn: createBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
      setShowCreateModal(false);
    },
    onError: (error: any) => {
      console.error('Error creating business:', error);
      // El error se captura y se muestra en el modal
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: activateBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
    },
  });

  const reconnectMutation = useMutation({
    mutationFn: reconnectBusinessBot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
      // Esperar más tiempo para que el bot se inicialice y genere el QR
      setTimeout(() => {
        if (selectedBusiness) {
          loadQRCode(selectedBusiness.id);
        }
      }, 5000); // 5 segundos para dar tiempo a que el bot genere el QR
    },
  });

  const { data: priceData } = useQuery({
    queryKey: ['subscription-price'],
    queryFn: getSubscriptionPrice,
  });

  const updatePriceMutation = useMutation({
    mutationFn: updateSubscriptionPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-price'] });
      setShowPriceModal(false);
    },
  });

  const loadQRCode = async (businessId: string) => {
    try {
      const response = await getBusinessQR(businessId);
      if (response.data.qr) {
        setQrCode(response.data.qr);
      } else if (response.data.status === 'authenticated') {
        // Bot ya está autenticado
        setQrCode('AUTHENTICATED');
      } else if (response.data.status === 'not_available') {
        // No hay QR disponible (pero no es un error)
        setQrCode(null);
      } else {
        setQrCode(null);
      }
    } catch (error: any) {
      console.error('Error loading QR:', error);
      setQrCode(null);
      
      // Solo loggear errores de red reales, no 404s (ahora el backend devuelve 200)
      if (error?.code === 'ERR_NETWORK' || error?.response?.status >= 500) {
        console.warn('Error de red al cargar QR. El servidor puede estar caído.');
      } else if (error?.response?.status === 404) {
        // Esto no debería pasar ahora, pero por si acaso
        console.warn('QR no disponible. El bot puede necesitar ser reconectado.');
      }
    }
  };

  const handleShowQR = async (business: Business) => {
    setSelectedBusiness(business);
    setShowQRModal(true);
    await loadQRCode(business.id);
    
    // Si no hay QR, intentar cargarlo varias veces (polling)
    // El bot puede estar inicializándose y generar el QR en unos segundos
    if (!qrCode) {
      let attempts = 0;
      const maxAttempts = 10; // Intentar 10 veces
      const interval = setInterval(async () => {
        attempts++;
        await loadQRCode(business.id);
        
        // Si encontramos QR o alcanzamos el máximo de intentos, parar
        if (qrCode || attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 2000); // Intentar cada 2 segundos
      
      // Limpiar intervalo si el modal se cierra
      return () => clearInterval(interval);
    }
  };

  const handleReconnectBot = async (businessId: string) => {
    if (confirm('¿Estás seguro de que quieres reconectar el bot? Esto generará un nuevo QR code.')) {
      reconnectMutation.mutate(businessId);
    }
  };

  const handleCreate = (data: CreateBusinessRequest) => {
    createMutation.mutate(data);
  };

  const handleToggleActive = (business: Business) => {
    if (business.is_active) {
      if (confirm(`¿Desactivar el negocio "${business.name}"?`)) {
        deleteMutation.mutate(business.id);
      }
    } else {
      activateMutation.mutate(business.id);
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      authenticated: { label: 'Conectado', color: '#28a745' },
      waiting_qr: { label: 'Esperando QR', color: '#ffc107' },
      initializing: { label: 'Inicializando', color: '#17a2b8' },
      not_initialized: { label: 'No inicializado', color: '#6c757d' },
      error: { label: 'Error', color: '#dc3545' },
    };

    const statusInfo = statusMap[status || 'not_initialized'] || statusMap.not_initialized;
    return (
      <span
        style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          backgroundColor: statusInfo.color,
          color: 'white',
          fontSize: '0.875rem',
        }}
      >
        {statusInfo.label}
      </span>
    );
  };

  if (isLoading) {
    return <div>Cargando negocios...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Gestión de Negocios</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowPriceModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            💰 Configurar Precio Suscripción
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            + Nuevo Negocio
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {data?.data.map((business) => (
          <div
            key={business.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1.5rem',
              backgroundColor: business.is_active ? 'white' : '#f8f9fa',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {business.name}
                  {business.is_trial && (
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: '#ffc107',
                      color: '#000',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}>
                      🎁 PRUEBA
                    </span>
                  )}
                  {!business.is_active && (
                    <span style={{ marginLeft: '0.5rem', color: '#6c757d', fontSize: '0.875rem' }}>
                      (Inactivo)
                    </span>
                  )}
                </h2>
                {business.is_trial && business.trial_end_date && (
                  <div style={{
                    marginBottom: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#fff3cd',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}>
                    <strong>Prueba hasta:</strong> {new Date(business.trial_end_date).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {new Date(business.trial_end_date) < new Date() && (
                      <span style={{ marginLeft: '0.5rem', color: '#dc3545', fontWeight: 'bold' }}>
                        (Expirado)
                      </span>
                    )}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                  <div>
                    <strong>ID:</strong> {business.id}
                  </div>
                  <div>
                    <strong>Teléfono:</strong> {business.phone}
                  </div>
                  <div>
                    <strong>WhatsApp:</strong> {business.whatsapp_number}
                  </div>
                  <div>
                    <strong>Estado Bot:</strong> {getStatusBadge(business.bot_status)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                <button
                  onClick={() => {
                    // Abrir panel del negocio en nueva pestaña
                    // Necesita login como business user, por ahora solo muestra info
                    const businessInfo = `Business ID: ${business.id}\nTeléfono: ${business.owner_phone || business.phone}\nContraseña temporal: changeme123`;
                    alert(`Para acceder al panel de este negocio:\n\n${businessInfo}\n\nNota: Debes hacer login con estas credenciales en una nueva pestaña.`);
                    // TODO: Implementar login automático o generar link con token temporal
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Abrir Panel
                </button>
                <button
                  onClick={() => handleShowQR(business)}
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
                  Ver QR
                </button>
                <button
                  onClick={() => handleReconnectBot(business.id)}
                  disabled={reconnectMutation.isPending}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ffc107',
                    color: 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: reconnectMutation.isPending ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    opacity: reconnectMutation.isPending ? 0.6 : 1,
                  }}
                >
                  {reconnectMutation.isPending ? 'Reconectando...' : 'Reconectar Bot'}
                </button>
                <button
                  onClick={() => handleToggleActive(business)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: business.is_active ? '#dc3545' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  {business.is_active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <CreateBusinessModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      )}

      {showQRModal && selectedBusiness && (
        <QRModal
          business={selectedBusiness}
          qrCode={qrCode}
          onClose={() => {
            setShowQRModal(false);
            setSelectedBusiness(null);
            setQrCode(null);
          }}
          onRefresh={() => loadQRCode(selectedBusiness.id)}
        />
      )}

      {showPriceModal && (
        <SubscriptionPriceModal
          currentPrice={priceData?.data.price || '5000.00'}
          onClose={() => setShowPriceModal(false)}
          onSave={(price) => updatePriceMutation.mutate(price)}
          isLoading={updatePriceMutation.isPending}
        />
      )}
    </div>
  );
}

function CreateBusinessModal({
  onClose,
  onSubmit,
  isLoading,
  error: mutationError,
}: {
  onClose: () => void;
  onSubmit: (data: CreateBusinessRequest) => void;
  isLoading: boolean;
  error?: any;
}) {
  const [formData, setFormData] = useState<CreateBusinessRequest>({
    name: '',
    phone: '',
    email: '',
    whatsapp_number: '',
    owner_phone: '',
    is_active: true,
    is_trial: false,
  });
  const [error, setError] = useState<string>('');

  // Actualizar error cuando cambia mutationError
  useEffect(() => {
    if (mutationError) {
      const errorMessage = mutationError?.response?.data?.error 
        || mutationError?.message 
        || 'Error al crear el negocio. Por favor, intenta de nuevo.';
      setError(errorMessage);
    } else {
      setError('');
    }
  }, [mutationError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpiar error anterior
    onSubmit(formData);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '500px',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Nuevo Negocio</h2>
        {error && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '4px',
            border: '1px solid #fcc',
          }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Teléfono</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email (opcional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Número WhatsApp</label>
            <input
              type="text"
              value={formData.whatsapp_number}
              onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Teléfono del Dueño</label>
            <input
              type="text"
              value={formData.owner_phone}
              onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_trial}
                onChange={(e) => setFormData({ ...formData, is_trial: e.target.checked })}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  🎁 Período de Prueba (7 días)
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                  El negocio tendrá acceso completo durante 7 días sin costo
                </div>
              </div>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} style={{ padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {isLoading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QRModal({
  business,
  qrCode,
  onClose,
  onRefresh,
}: {
  business: Business;
  qrCode: string | null;
  onClose: () => void;
  onRefresh: () => Promise<boolean>; // Ahora retorna boolean para indicar si debe continuar
}) {
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);
  const maxAttemptsRef = useRef(10); // Máximo de intentos
  const isMountedRef = useRef(true);
  
  // Efecto para iniciar polling cuando se abre el modal
  useEffect(() => {
    isMountedRef.current = true;
    
    // Cargar QR inicial inmediatamente
    const loadInitialQR = async () => {
      try {
        const found = await onRefresh();
        if (found && isMountedRef.current) {
          // QR encontrado o bot autenticado, no hacer polling
          return;
        }
      } catch (error) {
        console.error('[QR] Error cargando QR inicial:', error);
      }
      
      // Si no hay QR y el componente sigue montado, iniciar polling
      if (isMountedRef.current && !qrCode && !pollingRef.current) {
        setIsPolling(true);
        attemptsRef.current = 0;
        maxAttemptsRef.current = 10;
        
        pollingRef.current = setInterval(async () => {
          if (!isMountedRef.current) {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            return;
          }
          
          attemptsRef.current++;
          console.log(`[QR] Polling intento ${attemptsRef.current}/${maxAttemptsRef.current} para ${business.name}`);
          
          try {
            const found = await onRefresh();
            
            // Si encontramos QR o bot está autenticado, detener polling
            if (found) {
              console.log('[QR] QR encontrado o bot autenticado, deteniendo polling');
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
              setIsPolling(false);
              return;
            }
          } catch (error: any) {
            // Si hay error de red (servidor caído), detener polling
            if (error?.code === 'ERR_NETWORK' || error?.response?.status >= 500) {
              console.warn('[QR] Error de red detectado, deteniendo polling');
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
              setIsPolling(false);
              return;
            }
            // Para otros errores, continuar
            console.warn('[QR] Error en polling (continuando):', error?.message);
          }
          
          // Si alcanzamos el máximo de intentos, parar
          if (attemptsRef.current >= maxAttemptsRef.current) {
            console.log('[QR] Máximo de intentos alcanzado, deteniendo polling');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setIsPolling(false);
          }
        }, 3000); // Intentar cada 3 segundos
      }
    };
    
    loadInitialQR();
    
    // Limpiar cuando el componente se desmonte
    return () => {
      isMountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setIsPolling(false);
      attemptsRef.current = 0;
    };
  }, [business.id]); // Solo ejecutar cuando cambia el business.id
  
  // Detener polling si encontramos QR
  useEffect(() => {
    if (qrCode && isPolling && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      setIsPolling(false);
      attemptsRef.current = 0;
    }
  }, [qrCode, isPolling]);
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        <h2 style={{ marginTop: 0 }}>QR Code - {business.name}</h2>
        {qrCode === 'AUTHENTICATED' ? (
          <div>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#d4edda', 
              borderRadius: '4px', 
              marginBottom: '1rem',
              color: '#155724',
            }}>
              ✅ El bot ya está conectado a WhatsApp y autenticado.
            </div>
            <p style={{ color: '#6c757d', fontSize: '0.875rem' }}>
              No se necesita escanear QR. El bot está funcionando correctamente.
            </p>
          </div>
        ) : qrCode ? (
          <>
            <div style={{ margin: '1rem 0' }}>
              <QRCode value={qrCode} size={256} />
            </div>
            <p style={{ color: '#6c757d', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Escanea este código con WhatsApp para conectar el bot
            </p>
            <p style={{ color: '#856404', fontSize: '0.75rem', backgroundColor: '#fff3cd', padding: '0.5rem', borderRadius: '4px' }}>
              ⚠️ El QR expira en 5 minutos. Si expira, haz clic en "Reconectar Bot" para generar uno nuevo.
            </p>
          </>
        ) : (
          <div>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fff3cd', 
              borderRadius: '4px', 
              marginBottom: '1rem',
              color: '#856404',
            }}>
              ⚠️ No hay QR disponible en este momento.
            </div>
            <p style={{ color: '#6c757d', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Esto puede suceder si:
            </p>
            <ul style={{ textAlign: 'left', color: '#6c757d', fontSize: '0.875rem', marginBottom: '1rem' }}>
              <li>El bot ya está conectado a WhatsApp</li>
              <li>El QR expiró (válido por 5 minutos)</li>
              <li>El bot aún no se ha inicializado</li>
            </ul>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={onRefresh}
                disabled={isPolling}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: isPolling ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isPolling ? 'not-allowed' : 'pointer',
                }}
              >
                🔄 {isPolling ? 'Buscando...' : 'Refrescar'}
              </button>
              <p style={{ color: '#6c757d', fontSize: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                {isPolling 
                  ? 'El sistema está buscando el QR automáticamente. Si el bot está inicializándose, aparecerá en unos segundos.'
                  : 'O haz clic en "Reconectar Bot" en la lista para generar un nuevo QR.'}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            marginTop: '1rem',
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
    </div>
  );
}

function SubscriptionPriceModal({
  currentPrice,
  onClose,
  onSave,
  isLoading,
}: {
  currentPrice: string;
  onClose: () => void;
  onSave: (price: string) => void;
  isLoading: boolean;
}) {
  const [price, setPrice] = useState(currentPrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (price && !isNaN(parseFloat(price)) && parseFloat(price) >= 0) {
      onSave(price);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '500px',
        }}
      >
        <h2 style={{ marginTop: 0 }}>💰 Configurar Precio de Suscripción</h2>
        <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
          Este precio se utilizará en los mensajes de notificación cuando expire el período de prueba de los negocios.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Precio Mensual (ARS)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1.1rem',
              }}
            />
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6c757d' }}>
              Precio actual: ${parseFloat(currentPrice).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: 'white',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !price || isNaN(parseFloat(price)) || parseFloat(price) < 0}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

