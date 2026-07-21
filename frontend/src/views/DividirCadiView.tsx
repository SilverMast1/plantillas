import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Users, UserPlus, RefreshCw, Trash2, Plus, X, Play, ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';

interface Cliente {
  id: number;
  codigo_socio: string;
  nombre: string;
  email: string | null;
}

interface Cadi {
  id: number;
  numero_cadi: string;
  nombre: string;
  telefono: string | null;
  estado: 'DISPONIBLE' | 'EN_RONDA' | 'INACTIVO';
}

interface CadiActivo {
  id: number;
  numero_cadi: string;
  nombre: string;
  telefono: string | null;
  estado: string;
  clientes: Cliente[];
}

export default function DividirCadiView() {
  const { token } = useStore();
  const [cadis, setCadis] = useState<Cadi[]>([]);
  const [cadisActivos, setCadisActivos] = useState<CadiActivo[]>([]);
  const [socios, setSocios] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Formulario Nuevo Cadi
  const [numeroCadi, setNumeroCadi] = useState('');
  const [nombreCadi, setNombreCadi] = useState('');
  const [telefonoCadi, setTelefonoCadi] = useState('');
  const [creandoCadi, setCreandoCadi] = useState(false);

  // Formulario Asignación
  const [cadiSeleccionado, setCadiSeleccionado] = useState('');
  const [sociosSeleccionados, setSociosSeleccionados] = useState<number[]>([]);
  const [busquedaSocio, setBusquedaSocio] = useState('');
  const [asignando, setAsignando] = useState(false);

  useEffect(() => {
    if (token) {
      cargarDatos();
    }
  }, [token]);

  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      await Promise.all([
        cargarCadis(),
        cargarCadisActivos(),
        cargarSocios()
      ]);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const cargarCadis = async () => {
    const res = await fetch('/api/cadis', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setCadis(data);
    } else {
      throw new Error(data.error || 'Error al cargar listado de Cadis');
    }
  };

  const cargarCadisActivos = async () => {
    const res = await fetch('/api/cadis/activos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setCadisActivos(data);
    } else {
      throw new Error(data.error || 'Error al cargar Cadis activos');
    }
  };

  const cargarSocios = async () => {
    const res = await fetch('/api/socios', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setSocios(data);
    } else {
      throw new Error(data.error || 'Error al cargar socios');
    }
  };

  const handleCrearCadi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroCadi || !nombreCadi) {
      setError('Número y nombre del Cadi son requeridos');
      return;
    }

    setCreandoCadi(true);
    setError('');
    setExito('');

    try {
      const res = await fetch('/api/cadis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          numero_cadi: numeroCadi,
          nombre: nombreCadi,
          telefono: telefonoCadi || undefined
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setExito(`Cadi "${nombreCadi}" registrado correctamente`);
        setNumeroCadi('');
        setNombreCadi('');
        setTelefonoCadi('');
        cargarCadis();
        setTimeout(() => setExito(''), 4000);
      } else {
        throw new Error(data.error || 'Error al registrar Cadi');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreandoCadi(false);
    }
  };

  const handleIniciarRonda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadiSeleccionado) {
      setError('Debes seleccionar un Cadi disponible');
      return;
    }
    if (sociosSeleccionados.length === 0) {
      setError('Debes seleccionar al menos un socio para iniciar la ronda');
      return;
    }

    setAsignando(true);
    setError('');
    setExito('');

    try {
      const res = await fetch('/api/cadis/asignar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cadi_id: cadiSeleccionado,
          cliente_ids: sociosSeleccionados
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setExito('Ronda iniciada con éxito y Cadi asignado a los socios');
        setCadiSeleccionado('');
        setSociosSeleccionados([]);
        setBusquedaSocio('');
        await Promise.all([cargarCadis(), cargarCadisActivos()]);
        setTimeout(() => setExito(''), 4000);
      } else {
        throw new Error(data.error || 'Error al iniciar la ronda');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAsignando(false);
    }
  };

  const handleLiberarCadi = async (cadiId: number) => {
    if (!window.confirm('¿Deseas finalizar la ronda y liberar al Cadi?')) return;
    setError('');
    setExito('');
    try {
      const res = await fetch(`/api/cadis/${cadiId}/liberar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setExito('Cadi liberado y ronda finalizada');
        await Promise.all([cargarCadis(), cargarCadisActivos()]);
        setTimeout(() => setExito(''), 4000);
      } else {
        throw new Error(data.error || 'Error al liberar cadi');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEliminarCadi = async (cadiId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este Cadi? Se borrarán sus asignaciones anteriores.')) return;
    setError('');
    setExito('');
    try {
      const res = await fetch(`/api/cadis/${cadiId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setExito('Cadi eliminado del sistema');
        cargarCadis();
        setTimeout(() => setExito(''), 4000);
      } else {
        throw new Error(data.error || 'Error al eliminar cadi');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleSocioSeleccionado = (id: number) => {
    if (sociosSeleccionados.includes(id)) {
      setSociosSeleccionados(sociosSeleccionados.filter(x => x !== id));
    } else {
      setSociosSeleccionados([...sociosSeleccionados, id]);
    }
  };

  const sociosFiltrados = socios.filter((s) => {
    const q = busquedaSocio.toLowerCase().trim();
    if (!q) return true;
    return s.nombre.toLowerCase().includes(q) || s.codigo_socio.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold Outfit text-white">Cuenta para dividir de Cadis</h2>
          <p className="text-slate-400 text-sm mt-0.5">Asigna Cadis a socios, inicia rondas de golf y divide los cargos al momento</p>
        </div>
        <button
          onClick={cargarDatos}
          disabled={cargando}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 border border-slate-800 text-xs font-bold rounded-xl text-slate-350 hover:text-white flex items-center justify-center space-x-2 transition-all hover:border-slate-700 btn-premium disabled:opacity-50"
        >
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-2xl flex items-center space-x-2.5">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {exito && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-2xl flex items-center space-x-2.5">
          <CheckCircle2 size={16} />
          <span>{exito}</span>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Asignar Ronda */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Formulario Asignación */}
          <div className="glass-card rounded-2xl border border-slate-800/80 p-5 space-y-4">
            <h3 className="text-lg font-bold text-white Outfit flex items-center gap-2">
              <UserCheck size={20} className="text-campestre-green" />
              <span>Asignar Cadi a Socios (Iniciar Ronda)</span>
            </h3>
            
            <form onSubmit={handleIniciarRonda} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Selector de Cadi */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Seleccionar Cadi Disponible:</label>
                  <select
                    value={cadiSeleccionado}
                    onChange={(e) => setCadiSeleccionado(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                  >
                    <option value="">-- Seleccionar Cadi Disponible --</option>
                    {cadis.filter(c => c.estado === 'DISPONIBLE').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.numero_cadi} - {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro buscador de socios */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Buscar Socios por Nombre / Código:</label>
                  <input
                    type="text"
                    placeholder="E.g. Juan o SOCIO-10..."
                    value={busquedaSocio}
                    onChange={(e) => setBusquedaSocio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                  />
                </div>

              </div>

              {/* Lista multiselección */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Selecciona los Socios en la Ronda ({sociosSeleccionados.length} seleccionados):</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-slate-950/40 p-3.5 border border-slate-850 rounded-2xl">
                  {sociosFiltrados.length === 0 ? (
                    <div className="col-span-2 text-center text-slate-500 py-4 text-xs">
                      No se encontraron socios.
                    </div>
                  ) : (
                    sociosFiltrados.map((s) => (
                      <label
                        key={s.id}
                        className={`flex items-center space-x-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          sociosSeleccionados.includes(s.id)
                            ? 'bg-campestre-green/10 border-campestre-green/30 text-white font-bold'
                            : 'bg-slate-900/35 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={sociosSeleccionados.includes(s.id)}
                          onChange={() => toggleSocioSeleccionado(s.id)}
                          className="rounded bg-slate-800 border-slate-700 text-campestre-green focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <span className="truncate">{s.nombre} <span className="text-[10px] text-campestre-gold font-mono block">#{s.codigo_socio}</span></span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={asignando || !cadiSeleccionado || sociosSeleccionados.length === 0}
                className="w-full py-3 bg-campestre-green text-white hover:bg-campestre-green/90 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play size={14} className="fill-current" />
                <span>Iniciar Ronda (Asignar Cadi a Socios)</span>
              </button>
            </form>
          </div>

          {/* Cadis Activos / En juego */}
          <div className="glass-card rounded-2xl border border-slate-800/80 p-5 space-y-4">
            <h3 className="text-lg font-bold text-white Outfit flex items-center gap-2">
              <Play size={18} className="text-campestre-gold fill-current" />
              <span>Rondas de Golf Activas (Cadis en Juego)</span>
            </h3>

            {cadisActivos.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                No hay rondas activas en este momento. Todos los Cadis están disponibles.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cadisActivos.map((ca) => (
                  <div key={ca.id} className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-white font-mono text-sm">{ca.numero_cadi}</span>
                          <h4 className="text-xs font-semibold text-slate-350 block capitalize mt-0.5">{ca.nombre}</h4>
                        </div>
                        <span className="bg-blue-500/10 text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider">
                          En Juego
                        </span>
                      </div>

                      {/* Socios asignados */}
                      <div className="mt-3 space-y-1">
                        <span className="text-[10px] text-slate-550 block font-bold uppercase tracking-wider">Socios en Ronda:</span>
                        <div className="space-y-1">
                          {ca.clientes.map((c) => (
                            <div key={c.id} className="text-[11px] text-white flex justify-between bg-slate-950/40 p-1.5 rounded-lg border border-slate-900">
                              <span className="truncate pr-1">{c.nombre}</span>
                              <span className="text-[9px] text-campestre-gold font-mono font-bold">#{c.codigo_socio}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLiberarCadi(ca.id)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white font-semibold rounded-xl text-[10px] flex items-center justify-center space-x-1.5 transition-all border border-slate-700"
                    >
                      <span>Finalizar Ronda / Liberar Cadi</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Columna Derecha: Registrar Cadi y Listado */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Registrar Cadi */}
          <div className="glass-card rounded-2xl border border-slate-800/80 p-5 space-y-4 bg-slate-900/10">
            <h3 className="text-base font-bold text-white Outfit flex items-center gap-2">
              <UserPlus size={16} className="text-campestre-gold" />
              <span>Registrar Nuevo Cadi</span>
            </h3>
            
            <form onSubmit={handleCrearCadi} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Código de Cadi (Único):</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. CADI-105"
                  value={numeroCadi}
                  onChange={(e) => setNumeroCadi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Roberto Sánchez López"
                  value={nombreCadi}
                  onChange={(e) => setNombreCadi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono (Opcional):</label>
                <input
                  type="text"
                  placeholder="E.g. 555-123-4567"
                  value={telefonoCadi}
                  onChange={(e) => setTelefonoCadi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={creandoCadi}
                className="w-full py-2.5 bg-campestre-gold text-slate-950 hover:bg-campestre-gold/90 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg"
              >
                {creandoCadi ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Dar de Alta Cadi</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Listado Completo de Cadis */}
          <div className="glass-card rounded-2xl border border-slate-800/80 p-5 space-y-4 bg-slate-900/10">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white Outfit">Catálogo de Cadis</h3>
              <span className="text-[10px] bg-slate-950 px-2.5 py-1 rounded-full text-slate-450 border border-slate-900 font-bold">{cadis.length} Registrados</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {cadis.length === 0 ? (
                <div className="text-center text-slate-500 py-6 text-xs">No hay Cadis registrados en el sistema.</div>
              ) : (
                cadis.map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-3 bg-slate-950/25 border border-slate-850 rounded-xl hover:bg-slate-950/40 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-white font-mono">{c.numero_cadi}</span>
                      <span className="text-xs text-slate-400 capitalize block">{c.nombre}</span>
                      <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded border mt-1.5 uppercase tracking-wider ${
                        c.estado === 'DISPONIBLE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : c.estado === 'EN_RONDA' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}>
                        {c.estado}
                      </span>
                    </div>

                    <button
                      onClick={() => handleEliminarCadi(c.id)}
                      className="p-1.5 bg-slate-900 border border-slate-850 text-red-400 hover:text-white hover:bg-red-500/10 rounded-lg hover:border-red-500/20 transition-all"
                      title="Eliminar Cadi"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
