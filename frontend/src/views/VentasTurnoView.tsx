import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { RefreshCw, Search, Clock, Check, Users, DollarSign, BarChart3, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { io } from 'socket.io-client';

export default function VentasTurnoView() {
  const { token, user } = useStore();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [cuentas, setCuentas] = useState<any[]>([]);
  const [turnoActivo, setTurnoActivo] = useState<any | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroArea, setFiltroArea] = useState('TODAS');
  const [filtroVendedor, setFiltroVendedor] = useState('TODOS');
  const [seccionActiva, setSeccionActiva] = useState<'abiertas' | 'pagadas'>('abiertas');

  // Cargar datos
  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      // 1. Obtener cuentas del turno activo
      const resCuentas = await fetch('/api/admin/cuentas?solo_turno_activo=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!resCuentas.ok) {
        let errorMsg = 'Error al obtener cuentas';
        try {
          const errData = await resCuentas.json();
          errorMsg = errData.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }
      
      const dataCuentas = await resCuentas.json();
      setCuentas(dataCuentas);

      // 2. Obtener turno activo
      const resTurno = await fetch('/api/admin/turno/activo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (resTurno.ok) {
        const dataTurno = await resTurno.json();
        if (dataTurno.activo) {
          setTurnoActivo(dataTurno);
        } else {
          setTurnoActivo(null);
        }
      } else {
        setTurnoActivo(null);
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  // Escuchar actualizaciones por Sockets
  useEffect(() => {
    if (!token) return;
    cargarDatos();

    const socket = io('/', {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });
    socket.on('connect', () => {
      console.log('Conectado a sockets desde VentasTurnoView');
    });

    socket.on('cuenta:actualizar', () => {
      cargarDatos();
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Lista de vendedores únicos disponibles en las cuentas
  const vendedoresUnicos = Array.from(new Set(cuentas.map(c => c.atendido_por))).filter(Boolean);

  // Filtrar cuentas según criterios de búsqueda (disponible para todos los usuarios)
  const cuentasFiltradas = cuentas.filter(cta => {
    // 1. Filtro por Vendedor
    if (filtroVendedor !== 'TODOS' && cta.atendido_por !== filtroVendedor) {
      return false;
    }

    // 2. Filtro por Estado (abiertas vs pagadas)
    const estadoOk = seccionActiva === 'abiertas' ? cta.estado === 'ABIERTA' : cta.estado === 'PAGADA';
    if (!estadoOk) return false;

    // 3. Filtro por Área
    if (filtroArea !== 'TODAS' && cta.area !== filtroArea) return false;

    // 4. Filtro por Texto
    if (filtroTexto.trim() !== '') {
      const q = filtroTexto.toLowerCase();
      const refOk = cta.referencia?.toLowerCase().includes(q);
      const idOk = cta.id?.toString().includes(q);
      const cadiOk = cta.cadi?.toLowerCase().includes(q);
      const vendedorOk = cta.atendido_por?.toLowerCase().includes(q);
      return refOk || idOk || cadiOk || vendedorOk;
    }

    return true;
  });

  // Métricas financieras calculadas según los filtros (global para todos los usuarios)
  const metricas = (() => {
    const abiertas = cuentas.filter(c => c.estado === 'ABIERTA');
    const pagadas = cuentas.filter(c => c.estado === 'PAGADA');

    let totalVentas = 0;
    let efectivo = 0;
    let tarjeta = 0;
    let cargosSocio = 0;

    pagadas.forEach(c => {
      totalVentas += c.total;
      
      // Si la cuenta tiene pagos divididos
      if (c.divisiones && c.divisiones.length > 0) {
        c.divisiones.forEach((d: any) => {
          if (d.metodo_pago === 'EFECTIVO') efectivo += d.monto;
          else if (d.metodo_pago === 'TARJETA') tarjeta += d.monto;
          else if (d.metodo_pago === 'CARGO_SOCIO') cargosSocio += d.monto;
        });
      } else if (c.metodo_pago) {
        if (c.metodo_pago === 'EFECTIVO') efectivo += c.total;
        else if (c.metodo_pago === 'TARJETA') tarjeta += c.total;
        else if (c.metodo_pago === 'CARGO_SOCIO') cargosSocio += c.total;
        else if (c.metodo_pago === 'MIXTO') {
          efectivo += c.monto_efectivo || 0;
          tarjeta += c.monto_tarjeta || 0;
        }
      }
    });

    return {
      numAbiertas: abiertas.length,
      numPagadas: pagadas.length,
      totalVentas,
      efectivo,
      tarjeta,
      cargosSocio
    };
  })();

  return (
    <div className="space-y-6 font-sans">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold Outfit flex items-center gap-2 text-white">
            <BarChart3 className="text-campestre-gold" size={24} />
            <span>Ventas del Turno Activo</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Panel en vivo para auditar ventas, métodos de cobro y cuentas de todo el personal en el turno activo.
          </p>
        </div>
        <button
          onClick={cargarDatos}
          disabled={cargando}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-750 flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
          {cargando ? 'Actualizando...' : 'Actualizar Datos'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-2xl flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Caja de Turno inactiva warning */}
      {!turnoActivo && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-400">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Caja Inactiva</h4>
            <p className="text-[11px] text-slate-350 mt-1">
              No hay ningún turno de caja abierto en este momento. Los registros se mostrarán una vez que se aperture la caja.
            </p>
          </div>
        </div>
      )}

      {/* Widget de Métricas Premium */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Abiertas */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Cuentas Abiertas</span>
            <span className="text-2xl font-extrabold text-white block font-mono">{metricas.numAbiertas}</span>
            <span className="text-[10px] text-amber-400 block font-medium">En vivo / Consumos activos</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock size={20} />
          </div>
        </div>

        {/* Total Cerradas */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Cuentas Pagadas</span>
            <span className="text-2xl font-extrabold text-white block font-mono">{metricas.numPagadas}</span>
            <span className="text-[10px] text-emerald-400 block font-medium">Ventas concretadas</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Check size={20} />
          </div>
        </div>

        {/* Total Ventas */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Ventas</span>
            <span className="text-2xl font-extrabold text-campestre-gold block font-mono">
              ${metricas.totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-500 block">Suma de cuentas cerradas</span>
          </div>
          <div className="p-3 rounded-xl bg-campestre-gold/10 text-campestre-gold">
            <DollarSign size={20} />
          </div>
        </div>

        {/* desglose de pagos */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800/80 space-y-2">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Métodos de Cobro</span>
          <div className="text-[10px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Efectivo:</span>
              <span className="font-bold text-emerald-400 font-mono">${metricas.efectivo.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tarjeta:</span>
              <span className="font-bold text-blue-400 font-mono">${metricas.tarjeta.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cargo Socio:</span>
              <span className="font-bold text-yellow-500 font-mono">${metricas.cargosSocio.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="glass-card rounded-2xl border border-slate-800/80 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Buscador */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Buscar por folio, referencia, cadi..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-campestre-gold transition-colors font-medium"
          />
        </div>

        {/* Selectores */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Área */}
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-campestre-gold"
          >
            <option value="TODAS">Todas las Áreas</option>
            <option value="Bar">Bar</option>
            <option value="Snack">Snack</option>
            <option value="Palapa">Palapa</option>
          </select>

          {/* Vendedor */}
          <select
            value={filtroVendedor}
            onChange={(e) => setFiltroVendedor(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-campestre-gold"
          >
            <option value="TODOS">Todos los Vendedores</option>
            {vendedoresUnicos.map((vend: any) => (
              <option key={vend} value={vend}>{vend}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs principales de Estado */}
      <div className="flex border-b border-slate-800 bg-slate-900/30 p-1 rounded-xl w-fit">
        <button
          onClick={() => setSeccionActiva('abiertas')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
            seccionActiva === 'abiertas'
              ? 'bg-campestre-green text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock size={14} />
          <span>Cuentas Abiertas / En Vivo ({cuentasFiltradas.filter(c => c.estado === 'ABIERTA').length})</span>
        </button>
        <button
          onClick={() => setSeccionActiva('pagadas')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
            seccionActiva === 'pagadas'
              ? 'bg-campestre-gold text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Check size={14} />
          <span>Ventas Realizadas / Cerradas ({cuentasFiltradas.filter(c => c.estado === 'PAGADA').length})</span>
        </button>
      </div>

      {/* Listado Principal de Cuentas */}
      {cuentasFiltradas.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 flex flex-col justify-center items-center">
          <span className="text-4xl animate-bounce">⛳</span>
          <h4 className="text-sm font-bold text-white mt-4">No se encontraron cuentas</h4>
          <p className="text-slate-400 text-xs mt-1 max-w-sm">
            {filtroTexto.trim() !== '' 
              ? 'Ningún registro coincide con los criterios de búsqueda actuales.'
              : seccionActiva === 'abiertas' 
                ? 'No hay cuentas abiertas activas registradas en este turno.'
                : 'No se han cerrado ni cobrado cuentas todavía.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cuentasFiltradas.map((cta) => (
            <div
              key={cta.id}
              className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all relative overflow-hidden group"
            >
              {/* Badge superior derecho para el área y atendido por */}
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider block w-fit ${
                      cta.area === 'Bar' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : cta.area === 'Snack' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25'
                    }`}>
                      {cta.area}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold bg-slate-800/60 px-2 py-0.5 rounded border border-slate-750">
                      👤 {cta.atendido_por}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-tight mt-1">
                    {cta.referencia}
                  </h4>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {cta.cadi ? `Cadi: ${cta.cadi}` : 'Sin Cadi'}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-base font-black Outfit block ${cta.estado === 'PAGADA' ? 'text-emerald-400' : 'text-campestre-gold'}`}>
                    ${cta.total.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-500 block font-mono font-semibold">
                    #Folio {cta.id.slice(-6)}
                  </span>
                </div>
              </div>

              {/* Consumos */}
              {cta.productos && cta.productos.length > 0 && (
                <div className="text-[10px] text-slate-350 bg-slate-950/45 rounded-xl p-3 border border-slate-900 max-h-32 overflow-y-auto">
                  <span className="font-bold block text-slate-500 text-[9px] uppercase tracking-wider mb-1.5">Productos consumidos:</span>
                  <div className="space-y-1">
                    {cta.productos.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span>{p.cantidad}x {p.nombre}</span>
                        <span className="font-bold text-slate-200">${p.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalle Pagos (Solo para Cuentas Pagadas) */}
              {cta.estado === 'PAGADA' && (
                <div className="text-[9px] bg-slate-950/20 rounded-xl p-3 border border-slate-900/60 space-y-1">
                  <span className="font-bold block text-slate-500 text-[9px] uppercase tracking-wider mb-1">MÉTODO DE COBRO DETALLE:</span>
                  {cta.divisiones && cta.divisiones.length > 0 ? (
                    cta.divisiones.map((d: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-slate-300">
                        <span className="truncate max-w-[150px]">{d.cliente}</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[8px] ${
                          d.metodo_pago === 'EFECTIVO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          d.metodo_pago === 'TARJETA' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          {d.metodo_pago} (${d.monto.toFixed(2)})
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-center text-slate-350">
                      <span>Cobro Directo</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[8px] ${
                        cta.metodo_pago === 'EFECTIVO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        cta.metodo_pago === 'TARJETA' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        cta.metodo_pago === 'MIXTO' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>
                        {cta.metodo_pago === 'MIXTO'
                          ? `Mixto (EF: $${(cta.monto_efectivo || 0).toFixed(2)}, TJ: $${(cta.monto_tarjeta || 0).toFixed(2)})`
                          : `${cta.metodo_pago} ($${cta.total.toFixed(2)})`
                        }
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Pie de Tarjeta */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-1">
                  <Clock size={11} />
                  <span>Apertura: {new Date(cta.fecha).toLocaleTimeString('es-MX', { timeStyle: 'short' })}</span>
                </div>
                {cta.cerrado_at && (
                  <span>Cobrado: {new Date(cta.cerrado_at).toLocaleTimeString('es-MX', { timeStyle: 'short' })}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
