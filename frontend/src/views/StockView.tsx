import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { RefreshCw, ArrowLeftRight, AlertTriangle, Check, ShieldAlert, Package, Search, Edit2, Trash2, Plus } from 'lucide-react';

interface ProductoStock {
  id: number;
  codigo_barras: string | null;
  nombre: string;
  categoria: string | null;
  precio_venta: number;
  stockBar: number;
  stockSnack: number;
  stockPalapa: number;
}

export default function StockView() {
  const { token } = useStore();
  const [productos, setProductos] = useState<ProductoStock[]>([]);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [mostrarStockCritico, setMostrarStockCritico] = useState(false);

  // Historial de Mermas
  const [mostrarModalMermas, setMostrarModalMermas] = useState(false);
  const [mermas, setMermas] = useState<any[]>([]);
  const [cargandoMermas, setCargandoMermas] = useState(false);

  // Modos de Panel
  const [panelMode, setPanelMode] = useState<'traspaso' | 'editar' | 'merma' | 'sumar_stock'>('traspaso');

  // Formulario de Merma
  const [productoMermaId, setProductoMermaId] = useState('');
  const [areaMerma, setAreaMerma] = useState('1');
  const [cantidadMerma, setCantidadMerma] = useState('');
  const [motivoMerma, setMotivoMerma] = useState('');
  const [mermando, setMermando] = useState(false);

  // Formulario de Sumar Stock
  const [sumarProductoId, setSumarProductoId] = useState('');
  const [sumarArea, setSumarArea] = useState('1');
  const [sumarCantidad, setSumarCantidad] = useState('');
  const [sumandoStock, setSumandoStock] = useState(false);

  // Formulario de Traspaso
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');
  const [areaOrigen, setAreaOrigen] = useState('1'); // 1: Bar, 2: Snack, 3: Palapa
  const [areaDestino, setAreaDestino] = useState('2');
  const [cantidadTraspaso, setCantidadTraspaso] = useState('');
  const [motivoTraspaso, setMotivoTraspaso] = useState('');
  const [traspasando, setTraspasando] = useState(false);

  // Formulario de Edición de Producto y Stock Físico
  const [editProductoId, setEditProductoId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editPrecioVenta, setEditPrecioVenta] = useState('');
  const [editStockBar, setEditStockBar] = useState('');
  const [editStockSnack, setEditStockSnack] = useState('');
  const [editStockPalapa, setEditStockPalapa] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [eliminandoProducto, setEliminandoProducto] = useState(false);

  useEffect(() => {
    if (token) {
      cargarStockData();
    }
  }, [token]);

  const cargarStockData = async () => {
    setCargando(true);
    setError('');
    try {
      // Fetch products for all three areas
      const [resBar, resSnack, resPalapa] = await Promise.all([
        fetch('/api/pos/productos/1', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/pos/productos/2', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/pos/productos/3', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!resBar.ok || !resSnack.ok || !resPalapa.ok) {
        throw new Error('Error al obtener stock de una o más áreas');
      }

      const [barProds, snackProds, palapaProds] = await Promise.all([
        resBar.json(),
        resSnack.json(),
        resPalapa.json(),
      ]);

      // Compile data
      const prodsMap: { [id: number]: ProductoStock } = {};
      const processList = (list: any[], areaKey: 'stockBar' | 'stockSnack' | 'stockPalapa') => {
        list.forEach((p) => {
          if (!prodsMap[p.id]) {
            prodsMap[p.id] = {
              id: p.id,
              codigo_barras: p.codigo_barras,
              nombre: p.nombre,
              categoria: p.categoria,
              precio_venta: p.precio_venta || 0,
              stockBar: 0,
              stockSnack: 0,
              stockPalapa: 0,
            };
          }
          prodsMap[p.id][areaKey] = p.stock;
        });
      };

      processList(barProds, 'stockBar');
      processList(snackProds, 'stockSnack');
      processList(palapaProds, 'stockPalapa');

      const compiledList = Object.values(prodsMap).sort((a, b) => a.nombre.localeCompare(b.nombre));
      setProductos(compiledList);

      // Auto-select first product for transfer if not set
      if (compiledList.length > 0) {
        if (!productoSeleccionadoId) setProductoSeleccionadoId(compiledList[0].id.toString());
        if (!productoMermaId) setProductoMermaId(compiledList[0].id.toString());
        if (!sumarProductoId) setSumarProductoId(compiledList[0].id.toString());
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de red al cargar el inventario');
    } finally {
      setCargando(false);
    }
  };

  const cargarMermas = async () => {
    setCargandoMermas(true);
    try {
      const res = await fetch('/api/admin/inventario/mermas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMermas(data);
      }
    } catch (err) {
      console.error('Error al cargar mermas:', err);
    } finally {
      setCargandoMermas(false);
    }
  };

  const handleTraspaso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionadoId || !areaOrigen || !areaDestino || !cantidadTraspaso) {
      setError('Todos los campos del traspaso son requeridos');
      return;
    }

    const cantidad = parseFloat(cantidadTraspaso);
    if (isNaN(cantidad) || cantidad <= 0) {
      setError('La cantidad a traspasar debe ser mayor a cero');
      return;
    }

    if (areaOrigen === areaDestino) {
      setError('El área de origen y destino deben ser distintas');
      return;
    }

    // Verificar si el origen tiene suficiente stock
    const prod = productos.find((p) => p.id === parseInt(productoSeleccionadoId));
    if (prod) {
      const stockDisponible = 
        areaOrigen === '1' ? prod.stockBar : areaOrigen === '2' ? prod.stockSnack : prod.stockPalapa;
      if (stockDisponible < cantidad) {
        setError(`Stock insuficiente en el área origen. Disponible: ${stockDisponible}, Requerido: ${cantidad}`);
        return;
      }
    }

    setTraspasando(true);
    setError('');
    setMensajeExito('');

    try {
      const res = await fetch('/api/pos/inventario/transferir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          producto_id: productoSeleccionadoId,
          origen_area_id: areaOrigen,
          destino_area_id: areaDestino,
          cantidad: cantidad,
          motivo: motivoTraspaso || 'Traspaso manual entre áreas',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensajeExito(data.message || 'Traspaso completado con éxito');
        setCantidadTraspaso('');
        setMotivoTraspaso('');
        cargarStockData();
        setTimeout(() => setMensajeExito(''), 4000);
      } else {
        throw new Error(data.error || 'Ocurrió un error al procesar el traspaso');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de red al transferir stock');
    } finally {
      setTraspasando(false);
    }
  };

  const handleMerma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoMermaId || !areaMerma || !cantidadMerma || !motivoMerma.trim()) {
      setError('Todos los campos son obligatorios para registrar la merma');
      return;
    }

    const cantidad = parseFloat(cantidadMerma);
    if (isNaN(cantidad) || cantidad <= 0) {
      setError('La cantidad a mermar debe ser un número positivo mayor a cero');
      return;
    }

    const prod = productos.find((p) => p.id === parseInt(productoMermaId));
    if (prod) {
      const stockDisponible = 
        areaMerma === '1' ? prod.stockBar : areaMerma === '2' ? prod.stockSnack : prod.stockPalapa;
      if (stockDisponible < cantidad) {
        setError(`Stock insuficiente en el área para registrar esta merma. Disponible: ${stockDisponible}, Requerido: ${cantidad}`);
        return;
      }
    }

    setMermando(true);
    setError('');
    setMensajeExito('');

    try {
      const res = await fetch('/api/admin/inventario/merma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          producto_id: productoMermaId,
          area_id: areaMerma,
          cantidad: cantidad,
          motivo: motivoMerma.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensajeExito(data.message || 'Merma registrada con éxito');
        setCantidadMerma('');
        setMotivoMerma('');
        cargarStockData();
        setTimeout(() => setMensajeExito(''), 4000);
      } else {
        throw new Error(data.error || 'Error al registrar la merma');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de red al registrar la merma');
    } finally {
      setMermando(false);
    }
  };

  const handleSumarStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sumarProductoId || !sumarArea || !sumarCantidad) {
      setError('Todos los campos son requeridos para sumar stock');
      return;
    }
    const cantidad = parseFloat(sumarCantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      setError('La cantidad a sumar debe ser mayor a cero');
      return;
    }

    const prod = productos.find((p) => p.id === parseInt(sumarProductoId));
    if (!prod) return;

    let stockActual = 0;
    if (sumarArea === '1') stockActual = prod.stockBar;
    else if (sumarArea === '2') stockActual = prod.stockSnack;
    else stockActual = prod.stockPalapa;

    const nuevoStock = stockActual + cantidad;

    setSumandoStock(true);
    setError('');
    setMensajeExito('');

    try {
      const res = await fetch('/api/admin/inventario', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          area_id: parseInt(sumarArea),
          producto_id: prod.id,
          nuevo_stock: nuevoStock,
          motivo: 'Entrada manual de stock',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensajeExito(`Stock sumado correctamente. Nuevo stock: ${nuevoStock}`);
        setSumarCantidad('');
        cargarStockData();
        setTimeout(() => setMensajeExito(''), 4000);
      } else {
        throw new Error(data.error || 'Error al sumar stock');
      }
    } catch (err: any) {
      setError(err.message || 'Error de red');
    } finally {
      setSumandoStock(false);
    }
  };

  const startEdit = (prod: ProductoStock) => {
    setPanelMode('editar');
    setEditProductoId(prod.id);
    setEditNombre(prod.nombre);
    setEditPrecioVenta(prod.precio_venta !== undefined && prod.precio_venta !== null ? prod.precio_venta.toString() : '0');
    setEditStockBar(prod.stockBar.toString());
    setEditStockSnack(prod.stockSnack.toString());
    setEditStockPalapa(prod.stockPalapa.toString());
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductoId || !editNombre.trim()) {
      setError('El nombre del producto es requerido');
      return;
    }

    const nPrecio = parseFloat(editPrecioVenta);
    if (isNaN(nPrecio) || nPrecio < 0) {
      setError('El precio de venta debe ser un número positivo');
      return;
    }

    const nBar = parseFloat(editStockBar);
    const nSnack = parseFloat(editStockSnack);
    const nPalapa = parseFloat(editStockPalapa);

    if (isNaN(nBar) || isNaN(nSnack) || isNaN(nPalapa) || nBar < 0 || nSnack < 0 || nPalapa < 0) {
      setError('Los stocks no pueden ser menores a cero');
      return;
    }

    setGuardandoEdicion(true);
    setError('');
    setMensajeExito('');

    try {
      const prodOriginal = productos.find(p => p.id === editProductoId);
      if (!prodOriginal) throw new Error('Producto no encontrado');

      const promesas = [];

      const nombreCambio = editNombre.trim() !== prodOriginal.nombre;
      const precioCambio = nPrecio !== prodOriginal.precio_venta;
      const barCambio = nBar !== prodOriginal.stockBar;
      const snackCambio = nSnack !== prodOriginal.stockSnack;
      const palapaCambio = nPalapa !== prodOriginal.stockPalapa;

      if (nombreCambio || precioCambio || barCambio) {
        promesas.push(
          fetch('/api/admin/inventario', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              area_id: 1,
              producto_id: editProductoId,
              nuevo_stock: nBar,
              nombre: editNombre.trim(),
              precio_venta: nPrecio,
              motivo: 'Ajuste manual de stock/nombre/precio desde panel administrativo',
            }),
          })
        );
      }

      if (snackCambio) {
        promesas.push(
          fetch('/api/admin/inventario', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              area_id: 2,
              producto_id: editProductoId,
              nuevo_stock: nSnack,
              motivo: 'Ajuste manual de stock desde panel administrativo',
            }),
          })
        );
      }

      if (palapaCambio) {
        promesas.push(
          fetch('/api/admin/inventario', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              area_id: 3,
              producto_id: editProductoId,
              nuevo_stock: nPalapa,
              motivo: 'Ajuste manual de stock desde panel administrativo',
            }),
          })
        );
      }

      if (promesas.length > 0) {
        const respuestas = await Promise.all(promesas);
        for (const res of respuestas) {
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Error al actualizar el producto/stock');
          }
        }
        setMensajeExito('Producto y stock actualizados correctamente');
      }

      setPanelMode('traspaso');
      setEditProductoId(null);
      cargarStockData();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al guardar los cambios del producto');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleEliminarProducto = async () => {
    if (!editProductoId) return;

    const prod = productos.find(p => p.id === editProductoId);
    const confirmacion = window.confirm(`¿Estás seguro de que deseas eliminar el producto "${prod?.nombre || ''}" y todo su stock? Esta acción no se puede deshacer.`);
    if (!confirmacion) return;

    setEliminandoProducto(true);
    setError('');
    setMensajeExito('');

    try {
      const res = await fetch(`/api/admin/productos/${editProductoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setMensajeExito(data.message || 'Producto eliminado con éxito');
        setPanelMode('traspaso');
        setEditProductoId(null);
        cargarStockData();
        setTimeout(() => setMensajeExito(''), 4000);
      } else {
        throw new Error(data.error || 'Error al eliminar el producto');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de red al eliminar el producto');
    } finally {
      setEliminandoProducto(false);
    }
  };

  const prodFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    (p.categoria && p.categoria.toLowerCase().includes(filtro.toLowerCase()))
  );

  // Productos con stock crítico (<= 5 en cualquier área)
  const productosCriticos = productos.filter(
    (p) => p.stockBar <= 5 || p.stockSnack <= 5 || p.stockPalapa <= 5
  );

  const totalCriticos = productosCriticos.length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold Outfit text-white">Inventario, Stock y Almacenes</h2>
          <p className="text-slate-400 text-sm mt-0.5">Gestión y traspasos de stock en tiempo real entre Bar, Snack y Palapa</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setMostrarModalMermas(true);
              cargarMermas();
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-xs font-bold rounded-xl text-red-400 hover:text-red-300 flex items-center justify-center space-x-2 transition-all hover:border-red-500/30 btn-premium"
          >
            <ShieldAlert size={14} />
            <span>Ver Mermas</span>
          </button>
          <button
            onClick={cargarStockData}
            disabled={cargando}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 border border-slate-800 text-xs font-bold rounded-xl text-slate-350 hover:text-white flex items-center justify-center space-x-2 transition-all hover:border-slate-700 btn-premium disabled:opacity-50"
          >
            <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
            <span>Actualizar Inventario</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-2xl flex items-center space-x-2.5">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {mensajeExito && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-2xl flex items-center space-x-2.5">
          <Check size={16} />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl border border-slate-800/80 p-5 flex items-center space-x-4">
          <div className="p-3 bg-campestre-green/10 text-emerald-400 rounded-xl">
            <Package size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 block font-semibold uppercase tracking-wider">Productos Totales:</span>
            <span className="text-2xl font-extrabold text-white Outfit">{productos.length}</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-slate-800/80 p-5 flex items-center space-x-4">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
            <ShieldAlert size={20} className={totalCriticos > 0 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 block font-semibold uppercase tracking-wider">Alertas de Stock Crítico:</span>
            <span className="text-2xl font-extrabold text-red-400 Outfit">{totalCriticos}</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-slate-800/80 p-5 flex items-center space-x-4">
          <div className="p-3 bg-campestre-gold/10 text-campestre-gold rounded-xl">
            <ArrowLeftRight size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 block font-semibold uppercase tracking-wider">Soporte Traspasos:</span>
            <span className="text-sm font-extrabold text-white block mt-0.5">3 Áreas Habilitadas</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla / Resumen de Stock */}
        <div className="lg:col-span-2 space-y-4">
          {/* Alerta y Mini-lista de Productos Críticos */}
          {productosCriticos.length > 0 && (
            <div className="glass-card rounded-2xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
              <div 
                className="flex items-center justify-between text-red-400 cursor-pointer select-none"
                onClick={() => setMostrarStockCritico(!mostrarStockCritico)}
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} className={mostrarStockCritico ? "" : "animate-pulse"} />
                  <h4 className="text-xs font-bold uppercase tracking-wider Outfit">Productos con Stock Crítico (Poco Stock)</h4>
                </div>
                <span className="text-xs bg-red-500/20 px-2 py-1 rounded-lg">
                  {mostrarStockCritico ? 'Ocultar' : 'Mostrar'}
                </span>
              </div>
              
              {mostrarStockCritico && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 animate-fade-in">
                  {productosCriticos.map((prod) => (
                  <div key={`crit-${prod.id}`} className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl text-[11px] flex justify-between items-center">
                    <div>
                      <span className="text-white font-semibold block">{prod.nombre}</span>
                      <span className="text-[9px] text-slate-500">{prod.categoria || 'General'}</span>
                    </div>
                    <div className="flex space-x-1.5 text-center font-mono">
                      {prod.stockBar <= 5 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-455 border border-red-500/20">
                          B: {prod.stockBar}
                        </span>
                      )}
                      {prod.stockSnack <= 5 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-455 border border-red-500/20">
                          S: {prod.stockSnack}
                        </span>
                      )}
                      {prod.stockPalapa <= 5 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-455 border border-red-500/20">
                          P: {prod.stockPalapa}
                        </span>
                      )}
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="glass-card rounded-2xl border border-slate-800/80 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-bold text-white Outfit">Stock por Áreas</h3>
              
              <div className="relative w-full sm:max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Buscar producto o categoría..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="w-full pl-9 py-2 bg-slate-900 border border-slate-800 text-xs text-white rounded-xl placeholder-slate-500 focus:outline-none focus:border-slate-700"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-2">Producto</th>
                    <th className="py-3 px-2">Categoría</th>
                    <th className="py-3 px-2 text-center">Bar</th>
                    <th className="py-3 px-2 text-center">Snack</th>
                    <th className="py-3 px-2 text-center">Palapa</th>
                    <th className="py-3 px-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {cargando && productos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Cargando inventario...
                      </td>
                    </tr>
                  ) : prodFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {filtro ? 'No se encontraron productos coincidentes' : 'Inventario vacío.'}
                      </td>
                    </tr>
                  ) : (
                    prodFiltrados.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3.5 px-2 font-medium text-white">
                          <div>
                            <span className="block">{prod.nombre}</span>
                            <div className="flex items-center space-x-2 text-[9px] text-slate-500 font-mono">
                              <span>#{prod.codigo_barras || prod.id}</span>
                              <span>•</span>
                              <span className="text-campestre-gold font-semibold">${prod.precio_venta !== undefined ? Number(prod.precio_venta).toFixed(2) : '0.00'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-slate-400 capitalize">{prod.categoria || 'General'}</td>
                        <td className="py-3.5 px-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            prod.stockBar <= 5
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20 font-extrabold animate-pulse-slow'
                              : 'text-slate-200'
                          }`}>
                            {prod.stockBar}
                            {prod.stockBar <= 5 && <span className="ml-1 text-[9px]">⚠️</span>}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            prod.stockSnack <= 5
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20 font-extrabold animate-pulse-slow'
                              : 'text-slate-200'
                          }`}>
                            {prod.stockSnack}
                            {prod.stockSnack <= 5 && <span className="ml-1 text-[9px]">⚠️</span>}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            prod.stockPalapa <= 5
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20 font-extrabold animate-pulse-slow'
                              : 'text-slate-200'
                          }`}>
                            {prod.stockPalapa}
                            {prod.stockPalapa <= 5 && <span className="ml-1 text-[9px]">⚠️</span>}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <button
                            onClick={() => startEdit(prod)}
                            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-350 hover:text-white rounded-lg hover:border-slate-700 transition-all"
                            title="Editar Nombre y Stock"
                          >
                            <Edit2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel de Traspaso / Edición de Stock */}
        <div className="lg:col-span-1">
          {panelMode === 'editar' ? (
            <div className="glass-card rounded-2xl border border-slate-800/80 p-5 space-y-4 bg-slate-900/10 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-white Outfit flex items-center gap-2">
                  <Edit2 size={18} className="text-campestre-green" />
                  <span>Editar Producto</span>
                </h3>
                <p className="text-slate-400 text-xs mt-1">Ajusta el nombre del producto y el stock físico de cada área</p>
              </div>

              <form onSubmit={handleGuardarEdicion} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre del Producto</label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Precio de Venta ($)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={editPrecioVenta}
                    onChange={(e) => setEditPrecioVenta(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Stock en Bar (Área 1)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={editStockBar}
                    onChange={(e) => setEditStockBar(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Stock en Snack (Área 2)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={editStockSnack}
                    onChange={(e) => setEditStockSnack(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Stock en Palapa (Área 3)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={editStockPalapa}
                    onChange={(e) => setEditStockPalapa(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPanelMode('traspaso');
                      setEditProductoId(null);
                    }}
                    className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-bold text-slate-300 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoEdicion}
                    className="flex-1 py-3 bg-campestre-green text-white hover:bg-campestre-green/90 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg"
                  >
                    {guardandoEdicion ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <span>Guardar</span>
                    )}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/60 mt-4">
                  <button
                    type="button"
                    disabled={eliminandoProducto}
                    onClick={handleEliminarProducto}
                    className="w-full py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all"
                  >
                    {eliminandoProducto ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                    <span>Eliminar Producto</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selector de modo del panel lateral */}
              <div className="flex bg-slate-900/60 p-1 rounded-xl w-full border border-slate-800/80 flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setPanelMode('sumar_stock')}
                  className={`flex-1 min-w-[30%] py-1.5 text-center text-[10px] font-semibold rounded-lg transition-all ${
                    panelMode === 'sumar_stock'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sumar Stock
                </button>
                <button
                  type="button"
                  onClick={() => setPanelMode('traspaso')}
                  className={`flex-1 min-w-[30%] py-1.5 text-center text-[10px] font-semibold rounded-lg transition-all ${
                    panelMode === 'traspaso'
                      ? 'bg-campestre-gold text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Traspaso
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanelMode('merma');
                    if (productos.length > 0 && !productoMermaId) {
                      setProductoMermaId(productos[0].id.toString());
                    }
                  }}
                  className={`flex-1 min-w-[30%] py-1.5 text-center text-[10px] font-semibold rounded-lg transition-all ${
                    panelMode === 'merma'
                      ? 'bg-red-500/15 text-red-400 border border-red-500/20 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Registrar Merma
                </button>
              </div>

              {panelMode === 'sumar_stock' ? (
                <div className="glass-card rounded-2xl border border-slate-800/80 p-5 space-y-4 bg-slate-900/10 animate-fade-in">
                  <div>
                    <h3 className="text-lg font-bold text-white Outfit flex items-center gap-2">
                      <Plus size={18} className="text-emerald-400" />
                      <span>Sumar Stock Rápido</span>
                    </h3>
                    <p className="text-slate-400 text-[10px] mt-1">Añade inventario a un producto en una ubicación específica</p>
                  </div>

                  <form onSubmit={handleSumarStock} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Producto a sumar</label>
                      <select
                        required
                        value={sumarProductoId}
                        onChange={(e) => setSumarProductoId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500/50"
                      >
                        {productos.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.nombre} (B:{prod.stockBar} S:{prod.stockSnack} P:{prod.stockPalapa})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Área de Ingreso</label>
                        <select
                          required
                          value={sumarArea}
                          onChange={(e) => setSumarArea(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="1">Bar (Principal)</option>
                          <option value="2">Snack</option>
                          <option value="3">Palapa</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Cantidad a Añadir</label>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          required
                          value={sumarCantidad}
                          onChange={(e) => setSumarCantidad(e.target.value)}
                          placeholder="Ej. 10"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={sumandoStock || productos.length === 0}
                      className="w-full py-3 bg-emerald-500 text-white hover:bg-emerald-600 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {sumandoStock ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <span>Sumar Stock al Inventario</span>
                      )}
                    </button>
                  </form>
                </div>
              ) : panelMode === 'merma' ? (
                <div className="glass-card rounded-2xl border border-slate-800/80 p-5 space-y-4 bg-slate-900/10 animate-fade-in">
                  <div>
                    <h3 className="text-lg font-bold text-white Outfit flex items-center gap-2">
                      <ShieldAlert size={18} className="text-red-405" />
                      <span>Registrar Merma</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Registra desperdicio, merma o rotura de stock en un área específica</p>
                  </div>

                  <form onSubmit={handleMerma} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-450 mb-1.5">Producto con Merma</label>
                      <select
                        value={productoMermaId}
                        onChange={(e) => setProductoMermaId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                      >
                        <option value="">-- Seleccionar Producto --</option>
                        {productos.map((p) => {
                          const stockInfo = 
                            areaMerma === '1' ? p.stockBar : areaMerma === '2' ? p.stockSnack : p.stockPalapa;
                          return (
                            <option key={p.id} value={p.id}>
                              {p.nombre} (Stock: {stockInfo})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-455 mb-1.5">Área de la Merma</label>
                      <select
                        value={areaMerma}
                        onChange={(e) => setAreaMerma(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                      >
                        <option value="1">Bar</option>
                        <option value="2">Snack</option>
                        <option value="3">Palapa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-455 mb-1.5">Cantidad Mermada</label>
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        required
                        placeholder="E.g. 2"
                        value={cantidadMerma}
                        onChange={(e) => setCantidadMerma(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-750"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-455 mb-1.5">Motivo de la Merma *</label>
                      <textarea
                        placeholder="E.g. Botella rota, producto caducado..."
                        required
                        value={motivoMerma}
                        onChange={(e) => setMotivoMerma(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-750 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={mermando || productos.length === 0}
                      className="w-full py-3 bg-red-600 hover:bg-red-550 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg disabled:opacity-50"
                    >
                      {mermando ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Registrando Merma...</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={14} />
                          <span>Registrar Merma</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="glass-card rounded-2xl border border-slate-800/80 p-5 space-y-4 bg-slate-900/10">
                  <div>
                    <h3 className="text-lg font-bold text-white Outfit flex items-center gap-2">
                      <ArrowLeftRight size={18} className="text-campestre-gold" />
                      <span>Traspasar Stock</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Transfiere inventario de un almacén/área a otro de manera inmediata</p>
                  </div>

                  <form onSubmit={handleTraspaso} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-450 mb-1.5">Producto a Traspasar</label>
                      <select
                        value={productoSeleccionadoId}
                        onChange={(e) => setProductoSeleccionadoId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                      >
                        <option value="">-- Seleccionar Producto --</option>
                        {productos.map((p) => {
                          const origenStockInfo = 
                            areaOrigen === '1' ? p.stockBar : areaOrigen === '2' ? p.stockSnack : p.stockPalapa;
                          return (
                            <option key={p.id} value={p.id}>
                              {p.nombre} (Stock: {origenStockInfo})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-455 mb-1.5">Área de Origen</label>
                        <select
                          value={areaOrigen}
                          onChange={(e) => setAreaOrigen(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                        >
                          <option value="1">Bar</option>
                          <option value="2">Snack</option>
                          <option value="3">Palapa</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-455 mb-1.5">Área de Destino</label>
                        <select
                          value={areaDestino}
                          onChange={(e) => setAreaDestino(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                        >
                          <option value="1">Bar</option>
                          <option value="2">Snack</option>
                          <option value="3">Palapa</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-455 mb-1.5">Cantidad a Transferir</label>
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        required
                        placeholder="E.g. 5"
                        value={cantidadTraspaso}
                        onChange={(e) => setCantidadTraspaso(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-750"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-455 mb-1.5">Motivo / Notas</label>
                      <textarea
                        placeholder="E.g. Traspaso por evento especial..."
                        value={motivoTraspaso}
                        onChange={(e) => setMotivoTraspaso(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-750 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={traspasando || productos.length === 0}
                      className="w-full py-3 bg-campestre-gold text-slate-950 hover:bg-campestre-gold/90 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-campestre-gold/10 disabled:opacity-50"
                    >
                      {traspasando ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Transfiriendo...</span>
                        </>
                      ) : (
                        <>
                          <ArrowLeftRight size={14} />
                          <span>Confirmar Traspaso</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {mostrarModalMermas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-2xl rounded-3xl border border-slate-800 p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white Outfit flex items-center gap-2">
                  <ShieldAlert size={18} className="text-red-400" />
                  <span>Historial de Mermas</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Listado de productos mermados y motivos registrados</p>
              </div>
              <button
                onClick={() => setMostrarModalMermas(false)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
              >
                Cerrar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {cargandoMermas ? (
                <p className="text-center py-8 text-xs text-slate-500">Cargando historial de mermas...</p>
              ) : mermas.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-500">No se han registrado mermas en el inventario.</p>
              ) : (
                mermas.map((m) => (
                  <div key={m.id} className="bg-slate-900/50 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">{m.producto}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-850 text-slate-400 uppercase font-semibold">{m.area}</span>
                      </div>
                      <p className="text-slate-400"><strong className="text-slate-300">Motivo:</strong> {m.motivo}</p>
                      <p className="text-[10px] text-slate-500">Registrado por: {m.registrado_por} • {new Date(m.fecha).toLocaleString()}</p>
                    </div>
                    <div className="sm:text-right flex sm:flex-col justify-between sm:justify-center items-center">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold tracking-wider">Cantidad</span>
                      <span className="text-lg font-extrabold text-red-405 font-mono">-{m.cantidad}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
