import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { QRCodeSVG } from 'qrcode.react'; // SVG renderizador
import { User, Calendar, MapPin, Receipt, RefreshCw, Key, ShieldCheck, Clipboard, DollarSign, Activity, Sparkles } from 'lucide-react';
import { io } from 'socket.io-client';

export default function SocioView() {
  const { token, socio } = useStore();
  const [perfil, setPerfil] = useState<any>(null);
  const [consumos, setConsumos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [cuentaActiva, setCuentaActiva] = useState<any>(null);

  useEffect(() => {
    if (token) {
      cargarDatosPerfil();
      cargarConsumos();
      cargarCuentaActiva();

      const socket = io('/', {
        path: '/socket.io',
        transports: ['polling', 'websocket'],
      });

      socket.on('cuenta:actualizar', () => {
        console.log('Recibida notificación de cuenta en SocioView. Recargando datos de consumo y cuenta activa.');
        cargarDatosPerfil();
        cargarConsumos();
        cargarCuentaActiva();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [token]);


  const cargarDatosPerfil = async () => {
    try {
      const res = await fetch('/api/socio/perfil', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPerfil(data);
    } catch (err) {
      console.error('Error al cargar perfil del socio:', err);
    }
  };

  const cargarConsumos = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/socio/consumos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setConsumos(data);
    } catch (err) {
      console.error('Error al cargar consumos del socio:', err);
      setError('No se pudo cargar tu historial de consumos');
    } finally {
      setCargando(false);
    }
  };

  const cargarCuentaActiva = async () => {
    try {
      const res = await fetch('/api/socio/cuenta-activa', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCuentaActiva(data);
      }
    } catch (err) {
      console.error('Error al cargar cuenta activa:', err);
    }
  };


  const regenerarQR = async () => {
    setError('');
    try {
      const res = await fetch('/api/socio/qr-token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPerfil((prev: any) => ({ ...prev, qr_token: data.qr_token }));
      } else {
        throw new Error(data.error || 'No se pudo regenerar el QR');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copiarTokenAlPortapapeles = () => {
    if (perfil?.qr_token) {
      navigator.clipboard.writeText(perfil.qr_token);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const saldoPendienteTotal = consumos
    .filter((c) => c.estado_pago === 'PENDIENTE')
    .reduce((sum, c) => sum + c.mi_pago, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* Columna izquierda: Membresía Digital con QR Dinámico */}
      <div className="lg:col-span-1 space-y-6">
        {/* Widget de Cargos Pendientes */}
        <div className="glass-card rounded-2xl border border-slate-800 p-5 flex items-center justify-between relative overflow-hidden bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
              <DollarSign size={18} />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">Total Adeudos Pendientes:</span>
              <span className="text-xl font-extrabold text-white Outfit mt-0.5">
                ${saldoPendienteTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          {saldoPendienteTotal > 0 && (
            <span className="bg-red-500/10 text-red-400 text-[9px] font-bold px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-wider animate-pulse">
              Pendiente
            </span>
          )}
        </div>



        {/* Datos de Contacto y Seguridad */}
        <div className="glass-card rounded-2xl border border-slate-800 p-5 space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Datos de Contacto</h4>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between border-b border-slate-800/40 pb-2">
              <span className="text-slate-400">Correo Electrónico:</span>
              <span className="text-white font-medium">{socio?.email}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/40 pb-2">
              <span className="text-slate-400">Teléfono registrado:</span>
              <span className="text-white font-medium">{perfil?.telefono || 'No registrado'}</span>
            </div>
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-[10px] pt-1">
              <ShieldCheck size={14} />
              <span>Conexión cifrada de grado militar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Columna derecha: Historial de Consumos / Gastos */}
      <div className="lg:col-span-2 space-y-6">
        {/* Sección de Cuenta Activa en Tiempo Real */}
        {cuentaActiva && cuentaActiva.activa ? (
          <div className="glass-card rounded-3xl border border-indigo-500/30 overflow-hidden relative bg-indigo-950/5">
            {/* Glow background accent */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl"></div>

            <div className="p-4 bg-indigo-900/20 border-b border-indigo-950/20 flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-indigo-650/20 text-indigo-400 rounded-xl flex items-center justify-center animate-pulse">
                  <Activity size={14} />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white block">Ronda Activa - Cuenta Abierta</span>
                    <span className="bg-indigo-650 text-white text-[8px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wider animate-pulse">En Vivo</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Área: {cuentaActiva.area} | Atendido por: {cuentaActiva.atendido_por}</span>
                </div>
              </div>

              <button 
                onClick={cargarCuentaActiva}
                className="p-2 bg-indigo-900/30 border border-indigo-850 hover:border-indigo-700 text-indigo-455 hover:text-white rounded-xl transition-all btn-premium text-[10px] font-bold flex items-center gap-1"
              >
                <RefreshCw size={10} />
                <span>Actualizar</span>
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 border-r border-slate-800/40 pr-2">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">Consumos al momento:</span>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {cuentaActiva.productos.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs py-0.5 border-b border-slate-900/10">
                      <span className="text-slate-300">{item.cantidad}x {item.nombre}</span>
                      <span className="text-white font-medium">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between space-y-3 pl-0 md:pl-2">
                <div>
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-2">Totales Estimados:</span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal Cuenta:</span>
                      <span className="text-white">${cuentaActiva.subtotal.toFixed(2)}</span>
                    </div>
                    {cuentaActiva.descuento > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Descuento (30% Empleado):</span>
                        <span>-${cuentaActiva.descuento.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400 font-semibold border-t border-slate-800/40 pt-1">
                      <span>Total Acumulado:</span>
                      <span className="text-white">${cuentaActiva.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-850 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Mi Parte Proporcional:</span>
                    <span className="text-[8px] text-slate-400">Dividido entre {cuentaActiva.total_integrantes} socios/nombres</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-campestre-gold Outfit">${cuentaActiva.mi_total_estimado.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold Outfit">Historial de Consumos y Splits</h3>
          <button
            onClick={cargarConsumos}
            className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Actualizar consumos"
          >
            <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl text-center">
            {error}
          </div>
        )}

        {cargando && consumos.length === 0 ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-slate-900 border border-slate-850 h-36 rounded-3xl"></div>
            ))}
          </div>
        ) : consumos.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-slate-800">
            <Receipt className="mx-auto text-slate-500 mb-3" size={32} />
            <h4 className="text-sm font-bold text-white">Sin consumos registrados</h4>
            <p className="text-xs text-slate-400 mt-1">Aún no has registrado consumos bajo tu membresía en el club.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {consumos.map((c) => (
              <div key={c.division_id} className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
                {/* Header Consumo */}
                <div className="p-4 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="p-2 rounded-xl bg-slate-800 text-campestre-gold flex items-center justify-center">
                      <MapPin size={14} />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">{c.area}</span>
                      <span className="text-[9px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Calendar size={10} />
                        <span>Fecha Consumo: {new Date(c.fecha_consumo).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Atendido por:</span>
                    <span className="text-xs font-bold text-white">{c.atendido_por}</span>
                  </div>
                </div>

                {/* Cuerpo del Detalle */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Desglose de comida/bebida */}
                  <div className="space-y-2 border-r border-slate-800/60 pr-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Detalle del Consumo General:</span>
                    {c.consumo_detalle.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-slate-350">{item.cantidad}x {item.producto}</span>
                        <span className="text-white font-medium">${item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Detalle del split */}
                  <div className="flex flex-col justify-between space-y-3 pl-0 md:pl-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Desglose de la División:</span>
                      
                      {c.cadi && (
                        <div className="flex justify-between text-[10px] text-slate-400 border-b border-slate-800/40 pb-1.5 mb-1.5">
                          <span>Asistente Cadi:</span>
                          <span className="text-white font-bold">{c.cadi}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Total de la Cuenta (Grupo):</span>
                        <span className="text-white font-medium">${c.total_cuenta_grupo.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Mi participación ({c.mi_porcentaje.toFixed(0)}%):</span>
                        <span className="text-white font-medium">${c.mi_pago.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-850 flex justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border w-fit uppercase tracking-wider block ${
                          c.estado_pago === 'PAGADO'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : c.estado_pago === 'BORRADO'
                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {c.estado_pago === 'PAGADO' 
                            ? `Pagado - ${c.metodo_pago.replace('_', ' ')}` 
                            : c.estado_pago === 'BORRADO'
                            ? 'Cancelado / Anulado'
                            : 'Adeudo / Pendiente'}
                        </span>
                        {c.estado_pago === 'PAGADO' && c.fecha_pago && (
                          <span className="text-[8px] text-slate-500 font-mono">
                            Pagado el: {new Date(c.fecha_pago).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                        {c.estado_pago === 'BORRADO' && c.fecha_pago && (
                          <span className="text-[8px] text-slate-500 font-mono">
                            Anulado el: {new Date(c.fecha_pago).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {c.estado_pago === 'PAGADO' 
                            ? 'Mi Cargo Liquidado:' 
                            : c.estado_pago === 'BORRADO'
                            ? 'Monto Anulado:'
                            : 'Monto Pendiente:'}
                        </span>
                        <span className={`text-sm font-extrabold Outfit ${
                          c.estado_pago === 'PAGADO' 
                            ? 'text-white' 
                            : c.estado_pago === 'BORRADO'
                            ? 'text-slate-400 line-through'
                            : 'text-rose-450'
                        }`}>
                          ${c.mi_pago.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
