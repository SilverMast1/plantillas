import React, { useState } from 'react';
import { Download, Sparkles, Database, Layers, CheckCircle2, Copy, RefreshCw, Eye, Settings, Store, Utensils, Flag, ShoppingBag, Rocket, DollarSign, Send, FileText, QrCode, Truck } from 'lucide-react';
import { useStore } from '../store';

interface Preset {
  id: string;
  name: string;
  description: string;
  icon: any;
  database: 'sqlite' | 'postgresql';
  companyName: string;
  appName: string;
  tagline: string;
  features: {
    pos: boolean;
    cargos: boolean;
    dividirCadi: boolean;
    ventasTurno: boolean;
    admin: boolean;
    stock: boolean;
    insumos: boolean;
    facturacion: boolean;
    qrMenu: boolean;
    delivery: boolean;
  };
}

const PRESETS: Preset[] = [
  {
    id: 'restaurante',
    name: 'Plantilla Restaurante / Bar',
    description: 'Ideal para negocios de alimentos con comensales, división de cuentas en mesa y control de comandas.',
    icon: Utensils,
    database: 'sqlite',
    companyName: 'Restaurante & Bar',
    appName: 'POS Gastronómico',
    tagline: 'Gestión de Mesas y Comandas',
    features: { pos: true, cargos: false, dividirCadi: true, ventasTurno: true, admin: true, stock: true, insumos: true, facturacion: false, qrMenu: true, delivery: true }
  },
  {
    id: 'snack',
    name: 'Plantilla Tienda / Snack / Retail',
    description: 'Enfocada en venta rápida por mostrador, código de barras y control estricto de inventario de productos.',
    icon: ShoppingBag,
    database: 'sqlite',
    companyName: 'Snack & Express',
    appName: 'POS Mostrador',
    tagline: 'Venta Rápida e Inventario',
    features: { pos: true, cargos: false, dividirCadi: false, ventasTurno: true, admin: true, stock: true, insumos: false, facturacion: true, qrMenu: false, delivery: true }
  },
  {
    id: 'club',
    name: 'Plantilla Club / Cadi System',
    description: 'Diseñada para clubes recreativos, campos de golf y áreas asociadas con cargos a cuenta de socios.',
    icon: Flag,
    database: 'postgresql',
    companyName: 'Club Campestre',
    appName: 'Cadi System POS',
    tagline: 'Control de Cuentas y Socios',
    features: { pos: true, cargos: true, dividirCadi: true, ventasTurno: true, admin: true, stock: true, insumos: true, facturacion: true, qrMenu: true, delivery: false }
  }
];

