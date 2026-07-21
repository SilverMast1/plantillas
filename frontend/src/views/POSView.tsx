import { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
import { TicketVenta } from '../components/TicketVenta';
import { ShoppingCart, User, Users, Search, Plus, Minus, Trash2, CreditCard, Check, Sparkles, RefreshCw, Clock, X, Merge, Move } from 'lucide-react';
import { io } from 'socket.io-client';
import apiClient from '../api/apiClient';
import { addToOfflineQueue, syncOfflineQueue, getOfflineQueue } from '../api/offlineQueue';

// Wrapper de fetch compatible usando Axios
const apiFetch = async (url: string, options: any = {}) => {
  const method = options.method || 'GET';
  const headers = options.headers || {};
  let data = options.body;
  if (data && typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {}
  }

  // Limpiar headers redundantes
  if (headers['Authorization']) delete headers['Authorization'];
  if (headers['Content-Type']) delete headers['Content-Type'];

  const response = await apiClient({
    url,
    method,
    headers,
    data,
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: async () => response.data,
    text: async () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
  };
};

const fetch = apiFetch;

export default function POSView() {
  const {
    token,
    areaId,
    setAreaId,
    productos,
    setProductos,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    updateCartNotes,
    clearCart,
    cadiId,
    setCadiId,
    nombreReferencia,
    setNombreReferencia,
    cuentaId,
    setCuentaId,
    user,
  } = useStore();

  const socketRef = useRef<any>(null);
  const inputMezcladorRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<any>(null);

  const [cadis, setCadis] = useState<any[]>([]);
  const [animacionesCarrito, setAnimacionesCarrito] = useState<{ id: number; x: number; y: number }[]>([]);
  const [sociosBusqueda, setSociosBusqueda] = useState<any[]>([]);
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [sociosSeleccionadosCadi, setSociosSeleccionadosCadi] = useState<any[]>(() => {
    return useStore.getState().sociosSeleccionados || [];
  });

  useEffect(() => {
    useStore.setState({ sociosSeleccionados: sociosSeleccionadosCadi });
  }, [sociosSeleccionadosCadi]);
  const [mostrarBuscadorSocios, setMostrarBuscadorSocios] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Estados de Cobro
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);
  const [splitPreview, setSplitPreview] = useState<any>(null);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState(getOfflineQueue().length);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue((msg) => {
        console.log(msg);
        setOfflineQueueCount(0);
        cargarCuentasPendientes();
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      syncOfflineQueue(() => {
        setOfflineQueueCount(0);
        cargarCuentasPendientes();
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [metodosPago, setMetodosPago] = useState<{ [clienteId: number]: string }>({});
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [countdownPrint, setCountdownPrint] = useState(5);
  const [cargosSociosPanel, setCargosSociosPanel] = useState<{ [clienteId: number]: { total: number; divisiones: any[] } }>({});
  const [liquidarCargosPanel, setLiquidarCargosPanel] = useState<{ [clienteId: number]: boolean }>({});
  const [detenerTimer, setDetenerTimer] = useState(false);


  useEffect(() => {
    let timer: any;
    let interval: any;
    if (pagoExitoso && !detenerTimer) {
      setCountdownPrint(5);
      interval = setInterval(() => {
        setCountdownPrint((prev) => (prev > 1 ? prev - 1 : 1));
      }, 1000);

      timer = setTimeout(() => {
        setPagoExitoso(false);
        setMostrarModalCobro(false);
        setSplitPreview(null);
        clearCart();
        if (areaId) cargarProductos(areaId);
        cargarCadis();
        cargarCuentasPendientes();
      }, 5000);
    }
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [pagoExitoso, detenerTimer]);

  const [errorMsg, setErrorMsg] = useState('');
  const [metodoPagoDirecto, setMetodoPagoDirecto] = useState<string>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<string>('');
  const [montoEfectivoMixto, setMontoEfectivoMixto] = useState<string>('');
  const [montoTarjetaMixto, setMontoTarjetaMixto] = useState<string>('');
  const [abonoMonto, setAbonoMonto] = useState<string>('');
  const [metodoPagoAbono, setMetodoPagoAbono] = useState<string>('EFECTIVO');
  const [montoEfectivoMixtoSocio, setMontoEfectivoMixtoSocio] = useState<{ [clienteId: number]: string }>({});
  const [montoTarjetaMixtoSocio, setMontoTarjetaMixtoSocio] = useState<{ [clienteId: number]: string }>({});
  const [montoRecibidoSocio, setMontoRecibidoSocio] = useState<{ [clienteId: number]: string }>({});

  useEffect(() => {
    if (!mostrarModalCobro) {
      setAbonoMonto('');
      setMetodoPagoAbono('EFECTIVO');
      setMontoEfectivoMixto('');
      setMontoTarjetaMixto('');
      setDetenerTimer(false);
    }
  }, [mostrarModalCobro]);

  // Simulador de Escaneo QR
  const [simularQrToken, setSimularQrToken] = useState('');
  const [mostrarSimuladorQR, setMostrarSimuladorQR] = useState(false);

  // Filtro de Categorías / Mini-menús
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('TODOS');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarAgotados, setMostrarAgotados] = useState(false);

  // Cuentas pendientes para los vendedores
  const [cuentasPendientes, setCuentasPendientes] = useState<any[]>([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(false);
  const [busquedaPendientes, setBusquedaPendientes] = useState('');

  // Cuentas pagadas del turno activo
  const [cuentasPagadas, setCuentasPagadas] = useState<any[]>([]);
  const [cargandoPagadas, setCargandoPagadas] = useState(false);
  const [busquedaPagadas, setBusquedaPagadas] = useState('');

  // Estado del turno activo y validación diaria
  const [turnoActivo, setTurnoActivo] = useState<any | null>(null);
  const [turnoAbiertoHoy, setTurnoAbiertoHoy] = useState(false);
  const [fondoInicialPOS, setFondoInicialPOS] = useState('500');
  const [cargandoAbrirTurno, setCargandoAbrirTurno] = useState(false);
  const [errorAbrirTurno, setErrorAbrirTurno] = useState('');
  const [cuentaParaEditarPago, setCuentaParaEditarPago] = useState<any | null>(null);
  const [mostrarModalEditarPago, setMostrarModalEditarPago] = useState(false);
  const [nuevosMetodosPago, setNuevosMetodosPago] = useState<{ [key: string]: string }>({});
  const [guardandoMetodoPago, setGuardandoMetodoPago] = useState(false);
  const [descuentoEmpleado, setDescuentoEmpleado] = useState(false);

  const [datosUltimoTicket, setDatosUltimoTicket] = useState<any>(null);

  useEffect(() => {
    if (cart.length > 0 && !pagoExitoso) {
      const adeudosSeleccionados = Object.keys(liquidarCargosPanel).reduce((sum, key) => {
        const cid = Number(key);
        return sum + (liquidarCargosPanel[cid] ? (cargosSociosPanel[cid]?.total || 0) : 0);
      }, 0);

      const listaAdeudosDetalle: any[] = [];
      Object.keys(liquidarCargosPanel).forEach(key => {
        const cid = Number(key);
        if (liquidarCargosPanel[cid] && cargosSociosPanel[cid]?.divisiones) {
          cargosSociosPanel[cid].divisiones.forEach((div: any) => {
            listaAdeudosDetalle.push({
              area: div.area,
              fecha: div.fecha,
              monto: div.monto,
              cuenta_id: div.cuenta_id,
              productos: div.productos
            });
          });
        }
      });

      setDatosUltimoTicket({
        id: cuentaId || 'BORRADOR',
        descuento: descuentoEmpleado ? (cart.reduce((acc, c) => acc + (c.precio_venta * c.cantidad), 0) * 0.3) : 0,
        propina: 0,
        metodo_pago: metodoPagoDirecto || 'EFECTIVO',
        adeudosPagados: adeudosSeleccionados,
        adeudosDetalle: listaAdeudosDetalle,
        detalleCuentas: cart.map(c => ({
          id: c.id,
          cantidad: c.cantidad,
          precio_unitario: c.precio_unitario !== undefined ? c.precio_unitario : c.precio_venta,
          producto: c,
          notas: c.notas || ''
        })),
        mesa: nombreReferencia,
        socioNombre: sociosSeleccionadosCadi.map(s => s.nombre).join(', ')
      });
    }
  }, [cart, cuentaId, nombreReferencia, sociosSeleccionadosCadi, descuentoEmpleado, metodoPagoDirecto, pagoExitoso, liquidarCargosPanel, cargosSociosPanel]);

  // Estados para deudas y liquidación de socios en modal de cobro
  const [deudasSocios, setDeudasSocios] = useState<{ [clienteId: number]: { total: number; divisiones: any[] } }>({});
  const [liquidarDeudaSocio, setLiquidarDeudaSocio] = useState<{ [clienteId: number]: boolean }>({});
  const [metodosPagoLiquidacion, setMetodosPagoLiquidacion] = useState<{ [clienteId: number]: string }>({});



  // Estados para creación rápida de Socios y Cadis en POS (Vendedores)
  const [mostrarConfirmacionLimpiar, setMostrarConfirmacionLimpiar] = useState(false);
  const [mostrarModalCrearSocio, setMostrarModalCrearSocio] = useState(false);

  // States para Fusión de Cuentas
  const [mostrarModalFusion, setMostrarModalFusion] = useState(false);
  const [cuentaOrigenFusionId, setCuentaOrigenFusionId] = useState('');
  const [fusionando, setFusionando] = useState(false);
  const [mostrarModalMoverArea, setMostrarModalMoverArea] = useState(false);
  const [moviendoArea, setMoviendoArea] = useState(false);
  const [mostrarModalIniciarRonda, setMostrarModalIniciarRonda] = useState(false);
  const [mostrarFormCrearCadiInterno, setMostrarFormCrearCadiInterno] = useState(false);

  // Inputs Socio Nuevo
  const [codigoSocioNuevo, setCodigoSocioNuevo] = useState('');
  const [nombreSocioNuevo, setNombreSocioNuevo] = useState('');
  const [emailSocioNuevo, setEmailSocioNuevo] = useState('');
  const [telefonoSocioNuevo, setTelefonoSocioNuevo] = useState('');
  const [tipoSocioNuevo, setTipoSocioNuevo] = useState<'SOCIO' | 'EMPLEADO'>('SOCIO');

  const fetchSiguienteCodigo = async (tipo: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/socios/siguiente-codigo?tipo=${tipo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.siguiente_codigo) {
        setCodigoSocioNuevo(data.siguiente_codigo);
      }
    } catch (err) {
      console.error('Error al obtener siguiente código:', err);
    }
  };

  useEffect(() => {
    if (token && mostrarModalCrearSocio) {
      fetchSiguienteCodigo(tipoSocioNuevo);
    }
  }, [token, tipoSocioNuevo, mostrarModalCrearSocio]);

  // Inputs Cadi Nuevo (dentro de Iniciar Ronda)
  const [numeroCadiNuevo, setNumeroCadiNuevo] = useState('');
  const [nombreCadiNuevo, setNombreCadiNuevo] = useState('');
  const [telefonoCadiNuevo, setTelefonoCadiNuevo] = useState('');

  const handleAgregarAlCarrito = (producto: any) => {
    addToCart(producto);
    setTimeout(() => {
      const element = document.getElementById(`cart-item-${producto.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  // Estados Asignación / Iniciar Ronda
  const [todosLosCadis, setTodosLosCadis] = useState<any[]>([]);
  const [cadiSeleccionadoRonda, setCadiSeleccionadoRonda] = useState<string>('');
  const [sociosSeleccionadosRonda, setSociosSeleccionadosRonda] = useState<any[]>([]);
  const [busquedaSocioRonda, setBusquedaSocioRonda] = useState('');
  const [resultadosSocioRonda, setResultadosSocioRonda] = useState<any[]>([]);

  // Estados para mezclador
  const [mostrarModalMezclador, setMostrarModalMezclador] = useState(false);
  const [productoPreparadoSeleccionado, setProductoPreparadoSeleccionado] = useState<any | null>(null);
  const [busquedaMezclador, setBusquedaMezclador] = useState('');

  useEffect(() => {
    if (mostrarModalMezclador) {
      setTimeout(() => {
        inputMezcladorRef.current?.focus();
      }, 100);
    }
  }, [mostrarModalMezclador]);
  const [editingQty, setEditingQty] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    if (mostrarModalIniciarRonda) {
      cargarTodosLosCadis();
    }
  }, [mostrarModalIniciarRonda]);

  useEffect(() => {
    if (mostrarModalCobro && splitPreview) {
      setDeudasSocios({});
      setLiquidarDeudaSocio({ ...liquidarCargosPanel });
      setMetodosPagoLiquidacion({});

      if (splitPreview.divisiones && splitPreview.divisiones.length > 0) {
        // Cargar cargos pendientes para cada socio de las divisiones
        splitPreview.divisiones.forEach(async (d: any) => {
          try {
            const res = await fetch(`/api/pos/socios/${d.cliente_id}/cargos/detalle`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data) && data.length > 0) {
              const totalAdeudo = data.reduce((sum, item) => sum + Number(item.monto), 0);
              setDeudasSocios(prev => ({
                ...prev,
                [d.cliente_id]: {
                  total: totalAdeudo,
                  divisiones: data,
                }
              }));
            }
          } catch (error) {
            console.error(`Error al cargar cargos del socio ${d.cliente_id}:`, error);
          }
        });
      } else if (nombreReferencia && nombreReferencia.trim() !== '') {
        // En modo directo, buscar si el nombreReferencia coincide con algún socio activo
        (async () => {
          try {
            const q = nombreReferencia.trim();
            const resBusqueda = await fetch(`/api/socio/buscar?q=${encodeURIComponent(q)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const socios = await resBusqueda.json();
            if (resBusqueda.ok && Array.isArray(socios)) {
              // Buscar coincidencia exacta
              const socioExacto = socios.find(s => s.nombre.toLowerCase().trim() === q.toLowerCase());
              if (socioExacto) {
                // Consultar cargos del socio exacto
                const resCargos = await fetch(`/api/pos/socios/${socioExacto.id}/cargos/detalle`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const data = await resCargos.json();
                if (resCargos.ok && Array.isArray(data) && data.length > 0) {
                  const totalAdeudo = data.reduce((sum, item) => sum + Number(item.monto), 0);
                  setDeudasSocios({
                    [socioExacto.id]: {
                      total: totalAdeudo,
                      divisiones: data,
                    }
                  });
                }
              }
            }
          } catch (error) {
            console.error('Error al cargar cargos por referencia de nombre:', error);
          }
        })();
      }
    }
  }, [mostrarModalCobro, splitPreview, token, nombreReferencia]);

  // Conexión WebSockets
  useEffect(() => {
    if (!token) return;
    const socket = io('/', {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Conectado a WebSockets del POS');
      if (areaId) {
        socket.emit('join:area', areaId);
      }
    });

    socket.on('inventario:actualizar', () => {
      if (areaId) cargarProductos(areaId);
    });

    socket.on('cuenta:actualizar', () => {
      cargarCuentasPendientes();
      cargarCuentasPagadas();
      cargarCadis();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [areaId, token]);

  useEffect(() => {
    if (token) {
      cargarCadis();
      cargarCuentasPendientes();
      cargarCuentasPagadas();
    }
  }, [token]);

  useEffect(() => {
    if (areaId) {
      cargarProductos(areaId);
      setCategoriaSeleccionada('TODOS');
      cargarCuentasPendientes();
      cargarCuentasPagadas();
    }
  }, [areaId]);

  // Actualizar socios del Cadi cuando cambie el Cadi seleccionado en POS
  useEffect(() => {
    if (cadiId) {
      const cadiSeleccionado = cadis.find(c => c.id === cadiId);
      if (cadiSeleccionado && cadiSeleccionado.clientes) {
        setSociosSeleccionadosCadi(cadiSeleccionado.clientes);
      } else {
        setSociosSeleccionadosCadi([]);
      }
    } else {
      setSociosSeleccionadosCadi([]);
    }
  }, [cadiId, cadis]);

  // Auto-completar referencia con el nombre del socio si no hay referencia manual o es default "Mesa X"
  useEffect(() => {
    if (sociosSeleccionadosCadi.length > 0) {
      const esDefaultOMesa = !nombreReferencia || /^Mesa(\s+\d+)?$/i.test(nombreReferencia.trim());
      if (esDefaultOMesa) {
        const nombresSocios = sociosSeleccionadosCadi.map(s => s.nombre).join(', ');
        setNombreReferencia(nombresSocios);
      }
    }
  }, [sociosSeleccionadosCadi]);

  // Cargar deudas de los socios seleccionados en el panel lateral (carrito)
  useEffect(() => {
    if (!token) return;
    if (sociosSeleccionadosCadi && sociosSeleccionadosCadi.length > 0) {
      // Cargar cargos pendientes para cada socio seleccionado
      sociosSeleccionadosCadi.forEach(async (s: any) => {
        try {
          const res = await fetch(`/api/pos/socios/${s.id}/cargos/detalle`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && Array.isArray(data) && data.length > 0) {
            const totalAdeudo = data.reduce((sum: number, item: any) => sum + Number(item.monto), 0);
            setCargosSociosPanel(prev => ({
              ...prev,
              [s.id]: {
                total: totalAdeudo,
                divisiones: data,
              }
            }));
          } else {
            setCargosSociosPanel(prev => {
              const copy = { ...prev };
              delete copy[s.id];
              return copy;
            });
          }
        } catch (error) {
          console.error(`Error al cargar cargos del socio ${s.id} para el panel:`, error);
        }
      });
    } else {
      setCargosSociosPanel({});
      setLiquidarCargosPanel({});
    }
  }, [sociosSeleccionadosCadi, token]);

  // Limpiar estados de deudas si el carrito se vacía
  useEffect(() => {
    if (cart.length === 0) {
      setCargosSociosPanel({});
      setLiquidarCargosPanel({});
    }
  }, [cart]);

  const cargarProductos = async (idArea: number) => {
    const cacheKey = `campestre_productos_${idArea}`;
    if (!navigator.onLine) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) setProductos(JSON.parse(cached));
      return;
    }
    try {
      const res = await fetch(`/api/pos/productos/${idArea}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProductos(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      const cached = localStorage.getItem(cacheKey);
      if (cached) setProductos(JSON.parse(cached));
    }
  };

  const cargarCadis = async () => {
    const cacheKey = 'campestre_cadis_activos';
    if (!navigator.onLine) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) setCadis(JSON.parse(cached));
      return;
    }
    try {
      const res = await fetch('/api/cadis/activos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCadis(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error al cargar cadis:', error);
      const cached = localStorage.getItem(cacheKey);
      if (cached) setCadis(JSON.parse(cached));
    }
  };

  const cargarTodosLosCadis = async () => {
    if (!token) return;
    const cacheKey = 'campestre_cadis_todos';
    if (!navigator.onLine) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) setTodosLosCadis(JSON.parse(cached));
      return;
    }
    try {
      const res = await fetch('/api/cadis', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTodosLosCadis(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error al cargar todos los cadis:', error);
      const cached = localStorage.getItem(cacheKey);
      if (cached) setTodosLosCadis(JSON.parse(cached));
    }
  };

  const buscarSocioParaRonda = async (texto: string) => {
    setBusquedaSocioRonda(texto);
    if (texto.length < 2) {
      setResultadosSocioRonda([]);
      return;
    }
    try {
      const res = await fetch(`/api/socio/buscar?q=${encodeURIComponent(texto)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setResultadosSocioRonda(data);
      }
    } catch (error) {
      console.error('Error al buscar socios para ronda:', error);
    }
  };

  const handleCrearSocioRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoSocioNuevo || !nombreSocioNuevo) {
      alert('Código y nombre del socio son requeridos');
      return;
    }
    setCargando(true);
    try {
      const res = await fetch('/api/pos/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigo_socio: codigoSocioNuevo,
          nombre: nombreSocioNuevo,
          email: emailSocioNuevo || undefined,
          telefono: telefonoSocioNuevo || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar socio');
      alert(`Socio ${nombreSocioNuevo} registrado exitosamente.`);
      
      const nuevoSocioObj = data.cliente;
      
      // Auto-agregar a la selección de la ronda si el modal está abierto
      if (mostrarModalIniciarRonda) {
        setSociosSeleccionadosRonda(prev => [...prev, nuevoSocioObj]);
      } else {
        // Si se abrió el modal simple, agregar al carrito del POS
        if (!sociosSeleccionadosCadi.some(x => x.id === nuevoSocioObj.id)) {
          setSociosSeleccionadosCadi(prev => [...prev, nuevoSocioObj]);
        }
      }
      
      setCodigoSocioNuevo('');
      setNombreSocioNuevo('');
      setEmailSocioNuevo('');
      setTelefonoSocioNuevo('');
      setMostrarModalCrearSocio(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCargando(false);
    }
  };

  const handleCrearCadiRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroCadiNuevo || !nombreCadiNuevo) {
      alert('Número y nombre del cadi son requeridos');
      return;
    }
    setCargando(true);
    try {
      const res = await fetch('/api/cadis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          numero_cadi: numeroCadiNuevo,
          nombre: nombreCadiNuevo,
          telefono: telefonoCadiNuevo || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear cadi');
      alert(`Cadi ${nombreCadiNuevo} registrado exitosamente.`);
      
      await cargarTodosLosCadis();
      setCadiSeleccionadoRonda(data.id.toString());
      
      setNumeroCadiNuevo('');
      setNombreCadiNuevo('');
      setTelefonoCadiNuevo('');
      setMostrarFormCrearCadiInterno(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCargando(false);
    }
  };

  const handleIniciarRondaPOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadiSeleccionadoRonda) {
      alert('Debe seleccionar un cadi');
      return;
    }
    if (sociosSeleccionadosRonda.length === 0) {
      alert('Debe asociar al menos un socio a la ronda');
      return;
    }
    setCargando(true);
    try {
      const res = await fetch('/api/cadis/asignar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cadi_id: cadiSeleccionadoRonda,
          cliente_ids: sociosSeleccionadosRonda.map(s => s.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar ronda');
      alert('Ronda iniciada con éxito y Cadi asignado.');
      
      await cargarCadis();
      setCadiId(parseInt(cadiSeleccionadoRonda));
      
      setCadiSeleccionadoRonda('');
      setSociosSeleccionadosRonda([]);
      setBusquedaSocioRonda('');
      setResultadosSocioRonda([]);
      setMostrarModalIniciarRonda(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCargando(false);
    }
  };

  const esMismoDia = (dateStr: string) => {
    const d = new Date(dateStr);
    const hoy = new Date();
    return d.getFullYear() === hoy.getFullYear() &&
           d.getMonth() === hoy.getMonth() &&
           d.getDate() === hoy.getDate();
  };

  const cargarCuentasPendientes = async () => {
    if (!token) return;
    setCargandoCuentas(true);
    const cacheKey = 'campestre_cuentas_pendientes';
    if (!navigator.onLine) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) setCuentasPendientes(JSON.parse(cached));
      setCargandoCuentas(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/cuentas?solo_turno_activo=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const abiertas = data.filter((c: any) => c.estado === 'ABIERTA');
        setCuentasPendientes(abiertas);
        localStorage.setItem(cacheKey, JSON.stringify(abiertas));
      }
    } catch (error) {
      console.error('Error al cargar cuentas abiertas:', error);
      const cached = localStorage.getItem(cacheKey);
      if (cached) setCuentasPendientes(JSON.parse(cached));
    } finally {
      setCargandoCuentas(false);
    }
  };

  const cargarCuentasPagadas = async () => {
    if (!token) return;
    setCargandoPagadas(true);
    try {
      const res = await fetch('/api/admin/turno/activo?area_id=' + areaId, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.activo) {
        setTurnoActivo(data.turno);
        const hoyTurno = esMismoDia(data.turno.abierto_at);
        setTurnoAbiertoHoy(hoyTurno);
        if (hoyTurno) {
          setCuentasPagadas(data.ventas || []);
        } else {
          setCuentasPagadas([]);
        }
      } else {
        setTurnoActivo(null);
        setTurnoAbiertoHoy(false);
        setCuentasPagadas([]);
      }
    } catch (error) {
      console.error('Error al cargar cuentas pagadas:', error);
    } finally {
      setCargandoPagadas(false);
    }
  };

  const handleAbrirTurnoPOS = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorAbrirTurno('');
    setCargandoAbrirTurno(true);
    const fondo = parseFloat(fondoInicialPOS);
    if (isNaN(fondo) || fondo < 0) {
      setErrorAbrirTurno('El fondo inicial debe ser un número positivo');
      setCargandoAbrirTurno(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/turno/abrir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fondo_inicial: fondo, area_id: areaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al abrir turno');
      
      // Recargar el turno activo
      await cargarCuentasPagadas();
      setFondoInicialPOS('500');
    } catch (err: any) {
      setErrorAbrirTurno(err.message || 'Error de conexión');
    } finally {
      setCargandoAbrirTurno(false);
    }
  };

  const iniciarEdicionPago = (cuenta: any) => {
    setCuentaParaEditarPago(cuenta);
    const iniciales: { [key: string]: string } = {};
    cuenta.pagos.forEach((p: any) => {
      if (p.cliente_id !== null) {
        iniciales[p.cliente_id] = p.metodo;
      } else {
        iniciales['directo'] = p.metodo;
      }
    });
    setNuevosMetodosPago(iniciales);
    setMostrarModalEditarPago(true);
  };

  const handleActualizarMetodoPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaParaEditarPago) return;
    setGuardandoMetodoPago(true);
    setErrorMsg('');

    const tieneDivisiones = cuentaParaEditarPago.pagos.length > 0 && cuentaParaEditarPago.pagos[0].cliente_id !== null;

    let bodyPayload: any = {};
    if (tieneDivisiones) {
      bodyPayload.divisiones = cuentaParaEditarPago.pagos.map((p: any) => ({
        cliente_id: p.cliente_id,
        metodo_pago: nuevosMetodosPago[p.cliente_id] || p.metodo,
      }));
    } else {
      bodyPayload.metodo_pago = nuevosMetodosPago['directo'] || cuentaParaEditarPago.pagos[0].metodo;
    }

    try {
      const res = await fetch(`/api/pos/cuentas/${cuentaParaEditarPago.id}/metodo-pago`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar método de pago');
      setMostrarModalEditarPago(false);
      setCuentaParaEditarPago(null);
      cargarCuentasPagadas();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de red');
    } finally {
      setGuardandoMetodoPago(false);
    }
  };

  const handleCancelarEdicion = () => {
    clearCart();
    setSociosSeleccionadosCadi([]);
    setDescuentoEmpleado(false);
  };

  const handleSeleccionarCuenta = (cuenta: any) => {
    setDescuentoEmpleado(Number(cuenta.descuento || 0) > 0);
    const itemsCart = cuenta.productos.map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      precio_venta: p.precio_venta,
      cantidad: p.cantidad,
      categoria: p.categoria,
      notas: p.notas || '',
      guardado: true,
    }));

    useStore.setState({
      areaId: cuenta.area_id,
      cuentaId: Number(cuenta.id),
      cadiId: cuenta.cadi_id,
      nombreReferencia: cuenta.referencia,
      cart: itemsCart,
    });

    setSociosSeleccionadosCadi(cuenta.socios || []);
  };

  const handlePagarCuentaDirecto = async (cuenta: any) => {
    setCargando(true);
    setErrorMsg('');
    try {
      useStore.setState({
        areaId: cuenta.area_id,
        cuentaId: Number(cuenta.id),
        cadiId: cuenta.cadi_id,
        nombreReferencia: cuenta.referencia,
      });
      const sociosCta = cuenta.socios || [];
      setSociosSeleccionadosCadi(sociosCta);

      const resSplit = await fetch(`/api/pos/cuentas/${cuenta.id}/split-preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataSplit = await resSplit.json();
      
      if (resSplit.ok) {
        let finalSplit = dataSplit;
        if (!dataSplit.split_automatico && sociosCta.length > 0) {
          const totalVal = dataSplit.total;
          const cantidad = sociosCta.length;
          const montoBase = Math.round((totalVal / cantidad) * 100) / 100;
          let totalDividido = montoBase * cantidad;
          let residuo = Math.round((totalVal - totalDividido) * 100) / 100;

          const divisiones = sociosCta.map((s: any, index: number) => {
            let montoCliente = montoBase;
            if (index === cantidad - 1 && residuo !== 0) {
              montoCliente = Math.round((montoCliente + residuo) * 100) / 100;
            }
            return {
              cliente_id: s.id,
              nombre: s.nombre,
              codigo_socio: s.codigo_socio,
              porcentaje: 100 / cantidad,
              monto: montoCliente,
            };
          });

          finalSplit = {
            split_automatico: true,
            total: totalVal,
            divisiones,
          };
        }

        setSplitPreview(finalSplit);
        const metodosIniciales: { [key: number]: string } = {};
        finalSplit.divisiones.forEach((d: any) => {
          metodosIniciales[d.cliente_id] = 'EFECTIVO';
        });
        setMetodosPago(metodosIniciales);
        setMontoRecibidoSocio({});
        setMetodoPagoDirecto('EFECTIVO');
        setMostrarModalCobro(true);
      } else {
        throw new Error(dataSplit.error || 'Error al calcular la división');
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setCargando(false);
    }
  };

  const handleSoloGuardarConsumos = async () => {
    if (cart.length === 0) return;
    setCargando(true);
    setErrorMsg('');

    let idCuenta = cuentaId;
    let refName = '';

    try {
      refName = (() => {
        if (sociosSeleccionadosCadi.length > 0) {
          const esDefaultOMesa = !nombreReferencia || /^Mesa(\s+\d+)?$/i.test(nombreReferencia.trim());
          if (esDefaultOMesa) {
            return sociosSeleccionadosCadi.map(s => s.nombre).join(', ');
          }
        }
        return nombreReferencia || `Mesa ${Math.floor(Math.random() * 20) + 1}`;
      })();

      // Lógica offline
      if (!navigator.onLine) {
        let tempId = idCuenta;
        if (!tempId) {
          tempId = `temp-${Date.now()}` as any;
          setCuentaId(tempId);
          
          addToOfflineQueue({
            url: '/api/pos/cuentas/abrir',
            method: 'POST',
            tempCuentaId: String(tempId),
            data: {
              area_id: areaId,
              cadi_id: cadiId,
              nombre_referencia: refName,
              cliente_id: sociosSeleccionadosCadi[0]?.id || null,
            }
          });
        }

        const payloadProductos = cart.map(item => ({
          producto_id: typeof item.id === 'string' ? parseInt(item.id.split('-')[0]) : item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario !== undefined ? item.precio_unitario : item.precio_venta,
          notas: item.notas || null,
        }));

        addToOfflineQueue({
          url: `/api/pos/cuentas/${tempId}/consumos`,
          method: 'PUT',
          tempCuentaId: String(tempId).startsWith('temp-') ? String(tempId) : undefined,
          data: {
            productos: payloadProductos,
            cadi_id: cadiId,
            nombre_referencia: refName,
            cliente_id: sociosSeleccionadosCadi[0]?.id || null,
            descuento_empleado: descuentoEmpleado,
            dejar_abierta: true,
          }
        });

        // Formar el objeto de la cuenta mockeada
        const mockProductos = cart.map(item => ({
          id: typeof item.id === 'string' ? parseInt(item.id.split('-')[0]) : item.id,
          producto_id: typeof item.id === 'string' ? parseInt(item.id.split('-')[0]) : item.id,
          nombre: item.nombre,
          precio_venta: item.precio_venta,
          cantidad: item.cantidad,
          categoria: item.categoria || '',
          notas: item.notas || '',
        }));

        const mockCuenta = {
          id: tempId,
          area_id: areaId,
          cadi_id: cadiId,
          referencia: refName,
          estado: 'ABIERTA',
          descuento: descuentoEmpleado ? 10 : 0,
          socios: sociosSeleccionadosCadi,
          productos: mockProductos,
          total: cart.reduce((acc, c) => acc + (c.precio_venta * c.cantidad), 0),
          created_at: new Date().toISOString(),
          isOffline: true,
        };

        setCuentasPendientes(prev => {
          const index = prev.findIndex(c => String(c.id) === String(tempId));
          let updatedList;
          if (index > -1) {
            const existingCta = prev[index];
            const combinedProductos = [...existingCta.productos];
            mockProductos.forEach(newP => {
              const pIndex = combinedProductos.findIndex(p => p.id === newP.id);
              if (pIndex > -1) {
                combinedProductos[pIndex].cantidad += newP.cantidad;
              } else {
                combinedProductos.push(newP);
              }
            });
            const updatedCta = {
              ...existingCta,
              productos: combinedProductos,
              total: combinedProductos.reduce((acc, p) => acc + (p.precio_venta * p.cantidad), 0),
            };
            updatedList = prev.map((c, i) => i === index ? updatedCta : c);
          } else {
            updatedList = [mockCuenta, ...prev];
          }
          localStorage.setItem('campestre_cuentas_pendientes', JSON.stringify(updatedList));
          return updatedList;
        });

        setOfflineQueueCount(getOfflineQueue().length);
        clearCart();
        setSociosSeleccionadosCadi([]);
        alert('Consumos guardados de forma local (offline). Se sincronizarán al recuperar la conexión.');
        setCargando(false);
        return;
      }

      // Actualizar el estado local para reflejar el nombre final
      setNombreReferencia(refName);

      if (!idCuenta) {
        const resCuenta = await fetch('/api/pos/cuentas/abrir', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            area_id: areaId,
            cadi_id: cadiId,
            nombre_referencia: refName,
            cliente_id: sociosSeleccionadosCadi[0]?.id || null,
          }),
        });

        const dataCuenta = await resCuenta.json();
        if (!resCuenta.ok) throw new Error(dataCuenta.error || 'Error al abrir la cuenta');
        idCuenta = Number(dataCuenta.id);
        setCuentaId(idCuenta);
      }

      const payloadProductos = cart.map(item => ({
        producto_id: typeof item.id === 'string' ? parseInt(item.id.split('-')[0]) : item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario !== undefined ? item.precio_unitario : item.precio_venta,
        notas: item.notas || null,
      }));

      const resConsumos = await fetch(`/api/pos/cuentas/${idCuenta}/consumos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productos: payloadProductos,
          cadi_id: cadiId,
          nombre_referencia: refName,
          cliente_id: sociosSeleccionadosCadi[0]?.id || null,
          descuento_empleado: descuentoEmpleado,
          dejar_abierta: true,
        }),
      });

      const dataConsumos = await resConsumos.json();
      if (!resConsumos.ok) throw new Error(dataConsumos.error || 'Error al guardar consumos');

      if (socketRef.current) {
        socketRef.current.emit('cuenta:cambio', { cadi_id: cadiId });
      }

      clearCart();
      setSociosSeleccionadosCadi([]);
      cargarCuentasPendientes();
      if (areaId) cargarProductos(areaId);
    } catch (error: any) {
      console.warn("Fallo de red o túnel inactivo. Guardando en cola local offline.", error);
      let tempId = idCuenta || `temp-${Date.now()}`;
      if (!idCuenta) setCuentaId(tempId as any);

      const payloadProductos = cart.map(item => ({
        producto_id: typeof item.id === 'string' ? parseInt(item.id.split('-')[0]) : item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario !== undefined ? item.precio_unitario : item.precio_venta,
        notas: item.notas || null,
      }));

      if (!idCuenta) {
        addToOfflineQueue({
          url: '/api/pos/cuentas/abrir',
          method: 'POST',
          tempCuentaId: String(tempId),
          data: {
            area_id: areaId,
            cadi_id: cadiId,
            nombre_referencia: refName,
            cliente_id: sociosSeleccionadosCadi[0]?.id || null,
          }
        });
      }

      addToOfflineQueue({
        url: `/api/pos/cuentas/${tempId}/consumos`,
        method: 'PUT',
        tempCuentaId: String(tempId).startsWith('temp-') ? String(tempId) : undefined,
        data: {
          productos: payloadProductos,
          cadi_id: cadiId,
          nombre_referencia: refName,
          cliente_id: sociosSeleccionadosCadi[0]?.id || null,
          descuento_empleado: descuentoEmpleado,
          dejar_abierta: true,
        }
      });

      const mockProductos = cart.map(item => ({
        id: typeof item.id === 'string' ? parseInt(item.id.split('-')[0]) : item.id,
        producto_id: typeof item.id === 'string' ? parseInt(item.id.split('-')[0]) : item.id,
        nombre: item.nombre,
        precio_venta: item.precio_venta,
        cantidad: item.cantidad,
        categoria: item.categoria || '',
        notas: item.notas || '',
      }));

      const mockCuenta = {
        id: tempId,
        area_id: areaId,
        cadi_id: cadiId,
        referencia: refName,
        estado: 'ABIERTA',
        descuento: descuentoEmpleado ? 10 : 0,
        socios: sociosSeleccionadosCadi,
        productos: mockProductos,
        total: cart.reduce((acc, c) => acc + (c.precio_venta * c.cantidad), 0),
        created_at: new Date().toISOString(),
        isOffline: true,
      };

      setCuentasPendientes(prev => {
        const index = prev.findIndex(c => String(c.id) === String(tempId));
        let updatedList;
        if (index > -1) {
          const existingCta = prev[index];
          const combinedProductos = [...existingCta.productos];
          mockProductos.forEach(newP => {
            const pIndex = combinedProductos.findIndex(p => p.id === newP.id);
            if (pIndex > -1) {
              combinedProductos[pIndex].cantidad += newP.cantidad;
            } else {
              combinedProductos.push(newP);
            }
          });
          const updatedCta = {
            ...existingCta,
            productos: combinedProductos,
            total: combinedProductos.reduce((acc, p) => acc + (p.precio_venta * p.cantidad), 0),
          };
          updatedList = prev.map((c, i) => i === index ? updatedCta : c);
        } else {
          updatedList = [mockCuenta, ...prev];
        }
        localStorage.setItem('campestre_cuentas_pendientes', JSON.stringify(updatedList));
        return updatedList;
      });

      setOfflineQueueCount(getOfflineQueue().length);
      clearCart();
      setSociosSeleccionadosCadi([]);
      alert('Conexión con el servidor no disponible (túnel inactivo). Comanda guardada de forma local (offline). Se sincronizará automáticamente cuando vuelva la conexión.');
    } finally {
      setCargando(false);
    }
  };

  // Buscar socios por texto (Autocompletar) con Debounce de 150ms
  const buscarSocios = async (texto: string) => {
    setBusquedaTexto(texto);
    if (texto.length < 2) {
      setSociosBusqueda([]);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/socio/buscar?q=${encodeURIComponent(texto)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setSociosBusqueda(data);
      } catch (error) {
        console.error('Error al buscar socios:', error);
      }
    }, 150);
  };

  // Simular escaneo de QR
  const procesarEscaneoQRSimulado = async () => {
    if (!simularQrToken) return;
    setErrorMsg('');

    try {
      const res = await fetch('/api/socio/buscar-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qr_token: simularQrToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Token QR inválido');
      }

      // Si el socio fue encontrado, agregarlo al grupo temporal del Cadi
      // En un club real, primero debemos tener una asignación activa de Cadi.
      // Si no hay un cadi, podemos abrir la cuenta directamente a nombre de este socio.
      // Para simularlo, lo agregamos a los socios asociados.
      if (!sociosSeleccionadosCadi.some(s => s.id === data.id)) {
        setSociosSeleccionadosCadi([...sociosSeleccionadosCadi, data]);
      }
      setSimularQrToken('');
      setMostrarSimuladorQR(false);
      setMostrarBuscadorSocios(false);
    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  // Guardar cuenta abierta e iniciar el split
  const handleFusionarCuentas = async () => {
    if (!cuentaOrigenFusionId || !cuentaId) return;
    
    setFusionando(true);
    setErrorMsg('');
    
    try {
      const res = await fetch('/api/pos/cuentas/fusionar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cuenta_origen_id: cuentaOrigenFusionId,
          cuenta_destino_id: cuentaId.toString()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMostrarModalFusion(false);
        setCuentaOrigenFusionId('');
        // Recargar la cuenta actual
        const ctaTarget = cuentasPendientes.find(c => c.id.toString() === cuentaId.toString());
        if (ctaTarget) {
          // Volver a cargar la cuenta limpia
          clearCart();
          await cargarCuentasPendientes(); // This will trigger socket to refresh, we can also manually click edit again
          setCuentaId(null);
        }
      } else {
        throw new Error(data.error || 'Error al fusionar cuentas');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error de red al fusionar cuentas');
    } finally {
      setFusionando(false);
    }
  };

  const handleMoverArea = async (destinoAreaId: number) => {
    if (!cuentaId) return;
    setMoviendoArea(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/pos/cuentas/${cuentaId}/cambiar-area`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ area_id: destinoAreaId })
      });

      const data = await res.json();
      if (res.ok) {
        setMostrarModalMoverArea(false);
        clearCart();
        setCuentaId(null);
        await cargarCuentasPendientes();
      } else {
        throw new Error(data.error || 'Error al mover la cuenta de área');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error de red al mover la cuenta de área');
    } finally {
      setMoviendoArea(false);
    }
  };

  const handleGuardarCuenta = async () => {
    if (cart.length === 0) return;
    setCargando(true);
    setErrorMsg('');

    try {
      // 1. Abrir cuenta en DB si no existe
      let idCuenta = cuentaId;
      const refName = (() => {
        if (sociosSeleccionadosCadi.length > 0) {
          const esDefaultOMesa = !nombreReferencia || /^Mesa(\s+\d+)?$/i.test(nombreReferencia.trim());
          if (esDefaultOMesa) {
            return sociosSeleccionadosCadi.map(s => s.nombre).join(', ');
          }
        }
        return nombreReferencia || `Mesa ${Math.floor(Math.random() * 20) + 1}`;
      })();

      // Actualizar el estado local para reflejar el nombre final
      setNombreReferencia(refName);

      if (!idCuenta) {
        const resCuenta = await fetch('/api/pos/cuentas/abrir', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            area_id: areaId,
            cadi_id: cadiId,
            nombre_referencia: refName,
            cliente_id: sociosSeleccionadosCadi[0]?.id || null,
          }),
        });

        const dataCuenta = await resCuenta.json();
        if (!resCuenta.ok) throw new Error(dataCuenta.error || 'Error al abrir la cuenta');
        idCuenta = Number(dataCuenta.id);
        setCuentaId(idCuenta);
      }

      // 2. Guardar los consumos (detalle_cuentas)
      const payloadProductos = cart.map(item => ({
        producto_id: typeof item.id === 'string' ? parseInt(item.id.split('-')[0]) : item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario !== undefined ? item.precio_unitario : item.precio_venta,
        notas: item.notas || null,
      }));

      const resConsumos = await fetch(`/api/pos/cuentas/${idCuenta}/consumos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productos: payloadProductos,
          cadi_id: cadiId,
          nombre_referencia: refName,
          cliente_id: sociosSeleccionadosCadi[0]?.id || null,
          descuento_empleado: descuentoEmpleado,
        }),
      });

      const dataConsumos = await resConsumos.json();
      if (!resConsumos.ok) throw new Error(dataConsumos.error || 'Error al guardar consumos');

      // 3. Emitir evento de cambio vía sockets
      if (socketRef.current) {
        socketRef.current.emit('cuenta:cambio', { cadi_id: cadiId });
      }

      // Cargar previsualización del split
      const resSplit = await fetch(`/api/pos/cuentas/${idCuenta}/split-preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataSplit = await resSplit.json();
      
      if (resSplit.ok) {
        let finalSplit = dataSplit;
        if (!dataSplit.split_automatico && sociosSeleccionadosCadi.length > 0) {
          const totalVal = dataSplit.total;
          const cantidad = sociosSeleccionadosCadi.length;
          const montoBase = Math.round((totalVal / cantidad) * 100) / 100;
          let totalDividido = montoBase * cantidad;
          let residuo = Math.round((totalVal - totalDividido) * 100) / 100;

          const divisiones = sociosSeleccionadosCadi.map((s, index) => {
            let montoCliente = montoBase;
            if (index === cantidad - 1 && residuo !== 0) {
              montoCliente = Math.round((montoCliente + residuo) * 100) / 100;
            }
            return {
              cliente_id: s.id,
              nombre: s.nombre,
              codigo_socio: s.codigo_socio,
              porcentaje: 100 / cantidad,
              monto: montoCliente,
            };
          });

          finalSplit = {
            split_automatico: true,
            total: totalVal,
            divisiones,
          };
        }

        setSplitPreview(finalSplit);
        // Inicializar métodos de pago por cliente
        const metodosIniciales: { [key: number]: string } = {};
        finalSplit.divisiones.forEach((d: any) => {
          metodosIniciales[d.cliente_id] = 'EFECTIVO'; // Por defecto cargo a socio
        });
        setMetodosPago(metodosIniciales);
        setMontoRecibidoSocio({});
        setMetodoPagoDirecto('EFECTIVO');
        setMostrarModalCobro(true);
      } else {
        throw new Error(dataSplit.error || 'Error al calcular la división');
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setCargando(false);
    }
  };

  // Confirmar cobro directo (sin socios)
  const handleCobroDirecto = async () => {
    if (!cuentaId) return;
    setCargando(true);
    setErrorMsg('');

    if (metodoPagoDirecto === 'CARGO_SOCIO' && sociosSeleccionadosCadi.length === 0) {
      setErrorMsg('Debe asignar un socio en la sección derecha para poder realizar un Cargo a Socio');
      setCargando(false);
      return;
    }

    try {
      const bodyObj: any = { metodo_pago: metodoPagoDirecto };
      if (metodoPagoDirecto === 'MIXTO') {
        const ef = Number(montoEfectivoMixto || 0);
        const tj = Number(montoTarjetaMixto || 0);
        if (Math.abs((ef + tj) - totalMasAdeudos) > 0.01) {
          throw new Error(`La suma de efectivo ($${ef.toFixed(2)}) y tarjeta ($${tj.toFixed(2)}) debe coincidir con el total de la cuenta ($${totalMasAdeudos.toFixed(2)})`);
        }
        bodyObj.monto_efectivo = ef;
        bodyObj.monto_tarjeta = tj;
      }

      const response = await fetch(`/api/pos/cuentas/${cuentaId}/pagar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyObj),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el proceso de cobro');
      }

      // Liquidar deudas seleccionadas en modo directo
      for (const key of Object.keys(deudasSocios)) {
        const clienteId = Number(key);
        if (liquidarDeudaSocio[clienteId] && deudasSocios[clienteId]) {
          const divisionesIds = deudasSocios[clienteId].divisiones.map((x: any) => x.division_id);
          
          let metodoLiquidar = metodoPagoDirecto;
          if (metodoLiquidar === 'CARGO_SOCIO') {
            metodoLiquidar = 'EFECTIVO';
          } else if (metodoLiquidar === 'MIXTO') {
            metodoLiquidar = Number(montoTarjetaMixto || 0) > 0 ? 'TARJETA' : 'EFECTIVO';
          }

          const resLiq = await fetch(`/api/pos/socios/${clienteId}/cargos/liquidar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              metodo_pago: metodoLiquidar,
              divisionesIds,
              area_id: areaId,
            }),
          });
          
          const dataLiq = await resLiq.json();
          if (!resLiq.ok) {
            console.error(`Error al liquidar cargos en modo directo:`, dataLiq.error);
          }
        }
      }

      setDatosUltimoTicket((prev: any) => {
        if (prev) {
          return {
            ...prev,
            adeudosPagados: totalAdeudosACobrar
          };
        }
        return prev;
      });
      setPagoExitoso(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Confirmar el cobro dividido final
  const handleConfirmarCobro = async () => {
    if (!cuentaId || !splitPreview) return;
    setCargando(true);
    setErrorMsg('');

    try {
      let bodyObj: any = {};
      const singleDiv = splitPreview.divisiones.length === 1 ? splitPreview.divisiones[0] : null;

      if (singleDiv && abonoMonto && Number(abonoMonto) > 0) {
        if (metodoPagoAbono === 'MIXTO') {
          bodyObj = {
            abono: Number(abonoMonto),
            cliente_id: singleDiv.cliente_id,
            metodo_pago: 'MIXTO',
            monto_efectivo: Number(montoEfectivoMixto || 0),
            monto_tarjeta: Number(montoTarjetaMixto || 0)
          };
        } else {
          bodyObj = {
            abono: Number(abonoMonto),
            cliente_id: singleDiv.cliente_id,
            metodo_pago: metodoPagoAbono || 'EFECTIVO'
          };
        }
      } else {
        const payloadPagos = splitPreview.divisiones.map((d: any) => {
          const met = metodosPago[d.cliente_id] || 'EFECTIVO';
          const pObj: any = {
            cliente_id: d.cliente_id,
            monto: d.monto,
            metodo_pago: met,
          };
          if (met === 'MIXTO') {
            pObj.monto_efectivo = Number(montoEfectivoMixtoSocio[d.cliente_id] || 0);
            pObj.monto_tarjeta = Number(montoTarjetaMixtoSocio[d.cliente_id] || 0);
          }
          return pObj;
        });
        bodyObj = { pagos: payloadPagos };
      }

      const response = await fetch(`/api/pos/cuentas/${cuentaId}/pagar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyObj),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el proceso de cobro');
      }

      // Liquidar deudas seleccionadas
      for (const d of splitPreview.divisiones) {
        if (liquidarDeudaSocio[d.cliente_id] && deudasSocios[d.cliente_id]) {
          const divisionesIds = deudasSocios[d.cliente_id].divisiones.map((x: any) => x.division_id);
          
          let metodoLiquidar = metodosPago[d.cliente_id];
          if (!metodoLiquidar || metodoLiquidar === 'CARGO_SOCIO') {
            metodoLiquidar = metodosPagoLiquidacion[d.cliente_id] || 'EFECTIVO';
          } else if (metodoLiquidar === 'MIXTO') {
            const cardAmt = Number(montoTarjetaMixtoSocio[d.cliente_id] || 0);
            metodoLiquidar = cardAmt > 0 ? 'TARJETA' : 'EFECTIVO';
          }

          const resLiq = await fetch(`/api/pos/socios/${d.cliente_id}/cargos/liquidar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              metodo_pago: metodoLiquidar,
              divisionesIds,
              area_id: areaId,
            }),
          });
          
          const dataLiq = await resLiq.json();
          if (!resLiq.ok) {
            console.error(`Error al liquidar cargos del socio ${d.nombre}:`, dataLiq.error);
          }
        }
      }

      setDatosUltimoTicket((prev: any) => {
        if (prev) {
          return {
            ...prev,
            adeudosPagados: totalAdeudosACobrar
          };
        }
        return prev;
      });
      setPagoExitoso(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleAgregarProductoAlCarrito = (prod: any, e?: React.MouseEvent) => {
    let productoAMapear = prod;
    const nombreLower = prod.nombre.toLowerCase().trim();
    
    // Mapear automáticamente comida sencilla a versión con papas
    if (nombreLower === 'cheeseburger') {
      const conPapas = productos.find(p => p.nombre.toLowerCase().trim() === 'cheeseburger con papas');
      if (conPapas) productoAMapear = conPapas;
    } else if (nombreLower === 'hot dog') {
      const conPapas = productos.find(p => p.nombre.toLowerCase().trim() === 'hot dog con papas');
      if (conPapas) productoAMapear = conPapas;
    } else if (nombreLower === 'boneless') {
      const conPapas = productos.find(p => p.nombre.toLowerCase().trim() === 'boneless con papas');
      if (conPapas) productoAMapear = conPapas;
    }

    const nombreAMapearLower = productoAMapear.nombre.toLowerCase();
    const esPreparada = nombreAMapearLower.includes('prep') || nombreAMapearLower.includes('clamato');
    
    if (e) {
      const x = e.clientX;
      const y = e.clientY;
      const id = Date.now() + Math.random();
      setAnimacionesCarrito(prev => [...prev, { id, x, y }]);
      setTimeout(() => {
        setAnimacionesCarrito(prev => prev.filter(anim => anim.id !== id));
      }, 850);
    }

    if (esPreparada) {
      setProductoPreparadoSeleccionado(productoAMapear);
      setBusquedaMezclador('');
      setMostrarModalMezclador(true);
    } else {
      handleAgregarAlCarrito(productoAMapear);
    }
  };

  const handleSeleccionarMezclador = (mezclador: any) => {
    if (!productoPreparadoSeleccionado) return;
    
    // Agregar la bebida preparada
    handleAgregarAlCarrito(productoPreparadoSeleccionado);
    
    // Solo el agua mineral, agua natural o refrescos (categoría 'bebidas') no se cobran. Cervezas y licores/alcoholes sí.
    const esGratis = mezclador.nombre.toLowerCase().includes('agua mineral') ||
                     mezclador.nombre.toLowerCase().includes('agua natural') ||
                     mezclador.categoria?.toLowerCase() === 'bebidas';
                     
    const precio = esGratis ? 0 : Number(mezclador.precio_venta);
    
    // Agregar el mezclador con el precio correspondiente y un ID único
    const mezcladorModificado = {
      ...mezclador,
      id: `${mezclador.id}-mixer`,
      nombre: esGratis ? `${mezclador.nombre} (Mezclador - Gratis)` : `${mezclador.nombre} (Mezclador)`,
      precio_venta: precio,
      precio_unitario: precio,
    };
    handleAgregarAlCarrito(mezcladorModificado);
    
    setMostrarModalMezclador(false);
    setProductoPreparadoSeleccionado(null);
    setBusquedaMezclador('');
  };

  const handleAgregarSinMezclador = () => {
    if (productoPreparadoSeleccionado) {
      handleAgregarAlCarrito(productoPreparadoSeleccionado);
    }
    setMostrarModalMezclador(false);
    setProductoPreparadoSeleccionado(null);
    setBusquedaMezclador('');
  };

  const handleEliminarCuenta = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta cuenta? Los productos se devolverán al inventario y esta acción no se puede deshacer.')) return;
    setCargando(true);
    try {
      const res = await fetch(`/api/admin/cuentas/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar la cuenta');
      
      if (cuentaId === id) {
        clearCart();
        setCuentaId(null);
        setNombreReferencia('');
        setCadiId(null);
      }
      
      cargarCuentasPendientes();
      if (areaId) cargarProductos(areaId);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Verificar si el descuento de empleado está activado
  const tieneDescuento = descuentoEmpleado;

  // Calcular subtotal (suma de todos los productos que no son de la categoría 'descuentos')
  const subtotalLocal = cart
    .filter(item => item.categoria?.toLowerCase() !== 'descuentos')
    .reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);

  // Calcular descuento (30% de los productos sin descuento, si está activado)
  const descuentoLocal = tieneDescuento ? subtotalLocal * 0.30 : 0;

  // Calcular total final
  const totalLocal = subtotalLocal - descuentoLocal;

  // Filtrar productos por búsqueda y por categoría seleccionada
  const productosFiltrados = productos.filter((prod) => {
    // Ocultar del catálogo principal de venta la "Agua Mineral Grande"
    const nombreNormalizado = prod.nombre?.toLowerCase().trim() || '';
    if (nombreNormalizado === 'agua mineral grande') return false;

    // Si no es BAR (areaId === 1) ni SNACK (areaId === 2), excluir comidas, cenas, desayunos, niños y tacos de guisos
    const categoriaNormalizada = prod.categoria?.toLowerCase().trim() || '';
    const esExcluido = ['comida', 'comidas', 'cenas', 'desayunos', 'niños', 'tacos de guisos'].includes(categoriaNormalizada);
    if (areaId !== 1 && areaId !== 2 && esExcluido) return false;

    if (busquedaProducto.trim() !== '') {
      const q = busquedaProducto.toLowerCase().trim();
      const nombreOk = prod.nombre?.toLowerCase().includes(q);
      const descOk = prod.descripcion?.toLowerCase().includes(q);
      const catOk = prod.categoria?.toLowerCase().includes(q);
      return nombreOk || descOk || catOk;
    }
    if (categoriaSeleccionada === 'TODOS') return true;
    return prod.categoria?.toLowerCase() === categoriaSeleccionada.toLowerCase();
  });

  // Suma de adeudos que se van a cobrar en este momento (tanto en división como en directo)
  const totalAdeudosACobrar = (() => {
    if (splitPreview && splitPreview.divisiones && splitPreview.divisiones.length > 0) {
      return splitPreview.divisiones.reduce((sum: number, d: any) => {
        if (liquidarDeudaSocio[d.cliente_id] && deudasSocios[d.cliente_id]) {
          return sum + deudasSocios[d.cliente_id].total;
        }
        return sum;
      }, 0);
    } else {
      return Object.keys(deudasSocios).reduce((sum: number, key: string) => {
        const clienteId = Number(key);
        if (liquidarDeudaSocio[clienteId] && deudasSocios[clienteId]) {
          return sum + deudasSocios[clienteId].total;
        }
        return sum;
      }, 0);
    }
  })();

  // Filtrar cuentas pendientes según el buscador
  const cuentasPendientesFiltradas = cuentasPendientes.filter((cta) => {
    const query = busquedaPendientes.toLowerCase().trim();
    if (!query) return true;
    return (
      cta.referencia?.toLowerCase().includes(query) ||
      cta.id?.toString().toLowerCase().includes(query) ||
      cta.cadi?.toString().toLowerCase().includes(query) ||
      cta.area?.toLowerCase().includes(query)
    );
  });

  // Filtrar cuentas pagadas según el buscador
  const cuentasPagadasFiltradas = cuentasPagadas.filter((cta) => {
    const query = busquedaPagadas.toLowerCase().trim();
    if (!query) return true;
    return (
      cta.referencia?.toLowerCase().includes(query) ||
      cta.id?.toString().toLowerCase().includes(query) ||
      cta.cadi?.toString().toLowerCase().includes(query) ||
      cta.area?.toLowerCase().includes(query) ||
      cta.pagos?.some((p: any) => p.nombre?.toLowerCase().includes(query) || p.metodo?.toLowerCase().includes(query))
    );
  });

  const totalMasAdeudos = splitPreview ? splitPreview.total + totalAdeudosACobrar : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      <style>{`
        @keyframes floatFadeCart {
          0% {
            transform: translate(-50%, -50%) scale(1) translateY(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.4) translateY(-90px);
            opacity: 0;
          }
        }
        .animate-float-fade-cart {
          animation: floatFadeCart 0.75s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @media screen {
          #printable-ticket {
            display: none !important;
          }
        }
      `}</style>

      {/* Animaciones flotantes de "+1 🛒" */}
      {animacionesCarrito.map((anim) => (
        <span
          key={anim.id}
          style={{ left: anim.x, top: anim.y }}
          className="fixed pointer-events-none text-emerald-400 text-xs font-extrabold Outfit z-[9999] animate-float-fade-cart bg-slate-950/90 border border-emerald-500/30 px-2 py-1 rounded-full shadow-lg shadow-emerald-500/25 flex items-center gap-1"
        >
          <span>+1</span>
          <span>🛒</span>
        </span>
      ))}

      {/* ===== TICKET DE VENTA (OCULTO, SOLO PARA IMPRESIÓN) ===== */}
      <div className="hidden print:block print-wrapper">
        <TicketVenta 
          cuenta={datosUltimoTicket || {
            id: 'BORRADOR',
            descuento: 0,
            propina: 0,
            metodo_pago: 'EFECTIVO',
            detalleCuentas: [],
            mesa: nombreReferencia,
            socioNombre: ''
          }} 
          areaNombre={areaId === 1 ? 'Bar' : areaId === 2 ? 'Snack' : 'Palapa'} 
          cajeroNombre="Cajero POS"
        />
      </div>

      {/* Sección izquierda y central: Selección de área y catálogo de productos */}
      <div className="lg:col-span-2 space-y-6">
        {/* Banners de Estado del Turno */}
        {!turnoActivo && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex gap-3 text-amber-400">
            <span className="text-xl">⛳</span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Caja Cerrada</h4>
              <p className="text-[11px] text-slate-350 mt-1">
                No hay un turno de caja activo para el día de hoy. Abre la caja ingresando el fondo inicial abajo para poder operar en el POS.
              </p>
            </div>
          </div>
        )}

        {turnoActivo && !turnoAbiertoHoy && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 flex gap-3 text-red-400">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Turno de Caja Rezagado</h4>
              <p className="text-[11px] text-slate-350 mt-1">
                Hay una caja activa abierta en un día anterior (Inició: {new Date(turnoActivo.abierto_at).toLocaleDateString('es-MX')}). Debes realizar el <b>corte de caja</b> en Administración para poder operar hoy.
              </p>
            </div>
          </div>
        )}

        {/* Selector de Áreas Físicas */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Seleccionar Entorno:</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
              isOnline 
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/25 text-rose-450 animate-pulse'
            }`}>
              {isOnline ? '🟢 En Línea' : '🔴 Fuera de Línea'}
            </span>
            {offlineQueueCount > 0 && (
              <span className="bg-amber-500/10 border-amber-500/25 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase animate-pulse">
                ⏳ {offlineQueueCount} comanda(s) pendiente(s) por enviar
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            {[
              { id: 1, name: 'Bar 🍺' },
              { id: 2, name: 'Snack 🍔' },
              { id: 3, name: 'Palapa 🌴' },
            ].map((area) => (
              <button
                key={area.id}
                onClick={() => setAreaId(area.id)}
                className={`px-5 py-2.5 btn-premium text-sm ${
                  areaId === area.id
                    ? 'bg-campestre-green text-white font-bold shadow-lg shadow-campestre-green/20'
                    : 'bg-slate-800 text-slate-350 hover:bg-slate-750'
                }`}
              >
                {area.name}
              </button>
            ))}
          </div>
        </div>

        {/* Catálogo de Productos */}
        {!areaId ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 flex flex-col justify-center items-center">
            <span className="text-5xl animate-bounce">⛳</span>
            <h3 className="text-xl font-bold mt-4">Campestre System</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm">
              Por favor selecciona un área física arriba (Bar, Snack o Palapa) para cargar el catálogo de productos y stock local.
            </p>
          </div>
        ) : !turnoAbiertoHoy ? (
          <div className="glass-card rounded-3xl p-10 text-center border border-slate-800 flex flex-col justify-center items-center bg-slate-900/10">
            <span className="text-5xl animate-pulse mb-2">🔒</span>
            <h3 className="text-lg font-bold text-amber-500/90 mt-4">Sistema Inactivo</h3>
            
            {!turnoActivo ? (
              <div className="mt-4 w-full max-w-sm space-y-4">
                <p className="text-slate-350 text-xs">
                  No hay un turno de caja abierto para el día de hoy. Ingresa el fondo inicial para abrir la caja y comenzar a vender.
                </p>
                <form onSubmit={handleAbrirTurnoPOS} className="space-y-3">
                  <div className="text-left">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Fondo Inicial en Caja ($)
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 500"
                      value={fondoInicialPOS}
                      onChange={(e) => setFondoInicialPOS(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800/85 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-campestre-green transition-all"
                      required
                      min="0"
                      step="any"
                    />
                  </div>
                  
                  {errorAbrirTurno && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 p-2 rounded-lg">
                      {errorAbrirTurno}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={cargandoAbrirTurno}
                    className="w-full py-3 bg-campestre-green hover:bg-campestre-green/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {cargandoAbrirTurno ? 'Abriendo...' : 'Aperturar Turno en Caja'}
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-slate-400 text-xs mt-2 max-w-md">
                Existe un turno activo de otra fecha ({new Date(turnoActivo.abierto_at).toLocaleDateString('es-MX')}). Se requiere hacer el corte de caja antes de iniciar la jornada de hoy. Solicita a un administrador realizar el arqueo.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-bold Outfit">
                Menú y Productos del Área
              </h3>
              <div className="flex items-center gap-3">
                {/* Buscador de Productos */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, desc o cat..."
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-800/80 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-campestre-gold transition-colors"
                  />
                  {busquedaProducto && (
                    <button
                      onClick={() => setBusquedaProducto('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => {
                    cargarProductos(areaId);
                    setBusquedaProducto('');
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Recargar inventario"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* Mini-menús (Categorías) */}
            <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <button
                onClick={() => setCategoriaSeleccionada('TODOS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  categoriaSeleccionada === 'TODOS'
                    ? 'bg-campestre-gold text-slate-950 shadow-md shadow-campestre-gold/15'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white'
                }`}
              >
                Todos
              </button>
              {[
                { id: 'bebidas', label: 'Bebidas 🥤' },
                { id: 'botanas', label: 'Botanas 🍟' },
                { id: 'cenas', label: 'Cenas 🍽️' },
                { id: 'cervezas', label: 'Cervezas 🍺' },
                { id: 'cigarros', label: 'Cigarros 🚬' },
                { id: 'comida', label: 'Comida 🍔' },
                { id: 'desayunos', label: 'Desayunos 🍳' },
                { id: 'niños', label: 'Niños 👦👧' },
                { id: 'ron, brandy y vodka', label: 'Ron/Brandy/Vodka 🥃' },
                { id: 'tacos de guisos', label: 'Tacos de Guisos 🌮' },
                { id: 'tequilas', label: 'Tequilas 🌵' },
                { id: 'whisky', label: 'Whisky 🥃' },
              ].filter((cat) => {
                if (areaId !== 1 && areaId !== 2) {
                  const esExcluido = ['comida', 'comidas', 'cenas', 'desayunos', 'niños', 'tacos de guisos'].includes(cat.id.toLowerCase());
                  return !esExcluido;
                }
                return true;
              }).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSeleccionada(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    categoriaSeleccionada === cat.id
                      ? 'bg-campestre-gold text-slate-950 shadow-md shadow-campestre-gold/15'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {productosFiltrados.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 flex flex-col justify-center items-center">
                <span className="text-4xl animate-bounce">🍽️</span>
                <h4 className="text-sm font-bold text-white mt-4">No hay productos en esta categoría</h4>
                <p className="text-slate-400 text-xs mt-1 max-w-sm">
                  Crea productos asignados a esta categoría desde el panel de administración.
                </p>
              </div>
            ) : (
              <div className="max-h-[520px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {productosFiltrados.filter(p => p.stock > 0).map((prod) => {
                      const sinStock = false;
                      return (
                        <button
                          key={prod.id}
                          disabled={sinStock}
                          onClick={(e) => handleAgregarProductoAlCarrito(prod, e)}
                          className={`glass-card rounded-2xl p-4 border text-left flex flex-col justify-between transition-all duration-300 relative group overflow-hidden border-slate-800 hover:border-campestre-green/50 active:scale-[0.98]`}
                        >
                          <div className="absolute inset-0 bg-campestre-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                          <span className="text-[10px] text-campestre-gold font-semibold uppercase tracking-wider bg-campestre-gold/10 px-2 py-0.5 rounded-md w-fit mb-3">
                            {prod.categoria?.toLowerCase() === 'descuentos' ? '30% de Descuento' : (prod.categoria || 'Común')}
                          </span>
                          <div>
                            <h4 className="font-bold text-sm text-white line-clamp-2 leading-tight group-hover:text-campestre-gold transition-colors">{prod.nombre}</h4>
                            <p className="text-xs text-slate-400 mt-1">Stock: <b>{prod.stock}</b> pz</p>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-800/80">
                            {prod.categoria?.toLowerCase() === 'descuentos' ? (
                              <span className="text-xs font-bold text-emerald-400 Outfit">Aplica 30% a la cuenta</span>
                            ) : (
                              <span className="text-base font-extrabold text-white Outfit">${prod.precio_venta.toFixed(2)}</span>
                            )}
                            <span className="p-1 rounded-lg bg-campestre-green/10 text-campestre-green group-hover:bg-campestre-green group-hover:text-white transition-all">
                              <Plus size={14} />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {productosFiltrados.filter(p => p.stock <= 0).length > 0 && (
                    <div className="mt-2 border-t border-slate-800/50 pt-4">
                      <button 
                        onClick={() => setMostrarAgotados(!mostrarAgotados)}
                        className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-2 mb-4 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50 transition-colors"
                      >
                        {mostrarAgotados ? 'Ocultar productos agotados' : `Mostrar ${productosFiltrados.filter(p => p.stock <= 0).length} productos agotados`}
                      </button>

                      {mostrarAgotados && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 opacity-60">
                          {productosFiltrados.filter(p => p.stock <= 0).map((prod) => {
                            const sinStock = true;
                            return (
                              <button
                                key={prod.id}
                                disabled={sinStock}
                                onClick={(e) => handleAgregarProductoAlCarrito(prod, e)}
                                className={`glass-card rounded-2xl p-4 border text-left flex flex-col justify-between transition-all duration-300 relative group overflow-hidden border-slate-900 cursor-not-allowed`}
                              >
                                <div className="absolute inset-0 bg-campestre-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-md w-fit mb-3">
                                  Sin Disponible
                                </span>
                                <div>
                                  <h4 className="font-bold text-sm text-white line-clamp-2 leading-tight group-hover:text-campestre-gold transition-colors">{prod.nombre}</h4>
                                  <p className="text-xs text-slate-400 mt-1">Stock: <b className="text-red-400">{prod.stock}</b> pz</p>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-800/80">
                                  {prod.categoria?.toLowerCase() === 'descuentos' ? (
                                    <span className="text-xs font-bold text-emerald-400 Outfit">Aplica 30% a la cuenta</span>
                                  ) : (
                                    <span className="text-base font-extrabold text-white Outfit">${prod.precio_venta.toFixed(2)}</span>
                                  )}
                                  <span className="p-1 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold">🚫</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cuentas Pendientes de Pago */}
        <div className="bg-[#1e293b]/70 backdrop-blur-md rounded-3xl border-2 border-yellow-500 p-6 space-y-4 shadow-lg shadow-yellow-500/5">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="text-campestre-gold" size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Cuentas Pendientes (Mesa/Ronda Abiertas)
              </h3>
            </div>
            <button
              type="button"
              onClick={cargarCuentasPendientes}
              className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold border border-slate-700"
            >
              <RefreshCw size={12} className={cargandoCuentas ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>

          {/* Buscador Cuentas Pendientes */}
          {turnoAbiertoHoy && cuentasPendientes.length > 0 && (
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar por referencia, mesa, socio o ID..."
                value={busquedaPendientes}
                onChange={(e) => setBusquedaPendientes(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-campestre-gold/50 transition-all font-medium"
              />
            </div>
          )}

          {!turnoAbiertoHoy ? (
            <div className="text-center py-6 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800/80 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-500/80">⚠️ Caja Cerrada o del Día Anterior</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {!turnoActivo 
                  ? "Para visualizar cuentas y vender, primero debe aperturar la caja del día."
                  : "Por favor, realice el corte de caja anterior en Administración para operar hoy."}
              </p>
            </div>
          ) : cuentasPendientesFiltradas.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="text-xs">
                {busquedaPendientes.trim() !== '' 
                  ? "No se encontraron cuentas pendientes que coincidan con la búsqueda."
                  : "No hay cuentas pendientes abiertas en el POS."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
              {cuentasPendientesFiltradas.map((cta) => (
                <div
                  key={cta.id}
                  className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3.5 transition-all ${
                    cuentaId === Number(cta.id)
                      ? 'border-yellow-400 bg-yellow-500/25 shadow-lg shadow-yellow-500/15'
                      : 'border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/15 hover:border-yellow-500/60'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider block w-fit mb-1.5 ${
                        cta.area_id === 1 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                        : cta.area_id === 2 ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25'
                      }`}>
                        {cta.area}
                      </span>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {cta.referencia}
                      </h4>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {cta.cadi ? `Cadi: ${cta.cadi}` : 'Sin Cadi'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-campestre-gold Outfit block">
                        ${cta.total.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500 block font-mono mt-1">
                        #{cta.id.slice(-6)}
                      </span>
                    </div>
                  </div>

                  {cta.productos.length > 0 && (
                    <div className="text-[9px] text-slate-400 bg-slate-950/40 rounded-lg p-2 max-h-16 overflow-y-auto border border-slate-900">
                      <span className="font-semibold block text-slate-500 mb-0.5 uppercase tracking-wider">Consumo:</span>
                      {cta.productos.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between">
                          <span>{p.cantidad}x {p.nombre}</span>
                          <span className="text-slate-300 font-bold">${p.subtotal.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-slate-800/80 pt-2.5">
                    <span>Abierta: {new Date(cta.fecha).toLocaleTimeString('es-MX', { timeStyle: 'short' })}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSeleccionarCuenta(cta)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold border border-slate-700 flex items-center gap-1 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePagarCuentaDirecto(cta)}
                        className="px-2.5 py-1.5 bg-campestre-green hover:bg-campestre-green/90 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                      >
                        Pagar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarCuenta(cta.id)}
                        className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-bold border border-red-500/25 flex items-center gap-1 transition-colors"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cuentas Pagadas (Turno Activo) */}
        <div className="bg-[#1e293b]/70 backdrop-blur-md rounded-3xl border-2 border-emerald-500 p-6 space-y-4 shadow-lg shadow-emerald-500/5">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Check className="text-emerald-400" size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Cuentas Pagadas (Turno Activo)
              </h3>
            </div>
            <button
              type="button"
              onClick={cargarCuentasPagadas}
              className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold border border-slate-700"
            >
              <RefreshCw size={12} className={cargandoPagadas ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>

          {/* Buscador Cuentas Pagadas */}
          {turnoAbiertoHoy && cuentasPagadas.length > 0 && (
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar por referencia, socio, método de pago o ID..."
                value={busquedaPagadas}
                onChange={(e) => setBusquedaPagadas(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-campestre-gold/50 transition-all font-medium"
              />
            </div>
          )}

          {!turnoAbiertoHoy ? (
            <div className="text-center py-6 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800/80 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-500/80">⚠️ Caja Cerrada o del Día Anterior</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {!turnoActivo 
                  ? "Para visualizar cuentas y vender, primero debe aperturar la caja del día."
                  : "Por favor, realice el corte de caja anterior en Administración para operar hoy."}
              </p>
            </div>
          ) : cuentasPagadasFiltradas.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="text-xs">
                {busquedaPagadas.trim() !== '' 
                  ? "No se encontraron cuentas pagadas que coincidan con la búsqueda."
                  : "No hay cuentas pagadas en el turno activo."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
              {cuentasPagadasFiltradas.map((cta) => (
                <div
                  key={cta.id}
                  className="bg-emerald-500/10 border border-emerald-500/45 hover:bg-emerald-500/15 hover:border-emerald-500/70 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 transition-all"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider block w-fit ${
                          cta.area === 'Bar' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : cta.area === 'Snack' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25'
                        }`}>
                          {cta.area}
                        </span>
                        {cta.atendido_por && (
                          <span className="text-[10px] text-slate-400">
                            Vendedor: {cta.atendido_por}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {cta.referencia}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-emerald-450 Outfit block">
                        ${cta.total.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500 block font-mono mt-1">
                        #{cta.id.toString().slice(-6)}
                      </span>
                    </div>
                  </div>

                  {/* Consumo Resumen */}
                  {cta.items && cta.items.length > 0 && (
                    <div className="text-[9px] text-slate-450 bg-slate-950/40 rounded-lg p-2 max-h-16 overflow-y-auto border border-slate-900">
                      <span className="font-semibold block text-slate-550 mb-0.5 uppercase tracking-wider">Consumo:</span>
                      {cta.items.map((itemStr: string, idx: number) => (
                        <div key={idx} className="text-slate-350">
                          {itemStr}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Detalle Pagos */}
                  <div className="text-[9px] space-y-1 bg-slate-950/20 rounded-xl p-2.5 border border-slate-900/60">
                    <span className="font-semibold block text-slate-550 text-[9px] uppercase tracking-wider mb-1">
                      Método de Pago:
                    </span>
                    {cta.pagos.map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-slate-300">
                        <span className="truncate max-w-[120px]">{p.nombre}</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                          p.metodo === 'EFECTIVO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                          p.metodo === 'TARJETA' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' :
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/25'
                        }`}>
                          {p.metodo} (${p.monto.toFixed(0)})
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-slate-800/80 pt-2.5">
                    <span>Abierta: {cta.fecha ? new Date(cta.fecha).toLocaleTimeString('es-MX', { timeStyle: 'short' }) : '—'}</span>
                    <div className="flex gap-2">
                      {user?.roles?.includes('ADMIN') && (
                        <button
                          type="button"
                          onClick={() => handleSeleccionarCuenta(cta)}
                          className="px-2.5 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-450 rounded-lg font-bold border border-yellow-500/25 flex items-center gap-1 transition-colors"
                        >
                          Editar Cuenta
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => iniciarEdicionPago(cta)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-lg font-bold border border-slate-700 transition-colors"
                      >
                        Editar Pago
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sección derecha: Carrito de Compras, Cadi y Split */}
      <div className="space-y-6">
        <div className="glass-card rounded-3xl border border-slate-800 flex flex-col min-h-[500px]">
          {/* Header Carrito */}
          <div className="p-6 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="text-campestre-gold" size={20} />
                <h3 className="font-extrabold text-base Outfit">Detalle del Pedido</h3>
              </div>
              {cart.length > 0 && !cuentaId && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors flex items-center space-x-1"
                >
                  <Trash2 size={12} />
                  <span>Vaciar</span>
                </button>
              )}
            </div>
            {cuentaId && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="text-[10px] text-yellow-400">
                  <span className="font-bold uppercase block">Edición Activa</span>
                  <span>Cuenta #{cuentaId.toString().slice(-6)} ({nombreReferencia || 'Sin Ref'})</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMostrarModalFusion(true)}
                    className="text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-2 py-1 rounded-lg border border-blue-500/20 transition-colors font-bold flex items-center space-x-1"
                  >
                    <Merge size={12} />
                    <span>Juntar</span>
                  </button>
                  <button
                    onClick={() => setMostrarModalMoverArea(true)}
                    className="text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-2 py-1 rounded-lg border border-purple-500/20 transition-colors font-bold flex items-center space-x-1"
                  >
                    <Move size={12} />
                    <span>Mover</span>
                  </button>
                  <button
                    onClick={handleCancelarEdicion}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-350 px-2 py-1 rounded-lg border border-slate-700 transition-colors font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {errorMsg && !mostrarModalCobro && !mostrarModalFusion && !mostrarModalIniciarRonda && (
            <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          {/* Lista del Carrito */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[300px]">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-sm">El carrito está vacío</p>
                <p className="text-xs mt-1">Agrega consumos desde el menú</p>
              </div>
            ) : (
              cart.map((item) => (
                <div id={`cart-item-${item.id}`} key={item.id} className="flex justify-between items-center py-2.5 border-b border-slate-800/40 last:border-0">
                  <div className="flex-1 pr-2">
                    <h5 className="text-sm font-semibold text-white line-clamp-1">
                      {item.nombre}
                      {item.esNuevo && (
                        <span className="ml-2 text-[8px] bg-purple-500/30 text-purple-300 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">Nuevo</span>
                      )}
                    </h5>
                    {item.categoria?.toLowerCase() === 'descuentos' ? (
                      <span className="text-xs text-emerald-400 font-bold mt-0.5 block">Aplicado (-${descuentoLocal.toFixed(2)})</span>
                    ) : (
                      <div className="flex flex-col space-y-1 mt-1">
                        <span className="text-xs text-campestre-gold font-medium">${item.precio_venta.toFixed(2)} c/u</span>
                        <input
                          type="text"
                          value={item.notas || ''}
                          onChange={(e) => updateCartNotes(item.id, e.target.value)}
                          placeholder="Nota (ej: sin cebolla)..."
                          className="w-full bg-slate-900/50 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-300 placeholder:text-slate-600 focus:border-purple-500/50 outline-none"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2.5">
                    {item.categoria?.toLowerCase() !== 'descuentos' && (
                      <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            const currentQty = item.cantidad;
                            if (currentQty > 1) {
                              updateCartQuantity(item.id, currentQty - 1);
                            } else {
                              removeFromCart(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                          title="Disminuir cantidad"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="text"
                          value={editingQty[item.id] !== undefined ? editingQty[item.id] : (item.cantidad % 1 === 0 ? item.cantidad.toString() : Number(item.cantidad.toFixed(2)).toString())}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^[0-9./]*$/.test(val)) {
                              setEditingQty(prev => ({ ...prev, [item.id]: val }));
                              
                              let parsed = parseFloat(val);
                              if (val.includes('/')) {
                                const parts = val.split('/');
                                if (parts.length === 2) {
                                  const num = parseFloat(parts[0]);
                                  const den = parseFloat(parts[1]);
                                  if (!isNaN(num) && !isNaN(den) && den !== 0) {
                                    parsed = num / den;
                                  }
                                }
                              }
                              
                              if (!isNaN(parsed) && parsed > 0) {
                                updateCartQuantity(item.id, parsed);
                              }
                            }
                          }}
                          onBlur={() => {
                            setEditingQty(prev => {
                              const copy = { ...prev };
                              delete copy[item.id];
                              return copy;
                            });
                          }}
                          className="w-10 bg-transparent text-xs text-white text-center py-1 font-bold focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateCartQuantity(item.id, item.cantidad + 1);
                          }}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                          title="Aumentar cantidad"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Asignación de Cadi y Clientes (solo si el carrito tiene productos) */}
          {cart.length > 0 && (
            <div className="p-6 bg-slate-900/40 border-t border-slate-800 space-y-4">
              {/* Selección de Cadi */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Asociar a un Cadi:</label>
                  <button
                    onClick={() => setMostrarModalIniciarRonda(true)}
                    className="text-[10px] text-campestre-gold hover:underline font-bold"
                  >
                    + Iniciar Ronda
                  </button>
                </div>
                <select
                  value={cadiId || ''}
                  onChange={(e) => setCadiId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-campestre-gold"
                >
                  <option value="">-- Sin Cadi Asignado --</option>
                  {cadis.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.numero_cadi} - {c.nombre} ({c.clientes.length} socios)
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre de Referencia/Mesa */}
              <div className="relative">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Referencia de Mesa / Ubicación:</label>
                  <button
                    onClick={() => setMostrarModalCrearSocio(true)}
                    className="text-[10px] text-campestre-gold hover:underline font-bold"
                  >
                    + Crear Socio
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="E.g. Mesa 4, Hoyo 9, Camastro Alberca"
                  value={nombreReferencia}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNombreReferencia(val);
                    if (val.trim().length >= 2) {
                      buscarSocios(val);
                    } else {
                      setSociosBusqueda([]);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-campestre-gold"
                />

                {/* Dropdown de Sugerencias (Socios y Cadis) */}
                {nombreReferencia.trim().length >= 2 && (sociosBusqueda.length > 0 || cadis.some(c => c.nombre.toLowerCase().includes(nombreReferencia.toLowerCase()) || c.numero_cadi.toString().includes(nombreReferencia))) && (
                  <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-xl text-xs">
                    {/* Sección de Cadis */}
                    {cadis
                      .filter(c => c.nombre.toLowerCase().includes(nombreReferencia.toLowerCase()) || c.numero_cadi.toString().includes(nombreReferencia))
                      .map(c => (
                        <button
                          type="button"
                          key={`cadi-${c.id}`}
                          onClick={() => {
                            setNombreReferencia(c.nombre);
                            setCadiId(c.id);
                            setSociosBusqueda([]);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-800 border-b border-slate-800 last:border-0 text-white flex justify-between items-center"
                        >
                          <div>
                            <span className="font-semibold text-campestre-gold">Cadi: </span>
                            <span>{c.nombre}</span>
                          </div>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">#{c.numero_cadi}</span>
                        </button>
                      ))}

                    {/* Sección de Socios */}
                    {sociosBusqueda.map(s => (
                      <button
                        type="button"
                        key={`socio-${s.id}`}
                        onClick={() => {
                          setNombreReferencia(s.nombre);
                          setSociosSeleccionadosCadi([s]);
                          setCadiId(null);
                          setSociosBusqueda([]);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-800 border-b border-slate-800 last:border-0 text-white flex justify-between items-center"
                      >
                        <div>
                          <span className="font-semibold text-blue-400">Socio: </span>
                          <span>{s.nombre}</span>
                        </div>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">{s.codigo_socio}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Totales y Botón Guardar / Pagar */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-slate-800 space-y-4">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none bg-slate-950/40 rounded-xl px-3 py-2 border border-slate-800 hover:border-slate-750 transition-colors">
                <input
                  type="checkbox"
                  checked={descuentoEmpleado}
                  onChange={(e) => setDescuentoEmpleado(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-campestre-gold focus:ring-campestre-gold/50 focus:ring-offset-slate-900 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-300">🏷️ Descuento Empleado (30%)</span>
              </label>

              {/* Sección de Adeudos de Socios Seleccionados */}
              {Object.keys(cargosSociosPanel).some(key => cargosSociosPanel[Number(key)]?.total > 0) && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4.5 space-y-3">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">⚠️ Socios con Adeudos Pendientes</span>
                  <div className="space-y-2">
                    {Object.keys(cargosSociosPanel).map(key => {
                      const clienteId = Number(key);
                      const cargos = cargosSociosPanel[clienteId];
                      if (!cargos || cargos.total <= 0) return null;
                      const socioObj = sociosSeleccionadosCadi.find(s => s.id === clienteId);
                      if (!socioObj) return null;
                      
                      return (
                        <label key={clienteId} className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-colors">
                          <div className="flex items-center space-x-2.5">
                            <input
                              type="checkbox"
                              checked={!!liquidarCargosPanel[clienteId]}
                              onChange={(e) => setLiquidarCargosPanel({
                                ...liquidarCargosPanel,
                                [clienteId]: e.target.checked
                              })}
                              className="rounded border-slate-700 bg-slate-800 text-campestre-gold focus:ring-campestre-gold focus:ring-offset-0 w-4 h-4"
                            />
                            <div className="text-left">
                              <span className="text-[11px] font-bold text-white block">{socioObj.nombre}</span>
                              <span className="text-[9px] text-slate-450 block font-mono">#{socioObj.codigo_socio}</span>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-amber-400 font-mono">${cargos.total.toFixed(2)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {tieneDescuento && (
                  <>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-white">${subtotalLocal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                      <span>Descuento Empleado (30%):</span>
                      <span>-${descuentoLocal.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className={`flex justify-between text-base font-extrabold text-white Outfit ${tieneDescuento ? 'border-t border-slate-800/60 pt-2' : ''}`}>
                  <span>Total del Pedido:</span>
                  <span className="gold-gradient-text">${totalLocal.toFixed(2)}</span>
                </div>
                {Object.keys(liquidarCargosPanel).some(key => liquidarCargosPanel[Number(key)]) && (
                  <>
                    <div className="flex justify-between text-xs text-slate-450 border-t border-slate-800/60 pt-2">
                      <span>Consumo del día:</span>
                      <span className="font-semibold text-white">${totalLocal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-amber-400 font-semibold">
                      <span>Adeudos Seleccionados:</span>
                      <span>+${Object.keys(liquidarCargosPanel).reduce((sum, key) => {
                        const cid = Number(key);
                        return sum + (liquidarCargosPanel[cid] ? (cargosSociosPanel[cid]?.total || 0) : 0);
                      }, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-white Outfit border-t border-slate-800/60 pt-2">
                      <span>Total General (Pedido + Adeudos):</span>
                      <span className="gold-gradient-text">${(totalLocal + Object.keys(liquidarCargosPanel).reduce((sum, key) => {
                        const cid = Number(key);
                        return sum + (liquidarCargosPanel[cid] ? (cargosSociosPanel[cid]?.total || 0) : 0);
                      }, 0)).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={cart.length === 0}
                  className="py-3 px-4.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-250 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 rounded-xl transition-colors text-xs flex items-center justify-center font-bold"
                  title="Imprimir Pre-ticket (80mm)"
                >
                  🖨️
                </button>
                <button
                  onClick={handleSoloGuardarConsumos}
                  disabled={cargando}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold rounded-xl border border-slate-700 transition-colors text-xs"
                >
                  {cuentaId ? 'Guardar Cambios' : 'Dejar Abierta'}
                </button>
                <button
                  onClick={handleGuardarCuenta}
                  disabled={cargando}
                  className="flex-1 py-3 bg-campestre-green hover:bg-campestre-green/90 text-white font-bold rounded-xl btn-premium shadow-lg shadow-campestre-green/20 text-xs"
                >
                  {cargando ? 'Procesando...' : 'Pagar Cuenta'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL DE COBRO --- */}
      {mostrarModalCobro && splitPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-glass p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold Outfit flex items-center space-x-2">
                <Sparkles className="text-campestre-gold" size={18} />
                <span>{splitPreview.divisiones.length > 0 ? 'Cobro con División (Split)' : 'Cobrar Cuenta'}</span>
              </h3>
              {!pagoExitoso && (
                <button
                  onClick={() => setMostrarModalCobro(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm"
                >
                  Cerrar
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl text-center font-medium">
                {errorMsg}
              </div>
            )}

             {pagoExitoso ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <Check size={36} />
                </div>
                <h4 className="text-xl font-bold text-white font-sans">¡Transacción Exitosa!</h4>
                <p className="text-xs text-slate-400">Los stocks se han descontado y el pago fue registrado correctamente.</p>
                <div className="flex flex-col gap-2 pt-2 max-w-[200px] mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setDetenerTimer(true);
                      setTimeout(() => {
                        window.print();
                      }, 100);
                    }}
                    className="py-2.5 px-4 bg-campestre-gold hover:bg-campestre-gold/90 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    🖨️ Imprimir Recibo {detenerTimer ? '' : `(${countdownPrint}s)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarModalCobro(false);
                      setPagoExitoso(false);
                      setSplitPreview(null);
                      clearCart();
                      if (areaId) cargarProductos(areaId);
                      cargarCadis();
                      cargarCuentasPendientes();
                    }}
                    className="py-2 px-4 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                  >
                    Regresar al POS
                  </button>
                </div>
              </div>
            ) : splitPreview.divisiones.length > 0 ? (
              /* === MODO SPLIT (con socios) === */
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Cadi Asignado:</span>
                    <span className="text-white font-bold">{splitPreview.cadi || 'Sin Cadi'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block font-medium">
                      {totalAdeudosACobrar > 0 ? 'Total a Cobrar (con Adeudos):' : 'Total de la Cuenta:'}
                    </span>
                    <span className="text-campestre-gold font-extrabold text-sm">${totalMasAdeudos.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Distribución del Pago:</span>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {splitPreview.divisiones.map((d: any) => (
                      <div key={d.cliente_id} className="space-y-2.5 p-3.5 bg-slate-850 border border-slate-800 rounded-2xl">
                        {/* Fila principal */}
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-white text-xs font-bold block">{d.nombre}</span>
                            <span className="text-[10px] text-slate-400 block">{d.codigo_socio} • {d.porcentaje.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-extrabold text-white Outfit">${d.monto.toFixed(2)}</span>
                            <select
                              value={metodosPago[d.cliente_id] || 'EFECTIVO'}
                              onChange={(e) => setMetodosPago({ ...metodosPago, [d.cliente_id]: e.target.value })}
                              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:border-campestre-gold outline-none"
                            >
                              <option value="CARGO_SOCIO">Cargo a Socio</option>
                              <option value="TARJETA">Tarjeta Cred/Deb</option>
                              <option value="EFECTIVO">Efectivo</option>
                              <option value="TRANSFERENCIA">Transferencia</option>
                              <option value="MIXTO">Mixto</option>
                            </select>
                          </div>
                        </div>

                        {((metodosPago[d.cliente_id] || 'EFECTIVO') === 'EFECTIVO' || (splitPreview.divisiones.length === 1 && abonoMonto !== '' && metodoPagoAbono === 'EFECTIVO')) && (
                          <div className="mt-2.5 p-3 bg-slate-900 border border-emerald-500/20 rounded-xl space-y-2.5">
                            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Monto Recibido (Efectivo)</div>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={montoRecibidoSocio[d.cliente_id] || ''}
                                onChange={(e) => setMontoRecibidoSocio({ ...montoRecibidoSocio, [d.cliente_id]: e.target.value })}
                                placeholder="0.00"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-6 pr-2 py-1 text-xs text-white font-bold outline-none focus:border-emerald-500"
                              />
                            </div>
                            {(() => {
                              const totalSocio = ((splitPreview.divisiones.length === 1 && abonoMonto !== '') ? Number(abonoMonto) : d.monto) + 
                                (liquidarDeudaSocio[d.cliente_id] ? (deudasSocios[d.cliente_id]?.total || 0) : 0);
                              return (
                                <>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => setMontoRecibidoSocio({ ...montoRecibidoSocio, [d.cliente_id]: totalSocio.toFixed(2) })}
                                      className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold transition-all"
                                    >
                                      Monto Exacto (${totalSocio.toFixed(0)})
                                    </button>
                                    {[50, 100, 200, 500].filter(m => m >= totalSocio).map(m => (
                                      <button
                                        key={m}
                                        type="button"
                                        onClick={() => setMontoRecibidoSocio({ ...montoRecibidoSocio, [d.cliente_id]: m.toFixed(2) })}
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-350 border border-slate-700 rounded text-[9px] font-bold transition-all"
                                      >
                                        ${m}
                                      </button>
                                    ))}
                                  </div>
                                  {montoRecibidoSocio[d.cliente_id] && Number(montoRecibidoSocio[d.cliente_id]) >= totalSocio && (
                                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-800/60 mt-1">
                                      <span className="text-[10px] text-slate-400 font-bold">Cambio a entregar:</span>
                                      <span className="text-xs font-extrabold text-emerald-400">
                                        ${(Number(montoRecibidoSocio[d.cliente_id]) - totalSocio).toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  {montoRecibidoSocio[d.cliente_id] && Number(montoRecibidoSocio[d.cliente_id]) > 0 && Number(montoRecibidoSocio[d.cliente_id]) < totalSocio && (
                                    <div className="text-right mt-1">
                                      <span className="text-[9px] text-red-400 font-bold">Monto insuficiente</span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {metodosPago[d.cliente_id] === 'MIXTO' && (
                          <div className="mt-2.5 p-3 bg-slate-900 border border-purple-500/20 rounded-xl space-y-2.5">
                            <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Desglose Pago Mixto</div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400 font-bold block mb-1">Monto Efectivo</label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={montoEfectivoMixtoSocio[d.cliente_id] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setMontoEfectivoMixtoSocio({ ...montoEfectivoMixtoSocio, [d.cliente_id]: val });
                                      const numVal = Number(val) || 0;
                                      const rem = Math.max(0, d.monto - numVal);
                                      setMontoTarjetaMixtoSocio({ ...montoTarjetaMixtoSocio, [d.cliente_id]: rem.toFixed(2) });
                                    }}
                                    placeholder="0.00"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-6 pr-2 py-1 text-xs text-white font-bold outline-none focus:border-purple-500"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 font-bold block mb-1">Monto Tarjeta</label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={montoTarjetaMixtoSocio[d.cliente_id] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setMontoTarjetaMixtoSocio({ ...montoTarjetaMixtoSocio, [d.cliente_id]: val });
                                      const numVal = Number(val) || 0;
                                      const rem = Math.max(0, d.monto - numVal);
                                      setMontoEfectivoMixtoSocio({ ...montoEfectivoMixtoSocio, [d.cliente_id]: rem.toFixed(2) });
                                    }}
                                    placeholder="0.00"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-6 pr-2 py-1 text-xs text-white font-bold outline-none focus:border-purple-500"
                                  />
                                </div>
                              </div>
                            </div>
                            {Math.abs(Number(montoEfectivoMixtoSocio[d.cliente_id] || 0) + Number(montoTarjetaMixtoSocio[d.cliente_id] || 0) - d.monto) > 0.01 && (
                              <div className="text-[10px] text-red-400 font-semibold mt-1">
                                La suma (${(Number(montoEfectivoMixtoSocio[d.cliente_id] || 0) + Number(montoTarjetaMixtoSocio[d.cliente_id] || 0)).toFixed(2)}) no coincide con el total proporcional (${d.monto.toFixed(2)})
                              </div>
                            )}
                          </div>
                        )}

                        {/* Adeudo Info y Opción de Cobro */}
                        {deudasSocios[d.cliente_id] && deudasSocios[d.cliente_id].total > 0 && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/60 mt-1.5">
                            <div className="text-[10px] text-yellow-400 font-semibold flex items-center gap-1.5">
                              <span>⚠️</span>
                              <span>Debe adeudo de cargos: <b className="text-white">${deudasSocios[d.cliente_id].total.toFixed(2)}</b></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-350 hover:text-white font-medium select-none">
                                <input
                                  type="checkbox"
                                  checked={!!liquidarDeudaSocio[d.cliente_id]}
                                  onChange={(e) => setLiquidarDeudaSocio({ ...liquidarDeudaSocio, [d.cliente_id]: e.target.checked })}
                                  className="rounded border-slate-700 bg-slate-800 text-campestre-gold focus:ring-campestre-gold focus:ring-offset-0"
                                />
                                <span>Cobrar adeudo</span>
                              </label>
                              {liquidarDeudaSocio[d.cliente_id] && metodosPago[d.cliente_id] === 'CARGO_SOCIO' && (
                                <select
                                  value={metodosPagoLiquidacion[d.cliente_id] || 'EFECTIVO'}
                                  onChange={(e) => setMetodosPagoLiquidacion({ ...metodosPagoLiquidacion, [d.cliente_id]: e.target.value })}
                                  className="bg-slate-800 border border-slate-700 text-[10px] text-white rounded px-1.5 py-0.5 outline-none focus:border-campestre-gold"
                                >
                                  <option value="EFECTIVO">Efectivo</option>
                                  <option value="TARJETA">Tarjeta</option>
                                  <option value="TRANSFERENCIA">Transferencia</option>
                                </select>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Opciones de Abono si es un solo socio */}
                        {splitPreview.divisiones.length === 1 && (
                          <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-350">¿Realizar Abono Parcial?</span>
                              <input
                                type="checkbox"
                                checked={abonoMonto !== ''}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAbonoMonto('0');
                                  } else {
                                    setAbonoMonto('');
                                  }
                                }}
                                className="rounded border-slate-700 bg-slate-800 text-campestre-gold focus:ring-campestre-gold focus:ring-offset-0"
                              />
                            </div>
                            
                            {abonoMonto !== '' && (
                              <div className="space-y-3 pt-2 border-t border-slate-800">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Monto del Abono</label>
                                    <input
                                      type="number"
                                      value={abonoMonto}
                                      onChange={(e) => setAbonoMonto(e.target.value)}
                                      placeholder="0.00"
                                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold outline-none focus:border-campestre-gold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Método de Pago</label>
                                    <select
                                      value={metodoPagoAbono}
                                      onChange={(e) => setMetodoPagoAbono(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-campestre-gold"
                                    >
                                      <option value="EFECTIVO">Efectivo</option>
                                      <option value="TARJETA">Tarjeta</option>
                                      <option value="TRANSFERENCIA">Transferencia</option>
                                      <option value="MIXTO">Mixto</option>
                                    </select>
                                  </div>
                                </div>
                                {metodoPagoAbono === 'MIXTO' && (
                                  <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 bg-slate-950 rounded-lg border border-purple-500/20">
                                    <div>
                                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Efectivo</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={montoEfectivoMixto}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setMontoEfectivoMixto(val);
                                          const numVal = Number(val) || 0;
                                          const rem = Math.max(0, Number(abonoMonto) - numVal);
                                          setMontoTarjetaMixto(rem.toFixed(2));
                                        }}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-bold outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Tarjeta</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={montoTarjetaMixto}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setMontoTarjetaMixto(val);
                                          const numVal = Number(val) || 0;
                                          const rem = Math.max(0, Number(abonoMonto) - numVal);
                                          setMontoEfectivoMixto(rem.toFixed(2));
                                        }}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-bold outline-none"
                                      />
                                    </div>
                                    {Math.abs(Number(montoEfectivoMixto || 0) + Number(montoTarjetaMixto || 0) - Number(abonoMonto)) > 0.01 && (
                                      <div className="col-span-2 text-[9px] text-red-400 font-semibold mt-1">
                                        La suma (${(Number(montoEfectivoMixto || 0) + Number(montoTarjetaMixto || 0)).toFixed(2)}) no coincide con el abono (${Number(abonoMonto).toFixed(2)})
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-400">
                                  El resto (<span className="text-yellow-400 font-bold">${Math.max(0, d.monto - (Number(abonoMonto) || 0)).toFixed(2)}</span>) se registrará como Cargo a Socio pendiente.
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {(() => {
                  const splitMixtoInvalido = splitPreview?.divisiones?.some((div: any) => {
                    if (metodosPago[div.cliente_id] === 'MIXTO') {
                      const ef = Number(montoEfectivoMixtoSocio[div.cliente_id] || 0);
                      const tj = Number(montoTarjetaMixtoSocio[div.cliente_id] || 0);
                      return Math.abs(ef + tj - div.monto) > 0.01;
                    }
                    return false;
                  }) || (
                    splitPreview?.divisiones?.length === 1 && abonoMonto && Number(abonoMonto) > 0 && metodoPagoAbono === 'MIXTO' && 
                    Math.abs(Number(montoEfectivoMixto || 0) + Number(montoTarjetaMixto || 0) - Number(abonoMonto)) > 0.01
                  );

                  return (
                    <button
                      onClick={handleConfirmarCobro}
                      disabled={cargando || splitMixtoInvalido}
                      className="w-full py-3.5 bg-campestre-gold hover:bg-campestre-gold/90 text-slate-950 font-bold rounded-xl btn-premium mt-6 flex justify-center items-center space-x-2 shadow-lg shadow-campestre-gold/20 transition-all active:scale-[0.98]"
                    >
                      <CreditCard size={16} />
                      <span>
                        {cargando 
                          ? 'Procesando transacciones...' 
                          : (splitPreview?.divisiones?.length === 1 && abonoMonto && Number(abonoMonto) > 0)
                            ? `Abonar $${Number(abonoMonto).toFixed(2)} (Cargar $${Math.max(0, totalMasAdeudos - Number(abonoMonto)).toFixed(2)} a Socio)`
                            : `Pagar $${totalMasAdeudos.toFixed(2)}`
                        }
                      </span>
                    </button>
                  );
                })()}
              </div>
            ) : (
              /* === MODO PAGO DIRECTO (sin socios) === */
              <div className="space-y-5">
                <div className="p-4 bg-slate-950 rounded-2xl text-center">
                  <span className="text-slate-400 text-xs block font-medium">Total a Cobrar:</span>
                  <span className="text-3xl font-extrabold text-campestre-gold Outfit mt-1 block">${totalMasAdeudos.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Selecciona Método de Pago:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <button
                      type="button"
                      onClick={() => setMetodoPagoDirecto('EFECTIVO')}
                      className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 ${
                        metodoPagoDirecto === 'EFECTIVO'
                          ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-2xl block mb-1">💵</span>
                      <span className={`text-xs font-bold block ${metodoPagoDirecto === 'EFECTIVO' ? 'text-emerald-400' : 'text-slate-300'}`}>Efectivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPagoDirecto('TARJETA')}
                      className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 ${
                        metodoPagoDirecto === 'TARJETA'
                          ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-2xl block mb-1">💳</span>
                      <span className={`text-xs font-bold block ${metodoPagoDirecto === 'TARJETA' ? 'text-blue-400' : 'text-slate-300'}`}>Tarjeta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPagoDirecto('TRANSFERENCIA')}
                      className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 ${
                        metodoPagoDirecto === 'TRANSFERENCIA'
                          ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-2xl block mb-1">📲</span>
                      <span className={`text-xs font-bold block ${metodoPagoDirecto === 'TRANSFERENCIA' ? 'text-cyan-400' : 'text-slate-300'}`}>Transferencia</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMetodoPagoDirecto('MIXTO');
                        setMontoEfectivoMixto(totalMasAdeudos.toFixed(2));
                        setMontoTarjetaMixto('0.00');
                      }}
                      className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 ${
                        metodoPagoDirecto === 'MIXTO'
                          ? 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-2xl block mb-1">💵💳</span>
                      <span className={`text-xs font-bold block ${metodoPagoDirecto === 'MIXTO' ? 'text-purple-400' : 'text-slate-300'}`}>Mixto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPagoDirecto('CARGO_SOCIO')}
                      className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 ${
                        metodoPagoDirecto === 'CARGO_SOCIO'
                          ? 'border-yellow-400 bg-yellow-500/10 shadow-lg shadow-yellow-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-2xl block mb-1">⛳</span>
                      <span className={`text-xs font-bold block ${metodoPagoDirecto === 'CARGO_SOCIO' ? 'text-yellow-400' : 'text-slate-300'}`}>Cargo Socio</span>
                    </button>
                  </div>
                </div>

                {metodoPagoDirecto === 'EFECTIVO' && (
                  <div className="p-4 bg-slate-900 border border-emerald-500/20 rounded-2xl space-y-3">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Monto Recibido</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          value={montoRecibido}
                          onChange={(e) => setMontoRecibido(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-7 pr-3 text-white font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>

                      {/* Botones de Efectivo Rápido */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => setMontoRecibido(totalMasAdeudos.toFixed(2))}
                          className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-bold transition-all active:scale-[0.98]"
                        >
                          Monto Exacto (${totalMasAdeudos.toFixed(0)})
                        </button>
                        {[50, 100, 200, 500].filter(m => m >= totalMasAdeudos).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMontoRecibido(m.toFixed(2))}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-350 border border-slate-700 rounded-xl text-[10px] font-bold transition-all active:scale-[0.98]"
                          >
                            ${m}
                          </button>
                        ))}
                      </div>
                    </div>
                    {montoRecibido && Number(montoRecibido) >= totalMasAdeudos && (
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                        <span className="text-xs text-slate-400 font-bold">Cambio a entregar:</span>
                        <span className="text-lg font-extrabold text-emerald-400">
                          ${(Number(montoRecibido) - totalMasAdeudos).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {montoRecibido && Number(montoRecibido) > 0 && Number(montoRecibido) < totalMasAdeudos && (
                      <div className="text-right">
                        <span className="text-[10px] text-red-400 font-bold">Monto insuficiente</span>
                      </div>
                    )}
                  </div>
                )}

                {metodoPagoDirecto === 'MIXTO' && (
                  <div className="p-4 bg-slate-900 border border-purple-500/20 rounded-2xl space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Monto Efectivo</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                          <input
                            type="number"
                            value={montoEfectivoMixto}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMontoEfectivoMixto(val);
                              const numVal = Number(val || 0);
                              if (numVal <= totalMasAdeudos) {
                                setMontoTarjetaMixto((totalMasAdeudos - numVal).toFixed(2));
                              }
                            }}
                            placeholder="0.00"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-7 pr-3 text-white font-bold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Monto Tarjeta</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                          <input
                            type="number"
                            value={montoTarjetaMixto}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMontoTarjetaMixto(val);
                              const numVal = Number(val || 0);
                              if (numVal <= totalMasAdeudos) {
                                setMontoEfectivoMixto((totalMasAdeudos - numVal).toFixed(2));
                              }
                            }}
                            placeholder="0.00"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-7 pr-3 text-white font-bold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    {Math.abs(Number(montoEfectivoMixto || 0) + Number(montoTarjetaMixto || 0) - totalMasAdeudos) > 0.01 && (
                      <div className="text-center pt-1">
                        <span className="text-[10px] text-red-400 font-bold">
                          La suma (${(Number(montoEfectivoMixto || 0) + Number(montoTarjetaMixto || 0)).toFixed(2)}) no coincide con el total (${totalMasAdeudos.toFixed(2)})
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Adeudo Info y Opción de Cobro en Modo Directo */}
                {Object.keys(deudasSocios).map((key) => {
                  const clienteId = Number(key);
                  const deuda = deudasSocios[clienteId];
                  if (deuda && deuda.total > 0) {
                    return (
                      <div key={clienteId} className="space-y-2.5 p-3.5 bg-slate-850 border border-slate-800 rounded-2xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="text-[10px] text-yellow-400 font-semibold flex items-center gap-1.5">
                            <span>⚠️</span>
                            <span>Debe adeudo de cargos: <b className="text-white">${deuda.total.toFixed(2)}</b></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-350 hover:text-white font-medium select-none">
                              <input
                                type="checkbox"
                                checked={!!liquidarDeudaSocio[clienteId]}
                                onChange={(e) => setLiquidarDeudaSocio({ ...liquidarDeudaSocio, [clienteId]: e.target.checked })}
                                className="rounded border-slate-700 bg-slate-800 text-campestre-gold focus:ring-campestre-gold focus:ring-offset-0"
                              />
                              <span>Cobrar adeudo</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={handleCobroDirecto}
                  disabled={cargando || (metodoPagoDirecto === 'MIXTO' && Math.abs(Number(montoEfectivoMixto || 0) + Number(montoTarjetaMixto || 0) - totalMasAdeudos) > 0.01)}
                  className={`w-full py-3.5 font-bold rounded-xl btn-premium flex justify-center items-center space-x-2 shadow-lg transition-all ${
                    metodoPagoDirecto === 'EFECTIVO' ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'
                    : metodoPagoDirecto === 'TARJETA' ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20'
                    : metodoPagoDirecto === 'TRANSFERENCIA' ? 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-cyan-500/20'
                    : metodoPagoDirecto === 'MIXTO' ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20'
                    : 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-yellow-500/10'
                  }`}
                >
                  <CreditCard size={16} />
                  <span>
                    {cargando 
                      ? 'Procesando...' 
                      : `Cobrar $${totalMasAdeudos.toFixed(2)} con ${
                          metodoPagoDirecto === 'EFECTIVO' ? 'Efectivo' 
                          : metodoPagoDirecto === 'TARJETA' ? 'Tarjeta' 
                          : metodoPagoDirecto === 'TRANSFERENCIA' ? 'Transferencia'
                          : metodoPagoDirecto === 'MIXTO' ? 'Pago Mixto'
                          : 'Cargo a Socio'
                        }`
                    }
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL SIMULADOR QR SOCIO --- */}
      {mostrarSimuladorQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>📷</span>
              <span>Simular Lector QR del POS</span>
            </h4>
            <p className="text-xs text-slate-400">
              Ingresa el token dinámico de QR del socio. Puedes copiar el token desde el portal del cliente para simular el escaneo de la tablet.
            </p>
            <input
              type="text"
              placeholder="Pegar token de QR del socio..."
              value={simularQrToken}
              onChange={(e) => setSimularQrToken(e.target.value)}
              className="w-full input-premium text-xs"
            />
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => setMostrarSimuladorQR(false)}
                className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 font-bold rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={procesarEscaneoQRSimulado}
                className="flex-1 py-2 bg-campestre-gold text-slate-950 font-bold rounded-lg text-xs btn-premium"
              >
                Escanear QR
              </button>
            </div>
            <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/80 text-center">
              <b>Tokens Demo de QR (del seed):</b>
              <div className="mt-1 font-mono text-[9px]">
                Juan Pérez: <b>juan@socio.com</b> (puedes buscarlo por autocompletar)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EDITAR PAGO --- */}
      {mostrarModalEditarPago && cuentaParaEditarPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-glass p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold Outfit flex items-center space-x-2">
                <span>✏️</span>
                <span>Editar Método de Pago</span>
              </h3>
              {!guardandoMetodoPago && (
                <button
                  onClick={() => {
                    setMostrarModalEditarPago(false);
                    setCuentaParaEditarPago(null);
                  }}
                  className="text-slate-400 hover:text-white font-bold text-sm"
                >
                  Cerrar
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl text-center font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleActualizarMetodoPago} className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-2xl">
                <span className="text-slate-400 text-xs block">Cuenta:</span>
                <span className="text-sm font-bold text-white block mt-0.5">{cuentaParaEditarPago.referencia}</span>
                <span className="text-xs text-slate-500 block">ID: #{cuentaParaEditarPago.id} • Total: ${cuentaParaEditarPago.total.toFixed(2)}</span>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Métodos de Pago:</span>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {cuentaParaEditarPago.pagos.map((p: any) => {
                    const key = p.cliente_id !== null ? p.cliente_id.toString() : 'directo';
                    return (
                      <div key={key} className="flex justify-between items-center p-3 bg-slate-850 border border-slate-800 rounded-2xl">
                        <div className="flex-1 pr-2">
                          <span className="text-white text-xs font-bold block truncate">{p.nombre}</span>
                          <span className="text-[10px] text-slate-400 block">${p.monto.toFixed(2)}</span>
                        </div>
                        <select
                          value={nuevosMetodosPago[key] || p.metodo}
                          onChange={(e) => setNuevosMetodosPago({ ...nuevosMetodosPago, [key]: e.target.value })}
                          className="bg-slate-850 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:border-campestre-gold outline-none"
                        >
                          <option value="EFECTIVO">Efectivo</option>
                          <option value="TARJETA">Tarjeta</option>
                          <option value="CARGO_SOCIO">Cargo Socio</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex space-x-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  disabled={guardandoMetodoPago}
                  onClick={() => {
                    setMostrarModalEditarPago(false);
                    setCuentaParaEditarPago(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoMetodoPago}
                  className="flex-1 py-2.5 bg-campestre-gold hover:bg-campestre-gold/90 text-slate-950 font-bold rounded-xl text-xs btn-premium shadow-lg shadow-campestre-gold/25 transition-colors"
                >
                  {guardandoMetodoPago ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL SELECCIONAR MEZCLADOR --- */}
      {mostrarModalMezclador && productoPreparadoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-glass p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold Outfit text-white flex items-center space-x-2">
                  <Sparkles className="text-campestre-gold" size={18} />
                  <span>Seleccionar Mezclador / Acompañamiento</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Bebida preparada: <b className="text-white">{productoPreparadoSeleccionado.nombre}</b>. Elige un mezclador para descontar su stock (sin costo adicional).
                </p>
              </div>
              <button
                onClick={() => {
                  setMostrarModalMezclador(false);
                  setProductoPreparadoSeleccionado(null);
                }}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                Cerrar
              </button>
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-550">
                <Search size={14} />
              </span>
              <input
                ref={inputMezcladorRef}
                type="text"
                placeholder="Buscar mezclador (agua mineral, Coca, cerveza)..."
                value={busquedaMezclador}
                onChange={(e) => setBusquedaMezclador(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-955 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-campestre-gold transition-colors"
              />
              {busquedaMezclador && (
                <button
                  type="button"
                  onClick={() => setBusquedaMezclador('')}
                  className="absolute right-3 top-2 text-slate-400 hover:text-white text-xs font-bold font-mono"
                >
                  ×
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {/* Opción 1: Agua Mineral */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">💧 Aguas Minerales</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {productos.filter(p => p.nombre.toLowerCase().includes('agua mineral') && !p.nombre.toLowerCase().includes('prep') && p.stock > 0 && (!busquedaMezclador.trim() || p.nombre.toLowerCase().includes(busquedaMezclador.toLowerCase()))).map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleSeleccionarMezclador(m)}
                      className="p-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-campestre-gold/50 rounded-xl text-left text-xs text-white transition-all flex flex-col justify-between"
                    >
                      <span className="font-bold line-clamp-1">{m.nombre}</span>
                      <span className="text-[9px] text-slate-400 mt-1 font-mono">Stock: {m.stock}</span>
                    </button>
                  ))}
                  {productos.filter(p => p.nombre.toLowerCase().includes('agua mineral') && !p.nombre.toLowerCase().includes('prep') && p.stock > 0 && (!busquedaMezclador.trim() || p.nombre.toLowerCase().includes(busquedaMezclador.toLowerCase()))).length === 0 && (
                    <p className="text-[10px] text-slate-550 italic col-span-3">Sin agua mineral coincidente.</p>
                  )}
                </div>
              </div>

              {/* Opción 2: Refrescos */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">🥤 Refrescos</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {productos.filter(p => p.categoria?.toLowerCase() === 'bebidas' && !p.nombre.toLowerCase().includes('agua') && !p.nombre.toLowerCase().includes('prep') && p.stock > 0 && (!busquedaMezclador.trim() || p.nombre.toLowerCase().includes(busquedaMezclador.toLowerCase()))).map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleSeleccionarMezclador(m)}
                      className="p-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-campestre-gold/50 rounded-xl text-left text-xs text-white transition-all flex flex-col justify-between"
                    >
                      <span className="font-bold line-clamp-1">{m.nombre}</span>
                      <span className="text-[9px] text-slate-400 mt-1 font-mono">Stock: {m.stock}</span>
                    </button>
                  ))}
                  {productos.filter(p => p.categoria?.toLowerCase() === 'bebidas' && !p.nombre.toLowerCase().includes('agua') && !p.nombre.toLowerCase().includes('prep') && p.stock > 0 && (!busquedaMezclador.trim() || p.nombre.toLowerCase().includes(busquedaMezclador.toLowerCase()))).length === 0 && (
                    <p className="text-[10px] text-slate-550 italic col-span-3">Sin refrescos coincidentes.</p>
                  )}
                </div>
              </div>

              {/* Opción 3: Cervezas */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">🍺 Cervezas</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {productos.filter(p => p.categoria?.toLowerCase() === 'cervezas' && !p.nombre.toLowerCase().includes('prep') && p.stock > 0 && (!busquedaMezclador.trim() || p.nombre.toLowerCase().includes(busquedaMezclador.toLowerCase()))).map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleSeleccionarMezclador(m)}
                      className="p-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-campestre-gold/50 rounded-xl text-left text-xs text-white transition-all flex flex-col justify-between"
                    >
                      <span className="font-bold line-clamp-1">{m.nombre}</span>
                      <span className="text-[9px] text-slate-400 mt-1 font-mono">Stock: {m.stock}</span>
                    </button>
                  ))}
                  {productos.filter(p => p.categoria?.toLowerCase() === 'cervezas' && !p.nombre.toLowerCase().includes('prep') && p.stock > 0 && (!busquedaMezclador.trim() || p.nombre.toLowerCase().includes(busquedaMezclador.toLowerCase()))).length === 0 && (
                    <p className="text-[10px] text-slate-550 italic col-span-3">Sin cervezas coincidentes.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setMostrarModalMezclador(false);
                  setProductoPreparadoSeleccionado(null);
                }}
                className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAgregarSinMezclador}
                className="flex-1 py-2.5 bg-campestre-gold hover:bg-campestre-gold/90 text-slate-950 font-bold rounded-xl text-xs btn-premium shadow-lg shadow-campestre-gold/25 transition-colors"
              >
                Agregar sin Mezclador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL REGISTRAR NUEVO SOCIO --- */}
      {mostrarModalCrearSocio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-glass p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold Outfit text-white flex items-center space-x-2">
                <User size={18} className="text-campestre-gold" />
                <span>Registrar Nuevo Socio</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMostrarModalCrearSocio(false);
                  setCodigoSocioNuevo('');
                  setNombreSocioNuevo('');
                  setEmailSocioNuevo('');
                  setTelefonoSocioNuevo('');
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCrearSocioRapido} className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs text-white font-medium cursor-pointer">
                  <input type="radio" name="tipo_socio_rapido" value="SOCIO" checked={tipoSocioNuevo === 'SOCIO'} onChange={() => setTipoSocioNuevo('SOCIO')} className="text-campestre-gold focus:ring-0" />
                  Socio
                </label>
                <label className="flex items-center gap-1.5 text-xs text-white font-medium cursor-pointer">
                  <input type="radio" name="tipo_socio_rapido" value="EMPLEADO" checked={tipoSocioNuevo === 'EMPLEADO'} onChange={() => setTipoSocioNuevo('EMPLEADO')} className="text-campestre-gold focus:ring-0" />
                  Empleado
                </label>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Código de Socio *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. SOCIO-105"
                  value={codigoSocioNuevo}
                  onChange={e => setCodigoSocioNuevo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-campestre-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Alejandro G. Ruiz"
                  value={nombreSocioNuevo}
                  onChange={e => setNombreSocioNuevo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-campestre-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Email (Opcional)</label>
                <input
                  type="email"
                  placeholder="E.g. alejandro@correo.com"
                  value={emailSocioNuevo}
                  onChange={e => setEmailSocioNuevo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-campestre-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Teléfono (Opcional)</label>
                <input
                  type="text"
                  placeholder="E.g. 555-019-2834"
                  value={telefonoSocioNuevo}
                  onChange={e => setTelefonoSocioNuevo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-campestre-gold"
                />
              </div>

              <div className="flex space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalCrearSocio(false);
                    setCodigoSocioNuevo('');
                    setNombreSocioNuevo('');
                    setEmailSocioNuevo('');
                    setTelefonoSocioNuevo('');
                  }}
                  className="flex-1 py-2.5 bg-slate-855 hover:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 py-2.5 bg-campestre-gold hover:bg-campestre-gold/90 text-slate-950 font-bold rounded-xl text-xs btn-premium shadow-lg shadow-campestre-gold/25 transition-colors"
                >
                  {cargando ? 'Registrando...' : 'Registrar Socio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL INICIAR RONDA --- */}
      {mostrarModalIniciarRonda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-glass p-6 space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold Outfit text-white flex items-center space-x-2">
                <Users size={18} className="text-campestre-gold" />
                <span>Iniciar Ronda de Golf (Asignar Cadi)</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMostrarModalIniciarRonda(false);
                  setCadiSeleccionadoRonda('');
                  setSociosSeleccionadosRonda([]);
                  setBusquedaSocioRonda('');
                  setResultadosSocioRonda([]);
                  setMostrarFormCrearCadiInterno(false);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Sección Cadi */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cadi de la Ronda:</span>
                  {!mostrarFormCrearCadiInterno && (
                    <button
                      type="button"
                      onClick={() => setMostrarFormCrearCadiInterno(true)}
                      className="text-[10px] text-campestre-gold hover:underline font-bold"
                    >
                      + Registrar Nuevo Cadi
                    </button>
                  )}
                </div>

                {mostrarFormCrearCadiInterno ? (
                  <form onSubmit={handleCrearCadiRapido} className="space-y-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-300 block uppercase font-Outfit">Nuevo Cadi</span>
                    <div>
                      <label className="block text-[9px] font-medium text-slate-400 mb-0.5">Código/Número de Cadi *</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g. CADI-105"
                        value={numeroCadiNuevo}
                        onChange={e => setNumeroCadiNuevo(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-campestre-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-medium text-slate-400 mb-0.5">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g. Pedro Juárez"
                        value={nombreCadiNuevo}
                        onChange={e => setNombreCadiNuevo(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-campestre-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-medium text-slate-400 mb-0.5">Teléfono (Opcional)</label>
                      <input
                        type="text"
                        placeholder="E.g. 555-888-2938"
                        value={telefonoCadiNuevo}
                        onChange={e => setTelefonoCadiNuevo(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-campestre-gold"
                      />
                    </div>
                    <div className="flex space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarFormCrearCadiInterno(false);
                          setNumeroCadiNuevo('');
                          setNombreCadiNuevo('');
                          setTelefonoCadiNuevo('');
                        }}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 font-bold rounded-lg text-[10px] transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={cargando}
                        className="flex-1 py-1.5 bg-campestre-gold hover:bg-campestre-gold/90 text-slate-950 font-bold rounded-lg text-[10px] transition-colors"
                      >
                        Guardar Cadi
                      </button>
                    </div>
                  </form>
                ) : (
                  <select
                    value={cadiSeleccionadoRonda}
                    onChange={e => setCadiSeleccionadoRonda(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-campestre-gold"
                  >
                    <option value="">-- Seleccionar Cadi Disponible --</option>
                    {todosLosCadis
                      .filter(c => c.estado === 'DISPONIBLE' || c.id.toString() === cadiSeleccionadoRonda)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.numero_cadi} - {c.nombre}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Sección Socios */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Socios de esta Ronda:</label>
                  <button
                    type="button"
                    onClick={() => setMostrarModalCrearSocio(true)}
                    className="text-[10px] text-campestre-gold hover:underline font-bold"
                  >
                    + Registrar Nuevo Socio
                  </button>
                </div>

                {/* Buscador de Socios */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar socio por nombre o ID..."
                    value={busquedaSocioRonda}
                    onChange={e => buscarSocioParaRonda(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-campestre-gold"
                  />

                  {resultadosSocioRonda.length > 0 && (
                    <div className="absolute left-0 right-0 max-h-36 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl mt-1 text-xs z-10 shadow-lg pr-1">
                      {resultadosSocioRonda.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            if (!sociosSeleccionadosRonda.some(x => x.id === s.id)) {
                              setSociosSeleccionadosRonda([...sociosSeleccionadosRonda, s]);
                            }
                            setResultadosSocioRonda([]);
                            setBusquedaSocioRonda('');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-800 border-b border-slate-850 last:border-0 text-white flex justify-between items-center"
                        >
                          <span className="font-medium">{s.nombre}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">{s.codigo_socio}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Socios Seleccionados */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto bg-slate-950/50 p-3 rounded-2xl border border-slate-850">
                  {sociosSeleccionadosRonda.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic text-center py-2">Ningún socio seleccionado aún.</p>
                  ) : (
                    sociosSeleccionadosRonda.map(s => (
                      <div key={s.id} className="flex justify-between items-center bg-slate-900/80 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-xs">
                        <span className="text-white font-medium truncate max-w-[200px]">{s.nombre}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] bg-slate-850 px-2 py-0.5 rounded text-slate-400">{s.codigo_socio}</span>
                          <button
                            type="button"
                            onClick={() => setSociosSeleccionadosRonda(sociosSeleccionadosRonda.filter(x => x.id !== s.id))}
                            className="text-red-400 hover:text-red-300 font-bold px-1"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalIniciarRonda(false);
                    setCadiSeleccionadoRonda('');
                    setSociosSeleccionadosRonda([]);
                    setBusquedaSocioRonda('');
                    setResultadosSocioRonda([]);
                    setMostrarFormCrearCadiInterno(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-855 hover:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleIniciarRondaPOS}
                  disabled={cargando || !cadiSeleccionadoRonda || sociosSeleccionadosRonda.length === 0}
                  className="flex-1 py-2.5 bg-campestre-gold hover:bg-campestre-gold/90 text-slate-950 font-bold rounded-xl text-xs btn-premium shadow-lg shadow-campestre-gold/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cargando ? 'Iniciando...' : 'Iniciar Ronda'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Juntar Cuenta */}
      {mostrarModalFusion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-glass p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold Outfit flex items-center space-x-2">
                <Merge className="text-blue-400" size={18} />
                <span>Juntar Cuenta</span>
              </h3>
              <button
                onClick={() => { setMostrarModalFusion(false); setErrorMsg(''); }}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Selecciona la cuenta que deseas <strong>fusionar hacia esta</strong>. Todos sus productos se pasarán a esta cuenta y la cuenta seleccionada desaparecerá.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Cuenta Origen:
                </label>
                <select
                  value={cuentaOrigenFusionId}
                  onChange={(e) => setCuentaOrigenFusionId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="">-- Selecciona una cuenta --</option>
                  {cuentasPendientes
                    .filter(c => c.id.toString() !== cuentaId?.toString())
                    .map(c => (
                      <option key={c.id.toString()} value={c.id.toString()}>
                        {c.referencia}
                      </option>
                    ))}
                </select>
              </div>

              <button
                onClick={handleFusionarCuentas}
                disabled={fusionando || !cuentaOrigenFusionId}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-blue-500/20 transition-all"
              >
                {fusionando ? <RefreshCw size={14} className="animate-spin" /> : <Merge size={14} />}
                <span>Juntar Cuentas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mover de Área */}
      {mostrarModalMoverArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-glass p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold Outfit flex items-center space-x-2">
                <Move className="text-purple-400" size={18} />
                <span>Mover Cuenta de Área</span>
              </h3>
              <button
                onClick={() => { setMostrarModalMoverArea(false); setErrorMsg(''); }}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Selecciona el área de destino para transferir esta cuenta. Recuerda que debe haber un turno activo en el área de destino.
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 1, name: 'Bar 🍺' },
                  { id: 2, name: 'Snack 🍔' },
                  { id: 3, name: 'Palapa 🌴' }
                ].map(area => (
                  <button
                    key={area.id}
                    onClick={() => handleMoverArea(area.id)}
                    disabled={moviendoArea}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-white font-bold rounded-xl text-xs flex items-center justify-between border border-slate-700 hover:border-purple-500/50 transition-all disabled:opacity-50"
                  >
                    <span>{area.name}</span>
                    {moviendoArea ? <RefreshCw size={12} className="animate-spin text-purple-400" /> : <Move size={12} className="text-purple-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
