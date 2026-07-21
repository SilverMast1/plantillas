import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config();

import { optimizarSQLite } from './db';
import { authenticateJWT, requireRoles } from './middlewares/auth.middleware';
import { idempotency } from './middlewares/idempotency.middleware';
import { loginInterno, loginCliente, crearClientePorStaff, buscarSociosPublico, listarUsuarios, crearUsuarioInterno, cambiarPasswordUsuario, toggleActivoUsuario, actualizarUsuarioInterno } from './controllers/auth.controller';
import { listarProductosPorArea, abrirCuenta, guardarConsumos, previsualizarSplit, pagarYCerrarCuenta, ajustarStockArea, obtenerBalanceCaja, listarTodasLasCuentas, eliminarCuenta, resetearDatos, crearProducto, actualizarMetodoPagoCuenta, transferirStock, listarTodosLosProductos, registrarMermaStock, listarMermas, eliminarProducto, fusionarCuentas, cambiarAreaCuenta } from './controllers/pos.controller';
import { crearCadi, eliminarCadi, listarCadis, listarCadisActivos, asignarClientesACadi, liberarCadi } from './controllers/cadi.controller';
import { obtenerPerfilSocio, listarConsumosSocio, regenerarTokenQR, buscarSocioPorQR, buscarSocios, eliminarSocio, listarSocios, listarCargosSocios, obtenerDetalleCargosSocio, liquidarCargosSocio, borrarCargosSocio, obtenerCuentaActivaSocio, actualizarSocio, obtenerSiguienteCodigoSocio } from './controllers/cliente.controller';
import { abrirTurno, obtenerTurnoActivo, cerrarTurno, registrarRetiroCaja, registrarIngresoCaja } from './controllers/turno.controller';
import { obtenerReporteDiario, obtenerReporteCortes, obtenerVentasPorArea } from './controllers/reporte.controller';
import { listarInsumos, crearInsumo, actualizarInsumo, eliminarInsumo, guardarReceta, obtenerReceta } from './controllers/insumo.controller';
import { registrarGastoIngreso, obtenerReporteSemanalGastos, eliminarGastoIngreso } from './controllers/gastos.controller';
import { listarBackups, crearBackup, restaurarBackup } from './controllers/backup.controller';

const app = express();
const server = http.createServer(app);

// Orígenes permitidos: localhost para dev + dominio de producción desde env
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const isOriginAllowed = (origin: string): boolean => {
  if (allowedOrigins.includes(origin)) return true;
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    // Permitir localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    // Permitir IPs de red local
    if (
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) return true;
    // Permitir túneles de VS Code o localtunnel
    if (
      hostname.endsWith('.github.dev') ||
      hostname.endsWith('.app.github.dev') ||
      hostname.endsWith('.loca.lt')
    ) return true;
  } catch (err) {
    // Si no es una URL válida
  }
  return false;
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS socket.io: origen no permitido: ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// Middlewares globales
app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (Postman, mobile) o desde orígenes permitidos
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origen no permitido: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(idempotency);

// ==========================================
// RUTAS DEL API
// ==========================================

// 1. Autenticación (Públicas)
app.post('/api/auth/login-interno', loginInterno);
app.post('/api/auth/login-cliente', loginCliente);
app.get('/api/auth/socios/buscar', buscarSociosPublico);

// 2. Punto de Venta (Vendedores y Administradores)
app.get('/api/pos/productos/:areaId', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), listarProductosPorArea);
app.post('/api/pos/clientes', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), crearClientePorStaff);
app.post('/api/pos/cuentas/abrir', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), abrirCuenta);
app.post('/api/pos/cuentas/fusionar', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), fusionarCuentas);
app.put('/api/pos/cuentas/:cuentaId/consumos', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), guardarConsumos);
app.get('/api/pos/cuentas/:cuentaId/split-preview', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), previsualizarSplit);
app.post('/api/pos/cuentas/:cuentaId/pagar', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), pagarYCerrarCuenta);
app.put('/api/pos/cuentas/:cuentaId/metodo-pago', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), actualizarMetodoPagoCuenta);
app.put('/api/pos/cuentas/:cuentaId/cambiar-area', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), cambiarAreaCuenta);

