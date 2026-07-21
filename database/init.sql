-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. GESTIÓN DE USUARIOS, ROLES Y PERMISOS (RBAC)
-- ==========================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuario_roles (
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, role_id)
);

CREATE TABLE permisos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rol_permisos (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id INT REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permiso_id)
);

-- ==========================================
-- 2. ESTRUCTURA DE ÁREAS (MULTI-ENTORNO)
-- ==========================================

CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE, -- 'Bar', 'Snack', 'Palapa'
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. PRODUCTOS E INVENTARIOS POR ÁREA
-- ==========================================

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    codigo_barras VARCHAR(50) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_venta NUMERIC(12, 4) NOT NULL CHECK (precio_venta >= 0),
    categoria VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventario físico independiente por cada área
CREATE TABLE inventario_areas (
    area_id INT REFERENCES areas(id) ON DELETE RESTRICT,
    producto_id INT REFERENCES productos(id) ON DELETE RESTRICT,
    stock NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    stock_minimo NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    stock_maximo NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    ubicacion_estante VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (area_id, producto_id),
    CONSTRAINT chk_stock_positivo CHECK (stock >= 0)
);

-- Historial/Kardex de movimientos de inventario (Auditoría)
CREATE TABLE movimientos_inventario (
    id BIGSERIAL PRIMARY KEY,
    area_id INT REFERENCES areas(id) ON DELETE RESTRICT,
    producto_id INT REFERENCES productos(id) ON DELETE RESTRICT,
    tipo_movimiento VARCHAR(20) NOT NULL, -- 'ENTRADA', 'SALIDA_VENTA', 'AJUSTE', 'TRANSFERENCIA'
    cantidad NUMERIC(12, 4) NOT NULL,
    stock_anterior NUMERIC(12, 4) NOT NULL,
    stock_nuevo NUMERIC(12, 4) NOT NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE RESTRICT,
    referencia_id VARCHAR(100),
    motivo TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. ENTIDADES: JUGADORES/CLIENTES Y CADIS
-- ==========================================

CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    codigo_socio VARCHAR(50) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE, -- Opcional, nullable
    password_hash VARCHAR(255), -- Opcional, nullable
    telefono VARCHAR(20),
    qr_token VARCHAR(255) UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cadis (
    id SERIAL PRIMARY KEY,
    numero_cadi VARCHAR(20) NOT NULL UNIQUE, -- E.g., 'CADI-045'
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'DISPONIBLE', -- 'DISPONIBLE', 'EN_RONDA', 'INACTIVO'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Relación de asignación activa (Muchos a Muchos en el tiempo)
CREATE TABLE asignaciones_cadi_clientes (
    id SERIAL PRIMARY KEY,
    cadi_id INT REFERENCES cadis(id) ON DELETE RESTRICT,
    cliente_id INT REFERENCES clientes(id) ON DELETE RESTRICT,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_asignacion_activa UNIQUE (cadi_id, cliente_id, activa)
);

-- ==========================================
-- 5. TRANSACCIONAL: CUENTAS Y VENTAS
-- ==========================================

CREATE TABLE cuentas (
    id BIGSERIAL PRIMARY KEY,
    area_id INT REFERENCES areas(id) ON DELETE RESTRICT,
    usuario_id INT REFERENCES usuarios(id) ON DELETE RESTRICT,
    cadi_id INT REFERENCES cadis(id) ON DELETE SET NULL,
    nombre_referencia VARCHAR(100),
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA', -- 'ABIERTA', 'PAGADA', 'CANCELADA'
    subtotal NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    impuestos NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    descuento NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    total NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    metodo_pago VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_totales_no_negativos CHECK (subtotal >= 0 AND total >= 0)
);

CREATE TABLE detalle_cuentas (
    id BIGSERIAL PRIMARY KEY,
    cuenta_id BIGINT REFERENCES cuentas(id) ON DELETE CASCADE,
    producto_id INT REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(12, 4) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12, 4) NOT NULL CHECK (precio_unitario >= 0),
    descuento NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    subtotal NUMERIC(12, 4) NOT NULL,
    impuestos NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    total NUMERIC(12, 4) NOT NULL,
    estado_item VARCHAR(20) DEFAULT 'PEDIDO', -- 'PEDIDO', 'PREPARADO', 'ENTREGADO', 'CANCELADO'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Registro formal del cobro y su división
CREATE TABLE divisiones_cuentas (
    id BIGSERIAL PRIMARY KEY,
    cuenta_id BIGINT REFERENCES cuentas(id) ON DELETE RESTRICT,
    cliente_id INT REFERENCES clientes(id) ON DELETE RESTRICT,
    porcentaje_participacion NUMERIC(5, 2) NOT NULL,
    monto_proporcional NUMERIC(12, 4) NOT NULL,
    metodo_pago VARCHAR(50), -- 'EFECTIVO', 'TARJETA', 'CARGO_HABITACION', 'CARGO_SOCIO'
    estado_pago VARCHAR(20) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'PAGADO', 'REBOTADO'
    pagado_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_porcentaje_valido CHECK (porcentaje_participacion > 0 AND porcentaje_participacion <= 100),
    CONSTRAINT uq_cuenta_cliente_division UNIQUE (cuenta_id, cliente_id)
);

-- ==========================================
-- 6. ÍNDICES DE RENDIMIENTO
-- ==========================================
CREATE INDEX idx_cuentas_estado ON cuentas(estado) WHERE estado = 'ABIERTA';
CREATE INDEX idx_inventario_stock ON inventario_areas(area_id, stock);
CREATE INDEX idx_asignaciones_activas ON asignaciones_cadi_clientes(cadi_id) WHERE activa = TRUE;
CREATE INDEX idx_detalle_cuenta_id ON detalle_cuentas(cuenta_id);
