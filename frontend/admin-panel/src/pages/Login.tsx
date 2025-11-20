import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { login, forgotPassword, resetPassword } from '../services/api';

export function Login() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const initialBusinessId = searchParams.get('business') || '';
  const initialPhone = searchParams.get('phone') || '';
  const [businessId, setBusinessId] = useState(initialBusinessId);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para recuperación de contraseña
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const showResetPassword = !!resetToken; // Determinar si mostrar reset basado en token en URL
  const [resetTokenInput, setResetTokenInput] = useState(resetToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();

  useEffect(() => {
    const businessParam = searchParams.get('business') || '';
    const phoneParam = searchParams.get('phone') || '';
    setBusinessId(businessParam);
    setPhone(phoneParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginData = isSuperAdmin
        ? { email, password }
        : { business_id: businessId, phone, password };
      
      const response = await login(loginData);
      setAuth(response.token, response.user);
      
      // Redirigir según el tipo de usuario
      if (response.user.is_system_user) {
        navigate('/admin/businesses');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let message = 'Error al iniciar sesión';
      
      if (err?.response) {
        // Error de respuesta del servidor
        message = err.response.data?.error || err.response.data?.message || `Error ${err.response.status}: ${err.response.statusText}`;
      } else if (err?.request || err?.code === 'ECONNABORTED') {
        // Error de conexión o timeout
        if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
          message = 'El servidor está tardando en responder. Esto puede suceder si el servicio está "dormido" (plan gratuito de Render). Por favor, espera unos segundos e intenta de nuevo.';
        } else {
          message = 'No se pudo conectar con el servidor. Verifica que el backend esté funcionando.';
        }
        console.error('No response received:', err.request);
      } else {
        // Otro tipo de error
        message = err?.message || 'Error desconocido al iniciar sesión';
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setForgotPasswordLoading(true);

    try {
      const requestData = isSuperAdmin 
        ? { email } 
        : { business_id: businessId, phone };

      const response = await forgotPassword(requestData);
      
      // Si es super admin y viene token en la respuesta, redirigir al reset
      if (isSuperAdmin && response.token) {
        setResetTokenInput(response.token);
        setShowForgotPassword(false);
        // Mostrar formulario de reset automáticamente con el token
        navigate(`/login?token=${response.token}`);
        return; // Salir para que navegue al reset
      } else if (isSuperAdmin) {
        setSuccessMessage('Si el usuario existe, recibirás un código de recuperación por email.');
        setShowForgotPassword(false);
      } else {
        setSuccessMessage('Si el usuario existe, recibirás un código de recuperación por WhatsApp. Revisa tu teléfono.');
        setShowForgotPassword(false);
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err?.response?.data?.error || 'Error al solicitar recuperación de contraseña');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setResetPasswordLoading(true);

    try {
      await resetPassword({ token: resetTokenInput, password: newPassword });
      setSuccessMessage('Contraseña restablecida exitosamente. Redirigiendo al login...');
      setTimeout(() => {
              navigate('/login');
            }, 2000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err?.response?.data?.error || 'Error al restablecer contraseña. El token puede ser inválido o haber expirado.');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Función para cambiar entre super admin y business user
  const handleToggleUserType = () => {
    setIsSuperAdmin(!isSuperAdmin);
    setEmail('');
    setBusinessId('');
    setPhone('');
    setPassword('');
    setError('');
    setSuccessMessage('');
  };

  // Si hay token en la URL, mostrar formulario de reset
  if (showResetPassword) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            🔐 Recuperar Contraseña
          </h1>
          
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Código de recuperación
              </label>
              <input
                type="text"
                value={resetTokenInput}
                onChange={(e) => setResetTokenInput(e.target.value)}
                required
                placeholder="Ingresa el código recibido por WhatsApp"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Nueva contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            {error && (
              <div style={{
                color: 'red',
                marginBottom: '1rem',
                padding: '0.5rem',
                backgroundColor: '#fee',
                borderRadius: '4px'
              }}>
                {error}
              </div>
            )}

            {successMessage && (
              <div style={{
                color: '#28a745',
                marginBottom: '1rem',
                padding: '0.5rem',
                backgroundColor: '#d4edda',
                borderRadius: '4px'
              }}>
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={resetPasswordLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: resetPasswordLoading ? 'not-allowed' : 'pointer',
                opacity: resetPasswordLoading ? 0.6 : 1,
                marginBottom: '1rem'
              }}
            >
              {resetPasswordLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'transparent',
                color: '#6c757d',
                border: '1px solid #6c757d',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Volver al login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Si está en modo "olvidé mi contraseña"
  if (showForgotPassword) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            🔐 Recuperar Contraseña
          </h1>
          
          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleToggleUserType}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isSuperAdmin ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isSuperAdmin ? '👤 Super Admin' : '🏢 Negocio'}
            </button>
          </div>
          
          <p style={{ marginBottom: '1.5rem', color: '#666', textAlign: 'center' }}>
            {isSuperAdmin 
              ? 'Ingresa tu email. Recibirás un código de recuperación (en producción, esto debería enviarse por email).'
              : 'Ingresa tu Business ID y teléfono. Te enviaremos un código de recuperación por WhatsApp.'}
          </p>
          
          <form onSubmit={handleForgotPassword}>
            {isSuperAdmin ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@milobookings.com"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Business ID
                  </label>
                  <input
                    type="text"
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+5491123456789"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </>
            )}

            {error && (
              <div style={{
                color: 'red',
                marginBottom: '1rem',
                padding: '0.5rem',
                backgroundColor: '#fee',
                borderRadius: '4px'
              }}>
                {error}
              </div>
            )}

            {successMessage && (
              <div style={{
                color: '#28a745',
                marginBottom: '1rem',
                padding: '0.5rem',
                backgroundColor: '#d4edda',
                borderRadius: '4px'
              }}>
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={forgotPasswordLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer',
                opacity: forgotPasswordLoading ? 0.6 : 1,
                marginBottom: '1rem'
              }}
            >
              {forgotPasswordLoading ? 'Enviando...' : 'Enviar Código'}
            </button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'transparent',
                color: '#6c757d',
                border: '1px solid #6c757d',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Volver al login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          Milo Bookings
        </h1>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.25rem' }}>
          Iniciar Sesión
        </h2>
        
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setIsSuperAdmin(!isSuperAdmin)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isSuperAdmin ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isSuperAdmin ? '👤 Super Admin' : '🏢 Negocio'}
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {isSuperAdmin ? (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Business ID
                </label>
                <input
                  type="text"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Teléfono
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </>
          )}
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          {error && (
            <div style={{
              color: 'red',
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: '#fee',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginBottom: '0.5rem'
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: 'transparent',
              color: '#6c757d',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.875rem'
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      </div>
    </div>
  );
}