// 2.5 Gestión de Almacenamiento (Solo Administradores)
app.put('/api/admin/inventario', authenticateJWT, requireRoles(['ADMIN']), ajustarStockArea);
app.post('/api/admin/inventario/merma', authenticateJWT, requireRoles(['ADMIN']), registrarMermaStock);
app.get('/api/admin/inventario/mermas', authenticateJWT, requireRoles(['ADMIN']), listarMermas);
app.post('/api/pos/inventario/transferir', authenticateJWT, requireRoles(['ADMIN']), transferirStock);
app.get('/api/admin/caja', authenticateJWT, requireRoles(['ADMIN']), obtenerBalanceCaja);
app.get('/api/admin/cuentas', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), listarTodasLasCuentas);
app.delete('/api/admin/cuentas/:cuentaId', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), eliminarCuenta);
app.delete('/api/admin/reset', authenticateJWT, requireRoles(['ADMIN']), resetearDatos);
app.post('/api/admin/productos', authenticateJWT, requireRoles(['ADMIN']), crearProducto);
app.get('/api/admin/productos', authenticateJWT, requireRoles(['ADMIN']), listarTodosLosProductos);
app.delete('/api/admin/productos/:productoId', authenticateJWT, requireRoles(['ADMIN']), eliminarProducto);

// 2.5.5 Respaldos de Base de Datos (Solo Administradores)
app.get('/api/admin/backups', authenticateJWT, requireRoles(['ADMIN']), listarBackups);
app.post('/api/admin/backups/crear', authenticateJWT, requireRoles(['ADMIN']), crearBackup);
app.post('/api/admin/backups/restaurar', authenticateJWT, requireRoles(['ADMIN']), restaurarBackup);

// 2.9 Gestión de Usuarios Internos (Solo Administradores)
app.get('/api/admin/usuarios', authenticateJWT, requireRoles(['ADMIN']), listarUsuarios);
app.post('/api/admin/usuarios', authenticateJWT, requireRoles(['ADMIN']), crearUsuarioInterno);
app.put('/api/admin/usuarios/:id', authenticateJWT, requireRoles(['ADMIN']), actualizarUsuarioInterno);
app.put('/api/admin/usuarios/:id/password', authenticateJWT, requireRoles(['ADMIN']), cambiarPasswordUsuario);
app.put('/api/admin/usuarios/:id/toggle', authenticateJWT, requireRoles(['ADMIN']), toggleActivoUsuario);

// 2.8 Gestión de Insumos y Recetas (Solo Administradores)
app.get('/api/admin/insumos', authenticateJWT, requireRoles(['ADMIN']), listarInsumos);
app.post('/api/admin/insumos', authenticateJWT, requireRoles(['ADMIN']), crearInsumo);
app.put('/api/admin/insumos/:id', authenticateJWT, requireRoles(['ADMIN']), actualizarInsumo);
app.delete('/api/admin/insumos/:id', authenticateJWT, requireRoles(['ADMIN']), eliminarInsumo);
app.get('/api/admin/productos/:productoId/receta', authenticateJWT, requireRoles(['ADMIN']), obtenerReceta);
app.post('/api/admin/productos/:productoId/receta', authenticateJWT, requireRoles(['ADMIN']), guardarReceta);

// 2.6 Turnos / Cortes de Caja
app.post('/api/admin/turno/abrir', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), abrirTurno);
app.get('/api/admin/turno/activo', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), obtenerTurnoActivo);
app.post('/api/admin/turno/cerrar', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), cerrarTurno);
app.post('/api/admin/turno/retiro', authenticateJWT, requireRoles(['ADMIN']), registrarRetiroCaja);
app.post('/api/admin/turno/ingreso', authenticateJWT, requireRoles(['ADMIN']), registrarIngresoCaja);

