import React, { useState } from 'react';
import { FileText, Plus, Search, Download, CheckCircle2, DollarSign, Calendar, Building, ShieldCheck, Printer, RefreshCw, Send } from 'lucide-react';

interface Factura {
  id: string;
  folio: string;
  rfc: string;
  razonSocial: string;
  fecha: string;
  total: number;
  metodoPago: string;
  estado: 'TIMBRADA' | 'PENDIENTE' | 'CANCELADA';
  usoCFDI: string;
}

const INITIAL_FACTURAS: Factura[] = [
  { id: '1', folio: 'F-2026-001', rfc: 'XAXX010101000', razonSocial: 'PÚBLICO EN GENERAL', fecha: new Date().toLocaleDateString('es-MX'), total: 350.00, metodoPago: 'PUE - Efectivo', estado: 'TIMBRADA', usoCFDI: 'S01 - Sin efectos fiscales' },
  { id: '2', folio: 'F-2026-002', rfc: 'GOMR850412H78', razonSocial: 'ROBERTO GÓMEZ MARTÍNEZ', fecha: new Date().toLocaleDateString('es-MX'), total: 1240.50, metodoPago: 'PPD - Transferencia', estado: 'TIMBRADA', usoCFDI: 'G03 - Gastos en general' },
  { id: '3', folio: 'F-2026-003', rfc: 'CMA100518K92', razonSocial: 'CLUB CAMPESTRE S.A. DE C.V.', fecha: new Date().toLocaleDateString('es-MX'), total: 5800.00, metodoPago: 'PUE - Tarjeta de Crédito', estado: 'TIMBRADA', usoCFDI: 'G03 - Gastos en general' },
];

export default function FacturacionView() {
  const [facturas, setFacturas] = useState<Factura[]>(INITIAL_FACTURAS);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
  
  // Formulario nueva factura
  const [rfc, setRfc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [monto, setMonto] = useState('');
  const [usoCFDI, setUsoCFDI] = useState('G03 - Gastos en general');
  const [metodoPago, setMetodoPago] = useState('PUE - Efectivo');
  const [generando, setGenerando] = useState(false);
  const [exitoMsg, setExitoMsg] = useState('');

  const handleCrearFactura = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerando(true);
    setExitoMsg('');

    setTimeout(() => {
      const nueva: Factura = {
        id: String(Date.now()),
        folio: `F-2026-00${facturas.length + 1}`,
        rfc: rfc.toUpperCase() || 'XAXX010101000',
        razonSocial: razonSocial.toUpperCase() || 'PÚBLICO EN GENERAL',
        fecha: new Date().toLocaleDateString('es-MX'),
        total: parseFloat(monto) || 150.00,
        metodoPago,
        estado: 'TIMBRADA',
        usoCFDI,
      };

      setFacturas([nueva, ...facturas]);
      setGenerando(false);
      setExitoMsg(`¡Factura ${nueva.folio} timbrada exitosamente con el SAT!`);
      setRfc('');
      setRazonSocial('');
      setMonto('');
      setTimeout(() => {
        setExitoMsg('');
        setMostrarModalNueva(false);
      }, 2000);
    }, 1200);
  };

  const facturasFiltradas = facturas.filter(f =>
    f.rfc.toLowerCase().includes(busqueda.toLowerCase()) ||
    f.razonSocial.toLowerCase().includes(busqueda.toLowerCase()) ||
    f.folio.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <FileText size={14} />
            <span>Módulo de Facturación SAT CFDI 4.0</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight Outfit">
            Gestión y Timbrado de Facturas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Emisión inmediata de comprobantes fiscales digitales para clientes y ventas globales del día.
          </p>
        </div>

        <button
          onClick={() => setMostrarModalNueva(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 transition-all btn-premium"
        >
          <Plus size={16} />
          <span>Nueva Factura CFDI</span>
        </button>
      </div>

      {/* Buscador & Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center space-x-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <FileText size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Total Facturado</span>
            <span className="text-lg font-extrabold text-white">
              ${facturas.reduce((acc, f) => acc + f.total, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Estatus SAT PAC</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Conectado / Con timbres</span>
            </span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Building size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Régimen Fiscal</span>
            <span className="text-xs font-bold text-slate-200">601 - General de Ley Personas Morales</span>
          </div>
        </div>
      </div>

      {/* Buscador de comprobantes */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Buscar por Folio, RFC o Razón Social..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Tabla de Facturas */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Folio</th>
                <th className="py-3 px-4">RFC Cliente</th>
                <th className="py-3 px-4">Razón Social</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Uso CFDI</th>
                <th className="py-3 px-4 text-right">Monto Total</th>
                <th className="py-3 px-4 text-center">Estado SAT</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {facturasFiltradas.map((f) => (
                <tr key={f.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-400">{f.folio}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-200">{f.rfc}</td>
                  <td className="py-3 px-4 font-semibold text-white">{f.razonSocial}</td>
                  <td className="py-3 px-4 text-slate-400">{f.fecha}</td>
                  <td className="py-3 px-4 text-slate-400">{f.usoCFDI}</td>
                  <td className="py-3 px-4 text-right font-extrabold text-white">${f.total.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {f.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => alert(`Descargando XML de la factura ${f.folio}`)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg"
                        title="Descargar XML"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => alert(`Imprimiendo vista previa PDF de la factura ${f.folio}`)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                        title="Ver PDF"
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Emisión Nueva Factura */}
      {mostrarModalNueva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-4 relative animate-fade-in">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileText className="text-blue-400" size={20} />
              <span>Emitir Factura Electrónica CFDI 4.0</span>
            </h3>

            {exitoMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl text-center font-medium flex items-center justify-center space-x-2">
                <CheckCircle2 size={16} />
                <span>{exitoMsg}</span>
              </div>
            )}

            <form onSubmit={handleCrearFactura} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">RFC Receptor</label>
                <input
                  type="text"
                  required
                  placeholder="ej. GOMR850412H78"
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nombre o Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="ej. ROBERTO GÓMEZ MARTÍNEZ"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Monto a Facturar</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="0.00"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Método de Pago</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="PUE - Efectivo">PUE - Efectivo</option>
                    <option value="PUE - Tarjeta">PUE - Tarjeta</option>
                    <option value="PPD - Transferencia">PPD - Transferencia</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModalNueva(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={generando}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5"
                >
                  {generando ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
                  <span>{generando ? 'Timbrando...' : 'Timbrar Factura'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
