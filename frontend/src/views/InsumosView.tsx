import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { RefreshCw, Plus, Trash2, Edit2, Check, X, AlertTriangle, ArrowLeftRight, Settings, ShoppingBag, ListPlus } from 'lucide-react';

interface Insumo {
  id: number;
  nombre: string;
  stock: number;
  unidad: string;
  stock_minimo: number;
  critico: boolean;
}

interface RecetaIngrediente {
  insumo_id: number;
  nombre_insumo: string;
  unidad: string;
  cantidad: number;
}

export default function InsumosView() {
  const { token } = useStore();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [comidas, setComidas] = useState<any[]>([]); // Productos de categoría comida/desayunos
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Pestaña Activa
  const [activeTab, setActiveTab] = useState<'inventario' | 'recetas'>('inventario');

  // Formulario de Insumo Nuevo / Edición
  const [editId, setEditId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [stock, setStock] = useState('');
  const [unidad, setUnidad] = useState('Kg');
  const [stockMinimo, setStockMinimo] = useState('');
  const [guardandoInsumo, setGuardandoInsumo] = useState(false);

  // Formulación de Recetas
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');
  const [ingredientesReceta, setIngredientesReceta] = useState<RecetaIngrediente[]>([]);
  const [insumoAgregarId, setInsumoAgregarId] = useState('');
  const [cantidadAgregar, setCantidadAgregar] = useState('');
  const [cargandoReceta, setCargandoReceta] = useState(false);
  const [guardandoReceta, setGuardandoReceta] = useState(false);

  useEffect(() => {
    if (token) {
      cargarInsumos();
      cargarComidas();
    }
  }, [token]);

  useEffect(() => {
    if (productoSeleccionadoId) {
      cargarRecetaProducto(productoSeleccionadoId);
    } else {
      setIngredientesReceta([]);
    }
  }, [productoSeleccionadoId]);

  const cargarInsumos = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch('/api/admin/insumos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setInsumos(data);
      } else {
        throw new Error(data.error || 'Error al obtener insumos');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar insumos');
    } finally {
      setCargando(false);
    }
  };

  const cargarComidas = async () => {
    try {
      // Cargamos el catálogo global de productos
      const res = await fetch('/api/admin/productos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        // Filtrar productos que son comida, desayunos, niños o platillos
        const filtrados = data.filter(
          (p) => 
            p.categoria?.toLowerCase() === 'comida' || 
            p.categoria?.toLowerCase() === 'desayunos' ||
            p.categoria?.toLowerCase() === 'niños' ||
            p.categoria?.toLowerCase() === 'platillos'
        );
        setComidas(filtrados);
        if (filtrados.length > 0 && !productoSeleccionadoId) {
          setProductoSeleccionadoId(filtrados[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Error al cargar catálogo de productos:', err);
    }
  };

  const cargarRecetaProducto = async (prodId: string) => {
    setCargandoReceta(true);
    try {
      const res = await fetch(`/api/admin/productos/${prodId}/receta`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setIngredientesReceta(data);
      }
    } catch (err) {
      console.error('Error al obtener receta:', err);
    } finally {
      setCargandoReceta(false);
    }
  };

  const handleGuardarInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !unidad) {
      setError('Nombre y unidad de medida son obligatorios');
      return;
    }

    setGuardandoInsumo(true);
    setError('');
    setExito('');

    const payload = {
      nombre,
      stock: stock ? parseFloat(stock) : 0,
      unidad,
      stock_minimo: stockMinimo ? parseFloat(stockMinimo) : 0,
    };

    try {
      let res;
      if (editId) {
        res = await fetch(`/api/admin/insumos/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/insumos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (res.ok) {
        setExito(data.message || 'Operación realizada con éxito');
        setNombre('');
        setStock('');
        setStockMinimo('');
        setEditId(null);
        cargarInsumos();
        setTimeout(() => setExito(''), 4000);
      } else {
        throw new Error(data.error || 'Ocurrió un error al guardar insumo');
      }
    } catch (err: any) {
      setError(err.message || 'Error de red al guardar insumo');
    } finally {
      setGuardandoInsumo(false);
    }
  };

  const handleEliminarInsumo = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este insumo? Las recetas asociadas podrían verse afectadas.')) {
      return;
    }

    setError('');
    setExito('');

    try {
      const res = await fetch(`/api/admin/insumos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setExito(data.message || 'Insumo eliminado');
        cargarInsumos();
        setTimeout(() => setExito(''), 4000);
      } else {
        throw new Error(data.error || 'Error al eliminar');
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar eliminación');
    }
  };

  const handleEditClick = (ins: Insumo) => {
    setEditId(ins.id);
    setNombre(ins.nombre);
    setStock(ins.stock.toString());
    setUnidad(ins.unidad);
    setStockMinimo(ins.stock_minimo.toString());
  };

  const handleCancelarEdicion = () => {
    setEditId(null);
    setNombre('');
    setStock('');
    setStockMinimo('');
  };

  // Agregar ingrediente temporalmente a la receta local
  const handleAgregarIngredienteLocal = () => {
    if (!insumoAgregarId || !cantidadAgregar) return;
    const cant = parseFloat(cantidadAgregar);
    if (isNaN(cant) || cant <= 0) return;

    const ins = insumos.find((i) => i.id === parseInt(insumoAgregarId));
    if (!ins) return;

    // Verificar si ya existe en la receta local
    if (ingredientesReceta.some((x) => x.insumo_id === ins.id)) {
      setIngredientesReceta(
        ingredientesReceta.map((x) =>
          x.insumo_id === ins.id ? { ...x, cantidad: cant } : x
        )
      );
    } else {
      setIngredientesReceta([
        ...ingredientesReceta,
        {
          insumo_id: ins.id,
          nombre_insumo: ins.nombre,
          unidad: ins.unidad,
          cantidad: cant,
        },
      ]);
    }

    setInsumoAgregarId('');
    setCantidadAgregar('');
  };

  const handleQuitarIngredienteLocal = (insId: number) => {
    setIngredientesReceta(ingredientesReceta.filter((x) => x.insumo_id !== insId));
  };

  const handleGuardarRecetaCompleta = async () => {
    if (!productoSeleccionadoId) return;

    setGuardandoReceta(true);
    setError('');
    setExito('');

    try {
      const res = await fetch(`/api/admin/productos/${productoSeleccionadoId}/receta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ingredientes: ingredientesReceta.map((i) => ({
            insumo_id: i.insumo_id,
            cantidad: i.cantidad,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setExito(data.message || 'Receta guardada correctamente');
        cargarRecetaProducto(productoSeleccionadoId);
        setTimeout(() => setExito(''), 4000);
      } else {
        throw new Error(data.error || 'Error al guardar la receta');
      }
    } catch (err: any) {
      setError(err.message || 'Error de red al guardar receta');
    } finally {
      setGuardandoReceta(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold Outfit text-white">Insumos y Fórmulas de Recetas</h2>
          <p className="text-slate-400 text-sm mt-0.5">Control de materias primas para comidas y formulación de platillos</p>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('inventario')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg btn-premium transition-all ${
              activeTab === 'inventario' ? 'bg-campestre-green text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Almacén de Insumos
          </button>
          <button
            onClick={() => setActiveTab('recetas')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg btn-premium transition-all ${
              activeTab === 'recetas' ? 'bg-campestre-gold text-slate-950 shadow-sm' : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            Recetas / Fórmulas
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-2xl flex items-center space-x-2.5">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {exito && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-2xl flex items-center space-x-2.5">
          <Check size={16} />
          <span>{exito}</span>
        </div>
      )}

      {/* PESTAÑA 1: GESTIÓN DE INSUMOS */}
      {activeTab === 'inventario' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Listado de Insumos */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-2xl border border-slate-800/80 p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white Outfit">Materias Primas Disponibles</h3>
                <button
                  onClick={cargarInsumos}
                  disabled={cargando}
                  className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
                >
                  <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-2">Insumo</th>
                      <th className="py-3 px-2 text-center">Unidad</th>
                      <th className="py-3 px-2 text-center">Stock Actual</th>
                      <th className="py-3 px-2 text-center">Stock Mínimo</th>
                      <th className="py-3 px-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {insumos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          {cargando ? 'Cargando materias primas...' : 'No hay insumos registrados. Registra el primero a la derecha.'}
                        </td>
                      </tr>
                    ) : (
                      insumos.map((ins) => (
                        <tr key={ins.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 px-2 font-medium text-white capitalize">{ins.nombre}</td>
                          <td className="py-3 px-2 text-center text-slate-400">{ins.unidad}</td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                              ins.critico
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20 font-extrabold animate-pulse-slow'
                                : 'text-white'
                            }`}>
                              {ins.stock} {ins.unidad}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center text-slate-400">{ins.stock_minimo} {ins.unidad}</td>
                          <td className="py-3 px-2 text-center">
                            <div className="flex justify-center space-x-1">
                              <button
                                onClick={() => handleEditClick(ins)}
                                className="p-1.5 bg-slate-900 border border-slate-800 text-slate-350 hover:text-white rounded-lg hover:border-slate-700 transition-all"
                                title="Editar"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleEliminarInsumo(ins.id)}
                                className="p-1.5 bg-slate-900 border border-slate-800 text-red-400 hover:text-white hover:bg-red-500/10 rounded-lg hover:border-red-500/20 transition-all"
                                title="Eliminar"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Formulario Agregar/Editar Insumo */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl border border-slate-800/80 p-5 space-y-4 bg-slate-900/10">
              <div>
                <h3 className="text-lg font-bold text-white Outfit flex items-center gap-2">
                  <ListPlus size={18} className="text-campestre-green" />
                  <span>{editId ? 'Editar Insumo' : 'Registrar Insumo'}</span>
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  {editId ? 'Modifica los datos del insumo seleccionado' : 'Añade un nuevo ingrediente o materia prima al almacén'}
                </p>
              </div>

              <form onSubmit={handleGuardarInsumo} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre del Insumo / Ingrediente</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Pechuga de Pollo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Unidad de Medida</label>
                    <select
                      value={unidad}
                      onChange={(e) => setUnidad(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                    >
                      <option value="Kg">Kilogramo (Kg)</option>
                      <option value="Gr">Gramos (Gr)</option>
                      <option value="Pza">Pieza (Pza)</option>
                      <option value="Ltr">Litros (Ltr)</option>
                      <option value="Paquete">Paquete</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Stock Mínimo Alerta</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="E.g. 2"
                      value={stockMinimo}
                      onChange={(e) => setStockMinimo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    {editId ? 'Stock Actual en Almacén' : 'Stock Inicial en Almacén'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="E.g. 15"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  {editId && (
                    <button
                      type="button"
                      onClick={handleCancelarEdicion}
                      className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-bold text-slate-300 rounded-xl"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={guardandoInsumo}
                    className="flex-1 py-3 bg-campestre-green text-white hover:bg-campestre-green/90 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg"
                  >
                    {guardandoInsumo ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <span>{editId ? 'Actualizar Insumo' : 'Aceptar y Guardar'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: FORMULACIÓN DE RECETAS */}
      {activeTab === 'recetas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Selección y Formulación */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-2xl border border-slate-800/80 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white Outfit">Formulación de Platillos</h3>
                  <p className="text-slate-400 text-xs">Elige una comida o desayuno para definir los insumos que descuenta al venderse</p>
                </div>
                
                <select
                  value={productoSeleccionadoId}
                  onChange={(e) => setProductoSeleccionadoId(e.target.value)}
                  className="w-full sm:max-w-xs px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700"
                >
                  <option value="">-- Seleccionar Platillo --</option>
                  {comidas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (${c.precio_venta})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ingredientes de la receta */}
              {productoSeleccionadoId ? (
                <div className="space-y-4">
                  <div className="border-t border-slate-850 pt-4">
                    <span className="text-xs font-bold text-slate-350 block mb-3 uppercase tracking-wider">Ingredientes / Insumos de la Receta:</span>
                    
                    {cargandoReceta ? (
                      <div className="text-center py-6 text-slate-400 text-xs">Cargando receta...</div>
                    ) : ingredientesReceta.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                        Este producto no tiene insumos configurados aún. Utiliza el formulario de la derecha para agregarlos.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {ingredientesReceta.map((ing) => (
                          <div key={ing.insumo_id} className="flex justify-between items-center p-3 bg-slate-950/30 border border-slate-850 rounded-xl">
                            <div>
                              <span className="text-xs font-bold text-white capitalize">{ing.nombre_insumo}</span>
                              <span className="text-[10px] text-slate-450 block">Requiere: <span className="font-bold text-slate-300">{ing.cantidad} {ing.unidad}</span> por porción</span>
                            </div>
                            <button
                              onClick={() => handleQuitarIngredienteLocal(ing.insumo_id)}
                              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-red-400 hover:text-white rounded-lg transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {ingredientesReceta.length > 0 && (
                    <button
                      onClick={handleGuardarRecetaCompleta}
                      disabled={guardandoReceta}
                      className="w-full py-3 bg-campestre-gold text-slate-950 hover:bg-campestre-gold/90 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg"
                    >
                      {guardandoReceta ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Guardar Receta Definitiva</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Por favor selecciona un platillo del listado superior para formular su receta.
                </div>
              )}
            </div>
          </div>

          {/* Formulario de Adición Local de Ingredientes */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl border border-slate-800/80 p-5 space-y-4 bg-slate-900/10">
              <div>
                <h3 className="text-lg font-bold text-white Outfit flex items-center gap-2">
                  <Settings size={18} className="text-campestre-gold" />
                  <span>Añadir Ingrediente</span>
                </h3>
                <p className="text-slate-400 text-xs mt-1">Formular y asociar un insumo a la receta activa</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Materia Prima / Insumo</label>
                  <select
                    value={insumoAgregarId}
                    onChange={(e) => setInsumoAgregarId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-700 animate-fade-in"
                  >
                    <option value="">-- Seleccionar Insumo --</option>
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre} ({i.unidad})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Cantidad Necesaria</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      placeholder="E.g. 0.150"
                      value={cantidadAgregar}
                      onChange={(e) => setCantidadAgregar(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none focus:border-slate-750"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-500 text-[10px] font-bold">
                      {insumoAgregarId ? insumos.find(i => i.id === parseInt(insumoAgregarId))?.unidad : ''}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-1">Cantidad necesaria para elaborar 1 porción del producto</span>
                </div>

                <button
                  type="button"
                  onClick={handleAgregarIngredienteLocal}
                  disabled={!productoSeleccionadoId || !insumoAgregarId || !cantidadAgregar}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  <span>Cargar a la Lista</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
