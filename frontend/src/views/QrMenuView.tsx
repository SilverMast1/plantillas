import React, { useState } from 'react';
import { QrCode, Smartphone, Sparkles, Utensils, CheckCircle2, Copy, Eye, Plus, Trash2, ExternalLink } from 'lucide-react';
import brandingConfig from '../config/branding.json';

interface MenuItem {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
  descripcion: string;
  destacado?: boolean;
}

const INITIAL_MENU: MenuItem[] = [
  { id: '1', nombre: 'Tacos de Asada (Orden)', precio: 85, categoria: 'Especialidades', descripcion: '3 tacos en tortilla de maíz con carne asada al carbón, cilantro y cebolla.', destacado: true },
  { id: '2', nombre: 'Hamburguesa Especial Campestre', precio: 120, categoria: 'Especialidades', descripcion: 'Carne Sirloin 200g, queso gouda, tocino crujiente y papas a la francesa.', destacado: true },
  { id: '3', nombre: 'Cerveza Artesanal 355ml', precio: 65, categoria: 'Bebidas', descripcion: 'Cerveza clara u oscura de cervecería local.' },
  { id: '4', nombre: 'Pizza Pepperoni Familiar', precio: 240, categoria: 'Pizzas', descripcion: 'Masa artesanal, salsa pomodoro, mozzarella y pepperoni especial.' },
  { id: '5', nombre: 'Agua Fresca de Jamaica 1L', precio: 40, categoria: 'Bebidas', descripcion: 'Hecha con jamaica natural y hielo triturado.' }
];

export default function QrMenuView() {
  const [items, setItems] = useState<MenuItem[]>(INITIAL_MENU);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [copiadoUrl, setCopiadoUrl] = useState(false);

  // Formulario nuevo producto
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('Especialidades');
  const [descripcion, setDescripcion] = useState('');

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.href)}`;

  const handleAgregarItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !precio) return;
    const nuevo: MenuItem = {
      id: String(Date.now()),
      nombre,
      precio: parseFloat(precio),
      categoria,
      descripcion: descripcion || 'Preparado con ingredientes frescos.',
      destacado: false,
    };
    setItems([...items, nuevo]);
    setNombre('');
    setPrecio('');
    setDescripcion('');
  };

  const handleEliminar = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleCopiarEnlace = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiadoUrl(true);
    setTimeout(() => setCopiadoUrl(false), 2000);
  };

  const categoriasUnicas = ['TODAS', ...Array.from(new Set(items.map(i => i.categoria)))];
  const itemsFiltrados = categoriaFiltro === 'TODAS' ? items : items.filter(i => i.categoria === categoriaFiltro);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <QrCode size={14} />
            <span>Módulo de Menú Digital QR para Clientes</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight Outfit">
            Carta Digital Interactiva para Smartphones
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Los clientes escanean el código QR desde su mesa o habitación para consultar productos y realizar pedidos.
          </p>
        </div>

        <button
          onClick={handleCopiarEnlace}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 transition-all btn-premium"
        >
          {copiadoUrl ? <CheckCircle2 size={16} /> : <Copy size={16} />}
          <span>{copiadoUrl ? '¡Enlace Copiado!' : 'Copiar Enlace del Menú'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda & Centro: Administración de la Carta Digital */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agregar Nuevo Producto a la Carta */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Plus size={16} className="text-teal-400" />
              <span>Agregar Platillo / Bebida al Menú Digital</span>
            </h2>

            <form onSubmit={handleAgregarItem} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nombre del Platillo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Precio ($ MXN)"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="Especialidades">Especialidades</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Pizzas">Pizzas</option>
                <option value="Postres">Postres</option>
              </select>
              <input
                type="text"
                placeholder="Descripción del platillo (opcional)"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl py-2 px-4 shadow-md transition-all"
              >
                Agregar al Menú
              </button>
            </form>
          </div>

          {/* Lista de Productos en la Carta */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Utensils size={16} className="text-amber-400" />
                <span>Platillos en el Menú ({items.length})</span>
              </h2>
              {/* Filtro por Categoría */}
              <div className="flex space-x-1">
                {categoriasUnicas.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaFiltro(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      categoriaFiltro === cat ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {itemsFiltrados.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-xs">{item.nombre}</span>
                      {item.destacado && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{item.descripcion}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-extrabold text-teal-400 text-sm">${item.precio.toFixed(2)}</span>
                    <button
                      onClick={() => handleEliminar(item.id)}
                      className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Generador de QR & Simulador de Smartphone */}
        <div className="space-y-6">
          {/* Tarjeta de Código QR Imprimible */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 text-center space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center justify-center space-x-2">
              <QrCode size={18} className="text-teal-400" />
              <span>Código QR de la Mesa</span>
            </h2>

            <div className="bg-white p-3 rounded-2xl inline-block shadow-xl">
              <img src={qrUrl} alt="QR Code Menú Digital" className="w-44 h-44 mx-auto" />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Imprime este código en acrílicos de mesa o servilleteros. Los clientes lo escanean con la cámara de su smartphone.
            </p>

            <button
              onClick={() => window.print()}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl border border-slate-700 transition-all"
            >
              Imprimir Plantilla de Mesa
            </button>
          </div>

          {/* Simulador de Smartphone en Vivo */}
          <div className="glass-card p-5 rounded-2xl border border-teal-500/30 bg-slate-950 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-teal-400">
              <span className="flex items-center space-x-1.5">
                <Smartphone size={16} />
                <span>Simulador Smartphone Cliente</span>
              </span>
              <span className="text-[10px] text-slate-500">Vista previa en vivo</span>
            </div>

            {/* Pantalla del Celular */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-inner max-h-72 overflow-y-auto">
              <div className="text-center border-b border-slate-800 pb-2">
                <span className="font-extrabold text-xs text-white block">{brandingConfig.companyName}</span>
                <span className="text-[9px] text-teal-400 uppercase tracking-wider">Menú Digital de Mesa #4</span>
              </div>

              <div className="space-y-2">
                {items.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-bold text-slate-200 block">{item.nombre}</span>
                      <span className="text-[9px] text-slate-400">${item.precio.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => alert(`¡${item.nombre} agregado al pedido digital del cliente!`)}
                      className="px-2 py-1 bg-teal-600 text-white rounded-lg font-bold text-[9px]"
                    >
                      Pedir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
