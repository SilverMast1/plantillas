import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Search, Users, RefreshCw, Eye, CreditCard, DollarSign, X, Check, Calendar, AlertCircle, Trash2, Smartphone } from 'lucide-react';
import { io } from 'socket.io-client';

interface SocioCargo {
  id: number;
  codigo_socio: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  saldo_pendiente: number;
}

interface CargoDetalle {
  division_id: string;
  cuenta_id: string;
  area: string;
  atendido_por: string;
  fecha: string;
  monto: number;
  porcentaje_participacion: number;
  total_cuenta: number;
  cadi: string | null;
  productos: {
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }[];
}

export default function CargosSociosView() {
  const { token, areaId, user } = useStore();
  const [socios, setSocios] = useState<SocioCargo[]>([]);
  const [filtro, setFiltro] = useState('');
  const [ordenamiento, setOrdenamiento] = useState<'mayor' | 'menor' | 'az'>('mayor');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Estados para Modal de Detalle
  const [socioSeleccionado, setSocioSeleccionado] = useState<SocioCargo | null>(null);
  const [detalles, setDetalles] = useState<CargoDetalle[]>([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [divisionesSeleccionadas, setDivisionesSeleccionadas] = useState<string[]>([]);

  const handleEditarCuenta = async (cuentaId: string) => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch('/api/admin/cuentas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const cta = data.find((c: any) => c.id === cuentaId.toString());
        if (cta) {
          const itemsCart = cta.productos.map((p: any) => ({
            id: p.id,
            nombre: p.nombre,
            precio_venta: p.precio_venta,
            cantidad: p.cantidad,
            categoria: p.categoria,
            notas: p.notas || '',
            guardado: true,
          }));

          useStore.setState({
            areaId: cta.area_id,
            cuentaId: Number(cta.id),
            cadiId: cta.cadi_id,
            nombreReferencia: cta.referencia,
            cart: itemsCart,
            sociosSeleccionados: cta.socios || [],
            currentView: 'pos'
          });
        } else {
          throw new Error('No se encontró la información detallada de la cuenta.');
        }
      } else {
        throw new Error(data.error || 'Error al obtener cuentas del sistema');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar la cuenta para edición');
    } finally {
      setCargando(false);
      setMostrarModalDetalle(false);
    }
  };

  const [mostrarModalLiquidar, setMostrarModalLiquidar] = useState(false);
  const [metodoPagoLiquidar, setMetodoPagoLiquidar] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'>('EFECTIVO');
  const [liquidando, setLiquidando] = useState(false);
  const [liquidarTodoSocio, setLiquidarTodoSocio] = useState<SocioCargo | null>(null);
  const [pagaCon, setPagaCon] = useState('');

  // Estados para Modal de Borrado (Cancelar Adeudos)
  const [mostrarModalBorrar, setMostrarModalBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [borrarTodoSocio, setBorrarTodoSocio] = useState<SocioCargo | null>(null);


  useEffect(() => {
    if (token) {
      cargarCargosSocios();

      const socket = io('/', {
        path: '/socket.io',
        transports: ['polling', 'websocket'],
      });

      socket.on('cuenta:actualizar', () => {
        console.log('Recibida notificación de cuenta/adeudos en CargosSociosView');
        cargarCargosSocios();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [token]);

  const cargarCargosSocios = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch('/api/pos/socios/cargos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSocios(data);
      } else {
        throw new Error(data.error || 'No se pudieron cargar los cargos de socios');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de red al consultar cargos');
    } finally {
      setCargando(false);
    }
  };

  const verDetalleSocio = async (socio: SocioCargo) => {
    setSocioSeleccionado(socio);
    setMostrarModalDetalle(true);
    setCargandoDetalles(true);
    setDetalles([]);
    setDivisionesSeleccionadas([]);
    try {
      const res = await fetch(`/api/pos/socios/${socio.id}/cargos/detalle`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDetalles(data);
        // Por defecto seleccionamos todas las divisiones
        setDivisionesSeleccionadas(data.map((d: CargoDetalle) => d.division_id));
      } else {
        throw new Error(data.error || 'No se pudo obtener el detalle de deudas');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al obtener detalle del socio');
    } finally {
      setCargandoDetalles(false);
    }
  };

  const handleToggleDivision = (id: string) => {
    if (divisionesSeleccionadas.includes(id)) {
      setDivisionesSeleccionadas(divisionesSeleccionadas.filter((d) => d !== id));
    } else {
      setDivisionesSeleccionadas([...divisionesSeleccionadas, id]);
    }
  };

  const handleToggleSelectAll = () => {
    if (divisionesSeleccionadas.length === detalles.length) {
      setDivisionesSeleccionadas([]);
    } else {
      setDivisionesSeleccionadas(detalles.map((d) => d.division_id));
    }
  };

  const abrirLiquidarTodo = (socio: SocioCargo) => {
    setLiquidarTodoSocio(socio);
    setMetodoPagoLiquidar('EFECTIVO');
    setPagaCon('');
    setMostrarModalLiquidar(true);
  };

  const abrirLiquidarSeleccionados = () => {
    if (divisionesSeleccionadas.length === 0) return;
    setLiquidarTodoSocio(null);
    setMetodoPagoLiquidar('EFECTIVO');
    setPagaCon('');
    setMostrarModalLiquidar(true);
  };

  const procesarLiquidacion = async () => {
    const socioId = liquidarTodoSocio ? liquidarTodoSocio.id : socioSeleccionado?.id;
    if (!socioId) return;

    setLiquidando(true);
    setError('');
    setMensajeExito('');

    // Si liquidarTodoSocio está seteado, mandamos divisionesIds vacías (significa liquidar todo).
    // De lo contrario mandamos las seleccionadas.
    const divisionesIds = liquidarTodoSocio ? [] : divisionesSeleccionadas;

    try {
      const res = await fetch(`/api/pos/socios/${socioId}/cargos/liquidar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          metodo_pago: metodoPagoLiquidar,
          divisionesIds,
          area_id: areaId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensajeExito(data.message || 'Deuda liquidada exitosamente');
        setMostrarModalLiquidar(false);
        setMostrarModalDetalle(false);
        setSocioSeleccionado(null);
        setLiquidarTodoSocio(null);
        // Recargar datos principales
        cargarCargosSocios();
        // Mostrar aviso temporal de éxito
        setTimeout(() => setMensajeExito(''), 4000);
      } else {
        throw new Error(data.error || 'Ocurrió un error al liquidar cargos');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de red al liquidar deudas');
      setMostrarModalLiquidar(false);
    } finally {
      setLiquidando(false);
    }
  };

  const abrirBorrarTodo = (socio: SocioCargo) => {
    setBorrarTodoSocio(socio);
    setMostrarModalBorrar(true);
  };

  const abrirBorrarSeleccionados = () => {
    if (divisionesSeleccionadas.length === 0) return;
    setBorrarTodoSocio(null);
    setMostrarModalBorrar(true);
  };

  const procesarBorrado = async () => {
    const socioId = borrarTodoSocio ? borrarTodoSocio.id : socioSeleccionado?.id;
    if (!socioId) return;

    setBorrando(true);
    setError('');
    setMensajeExito('');

    const divisionesIds = borrarTodoSocio ? [] : divisionesSeleccionadas;

    try {
      const res = await fetch(`/api/pos/socios/${socioId}/cargos/borrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          divisionesIds,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensajeExito(data.message || 'Adeudos borrados correctamente');
        setMostrarModalBorrar(false);
        setMostrarModalDetalle(false);
        setSocioSeleccionado(null);
        setBorrarTodoSocio(null);
        cargarCargosSocios();
        setTimeout(() => setMensajeExito(''), 4000);
      } else {
        throw new Error(data.error || 'Ocurrió un error al borrar cargos');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de red al borrar deudas');
      setMostrarModalBorrar(false);
    } finally {
      setBorrando(false);
    }
  };


  const sociosFiltrados = socios
    .filter(
      (s) =>
        s.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        (s.codigo_socio && s.codigo_socio.toLowerCase().includes(filtro.toLowerCase()))
    )
    .sort((a, b) => {
      if (ordenamiento === 'mayor') return b.saldo_pendiente - a.saldo_pendiente;
      if (ordenamiento === 'menor') return a.saldo_pendiente - b.saldo_pendiente;
      return a.nombre.localeCompare(b.nombre);
    });

  const totalSeleccionado = detalles
    .filter((d) => divisionesSeleccionadas.includes(d.division_id))
    .reduce((sum, d) => sum + d.monto, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold Outfit text-white">Cargos a Socios (Cuentas por Cobrar)</h2>
          <p className="text-slate-400 text-sm mt-0.5">Control de adeudos acumulados y liquidación de deudas de socios</p>
        </div>
        <button
          onClick={cargarCargosSocios}
          disabled={cargando}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 border border-slate-800 text-xs font-bold rounded-xl text-slate-350 hover:text-white flex items-center justify-center space-x-2 transition-all hover:border-slate-700 btn-premium disabled:opacity-50"
        >
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
          <span>Actualizar Lista</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-2xl flex items-center space-x-2.5">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {mensajeExito && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-2xl flex items-center space-x-2.5">
          <Check size={16} />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Buscador y Resumen */}
      <div className="glass-card rounded-2xl border border-slate-800/80 p-5 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o número de socio..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 input-premium"
          />
        </div>
        <select
          value={ordenamiento}
          onChange={(e) => setOrdenamiento(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-campestre-gold transition-all cursor-pointer"
        >
          <option value="mayor">Mayor deuda primero</option>
          <option value="menor">Menor deuda primero</option>
          <option value="az">A → Z</option>
        </select>
        <div className="flex items-center space-x-4 w-full md:w-auto justify-end text-right px-1">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Deuda Total Socios:</span>
            <span className="text-xl font-extrabold text-campestre-gold Outfit">
              ${socios.reduce((acc, s) => acc + s.saldo_pendiente, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Socios Deudores:</span>
            <span className="text-xl font-extrabold text-white Outfit">{socios.length}</span>
          </div>
        </div>
      </div>

      {/* Listado de Socios */}
      {cargando && socios.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-slate-900 border border-slate-850 h-40 rounded-2xl"></div>
          ))}
        </div>
      ) : sociosFiltrados.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center border border-slate-800/80">
          <Users className="mx-auto text-slate-650 mb-3" size={36} />
          <h4 className="text-base font-bold text-white">No se encontraron deudas pendientes</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {filtro ? 'Prueba ajustando el texto de búsqueda' : 'Actualmente no existen socios con cargos de adeudo pendientes.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sociosFiltrados.map((socio) => (
            <div key={socio.id} className="glass-card rounded-2xl border border-slate-800/80 p-5 hover:border-slate-700/60 transition-all flex flex-col justify-between relative overflow-hidden group">
              {/* Gold gradient accent line at top on hover */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-campestre-gold/0 via-campestre-gold/30 to-campestre-gold/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-white text-base Outfit group-hover:text-campestre-gold transition-colors">{socio.nombre}</h3>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      No. Socio: <span className="font-bold text-white">{socio.codigo_socio || 'N/A'}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-450 border-t border-slate-850/50 pt-3 mt-3">
                  {socio.email && (
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="text-slate-300 font-medium truncate max-w-[160px]">{socio.email}</span>
                    </div>
                  )}
                  {socio.telefono && (
                    <div className="flex justify-between">
                      <span>Teléfono:</span>
                      <span className="text-slate-300 font-medium">{socio.telefono}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-850/50 pt-4 mt-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider">Adeudo Pendiente:</span>
                  <span className="text-lg font-extrabold text-campestre-gold Outfit">
                    ${socio.saldo_pendiente.toFixed(2)}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => verDetalleSocio(socio)}
                    className="p-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl hover:border-slate-700 transition-all btn-premium"
                    title="Ver detalle de deudas"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => abrirBorrarTodo(socio)}
                    className="p-2 bg-slate-900 border border-slate-800 text-red-400 hover:text-white hover:bg-red-500/10 rounded-xl hover:border-red-500/20 transition-all btn-premium"
                    title="Borrar todos los adeudos de este socio"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLiquidarTodoSocio(socio);
                      setMetodoPagoLiquidar('EFECTIVO');
                      setPagaCon(socio.saldo_pendiente.toFixed(2));
                      setMostrarModalLiquidar(true);
                    }}
                    className="p-2 bg-slate-900 border border-slate-800 text-emerald-400 hover:text-white hover:bg-emerald-500/10 rounded-xl hover:border-emerald-500/20 transition-all btn-premium"
                    title="Cobro rápido en efectivo"
                  >
                    <DollarSign size={14} />
                  </button>
                  <button
                    onClick={() => abrirLiquidarTodo(socio)}
                    className="px-3 py-2 bg-campestre-gold/15 hover:bg-campestre-gold text-campestre-gold hover:text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all border border-campestre-gold/20 hover:border-campestre-gold hover:shadow-lg hover:shadow-campestre-gold/10"
                  >
                    <CreditCard size={12} />
                    <span>Cobrar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: DETALLE DE DEUDAS */}
      {mostrarModalDetalle && socioSeleccionado && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-4xl glass-card rounded-3xl border border-slate-850 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
            
            {/* Header Modal */}
            <div className="p-6 bg-slate-900/60 border-b border-slate-850 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-campestre-gold font-bold uppercase tracking-wider bg-campestre-gold/10 px-2.5 py-1 rounded-full border border-campestre-gold/20">
                  Desglose de Cargos
                </span>
                <h3 className="text-xl font-extrabold text-white Outfit mt-2">{socioSeleccionado.nombre}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Socio No. {socioSeleccionado.codigo_socio} | {detalles.length} consumos registrados</p>
              </div>
              <button
                onClick={() => setMostrarModalDetalle(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-all btn-premium border border-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Cuerpo Modal (Lista de Cargos) */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {cargandoDetalles ? (
                <div className="space-y-4 py-8 text-center text-slate-400 text-xs">
                  <RefreshCw size={24} className="animate-spin mx-auto text-campestre-gold mb-2" />
                  <span>Obteniendo cuentas de socio...</span>
                </div>
              ) : detalles.length === 0 ? (
                <p className="text-slate-400 text-center py-8 text-xs">No se encontraron cargos específicos para mostrar.</p>
              ) : (
                <>
                  <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-850">
                    <button
                      onClick={handleToggleSelectAll}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-750 rounded text-[10px] font-bold text-slate-300 transition-all btn-premium"
                    >
                      {divisionesSeleccionadas.length === detalles.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                    <span>{divisionesSeleccionadas.length} seleccionados</span>
                  </div>

                  <div className="space-y-3">
                    {detalles.map((cargo) => {
                      const estaSeleccionado = divisionesSeleccionadas.includes(cargo.division_id);
                      return (
                        <div
                          key={cargo.division_id}
                          onClick={() => handleToggleDivision(cargo.division_id)}
                          className={`glass-card rounded-2xl border transition-all overflow-hidden cursor-pointer ${
                            estaSeleccionado
                              ? 'border-campestre-gold/40 bg-campestre-gold/[0.02]'
                              : 'border-slate-850 hover:border-slate-800 bg-slate-900/10'
                          }`}
                        >
                          <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 border-b border-slate-850/50">
                            <div className="flex items-start space-x-3">
                              <div className="pt-0.5">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  estaSeleccionado 
                                    ? 'bg-campestre-gold border-campestre-gold text-slate-950' 
                                    : 'border-slate-700 hover:border-slate-500'
                                }`}>
                                  {estaSeleccionado && <Check size={12} strokeWidth={3} />}
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold text-white">{cargo.area}</span>
                                  <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                    Cuenta #{cargo.cuenta_id}
                                  </span>
                                  {cargo.cadi && (
                                    <span className="text-[9px] text-amber-450 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                                      División de Cadi: {cargo.cadi}
                                    </span>
                                  )}
                                  {user?.roles?.includes('ADMIN') && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditarCuenta(cargo.cuenta_id);
                                      }}
                                      className="text-[9px] font-bold text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/25 px-2 py-0.5 rounded border border-yellow-500/20 transition-all flex items-center"
                                    >
                                      ✏️ Editar Cuenta
                                    </button>
                                  )}
                                </div>
                                <div className="text-[9px] text-slate-400 flex items-center space-x-1.5 mt-1 font-medium">
                                  <Calendar size={10} />
                                  <span>{new Date(cargo.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                  <span className="text-slate-650">•</span>
                                  <span>Cajero: {cargo.atendido_por}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex md:flex-col items-baseline md:items-end justify-between w-full md:w-auto gap-1 border-t md:border-t-0 border-slate-850/60 pt-2.5 md:pt-0">
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block md:hidden">Mi Cargo:</span>
                              <div className="text-right">
                                <span className="text-sm font-extrabold text-campestre-gold Outfit">${cargo.monto.toFixed(2)}</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5">
                                  Split: {cargo.porcentaje_participacion.toFixed(0)}% de ${cargo.total_cuenta.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Productos del Consumo */}
                          <div className="p-4 bg-slate-950/20 text-xs space-y-2">
                            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Consumos de la Cuenta:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                              {cargo.productos.map((prod, idx) => (
                                <div key={idx} className="flex justify-between text-slate-350 py-0.5 border-b border-slate-900/30">
                                  <span>{prod.cantidad}x {prod.nombre}</span>
                                  <span className="text-slate-400">${prod.subtotal.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer Modal (Cálculo y Liquidar) */}
            <div className="p-6 bg-slate-900/60 border-t border-slate-850 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Resumen de Liquidación Seleccionada:</span>
                <div className="text-lg font-extrabold text-white mt-0.5">
                  Total a Cobrar: <span className="text-campestre-gold font-bold Outfit">${totalSeleccionado.toFixed(2)}</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ({divisionesSeleccionadas.length} consumos de {detalles.length})
                </span>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setMostrarModalDetalle(false)}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-all btn-premium"
                >
                  Cancelar
                </button>
                <button
                  onClick={abrirBorrarSeleccionados}
                  disabled={divisionesSeleccionadas.length === 0}
                  className="px-5 py-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                  <span>Borrar Seleccionados</span>
                </button>
                <button
                  onClick={abrirLiquidarSeleccionados}
                  disabled={divisionesSeleccionadas.length === 0}
                  className="px-6 py-3 bg-campestre-gold text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all hover:bg-campestre-gold/90 hover:shadow-lg hover:shadow-campestre-gold/15 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <DollarSign size={14} />
                  <span>Cobrar Seleccionados</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAR LIQUIDACIÓN (MÉTODO DE PAGO) */}
      {mostrarModalLiquidar && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-md glass-card rounded-3xl border border-slate-850 p-6 shadow-2xl relative">
            <button
              onClick={() => setMostrarModalLiquidar(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-450 hover:text-white transition-all btn-premium border border-slate-700"
            >
              <X size={14} />
            </button>

            <div className="text-center mb-6">
              <span className="text-3xl">💰</span>
              <h3 className="text-lg font-extrabold text-white Outfit mt-3">Registrar Cobro de Deuda</h3>
              <p className="text-slate-400 text-xs mt-1">
                {liquidarTodoSocio 
                  ? `Se liquidará la deuda total del socio ${liquidarTodoSocio.nombre}`
                  : `Se liquidarán los consumos seleccionados del socio ${socioSeleccionado?.nombre}`
                }
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-850 rounded-2xl p-4 mb-6 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Monto a Liquidar:</span>
              <span className="text-2xl font-extrabold text-campestre-gold Outfit block mt-1">
                ${liquidarTodoSocio 
                  ? liquidarTodoSocio.saldo_pendiente.toFixed(2)
                  : totalSeleccionado.toFixed(2)
                }
              </span>
            </div>

            <label className="block text-xs font-semibold text-slate-400 mb-2">Selecciona el Método de Pago Real:</label>
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              <button
                type="button"
                onClick={() => setMetodoPagoLiquidar('EFECTIVO')}
                className={`py-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all btn-premium ${
                  metodoPagoLiquidar === 'EFECTIVO'
                    ? 'border-campestre-green bg-campestre-green/10 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign size={18} className={metodoPagoLiquidar === 'EFECTIVO' ? 'text-campestre-green' : ''} />
                <span>Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setMetodoPagoLiquidar('TARJETA')}
                className={`py-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all btn-premium ${
                  metodoPagoLiquidar === 'TARJETA'
                    ? 'border-campestre-gold bg-campestre-gold/10 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard size={18} className={metodoPagoLiquidar === 'TARJETA' ? 'text-campestre-gold' : ''} />
                <span>Tarjeta</span>
              </button>
              <button
                type="button"
                onClick={() => setMetodoPagoLiquidar('TRANSFERENCIA')}
                className={`py-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all btn-premium ${
                  metodoPagoLiquidar === 'TRANSFERENCIA'
                    ? 'border-cyan-400 bg-cyan-500/10 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone size={18} className={metodoPagoLiquidar === 'TRANSFERENCIA' ? 'text-cyan-400' : ''} />
                <span>Transferencia</span>
              </button>
            </div>

            {metodoPagoLiquidar === 'EFECTIVO' && (() => {
              const montoALiquidar = liquidarTodoSocio 
                ? liquidarTodoSocio.saldo_pendiente 
                : totalSeleccionado;
              return (
                <div className="space-y-3 mb-6 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-450">Paga con ($):</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={pagaCon}
                      onChange={(e) => setPagaCon(e.target.value)}
                      className="w-32 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white text-right outline-none focus:border-campestre-green"
                    />
                  </div>
                  
                  {/* Botones rápidos */}
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    <button
                      key="exact"
                      type="button"
                      onClick={() => setPagaCon(montoALiquidar.toFixed(2))}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-lg text-[10px] font-bold border border-slate-700 transition-colors"
                    >
                      Exacto
                    </button>
                    {[50, 100, 200, 500, 1000].filter(val => val >= montoALiquidar).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPagaCon(val.toString())}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-lg text-[10px] font-bold border border-slate-700 transition-colors"
                      >
                        ${val}
                      </button>
                    ))}
                  </div>

                  {parseFloat(pagaCon) > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                      <span className="text-xs font-semibold text-slate-455">Cambio:</span>
                      <span className={`text-sm font-extrabold ${parseFloat(pagaCon) >= montoALiquidar ? 'text-emerald-400' : 'text-red-400'}`}>
                        {parseFloat(pagaCon) >= montoALiquidar 
                          ? `$${(parseFloat(pagaCon) - montoALiquidar).toFixed(2)}`
                          : `Faltan $${(montoALiquidar - parseFloat(pagaCon)).toFixed(2)}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setMostrarModalLiquidar(false)}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white font-bold rounded-xl text-xs transition-all btn-premium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={procesarLiquidacion}
                disabled={liquidando}
                className="flex-1 py-3 bg-campestre-green hover:bg-campestre-green/90 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all btn-premium shadow-lg shadow-campestre-green/15 disabled:opacity-50"
              >
                {liquidando ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Confirmar Liquidación</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 3: CONFIRMAR BORRADO (CANCELACIÓN DE ADEUDO) */}
      {mostrarModalBorrar && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-md glass-card rounded-3xl border border-red-500/20 p-6 shadow-2xl relative bg-slate-950">
            <button
              onClick={() => setMostrarModalBorrar(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-450 hover:text-white transition-all btn-premium border border-slate-700"
            >
              <X size={14} />
            </button>

            <div className="text-center mb-6">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-lg font-extrabold text-white Outfit mt-3">Confirmar Borrado de Adeudo</h3>
              <p className="text-slate-400 text-xs mt-1">
                ¿Estás seguro de que deseas borrar los cargos seleccionados? El adeudo se cancelará permanentemente.
              </p>
              <p className="text-red-400 text-[10px] mt-2 font-semibold">
                * La compra permanecerá registrada en el historial y los productos NO se devolverán al inventario.
              </p>
            </div>

            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 mb-6 text-center">
              <span className="text-[10px] text-red-400 block font-semibold uppercase tracking-wider">Monto a Cancelar:</span>
              <span className="text-2xl font-extrabold text-red-500 Outfit block mt-1">
                ${borrarTodoSocio 
                  ? borrarTodoSocio.saldo_pendiente.toFixed(2)
                  : totalSeleccionado.toFixed(2)
                }
              </span>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setMostrarModalBorrar(false)}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white font-bold rounded-xl text-xs transition-all btn-premium"
              >
                No, mantener
              </button>
              <button
                type="button"
                onClick={procesarBorrado}
                disabled={borrando}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all btn-premium shadow-lg shadow-red-500/15 disabled:opacity-50"
              >
                {borrando ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Cancelando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Sí, borrar adeudo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
