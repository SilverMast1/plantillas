import React, { useState } from 'react';
import { Truck, Plus, MapPin, Phone, Clock, CheckCircle2, User, Send, ShoppingBag, Shield, DollarSign } from 'lucide-react';

interface PedidoDelivery {
  id: string;
  cliente: string;
  telefono: string;
  direccion: string;
  items: string;
  total: number;
  estado: 'NUEVO' | 'EN_PREPARACION' | 'EN_CAMINO' | 'ENTREGADO';
  repartidor?: string;
  hora: string;
}

const INITIAL_PEDIDOS: PedidoDelivery[] = [
  { id: 'DEL-101', cliente: 'Carlos Mendoza', telefono: '8441234567', direccion: 'Calle Las Palmas #450, Col. Campestre', items: '2x Tacos Asada, 1x Cerveza Artesanal', total: 235.00, estado: 'EN_CAMINO', repartidor: 'Juan Repartidor', hora: '12:15 PM' },
  { id: 'DEL-102', cliente: 'Ana Lucía Torres', telefono: '8449876543', direccion: 'Blvd. Venustiano Carranza #1200', items: '1x Pizza Pepperoni, 2x Refresco 600ml', total: 310.00, estado: 'EN_PREPARACION', repartidor: 'Pedro Express', hora: '12:28 PM' },
  { id: 'DEL-103', cliente: 'Gabriel Ramos', telefono: '8445558899', direccion: 'Av. República #890', items: '1x Hamburguesa Especial, 1x Agua Jamaica', total: 160.00, estado: 'NUEVO', hora: '12:40 PM' },
];

export default function DeliveryView() {
  const [pedidos, setPedidos] = useState<PedidoDelivery[]>(INITIAL_PEDIDOS);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);

  // Formulario nuevo pedido
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [itemsTexto, setItemsTexto] = useState('');
  const [total, setTotal] = useState('');

  const handleCrearPedido = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevo: PedidoDelivery = {
      id: `DEL-${Date.now().toString().slice(-3)}`,
      cliente,
      telefono,
      direccion,
      items: itemsTexto || '1x Orden de Prueba Delivery',
      total: parseFloat(total) || 200.00,
      estado: 'NUEVO',
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
    setPedidos([nuevo, ...pedidos]);
    setCliente('');
    setTelefono('');
    setDireccion('');
    setItemsTexto('');
    setTotal('');
    setMostrarModalNuevo(false);
  };

  const moverEstado = (id: string, nuevoEstado: PedidoDelivery['estado']) => {
    setPedidos(pedidos.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
  };

  const handleEnviarWhatsApp = (p: PedidoDelivery) => {
    const msg = `Hola ${p.cliente}! 🛵 Tu pedido *${p.id}* por $${p.total.toFixed(2)} se encuentra: *${p.estado.replace('_', ' ')}*. Dirección: ${p.direccion}. ¡Gracias por tu compra!`;
    const url = `https://api.whatsapp.com/send?phone=52${p.telefono}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const getBadgesEstado = (estado: PedidoDelivery['estado']) => {
    switch (estado) {
      case 'NUEVO': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'EN_PREPARACION': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'EN_CAMINO': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'ENTREGADO': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Truck size={14} />
            <span>Módulo de Pedidos a Domicilio & Delivery</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight Outfit">
            Control de Envíos y Repartidores
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión en tiempo real de llamadas, pedidos para llevar y rastreo de envíos.
          </p>
        </div>

        <button
          onClick={() => setMostrarModalNuevo(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 transition-all btn-premium"
        >
          <Plus size={16} />
          <span>Nuevo Pedido Domicilio</span>
        </button>
      </div>

      {/* Pipeline Kanban de Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(['NUEVO', 'EN_PREPARACION', 'EN_CAMINO', 'ENTREGADO'] as const).map((colEstado) => {
          const pedidosCol = pedidos.filter(p => p.estado === colEstado);
          const titulos = {
            NUEVO: '🟡 Nuevos Pedidos',
            EN_PREPARACION: '🔵 En Cocina',
            EN_CAMINO: '🟣 En Camino (Reparto)',
            ENTREGADO: '🟢 Entregados'
          };

          return (
            <div key={colEstado} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200">{titulos[colEstado]}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono font-bold">
                  {pedidosCol.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[300px]">
                {pedidosCol.map((p) => (
                  <div key={p.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-rose-400 text-xs">{p.id}</span>
                      <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                        <Clock size={12} />
                        <span>{p.hora}</span>
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-white text-xs block">{p.cliente}</span>
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Phone size={10} />
                        <span>{p.telefono}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 flex items-start space-x-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                      <MapPin size={12} className="text-rose-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">{p.direccion}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-medium border-t border-slate-900 pt-1.5">
                      <span>{p.items}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <span className="font-extrabold text-white text-xs">${p.total.toFixed(2)}</span>
                      <button
                        onClick={() => handleEnviarWhatsApp(p)}
                        className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-[10px] font-bold flex items-center space-x-1"
                        title="Enviar WhatsApp al Cliente"
                      >
                        <Send size={11} />
                        <span>WhatsApp</span>
                      </button>
                    </div>

                    {/* Botones de Cambio de Estado */}
                    <div className="flex gap-1 pt-1">
                      {colEstado === 'NUEVO' && (
                        <button
                          onClick={() => moverEstado(p.id, 'EN_PREPARACION')}
                          className="w-full py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold"
                        >
                          Mover a Cocina ➔
                        </button>
                      )}
                      {colEstado === 'EN_PREPARACION' && (
                        <button
                          onClick={() => moverEstado(p.id, 'EN_CAMINO')}
                          className="w-full py-1 bg-violet-600 text-white rounded-lg text-[10px] font-bold"
                        >
                          Enviar Repartidor ➔
                        </button>
                      )}
                      {colEstado === 'EN_CAMINO' && (
                        <button
                          onClick={() => moverEstado(p.id, 'ENTREGADO')}
                          className="w-full py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
                        >
                          Marcar Entregado ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nuevo Pedido */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-4 relative animate-fade-in">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Truck className="text-rose-400" size={20} />
              <span>Nuevo Pedido a Domicilio</span>
            </h3>

            <form onSubmit={handleCrearPedido} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Carlos Mendoza"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Teléfono (WhatsApp)</label>
                <input
                  type="text"
                  required
                  placeholder="ej. 8441234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Dirección de Entrega</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Calle Las Palmas #450, Col. Campestre"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Detalle Platillos</label>
                  <input
                    type="text"
                    placeholder="2x Tacos, 1x Refresco"
                    value={itemsTexto}
                    onChange={(e) => setItemsTexto(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Total Cobro ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="200.00"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl"
                >
                  Guardar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
