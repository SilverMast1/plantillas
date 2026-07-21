// Backend en Memoria / LocalStorage para ejecución autónoma en GitHub Pages

const STORAGE_KEYS = {
  PRODUCTOS: 'mock_pos_productos',
  CUENTAS: 'mock_pos_cuentas',
  TURNOS: 'mock_pos_turnos',
  CADIS: 'mock_pos_cadis',
  INSUMOS: 'mock_pos_insumos',
  GASTOS: 'mock_pos_gastos',
};

// Datos Iniciales por defecto
const DEFAULT_PRODUCTS = [
  { id: 1, codigo_barras: '75010001', nombre: 'Tacos de Asada (Orden)', precio_venta: 85, categoria: 'Alimentos', activo: true },
  { id: 2, codigo_barras: '75010002', nombre: 'Hamburguesa Especial', precio_venta: 120, categoria: 'Alimentos', activo: true },
  { id: 3, codigo_barras: '75010003', nombre: 'Cerveza Artesanal 355ml', precio_venta: 65, categoria: 'Bebidas', activo: true },
  { id: 4, codigo_barras: '75010004', nombre: 'Agua Fresca de Jamaica 1L', precio_venta: 40, categoria: 'Bebidas', activo: true },
  { id: 5, codigo_barras: '75010005', nombre: 'Pizza Familiar Pepperoni', precio_venta: 240, categoria: 'Alimentos', activo: true },
  { id: 6, codigo_barras: '75010006', nombre: 'Refresco 600ml', precio_venta: 35, categoria: 'Bebidas', activo: true },
  { id: 7, codigo_barras: '75010007', nombre: 'Nachos con Queso y Jalapeño', precio_venta: 75, categoria: 'Snacks', activo: true },
  { id: 8, codigo_barras: '75010008', nombre: 'Café Americano', precio_venta: 30, categoria: 'Bebidas', activo: true }
];

const DEFAULT_AREAS = [
  { id: 1, nombre: 'Bar Principal', descripcion: 'Área de bebidas y coctelería' },
  { id: 2, nombre: 'Snack Palapa', descripcion: 'Comida rápida y botanas' },
  { id: 3, nombre: 'Restaurante General', descripcion: 'Servicio de mesas' }
];

const DEFAULT_CADIS = [
  { id: 1, numero_cadi: '01', nombre: 'Cadi Palapa 1', estado: 'DISPONIBLE' },
  { id: 2, numero_cadi: '02', nombre: 'Cadi Palapa 2', estado: 'DISPONIBLE' },
  { id: 3, numero_cadi: '03', nombre: 'Cadi Zona Golf', estado: 'DISPONIBLE' }
];

const DEFAULT_SOCIOS = [
  { id: 1, codigo_socio: 'SOC-101', nombre: 'Juan Carlos Pérez', email: 'juan.perez@example.com' },
  { id: 2, codigo_socio: 'SOC-102', nombre: 'María Elena García', email: 'maria.garcia@example.com' },
  { id: 3, codigo_socio: 'SOC-103', nombre: 'Roberto Gómez', email: 'roberto.gomez@example.com' }
];

// Inicializador de LocalStorage
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTOS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(DEFAULT_PRODUCTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CADIS)) {
    localStorage.setItem(STORAGE_KEYS.CADIS, JSON.stringify(DEFAULT_CADIS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUENTAS)) {
    localStorage.setItem(STORAGE_KEYS.CUENTAS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TURNOS)) {
    localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify([]));
  }
}

initStorage();