// 2.7 Reportes (Solo Administradores)
app.get('/api/admin/reportes/diario', authenticateJWT, requireRoles(['ADMIN']), obtenerReporteDiario);
app.get('/api/admin/reportes/cortes', authenticateJWT, requireRoles(['ADMIN']), obtenerReporteCortes);
app.get('/api/admin/reportes/ventas-por-area', authenticateJWT, requireRoles(['ADMIN']), obtenerVentasPorArea);
app.post('/api/admin/gastos-ingresos', authenticateJWT, requireRoles(['ADMIN']), registrarGastoIngreso);
app.get('/api/admin/gastos-ingresos/semanal', authenticateJWT, requireRoles(['ADMIN']), obtenerReporteSemanalGastos);
app.delete('/api/admin/gastos-ingresos/:id', authenticateJWT, requireRoles(['ADMIN']), eliminarGastoIngreso);

// 3. Catálogo y Gestión de Cadis (Vendedores y Administradores)
app.get('/api/cadis', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), listarCadis);
app.get('/api/cadis/activos', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), listarCadisActivos);
app.post('/api/cadis', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), crearCadi);
app.post('/api/cadis/asignar', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), asignarClientesACadi);
app.put('/api/cadis/:cadiId/liberar', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), liberarCadi);
app.delete('/api/cadis/:cadiId', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), eliminarCadi);

// 4. Portal del Socio/Cliente y Autocompletados
app.get('/api/socio/perfil', authenticateJWT, requireRoles(['CLIENTE']), obtenerPerfilSocio);
app.get('/api/socio/consumos', authenticateJWT, requireRoles(['CLIENTE']), listarConsumosSocio);
app.get('/api/socio/cuenta-activa', authenticateJWT, requireRoles(['CLIENTE']), obtenerCuentaActivaSocio);
app.post('/api/socio/qr-token', authenticateJWT, requireRoles(['CLIENTE']), regenerarTokenQR);
app.post('/api/socio/buscar-qr', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), buscarSocioPorQR);
app.get('/api/socio/buscar', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), buscarSocios);
app.get('/api/socios', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), listarSocios);
app.get('/api/socios/siguiente-codigo', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), obtenerSiguienteCodigoSocio);
app.put('/api/socios/:socioId', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), actualizarSocio);
app.delete('/api/socios/:socioId', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), eliminarSocio);

// 4.5 Cargos a Socios (Deudas)
app.get('/api/pos/socios/cargos', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), listarCargosSocios);
app.get('/api/pos/socios/:socioId/cargos/detalle', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), obtenerDetalleCargosSocio);
app.post('/api/pos/socios/:socioId/cargos/liquidar', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), liquidarCargosSocio);
app.post('/api/pos/socios/:socioId/cargos/borrar', authenticateJWT, requireRoles(['ADMIN', 'VENDEDOR']), borrarCargosSocio);

// Ruta de estado general de salud del API
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ==========================================
// SERVIR FRONTEND COMPILADO (PRODUCCIÓN LOCAL)
// ==========================================
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  // Solo redirigir al frontend si no es una ruta de API
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  }
});

// ==========================================
// CONFIGURACIÓN DE WEBSOCKETS (TIEMPO REAL)
// ==========================================
io.on('connection', (socket) => {
  console.log('Cliente conectado por WebSocket:', socket.id);

  // Unirse a salas de áreas (Bar, Snack, Palapa)
  socket.on('join:area', (areaId) => {
    socket.join(`area:${areaId}`);
    console.log(`Socket ${socket.id} se unió a area:${areaId}`);
  });

  // Notificar cuando el stock cambia
  socket.on('inventario:cambio', (data) => {
    // data = { area_id }
    socket.to(`area:${data.area_id}`).emit('inventario:actualizar');
    socket.broadcast.emit('notificacion:global', { message: 'El stock de productos ha sido actualizado' });
  });

  // Notificar cuentas abiertas actualizadas
  socket.on('cuenta:cambio', (data) => {
    // data = { cadi_id }
    socket.broadcast.emit('cuenta:actualizar', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado por WebSocket:', socket.id);
  });
});

// Adjuntar instancia de socket.io a express para poder disparar eventos desde controladores si es necesario
app.set('io', io);

// Arrancar servidor
async function startServer() {
  await optimizarSQLite();
  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
  });
}
startServer();
