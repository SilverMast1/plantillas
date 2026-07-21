import React, { useState, lazy, Suspense } from 'react';
import { useStore } from './store';

const POSView = lazy(() => import('./views/POSView'));
const SocioView = lazy(() => import('./views/SocioView'));
const AdminView = lazy(() => import('./views/AdminView'));
const CargosSociosView = lazy(() => import('./views/CargosSociosView'));
const StockView = lazy(() => import('./views/StockView'));
const InsumosView = lazy(() => import('./views/InsumosView'));
const DividirCadiView = lazy(() => import('./views/DividirCadiView'));
const VentasTurnoView = lazy(() => import('./views/VentasTurnoView'));
import { Shield, Users, LogOut, Menu, UserCheck, Lock, Fingerprint, CheckCircle2, RefreshCw, Sun, Moon } from 'lucide-react';
import Logo from './components/Logo';
import featuresConfig from './config/features.json';
import brandingConfig from './config/branding.json';

function App() {
  const { token, userType, user, socio, logout, setSession, tema, toggleTema, currentView, setCurrentView } = useStore();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeTab, setActiveTab] = useState<'login-vendedor' | 'entrada-empleado'>('login-vendedor');
  const isAdmin = userType === 'INTERNAL' && user?.roles?.includes('ADMIN');

  // Estados de formularios
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [codigoSocio, setCodigoSocio] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para simulación de asistencia de empleados
  const [codigoEmpleado, setCodigoEmpleado] = useState('');
  const [asistenciaStatus, setAsistenciaStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [asistenciaMsg, setAsistenciaMsg] = useState('');

  React.useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      // Seguridad: Si un usuario interno ingresa a /socios, le cerramos sesión para evitar que vea el panel de ventas
      if (path === '/socios' && token && userType === 'INTERNAL') {
        logout();
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    
    // Ejecutar chequeo inicial
    if (window.location.pathname === '/socios' && token && userType === 'INTERNAL') {
      logout();
    }

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [token, userType, logout]);

  const handleRegistroAsistencia = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAsistenciaStatus('scanning');
    setAsistenciaMsg('');
    setTimeout(() => {
      setAsistenciaStatus('success');
      const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setAsistenciaMsg(`¡Asistencia Registrada! Entrada/Salida confirmada para ${codigoEmpleado || 'Huella Biométrica'} a las ${timeStr}.`);
      setCodigoEmpleado('');
      setTimeout(() => {
        setAsistenciaStatus('idle');
        setAsistenciaMsg('');
      }, 5000);
    }, 1500);
  };

  React.useEffect(() => {
    if (!token) {
      setCurrentView('pos');
    }
  }, [token]);

  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const handleNombreChange = async (val: string) => {
    setNombre(val);
    if (val.length >= 2) {
      try {
        const response = await fetch(`/api/auth/socios/buscar?q=${encodeURIComponent(val)}`);
        if (response.ok) {
          const data = await response.json();
          setSugerencias(data);
          setMostrarSugerencias(true);
        }
      } catch (err) {
        console.error('Error fetching socio suggestions:', err);
      }
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  };

  const handleLoginVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login-interno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fallo de autenticación');
      }

      setSession(data.token, data.usuario, 'INTERNAL');
      setSuccess('Sesión iniciada correctamente');
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };  const handleLoginSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fallo de autenticación');
      }

      setSession(data.token, data.cliente, 'CLIENT');
      setSuccess('Sesión iniciada correctamente');
      setNombre('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Si no está autenticado, mostrar portal de accesos (Login/Registro/Asistencia)
  if (!token) {
    const isSocioPath = currentPath === '/socios';

    if (isSocioPath) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
          {/* Decoración de fondo premium estilo golf */}
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-campestre-gold/10 blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-campestre-green/5 blur-[100px] animate-pulse-slow"></div>

          <div className="w-full max-w-md glass-card rounded-3xl shadow-glass p-8 relative z-10">
            <div className="text-center mb-6">
              <Logo size="lg" className="mx-auto" />
              <h2 className="text-xl font-bold text-white mt-4 Outfit">Portal de Socios</h2>
              <p className="text-slate-400 text-xs mt-1">Consulte su consumo y estado de cuenta</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl mb-4 text-center font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl mb-4 text-center font-medium">
                {success}
              </div>
            )}

            <form onSubmit={handleLoginSocio} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre Completo del Socio</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Users size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez García"
                    value={nombre}
                    onChange={(e) => handleNombreChange(e.target.value)}
                    onFocus={() => {
                      if (nombre.length >= 2) {
                        setMostrarSugerencias(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                    className="w-full pl-10 input-premium"
                  />
                  {mostrarSugerencias && sugerencias.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-800">
                      {sugerencias.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setNombre(s.nombre);
                            setSugerencias([]);
                            setMostrarSugerencias(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs hover:bg-slate-800 text-slate-350 hover:text-white transition-colors flex justify-between items-center"
                        >
                          <span className="font-semibold">{s.nombre}</span>
                          <span className="text-[10px] text-campestre-gold font-mono">#{s.codigo_socio}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-campestre-gold hover:bg-campestre-gold/90 text-slate-950 font-bold rounded-xl btn-premium mt-6 shadow-lg shadow-campestre-gold/20"
              >
                {loading ? 'Ingresando...' : 'Ingresar a mi Portal'}
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
        {/* Decoración de fondo premium estilo golf */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-campestre-green/10 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-campestre-gold/5 blur-[100px] animate-pulse-slow"></div>

        <div className="w-full max-w-md glass-card rounded-3xl shadow-glass p-8 relative z-10">
          <div className="text-center mb-6">
            <Logo size="lg" className="mx-auto" />
            <p className="text-slate-400 text-xs mt-2">POS & Control de Accesos</p>
          </div>

          {/* Pestanas de acceso */}
          <div className="flex border-b border-slate-800 mb-6 bg-slate-900/50 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('login-vendedor'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg btn-premium ${
                activeTab === 'login-vendedor'
                  ? 'bg-campestre-green text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vendedores
            </button>
            <button
              onClick={() => { setActiveTab('entrada-empleado'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg btn-premium ${
                activeTab === 'entrada-empleado'
                  ? 'bg-campestre-gold text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrada de Empleados
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl mb-4 text-center font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl mb-4 text-center font-medium">
              {success}
            </div>
          )}

          {asistenciaMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs px-4 py-3 rounded-xl mb-4 text-center font-semibold flex items-center justify-center space-x-2">
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
              <span>{asistenciaMsg}</span>
            </div>
          )}

          {/* Formulario 1: Login Vendedores / Admin */}
          {activeTab === 'login-vendedor' && (
            <form onSubmit={handleLoginVendedor} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Usuario del Sistema</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Shield size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 input-premium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Contraseña</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 input-premium"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-campestre-green hover:bg-campestre-green/90 text-white font-bold rounded-xl btn-premium mt-6 shadow-lg shadow-campestre-green/20"
              >
                {loading ? 'Ingresando...' : 'Iniciar Sesión POS'}
              </button>
            </form>
          )}

          {/* Formulario 2: Entrada de Empleados (Con simulación de huella digital) */}
          {activeTab === 'entrada-empleado' && (
            <form onSubmit={handleRegistroAsistencia} className="space-y-6">
              <div className="flex flex-col items-center justify-center py-4 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleRegistroAsistencia()}
                  disabled={asistenciaStatus === 'scanning'}
                  className={`relative p-6 rounded-full border-2 transition-all duration-300 ${
                    asistenciaStatus === 'scanning'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20 animate-pulse scale-105'
                      : asistenciaStatus === 'success'
                      ? 'border-emerald-500 bg-emerald-500/20'
                      : 'border-slate-700 hover:border-campestre-gold bg-slate-850 hover:bg-slate-800/60 shadow-lg cursor-pointer'
                  }`}
                >
                  {asistenciaStatus === 'scanning' ? (
                    <RefreshCw className="text-emerald-400 animate-spin" size={40} />
                  ) : (
                    <Fingerprint
                      className={`${
                        asistenciaStatus === 'success' ? 'text-emerald-400' : 'text-slate-400 hover:text-campestre-gold'
                      }`}
                      size={40}
                    />
                  )}
                  {asistenciaStatus === 'scanning' && (
                    <span className="absolute inset-0 rounded-full border-4 border-emerald-500/40 animate-ping"></span>
                  )}
                </button>
                <span className="text-[11px] text-slate-400 font-semibold mt-4 text-center px-4">
                  {asistenciaStatus === 'scanning'
                    ? 'Leyendo huella digital...'
                    : asistenciaStatus === 'success'
                    ? '¡Lectura de huella exitosa!'
                    : 'Coloque su dedo en el lector biométrico o haga clic para escanear'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Código o Nombre de Empleado (Alternativo)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <UserCheck size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Ej. EMP-001 o Nombre"
                    value={codigoEmpleado}
                    onChange={(e) => setCodigoEmpleado(e.target.value)}
                    className="w-full pl-10 input-premium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={asistenciaStatus === 'scanning'}
                className="w-full py-3 bg-campestre-gold hover:bg-campestre-gold/90 text-slate-950 font-bold rounded-xl btn-premium shadow-lg shadow-campestre-gold/20 flex items-center justify-center space-x-2"
              >
                <span>Registrar Asistencia</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- NAVEGACIÓN Y PANTALLAS PRINCIPALES PARA USUARIOS AUTENTICADOS ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Premium */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo size="sm" className="hidden sm:block" />
            <div>
              <span className="font-extrabold text-sm tracking-tight Outfit block sm:hidden text-white">
                {brandingConfig.companyName}
              </span>
              <span className="text-[9px] text-slate-400 tracking-wider uppercase block">
                {userType === 'INTERNAL' ? brandingConfig.appName : 'Portal del Cliente'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <span className="text-xs text-slate-400 block">Bienvenido,</span>
              <span className="text-sm font-semibold text-white">
                {userType === 'INTERNAL' ? user?.nombre : socio?.nombre}
              </span>
            </div>
            
            {userType === 'INTERNAL' && user?.roles?.includes('ADMIN') && (
              <span className="bg-campestre-gold/10 text-campestre-gold text-[10px] font-bold px-2.5 py-1 rounded-full border border-campestre-gold/20 uppercase tracking-wider">
                Admin
              </span>
            )}
            
            {userType === 'INTERNAL' && !user?.roles?.includes('ADMIN') && (
              <span className="bg-campestre-green/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-campestre-green/20 uppercase tracking-wider">
                Vendedor
              </span>
            )}

            <button
              onClick={toggleTema}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-campestre-gold transition-all btn-premium"
              title={tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}
            >
              {tema === 'oscuro' ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <button
              onClick={logout}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-500/10 hover:text-red-400 transition-all text-slate-400 btn-premium"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Renderizado de vistas según tipo de usuario */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {userType === 'INTERNAL' ? (
          <div className="space-y-6">
            <div className="flex flex-wrap bg-slate-900 p-1 rounded-xl w-fit border border-slate-800 gap-1">
              {featuresConfig.pos.enabled && (
                <button
                  onClick={() => setCurrentView('pos')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg btn-premium transition-all ${
                    currentView === 'pos' ? 'bg-campestre-green text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {featuresConfig.pos.label}
                </button>
              )}
              {featuresConfig.cargos.enabled && (
                <button
                  onClick={() => setCurrentView('cargos')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg btn-premium transition-all ${
                    currentView === 'cargos' ? 'bg-campestre-gold text-slate-950 shadow-sm' : 'text-slate-450 hover:text-slate-200'
                  }`}
                >
                  {featuresConfig.cargos.label}
                </button>
              )}
              {featuresConfig.dividirCadi.enabled && (
                <button
                  onClick={() => setCurrentView('dividir-cadi')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg btn-premium transition-all ${
                    currentView === 'dividir-cadi' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-450 hover:text-slate-200'
                  }`}
                >
                  {featuresConfig.dividirCadi.label}
                </button>
              )}
              {featuresConfig.ventasTurno.enabled && (
                <button
                  onClick={() => setCurrentView('ventas-turno')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg btn-premium transition-all ${
                    currentView === 'ventas-turno' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-450 hover:text-slate-200'
                  }`}
                >
                  {featuresConfig.ventasTurno.label}
                </button>
              )}
              {isAdmin ? (
                <>
                  {featuresConfig.admin.enabled && (
                    <button
                      onClick={() => setCurrentView('admin')}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg btn-premium transition-all ${
                        currentView === 'admin' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      {featuresConfig.admin.label}
                    </button>
                  )}
                  {featuresConfig.stock.enabled && (
                    <button
                      onClick={() => setCurrentView('stock')}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg btn-premium transition-all ${
                        currentView === 'stock' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      {featuresConfig.stock.label}
                    </button>
                  )}
                  {featuresConfig.insumos.enabled && (
                    <button
                      onClick={() => setCurrentView('insumos')}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg btn-premium transition-all ${
                        currentView === 'insumos' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      {featuresConfig.insumos.label}
                    </button>
                  )}
                </>
              ) : (
                featuresConfig.admin.enabled && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg btn-premium transition-all ${
                      currentView === 'admin' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-450 hover:text-slate-200'
                    }`}
                  >
                    Corte de Caja
                  </button>
                )
              )}
            </div>

            <Suspense fallback={
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                <RefreshCw size={24} className="animate-spin text-campestre-gold" />
                <span className="text-xs font-semibold">Cargando sección...</span>
              </div>
            }>
              {featuresConfig.pos.enabled && currentView === 'pos' && <POSView />}
              {featuresConfig.cargos.enabled && currentView === 'cargos' && <CargosSociosView />}
              {featuresConfig.dividirCadi.enabled && currentView === 'dividir-cadi' && <DividirCadiView />}
              {featuresConfig.ventasTurno.enabled && currentView === 'ventas-turno' && <VentasTurnoView />}
              {featuresConfig.admin.enabled && currentView === 'admin' && <AdminView />}
              {isAdmin && featuresConfig.stock.enabled && currentView === 'stock' && <StockView />}
              {isAdmin && featuresConfig.insumos.enabled && currentView === 'insumos' && <InsumosView />}
            </Suspense>
          </div>
        ) : (
          // Socio va a la vista de socio
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <RefreshCw size={24} className="animate-spin text-campestre-gold" />
              <span className="text-xs font-semibold">Cargando portal...</span>
            </div>
          }>
            <SocioView />
          </Suspense>
        )}
      </main>
    </div>
  );
}

export default App;