export default function TemplateGeneratorView() {
  const { setCurrentView } = useStore();
  const [selectedPreset, setSelectedPreset] = useState<string>('restaurante');
  const [dbProvider, setDbProvider] = useState<'sqlite' | 'postgresql'>('sqlite');
  const [companyName, setCompanyName] = useState('Mi Negocio');
  const [appName, setAppName] = useState('POS System');
  const [tagline, setTagline] = useState('Punto de Venta');
  const [features, setFeatures] = useState({
    pos: true,
    cargos: true,
    dividirCadi: true,
    ventasTurno: true,
    admin: true,
    stock: true,
    insumos: true,
    facturacion: true,
    qrMenu: true,
    delivery: true
  });

  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedCotizacion, setCopiedCotizacion] = useState(false);

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setDbProvider(preset.database);
      setCompanyName(preset.companyName);
      setAppName(preset.appName);
      setTagline(preset.tagline);
      setFeatures({ ...preset.features });
    }
  };

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getGeneratedJSON = () => {
    return JSON.stringify({
      branding: {
        companyName,
        appName,
        tagline,
        logoUrl: ''
      },
      database: {
        provider: dbProvider,
        url: dbProvider === 'sqlite' ? 'file:./dev.db' : 'postgresql://user:pass@localhost:5432/mydb'
      },
      features: {
        pos: { enabled: features.pos, label: "Ventas" },
        cargos: { enabled: features.cargos, label: "Cargos a Socios" },
        dividirCadi: { enabled: features.dividirCadi, label: "Dividir Cuentas (Cadi)" },
        ventasTurno: { enabled: features.ventasTurno, label: "Ventas de Turno" },
        admin: { enabled: features.admin, label: "Gestión Administrativa" },
        stock: { enabled: features.stock, label: "Inventario y Stock" },
        insumos: { enabled: features.insumos, label: "Insumos de Comida" },
        facturacion: { enabled: features.facturacion, label: "Facturación CFDI" },
        qrMenu: { enabled: features.qrMenu, label: "Menú Digital QR" },
        delivery: { enabled: features.delivery, label: "Pedidos Domicilio" }
      }
    }, null, 2);
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(getGeneratedJSON());
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2500);
  };

  const handleDownloadJson = () => {
    const jsonStr = getGeneratedJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla-${companyName.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
  };

  const activeModulesCount = Object.values(features).filter(Boolean).length;
  
  // Precios Bajos + Mensualidad
  const pagoInicialConfig = 1299;
  const mensualidadConfig = 299 + (activeModulesCount > 6 ? 100 : 0);

  const handleCopyCotizacionWhatsApp = () => {
    const texto = `Hola ${companyName}! 🚀
Te presento la propuesta para tu nuevo Sistema POS (${appName}):

📌 *Módulos Incluidos (${activeModulesCount}):*
• Marca y Logo Personalizado (${companyName})
• Motor de Base de datos: ${dbProvider.toUpperCase()}
• Módulos activos: ${Object.entries(features).filter(([_, v]) => v).map(([k]) => k).join(', ')}
• Soporte Multicaja y Control de Turnos
• Funcionamiento Offline

💰 *Plan de Precios Accesible:*
• 🛠️ *Pago Inicial de Instalación & Configuración:* $${pagoInicialConfig.toLocaleString('es-MX')} MXN
• 🔄 *Mensualidad (Soporte, Servidor & Nube):* $${mensualidadConfig.toLocaleString('es-MX')} MXN / mes

¿Te gustaría probar una demo en vivo ahora mismo?`;

    navigator.clipboard.writeText(texto);
    setCopiedCotizacion(true);
    setTimeout(() => setCopiedCotizacion(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner estilo Presentación de Producto */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/50 relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-campestre-gold/10 border border-campestre-gold/30 text-campestre-gold text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Generador & Catálogo de Plantillas POS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight Outfit">
            Personaliza y Demuestra la Plantilla a tu Cliente
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Selecciona un estilo predefinido o personaliza los botones, logo y base de datos. Puedes probar la plantilla terminada en tiempo real o descargar la configuración.
          </p>
        </div>
      </div>

      {/* 1. Presets de Plantillas */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Store size={20} className="text-campestre-gold" />
          <span>1. Elige un Estilo de Plantilla Preconfigurado</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-campestre-gold ring-2 ring-campestre-gold/30 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${isSelected ? 'bg-campestre-gold text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                      <Icon size={22} />
                    </div>
                    {isSelected && <CheckCircle2 size={20} className="text-campestre-gold" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{preset.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{preset.description}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>BD: {preset.database.toUpperCase()}</span>
                  <span>{Object.values(preset.features).filter(Boolean).length} Módulos</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Personalización Visual de Módulos y Marca */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Izquierda: Configuración de Botones y Base de datos */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Settings size={18} className="text-emerald-400" />
            <span>2. Personalizar Módulos & Datos</span>
          </h2>

          {/* Nombre y Marca */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">Nombre del Negocio / Empresa</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-campestre-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nombre del Sistema</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-campestre-gold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Motor de Base de Datos</label>
              <select
                value={dbProvider}
                onChange={(e: any) => setDbProvider(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-campestre-gold"
              >
                <option value="sqlite">SQLite (Local/Archivos)</option>
                <option value="postgresql">PostgreSQL (Servidor/Nube)</option>
              </select>
            </div>
          </div>

          {/* Switcheo de Botones */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-slate-300 block">Seleccionar Módulos / Botones Activos:</label>
            <div className="space-y-2">
              {[
                { key: 'pos', label: 'Ventas (Punto de Venta POS)', desc: 'Caja rápida de cobro' },
                { key: 'cargos', label: 'Cargos a Socios / Créditos', desc: 'Cuentas abiertas por cliente' },
                { key: 'dividirCadi', label: 'Dividir Cuentas (Cadi)', desc: 'Cuentas divididas entre comensales' },
                { key: 'ventasTurno', label: 'Ventas de Turno', desc: 'Control de caja y turnos de empleados' },
                { key: 'admin', label: 'Gestión Administrativa', desc: 'Reportes y cortes globales' },
                { key: 'stock', label: 'Inventario y Stock', desc: 'Control de existencias de productos' },
                { key: 'insumos', label: 'Insumos de Comida', desc: 'Recetas e ingredientes por platillo' },
                { key: 'facturacion', label: 'Facturación Electrónica', desc: 'Generación de facturas CFDI' },
                { key: 'qrMenu', label: 'Menú Digital QR', desc: 'Carta digital para smartphones' },
                { key: 'delivery', label: 'Pedidos a Domicilio', desc: 'Control de pedidos y envíos' },
              ].map(({ key, label, desc }) => {
                const isEnabled = (features as any)[key];
                return (
                  <div
                    key={key}
                    onClick={() => toggleFeature(key as any)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isEnabled ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-950 border-slate-800 opacity-60'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{label}</span>
                      <span className="text-[10px] text-slate-400">{desc}</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 ${isEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'}`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Vista Previa, Botón de Demo Directa y Cotizador Comercial */}
        <div className="space-y-6">
          {/* Vista Previa Interactiva */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Eye size={18} className="text-amber-400" />
                <span>Vista Previa de la Interfaz</span>
              </h2>
              <button
                onClick={() => setCurrentView('pos')}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg flex items-center space-x-1 transition-all"
              >
                <Rocket size={14} />
                <span>Ir al POS en Vivo</span>
              </button>
            </div>

            {/* Simulador de Header */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                    {companyName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{companyName}</span>
                    <span className="text-[9px] text-slate-400 uppercase">{appName}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {dbProvider.toUpperCase()}
                </span>
              </div>

              {/* Simulador de Botones de Navegación */}
              <div className="flex flex-wrap gap-1.5">
                {features.pos && <span className="text-[11px] px-2.5 py-1 rounded-lg bg-campestre-green text-white font-semibold">Ventas</span>}
                {features.cargos && <span className="text-[11px] px-2.5 py-1 rounded-lg bg-campestre-gold text-slate-950 font-semibold">Cargos a Socios</span>}
                {features.dividirCadi && <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold">Dividir Cuentas</span>}
                {features.ventasTurno && <span className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-600 text-white font-semibold">Ventas de Turno</span>}
                {features.admin && <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 font-semibold">Admin</span>}
                {features.stock && <span className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-650 text-white font-semibold">Stock</span>}
                {features.insumos && <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold">Insumos</span>}
                {features.facturacion && <span className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold">Facturación</span>}
                {features.qrMenu && <span className="text-[11px] px-2.5 py-1 rounded-lg bg-teal-600 text-white font-semibold">Menú QR</span>}
                {features.delivery && <span className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold">Delivery</span>}
              </div>
            </div>
          </div>

          {/* Exportación y Descarga */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Download size={18} className="text-emerald-400" />
              <span>3. Exportar Configuración</span>
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadJson}
                className="flex-1 btn-gold py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg"
              >
                <Download size={16} />
                <span>Descargar JSON (.json)</span>
              </button>

              <button
                onClick={handleCopyConfig}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all border border-slate-700"
              >
                {copiedConfig ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span>{copiedConfig ? '¡Copiado!' : 'Copiar Configuración'}</span>
              </button>
            </div>
          </div>

          {/* Cotizador Comercial para Vender al Cliente (Precios Bajos + Mensualidad) */}
          <div className="glass-card p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-amber-950/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="text-base font-bold text-amber-400 flex items-center space-x-2">
                <DollarSign size={18} />
                <span>Plan de Pago Sugerido</span>
              </h2>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Pago Inicial + Mensualidad</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">
                  ${pagoInicialConfig.toLocaleString('es-MX')} + ${mensualidadConfig.toLocaleString('es-MX')}/mes
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Instalación Única</span>
                <span className="font-extrabold text-white text-sm">${pagoInicialConfig.toLocaleString('es-MX')} MXN</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Suscripción Mensual</span>
                <span className="font-extrabold text-emerald-400 text-sm">${mensualidadConfig.toLocaleString('es-MX')} MXN / mes</span>
              </div>
            </div>

            <button
              onClick={handleCopyCotizacionWhatsApp}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all"
            >
              {copiedCotizacion ? <CheckCircle2 size={16} /> : <Send size={16} />}
              <span>{copiedCotizacion ? '¡Propuesta Copiada!' : 'Copiar Propuesta para WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