export async function handleMockRequest(config: any): Promise<any> {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  const body = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};

  // Simulamos un pequeño retraso de red para realismo
  await new Promise(resolve => setTimeout(resolve, 150));

  // --- AUTHENTICATION ---
  if (url.includes('/api/auth/login-interno') || url.includes('/api/auth/login')) {
    const { username } = body;
    const isUserAdmin = username?.toLowerCase() === 'admin' || !username || username.trim() === '';
    return {
      status: 200,
      data: {
        token: 'mock-jwt-token-demo-123456',
        usuario: {
          id: isUserAdmin ? 1 : 2,
          username: username || 'admin',
          nombre: isUserAdmin ? 'Administrador General' : 'Vendedor / Cajero',
          roles: isUserAdmin ? ['ADMIN', 'VENDEDOR'] : ['VENDEDOR']
        }
      }
    };
  }

  if (url.includes('/api/auth/login-cliente') || url.includes('/api/auth/login-socio')) {
    const { nombre } = body;
    return {
      status: 200,
      data: {
        token: 'mock-socio-token-123',
        cliente: {
          id: 1,
          nombre: nombre || 'Juan Carlos Pérez',
          codigo_socio: 'SOC-101'
        }
      }
    };
  }

  if (url.includes('/api/auth/socios/buscar')) {
    return {
      status: 200,
      data: DEFAULT_SOCIOS
    };
  }

  // --- POS / PRODUCTOS ---
  if (url.includes('/api/pos/areas')) {
    return { status: 200, data: DEFAULT_AREAS };
  }

  if (url.includes('/api/pos/productos')) {
    const productos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTOS) || '[]');
    return { status: 200, data: productos };
  }

  if (url.includes('/api/pos/cadis')) {
    const cadis = JSON.parse(localStorage.getItem(STORAGE_KEYS.CADIS) || '[]');
    return { status: 200, data: cadis };
  }

  // --- TURNOS ---
  if (url.includes('/api/turnos/activo')) {
    const turnos = JSON.parse(localStorage.getItem(STORAGE_KEYS.TURNOS) || '[]');
    const activo = turnos.find((t: any) => t.activo);
    return { status: 200, data: activo || null };
  }

  if (url.includes('/api/turnos/abrir')) {
    const turnos = JSON.parse(localStorage.getItem(STORAGE_KEYS.TURNOS) || '[]');
    const nuevoTurno = {
      id: Date.now(),
      usuario_id: 1,
      area_id: body.area_id || 1,
      fondo_inicial: body.fondo_inicial || 1000,
      caja_efectivo: body.fondo_inicial || 1000,
      caja_tarjeta: 0,
      caja_cargos: 0,
      caja_transferencia: 0,
      abierto_at: new Date().toISOString(),
      activo: true
    };
    turnos.push(nuevoTurno);
    localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify(turnos));
    return { status: 200, data: nuevoTurno };
  }

  if (url.includes('/api/turnos/cerrar')) {
    const turnos = JSON.parse(localStorage.getItem(STORAGE_KEYS.TURNOS) || '[]');
    const index = turnos.findIndex((t: any) => t.activo);
    if (index !== -1) {
      turnos[index].activo = false;
      turnos[index].cerrado_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify(turnos));
      return { status: 200, data: turnos[index] };
    }
    return { status: 200, data: { message: 'Turno cerrado' } };
  }

  // --- CUENTAS / VENTAS ---
  if (url.includes('/api/pos/cuentas') && method === 'post') {
    const cuentas = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUENTAS) || '[]');
    const nuevaCuenta = {
      id: Date.now(),
      area_id: body.area_id || 1,
      usuario_id: 1,
      cadi_id: body.cadi_id || null,
      nombre_referencia: body.nombre_referencia || 'Mesa / Cliente',
      estado: 'ABIERTA',
      subtotal: 0,
      total: 0,
      detalleCuentas: [],
      created_at: new Date().toISOString()
    };
    cuentas.push(nuevaCuenta);
    localStorage.setItem(STORAGE_KEYS.CUENTAS, JSON.stringify(cuentas));
    return { status: 200, data: nuevaCuenta };
  }

  if (url.includes('/api/pos/cuentas/cerrar') || url.includes('/pagar')) {
    return { status: 200, data: { status: 'PAGADA', total: body.total || 150 } };
  }

  // Fallback genérico exitoso para cualquier otra API
  return {
    status: 200,
    data: { ok: true, message: 'Operación realizada en modo Demo Client-Side' }
  };
}
