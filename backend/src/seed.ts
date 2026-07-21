import { PrismaClient } from '@prisma/client';
import prisma from './db';

async function main() {
  console.log('Iniciando carga de datos desde seed personalizado...');

  // Desactivar llaves foráneas en SQLite para la limpieza e inserción segura
  console.log('Desactivando llaves foráneas en SQLite...');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');

  // Limpiar tablas para evitar duplicados / conflictos de claves primarias
  console.log('Limpiando tablas de base de datos...');
  await prisma.usuarioRole.deleteMany({});
  await prisma.inventarioArea.deleteMany({});
  await prisma.recetaIngrediente.deleteMany({});
  await prisma.divisionCuenta.deleteMany({});
  await prisma.detalleCuenta.deleteMany({});
  await prisma.cuenta.deleteMany({});
  await prisma.movimientoInventario.deleteMany({});
  await prisma.retiroCaja.deleteMany({});
  await prisma.turno.deleteMany({});
  await prisma.asignacionCadiCliente.deleteMany({});
  await prisma.producto.deleteMany({});
  await prisma.insumo.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.cadi.deleteMany({});
  await prisma.area.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.usuario.deleteMany({});
  console.log('Limpieza completada');

  // 1. Roles
  console.log('Insertando roles...');
  await prisma.role.createMany({
    data: [
  {
    "id": 1,
    "nombre": "ADMIN",
    "descripcion": "Superusuario con control total sobre inventario y usuarios",
    "created_at": "2026-06-19T05:50:34.882Z",
    "updated_at": "2026-06-19T05:50:34.882Z"
  },
  {
    "id": 2,
    "nombre": "VENDEDOR",
    "descripcion": "Vendedor del punto de venta por área",
    "created_at": "2026-06-19T05:50:34.893Z",
    "updated_at": "2026-07-10T16:38:40.850Z"
  }
]
  });

  // 2. Usuarios
  console.log('Insertando usuarios...');
  await prisma.usuario.createMany({
    data: [
  {
    "id": 1,
    "username": "admin",
    "password_hash": "$2b$12$plYLoJpRJpzeDe4b8eHb7.YZkeZt8lCiVf4jMV24B0OG60VBcQ3l6",
    "nombre": "Administrador General",
    "email": "admin@campestre.com",
    "activo": true,
    "created_at": "2026-06-19T05:50:35.377Z",
    "updated_at": "2026-06-19T05:50:35.377Z"
  },
  {
    "id": 2,
    "username": "vendedor",
    "password_hash": "$2b$12$.dihLo4vWm5JoIcHXa.jRO0tWNp8e9W5wL.vGzlrve6AShW7pY64m",
    "nombre": "Vendedor",
    "email": "vendedor@campestre.com",
    "activo": true,
    "created_at": "2026-06-19T05:50:35.386Z",
    "updated_at": "2026-07-01T15:34:42.879Z"
  },
  {
    "id": 3,
    "username": "david",
    "password_hash": "$2b$12$5ecE6tf0dboe.fEEG8tQ.uk2MCQP1cDtrBuLkP7hvqn3n5OC0X7xi",
    "nombre": "David",
    "email": "david@campestre.com",
    "activo": true,
    "created_at": "2026-06-19T19:49:11.306Z",
    "updated_at": "2026-07-01T17:20:01.781Z"
  },
  {
    "id": 4,
    "username": "roger",
    "password_hash": "$2b$12$KQ9bPRqXjrChW6YSd5GAnerRnXnQAeKbdDrRchGaYPaZE8Dzk4g1u",
    "nombre": "Roger",
    "email": "roger@campestre.com",
    "activo": true,
    "created_at": "2026-06-19T19:49:11.331Z",
    "updated_at": "2026-07-09T22:47:38.820Z"
  },
  {
    "id": 5,
    "username": "gabriel",
    "password_hash": "$2b$12$zuwlfj3H91iYNAqFBT7ZJelAY2GYXJrSlafUIzX.RydwHQTm2dmT2",
    "nombre": "Gabriel",
    "email": "gabriel@campestre.com",
    "activo": true,
    "created_at": "2026-06-19T19:49:11.362Z",
    "updated_at": "2026-07-01T17:20:23.140Z"
  },
  {
    "id": 6,
    "username": "luis",
    "password_hash": "$2b$12$WT.MiIgQdW8bFcYSG4Dmw.Y9qMmqP4k2oDBBpFXOS4b/Nrh7RqOCW",
    "nombre": "Luis",
    "email": "luis@campestre.com",
    "activo": true,
    "created_at": "2026-06-19T19:49:11.376Z",
    "updated_at": "2026-07-01T17:20:38.331Z"
  },
  {
    "id": 7,
    "username": "Miguel",
    "password_hash": "$2b$12$YDQ3a2YmuHEv8RcZqwuZXex3XZvA6r6yZ0agGBEhNKwdQICRHYaZK",
    "nombre": "Miguel",
    "email": null,
    "activo": true,
    "created_at": "2026-06-23T05:59:21.769Z",
    "updated_at": "2026-07-08T19:48:12.763Z"
  }
]
  });

  // 3. Usuario Roles
  console.log('Insertando roles de usuario...');
  await prisma.usuarioRole.createMany({
    data: [
  {
    "usuario_id": 1,
    "role_id": 1
  },
  {
    "usuario_id": 7,
    "role_id": 1
  },
  {
    "usuario_id": 3,
    "role_id": 2
  },
  {
    "usuario_id": 5,
    "role_id": 2
  },
  {
    "usuario_id": 6,
    "role_id": 2
  },
  {
    "usuario_id": 4,
    "role_id": 2
  },
  {
    "usuario_id": 2,
    "role_id": 2
  }
]
  });

  // 4. Áreas
  console.log('Insertando áreas...');
  await prisma.area.createMany({
    data: [
  {
    "id": 1,
    "nombre": "Bar",
    "descripcion": "Bar de la Casa Club",
    "activo": true,
    "created_at": "2026-06-19T05:50:35.404Z"
  },
  {
    "id": 2,
    "nombre": "Snack",
    "descripcion": "Snack en el Hoyo 9",
    "activo": true,
    "created_at": "2026-06-19T05:50:35.411Z"
  },
  {
    "id": 3,
    "nombre": "Palapa",
    "descripcion": "Palapa de la alberca / exterior",
    "activo": true,
    "created_at": "2026-06-19T05:50:35.415Z"
  },
  {
    "id": 4,
    "nombre": "DEUDAS",
    "descripcion": null,
    "activo": true,
    "created_at": "2026-07-04T18:00:12.893Z"
  }
]
  });

  // 5. Clientes (Socios)
  console.log('Insertando clientes/socios...');
  await prisma.cliente.createMany({
    data: [
  {
    "id": 50,
    "codigo_socio": "SOCIO-1",
    "nombre": "JUAN PABLO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "b2ec1102-e922-489f-90ad-510b5b1caabe",
    "activo": true,
    "created_at": "2026-06-23T18:41:23.658Z",
    "updated_at": "2026-07-12T02:51:08.159Z"
  },
  {
    "id": 51,
    "codigo_socio": "EMPLEADO-1",
    "nombre": "PATY",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "98ee414c-ce2f-4493-b8ac-0c87d6909a7c",
    "activo": true,
    "created_at": "2026-06-23T18:42:14.628Z",
    "updated_at": "2026-07-12T02:51:09.340Z"
  },
  {
    "id": 55,
    "codigo_socio": "SOCIO-2",
    "nombre": "JORGE HERNANDEZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "a545c47c-6f44-4d86-8283-449a62689f1f",
    "activo": true,
    "created_at": "2026-06-23T22:29:20.338Z",
    "updated_at": "2026-07-12T02:51:08.165Z"
  },
  {
    "id": 57,
    "codigo_socio": "SOCIO-3",
    "nombre": "ALEJANDRO GUTIERREZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:28:58.190Z",
    "updated_at": "2026-07-12T02:51:08.172Z"
  },
  {
    "id": 58,
    "codigo_socio": "SOCIO-4",
    "nombre": "ALEJANDRO OROPEZA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:29:59.332Z",
    "updated_at": "2026-07-12T02:51:08.180Z"
  },
  {
    "id": 59,
    "codigo_socio": "SOCIO-5",
    "nombre": "ALEJANDRO TREVIÑO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:29:59.360Z",
    "updated_at": "2026-07-12T02:51:08.187Z"
  },
  {
    "id": 60,
    "codigo_socio": "SOCIO-6",
    "nombre": "ALFREDO CABELLO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:29:59.565Z",
    "updated_at": "2026-07-12T02:51:08.196Z"
  },
  {
    "id": 61,
    "codigo_socio": "SOCIO-7",
    "nombre": "ANTONIO LIRA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:29:59.697Z",
    "updated_at": "2026-07-12T02:51:08.203Z"
  },
  {
    "id": 62,
    "codigo_socio": "SOCIO-8",
    "nombre": "ARMANDO AGÜERO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:00.345Z",
    "updated_at": "2026-07-12T02:51:08.209Z"
  },
  {
    "id": 63,
    "codigo_socio": "SOCIO-9",
    "nombre": "ARTURO AGUIRRE",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:00.564Z",
    "updated_at": "2026-07-12T02:51:08.214Z"
  },
  {
    "id": 64,
    "codigo_socio": "SOCIO-10",
    "nombre": "ROBERTO BERLANGA/BETO BERLANGA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:00.718Z",
    "updated_at": "2026-07-12T02:51:08.219Z"
  },
  {
    "id": 65,
    "codigo_socio": "SOCIO-11",
    "nombre": "BRANDON ( DE BOLAS )",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:00.757Z",
    "updated_at": "2026-07-12T02:51:08.223Z"
  },
  {
    "id": 66,
    "codigo_socio": "SOCIO-12",
    "nombre": "BUFALO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:01.067Z",
    "updated_at": "2026-07-12T02:51:08.228Z"
  },
  {
    "id": 67,
    "codigo_socio": "SOCIO-13",
    "nombre": "CAMARON",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:01.440Z",
    "updated_at": "2026-07-12T02:51:08.234Z"
  },
  {
    "id": 68,
    "codigo_socio": "SOCIO-14",
    "nombre": "CARLOS ARTURO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:01.591Z",
    "updated_at": "2026-07-12T02:51:08.239Z"
  },
  {
    "id": 69,
    "codigo_socio": "SOCIO-15",
    "nombre": "CARLOS GALLEGOS",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:01.850Z",
    "updated_at": "2026-07-12T02:51:08.243Z"
  },
  {
    "id": 70,
    "codigo_socio": "SOCIO-16",
    "nombre": "CARLOS OLGUINA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:02.060Z",
    "updated_at": "2026-07-12T02:51:08.248Z"
  },
  {
    "id": 71,
    "codigo_socio": "SOCIO-17",
    "nombre": "CARLOS RECIO/PRESI",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:02.484Z",
    "updated_at": "2026-07-12T02:51:08.253Z"
  },
  {
    "id": 72,
    "codigo_socio": "SOCIO-18",
    "nombre": "CESAR PEREZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:02.645Z",
    "updated_at": "2026-07-12T02:51:08.257Z"
  },
  {
    "id": 73,
    "codigo_socio": "SOCIO-19",
    "nombre": "CESAR REVILLA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:03.807Z",
    "updated_at": "2026-07-12T02:51:08.262Z"
  },
  {
    "id": 74,
    "codigo_socio": "SOCIO-20",
    "nombre": "CHIGARRIS PEREZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:04.285Z",
    "updated_at": "2026-07-12T02:51:08.266Z"
  },
  {
    "id": 77,
    "codigo_socio": "SOCIO-21",
    "nombre": "DANI SOSA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:04.962Z",
    "updated_at": "2026-07-12T02:51:08.273Z"
  },
  {
    "id": 78,
    "codigo_socio": "SOCIO-22",
    "nombre": "DANIEL GALVAN/PROFEDANI",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:05.547Z",
    "updated_at": "2026-07-12T02:51:08.298Z"
  },
  {
    "id": 79,
    "codigo_socio": "SOCIO-23",
    "nombre": "DEL BOSQUE",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "2009450a-9875-4e77-a82b-f3a40d9cea2f",
    "activo": true,
    "created_at": "2026-07-01T17:30:05.914Z",
    "updated_at": "2026-07-12T02:51:08.307Z"
  },
  {
    "id": 80,
    "codigo_socio": "SOCIO-24",
    "nombre": "DOCTOR EDGAR",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:06.227Z",
    "updated_at": "2026-07-12T02:51:08.314Z"
  },
  {
    "id": 81,
    "codigo_socio": "SOCIO-25",
    "nombre": "ELIZONDO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:06.368Z",
    "updated_at": "2026-07-12T02:51:08.342Z"
  },
  {
    "id": 82,
    "codigo_socio": "SOCIO-26",
    "nombre": "EMILIANO DELGADO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:06.800Z",
    "updated_at": "2026-07-12T02:51:08.410Z"
  },
  {
    "id": 83,
    "codigo_socio": "SOCIO-27",
    "nombre": "ENRIQUE CUEVAS",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:06.944Z",
    "updated_at": "2026-07-12T02:51:08.416Z"
  },
  {
    "id": 84,
    "codigo_socio": "SOCIO-28",
    "nombre": "ERNESTO LOPEZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:07.463Z",
    "updated_at": "2026-07-12T02:51:08.423Z"
  },
  {
    "id": 85,
    "codigo_socio": "SOCIO-29",
    "nombre": "FERNANDO CORONADO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:07.761Z",
    "updated_at": "2026-07-12T02:51:08.435Z"
  },
  {
    "id": 86,
    "codigo_socio": "SOCIO-30",
    "nombre": "FERNANDO DEL TORO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:08.316Z",
    "updated_at": "2026-07-12T02:51:08.442Z"
  },
  {
    "id": 87,
    "codigo_socio": "SOCIO-31",
    "nombre": "FERNANDO MONTOYA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:08.600Z",
    "updated_at": "2026-07-12T02:51:08.449Z"
  },
  {
    "id": 88,
    "codigo_socio": "SOCIO-32",
    "nombre": "FERNANDO OBREGON",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:08.700Z",
    "updated_at": "2026-07-12T02:51:08.455Z"
  },
  {
    "id": 89,
    "codigo_socio": "SOCIO-33",
    "nombre": "FRANCISCO GERENTE",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:09.031Z",
    "updated_at": "2026-07-12T02:51:08.462Z"
  },
  {
    "id": 90,
    "codigo_socio": "SOCIO-34",
    "nombre": "FRANCISCO ROMERO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:09.733Z",
    "updated_at": "2026-07-12T02:51:08.471Z"
  },
  {
    "id": 91,
    "codigo_socio": "SOCIO-35",
    "nombre": "FRANCISCO VALDEZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:10.025Z",
    "updated_at": "2026-07-12T02:51:08.483Z"
  },
  {
    "id": 93,
    "codigo_socio": "SOCIO-36",
    "nombre": "GILBERTO NAVARRO/GIL NAVARRO/DOC GIL",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "37254c72-a609-472c-aa54-7ab783dd26d4",
    "activo": true,
    "created_at": "2026-07-01T17:30:10.434Z",
    "updated_at": "2026-07-12T02:51:08.490Z"
  },
  {
    "id": 94,
    "codigo_socio": "SOCIO-37",
    "nombre": "GILBERTO VEGA/DOC VEGA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:10.714Z",
    "updated_at": "2026-07-12T02:51:08.498Z"
  },
  {
    "id": 97,
    "codigo_socio": "SOCIO-38",
    "nombre": "GUSTAVO SOLIS",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:10.882Z",
    "updated_at": "2026-07-12T02:51:08.505Z"
  },
  {
    "id": 98,
    "codigo_socio": "SOCIO-39",
    "nombre": "HECTOR AGUIRRE",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:11.027Z",
    "updated_at": "2026-07-12T02:51:08.511Z"
  },
  {
    "id": 99,
    "codigo_socio": "SOCIO-40",
    "nombre": "HECTOR CARDENAS",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:11.057Z",
    "updated_at": "2026-07-12T02:51:08.517Z"
  },
  {
    "id": 100,
    "codigo_socio": "SOCIO-41",
    "nombre": "HECTOR GUTIERREZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:11.340Z",
    "updated_at": "2026-07-12T02:51:08.524Z"
  },
  {
    "id": 101,
    "codigo_socio": "SOCIO-42",
    "nombre": "HERNAN QUINTANILLA/MIRREYES",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:11.893Z",
    "updated_at": "2026-07-12T02:51:08.529Z"
  },
  {
    "id": 102,
    "codigo_socio": "SOCIO-43",
    "nombre": "HOMERO GUERRERO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:12.128Z",
    "updated_at": "2026-07-12T02:51:08.535Z"
  },
  {
    "id": 103,
    "codigo_socio": "SOCIO-44",
    "nombre": "IVAN GONZALES",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:12.374Z",
    "updated_at": "2026-07-12T02:51:08.542Z"
  },
  {
    "id": 104,
    "codigo_socio": "SOCIO-45",
    "nombre": "IVAN GONZALES NIÑO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:12.399Z",
    "updated_at": "2026-07-12T02:51:08.547Z"
  },
  {
    "id": 105,
    "codigo_socio": "SOCIO-46",
    "nombre": "JACOBO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:12.515Z",
    "updated_at": "2026-07-12T02:51:08.553Z"
  },
  {
    "id": 106,
    "codigo_socio": "SOCIO-47",
    "nombre": "JAVIER DE LEON/JAVIIDELEON",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:12.933Z",
    "updated_at": "2026-07-12T02:51:08.559Z"
  },
  {
    "id": 107,
    "codigo_socio": "SOCIO-48",
    "nombre": "JESUS IBARRA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:13.683Z",
    "updated_at": "2026-07-12T02:51:08.566Z"
  },
  {
    "id": 108,
    "codigo_socio": "SOCIO-49",
    "nombre": "JESUS SANTOS",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:14.029Z",
    "updated_at": "2026-07-12T02:51:08.571Z"
  },
  {
    "id": 109,
    "codigo_socio": "SOCIO-50",
    "nombre": "JORGE ROQUE",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:14.217Z",
    "updated_at": "2026-07-12T02:51:08.578Z"
  },
  {
    "id": 110,
    "codigo_socio": "SOCIO-51",
    "nombre": "JOSE OROPEZA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:14.361Z",
    "updated_at": "2026-07-12T02:51:08.584Z"
  },
  {
    "id": 111,
    "codigo_socio": "SOCIO-52",
    "nombre": "JUAN CERDA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:14.524Z",
    "updated_at": "2026-07-12T02:51:08.589Z"
  },
  {
    "id": 113,
    "codigo_socio": "SOCIO-53",
    "nombre": "KUESS/KUSS",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:15.095Z",
    "updated_at": "2026-07-12T02:51:08.596Z"
  },
  {
    "id": 114,
    "codigo_socio": "SOCIO-54",
    "nombre": "LIC CASTILLO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:15.196Z",
    "updated_at": "2026-07-12T02:51:08.603Z"
  },
  {
    "id": 115,
    "codigo_socio": "SOCIO-55",
    "nombre": "LUIS CORTEZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:16.190Z",
    "updated_at": "2026-07-12T02:51:08.609Z"
  },
  {
    "id": 116,
    "codigo_socio": "SOCIO-56",
    "nombre": "LUIS GALINDO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:16.627Z",
    "updated_at": "2026-07-12T02:51:08.615Z"
  },
  {
    "id": 117,
    "codigo_socio": "SOCIO-57",
    "nombre": "LUIS GONZALEZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:16.909Z",
    "updated_at": "2026-07-12T02:51:08.621Z"
  },
  {
    "id": 118,
    "codigo_socio": "SOCIO-58",
    "nombre": "MANUEL",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:17.000Z",
    "updated_at": "2026-07-12T02:51:08.629Z"
  },
  {
    "id": 119,
    "codigo_socio": "SOCIO-59",
    "nombre": "MARCO ROMERO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:17.217Z",
    "updated_at": "2026-07-12T02:51:08.636Z"
  },
  {
    "id": 120,
    "codigo_socio": "SOCIO-60",
    "nombre": "MAURO CABELLO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:17.495Z",
    "updated_at": "2026-07-12T02:51:08.641Z"
  },
  {
    "id": 121,
    "codigo_socio": "SOCIO-61",
    "nombre": "NARCISO CABALLERO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:17.801Z",
    "updated_at": "2026-07-12T02:51:08.647Z"
  },
  {
    "id": 122,
    "codigo_socio": "SOCIO-62",
    "nombre": "OMAR MEDINA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:18.326Z",
    "updated_at": "2026-07-12T02:51:08.655Z"
  },
  {
    "id": 123,
    "codigo_socio": "SOCIO-63",
    "nombre": "OMAR NUNCIO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:18.728Z",
    "updated_at": "2026-07-12T02:51:08.662Z"
  },
  {
    "id": 124,
    "codigo_socio": "SOCIO-64",
    "nombre": "PABLO TREJO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:18.982Z",
    "updated_at": "2026-07-12T02:51:08.670Z"
  },
  {
    "id": 127,
    "codigo_socio": "SOCIO-65",
    "nombre": "PEDRO GARCIA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:19.434Z",
    "updated_at": "2026-07-12T02:51:08.676Z"
  },
  {
    "id": 128,
    "codigo_socio": "SOCIO-66",
    "nombre": "PEPE GODINA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:19.864Z",
    "updated_at": "2026-07-12T02:51:08.684Z"
  },
  {
    "id": 129,
    "codigo_socio": "SOCIO-67",
    "nombre": "PONCE",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:19.967Z",
    "updated_at": "2026-07-12T02:51:08.691Z"
  },
  {
    "id": 130,
    "codigo_socio": "SOCIO-68",
    "nombre": "PROFE REYNA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:20.346Z",
    "updated_at": "2026-07-12T02:51:08.722Z"
  },
  {
    "id": 132,
    "codigo_socio": "SOCIO-69",
    "nombre": "RAMSES",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:21.162Z",
    "updated_at": "2026-07-12T02:51:08.728Z"
  },
  {
    "id": 133,
    "codigo_socio": "SOCIO-70",
    "nombre": "RAUL GALICIA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:21.649Z",
    "updated_at": "2026-07-12T02:51:08.797Z"
  },
  {
    "id": 134,
    "codigo_socio": "SOCIO-71",
    "nombre": "RICARDO ELIZONDO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:21.833Z",
    "updated_at": "2026-07-12T02:51:08.804Z"
  },
  {
    "id": 135,
    "codigo_socio": "SOCIO-72",
    "nombre": "RODRIGO NAVARRO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:21.931Z",
    "updated_at": "2026-07-12T02:51:08.834Z"
  },
  {
    "id": 136,
    "codigo_socio": "SOCIO-73",
    "nombre": "RODRIGO QUINTANILLA/MIRREYES",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:22.299Z",
    "updated_at": "2026-07-12T02:51:08.840Z"
  },
  {
    "id": 137,
    "codigo_socio": "SOCIO-74",
    "nombre": "ROGELIO SANCHEZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:22.738Z",
    "updated_at": "2026-07-12T02:51:08.855Z"
  },
  {
    "id": 138,
    "codigo_socio": "SOCIO-75",
    "nombre": "RUBEN CARRITOS",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:23.083Z",
    "updated_at": "2026-07-12T02:51:08.873Z"
  },
  {
    "id": 139,
    "codigo_socio": "SOCIO-76",
    "nombre": "TOBIAS",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:23.811Z",
    "updated_at": "2026-07-12T02:51:08.936Z"
  },
  {
    "id": 140,
    "codigo_socio": "SOCIO-77",
    "nombre": "TOÑO MARSHALL",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:24.116Z",
    "updated_at": "2026-07-12T02:51:08.948Z"
  },
  {
    "id": 141,
    "codigo_socio": "SOCIO-78",
    "nombre": "TOTO LOPEZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:24.796Z",
    "updated_at": "2026-07-12T02:51:08.957Z"
  },
  {
    "id": 142,
    "codigo_socio": "SOCIO-79",
    "nombre": "UBALDO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:25.322Z",
    "updated_at": "2026-07-12T02:51:08.967Z"
  },
  {
    "id": 143,
    "codigo_socio": "SOCIO-80",
    "nombre": "VICTOR VALDEZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:25.659Z",
    "updated_at": "2026-07-12T02:51:08.972Z"
  },
  {
    "id": 144,
    "codigo_socio": "SOCIO-81",
    "nombre": "IVAN SANTANA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:25.943Z",
    "updated_at": "2026-07-12T02:51:08.987Z"
  },
  {
    "id": 145,
    "codigo_socio": "SOCIO-82",
    "nombre": "JESUS JIMENES",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:26.376Z",
    "updated_at": "2026-07-12T02:51:08.994Z"
  },
  {
    "id": 147,
    "codigo_socio": "SOCIO-83",
    "nombre": "EDUARDO PEART",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:27.184Z",
    "updated_at": "2026-07-12T02:51:09.001Z"
  },
  {
    "id": 148,
    "codigo_socio": "SOCIO-84",
    "nombre": "ROGELIO CORTEZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:27.334Z",
    "updated_at": "2026-07-12T02:51:09.007Z"
  },
  {
    "id": 149,
    "codigo_socio": "SOCIO-85",
    "nombre": "SERGIO BARRERA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-01T17:30:27.677Z",
    "updated_at": "2026-07-12T02:51:09.013Z"
  },
  {
    "id": 151,
    "codigo_socio": "SOCIO-86",
    "nombre": "RODRIGO SARMIENTO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-02T16:06:40.745Z",
    "updated_at": "2026-07-12T02:51:09.020Z"
  },
  {
    "id": 152,
    "codigo_socio": "SOCIO-87",
    "nombre": "JOSE ÁNGEL RODRÍGUEZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "9a7e81da-4248-409c-896e-fba808ea7611",
    "activo": true,
    "created_at": "2026-07-02T19:45:56.243Z",
    "updated_at": "2026-07-12T02:51:09.025Z"
  },
  {
    "id": 153,
    "codigo_socio": "SOCIO-88",
    "nombre": "JOSE ANGEL RDZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-02T20:37:36.093Z",
    "updated_at": "2026-07-12T02:51:09.032Z"
  },
  {
    "id": 154,
    "codigo_socio": "SOCIO-89",
    "nombre": "FEDERICO MORQUECHO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-03T16:46:13.272Z",
    "updated_at": "2026-07-12T02:51:09.038Z"
  },
  {
    "id": 155,
    "codigo_socio": "SOCIO-90",
    "nombre": "GONZALO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-03T16:46:21.572Z",
    "updated_at": "2026-07-12T02:51:09.045Z"
  },
  {
    "id": 156,
    "codigo_socio": "SOCIO-91",
    "nombre": "GONZALO 2",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-03T16:46:21.820Z",
    "updated_at": "2026-07-12T02:51:09.051Z"
  },
  {
    "id": 157,
    "codigo_socio": "SOCIO-92",
    "nombre": "PROFE DANI/DANIEL GALVAN",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-03T16:46:31.964Z",
    "updated_at": "2026-07-12T02:51:09.058Z"
  },
  {
    "id": 158,
    "codigo_socio": "SOCIO-93",
    "nombre": "CHINO COSS",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-03T19:37:11.672Z",
    "updated_at": "2026-07-12T02:51:09.063Z"
  },
  {
    "id": 159,
    "codigo_socio": "SOCIO-94",
    "nombre": "CLAUDIO DEL VALLE",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-03T19:37:11.704Z",
    "updated_at": "2026-07-12T02:51:09.071Z"
  },
  {
    "id": 160,
    "codigo_socio": "SOCIO-95",
    "nombre": "CRISTIAN PUIU/PUIU",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-03T19:37:11.724Z",
    "updated_at": "2026-07-12T02:51:09.077Z"
  },
  {
    "id": 161,
    "codigo_socio": "SOCIO-96",
    "nombre": "FERNANDO ALVAREZ/MIRREYES/FER",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-03T19:37:14.000Z",
    "updated_at": "2026-07-12T02:51:09.084Z"
  },
  {
    "id": 163,
    "codigo_socio": "SOCIO-97",
    "nombre": "BRANDON BOLAS",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-03T20:36:54.645Z",
    "updated_at": "2026-07-12T02:51:09.089Z"
  },
  {
    "id": 166,
    "codigo_socio": "SOCIO-98",
    "nombre": "LUIS URIBE",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": null,
    "activo": true,
    "created_at": "2026-07-04T18:00:13.068Z",
    "updated_at": "2026-07-12T02:51:09.096Z"
  },
  {
    "id": 167,
    "codigo_socio": "SOCIO-99",
    "nombre": "PEPE LUZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "f8aaa490-4e82-4902-ab3c-33bb14ec76d0",
    "activo": true,
    "created_at": "2026-07-06T00:16:26.049Z",
    "updated_at": "2026-07-12T02:51:09.102Z"
  },
  {
    "id": 168,
    "codigo_socio": "EMPLEADO-2",
    "nombre": "DAVID DEL ANGEL",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "94fbc68e-5a6b-42bf-a1e8-e3b3f84b117d",
    "activo": true,
    "created_at": "2026-07-07T18:49:32.823Z",
    "updated_at": "2026-07-12T02:51:09.348Z"
  },
  {
    "id": 169,
    "codigo_socio": "SOCIO-100",
    "nombre": "BALDO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "c3c90710-c69b-4697-a55a-175b1d54a834",
    "activo": true,
    "created_at": "2026-07-07T23:52:42.971Z",
    "updated_at": "2026-07-12T02:51:09.120Z"
  },
  {
    "id": 170,
    "codigo_socio": "SOCIO-101",
    "nombre": "FABIO LOPEZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "cb35f71a-2872-4820-8714-f319a679b0a7",
    "activo": true,
    "created_at": "2026-07-08T19:26:54.759Z",
    "updated_at": "2026-07-12T02:51:09.129Z"
  },
  {
    "id": 171,
    "codigo_socio": "SOCIO-102",
    "nombre": "DANIEL",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "489c6f80-113c-4f06-8657-52b19efbc0e8",
    "activo": true,
    "created_at": "2026-07-08T19:28:17.727Z",
    "updated_at": "2026-07-12T02:51:09.145Z"
  },
  {
    "id": 172,
    "codigo_socio": "SOCIO-103",
    "nombre": "PROFE SOTO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "dc04a0a4-8b36-48f0-8ed0-9c02a6fbb519",
    "activo": true,
    "created_at": "2026-07-08T20:01:55.284Z",
    "updated_at": "2026-07-12T02:51:09.162Z"
  },
  {
    "id": 173,
    "codigo_socio": "SOCIO-104",
    "nombre": "JORGE AGUIRRE",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "a4130d57-541b-43b8-a67a-4468eb84fb90",
    "activo": true,
    "created_at": "2026-07-08T20:08:22.647Z",
    "updated_at": "2026-07-12T02:51:09.173Z"
  },
  {
    "id": 174,
    "codigo_socio": "SOCIO-105",
    "nombre": "MYCOT",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "0bbe26de-c711-479b-a409-00e097f4aadd",
    "activo": true,
    "created_at": "2026-07-08T20:36:32.573Z",
    "updated_at": "2026-07-12T02:51:09.190Z"
  },
  {
    "id": 175,
    "codigo_socio": "SOCIO-106",
    "nombre": "PRUEBA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "38541672-2dba-4acc-adcc-424a1606fba4",
    "activo": true,
    "created_at": "2026-07-09T15:48:15.068Z",
    "updated_at": "2026-07-12T02:51:09.202Z"
  },
  {
    "id": 176,
    "codigo_socio": "SOCIO-107",
    "nombre": "LUIS ELIZONDO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "6e3d4952-8d4f-4e09-9184-83f4402363b1",
    "activo": true,
    "created_at": "2026-07-09T18:37:34.372Z",
    "updated_at": "2026-07-12T02:51:09.227Z"
  },
  {
    "id": 177,
    "codigo_socio": "SOCIO-108",
    "nombre": "DANIEL SANCHEZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "3f53c97b-bb31-497d-b070-7e02440cabf0",
    "activo": true,
    "created_at": "2026-07-09T18:55:25.987Z",
    "updated_at": "2026-07-12T02:51:09.235Z"
  },
  {
    "id": 178,
    "codigo_socio": "SOCIO-109",
    "nombre": "DUQUE",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "0ce2c2c7-19ed-4ba6-b058-d654f55639c0",
    "activo": true,
    "created_at": "2026-07-09T20:03:40.929Z",
    "updated_at": "2026-07-12T02:51:09.239Z"
  },
  {
    "id": 179,
    "codigo_socio": "SOCIO-110",
    "nombre": "RAMIRO MENCHACA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "b81b86d5-9771-4122-8941-d3af219663da",
    "activo": true,
    "created_at": "2026-07-09T20:06:32.664Z",
    "updated_at": "2026-07-12T02:51:09.244Z"
  },
  {
    "id": 180,
    "codigo_socio": "SOCIO-111",
    "nombre": "RUBEN GLZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "fe4f1b61-71b7-4a2f-9b4b-7a2f7e24b1b3",
    "activo": true,
    "created_at": "2026-07-09T21:48:05.714Z",
    "updated_at": "2026-07-12T02:51:09.252Z"
  },
  {
    "id": 181,
    "codigo_socio": "SOCIO-112",
    "nombre": "BONIFACIO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "976b73fa-2cca-4783-aa80-a54044996443",
    "activo": true,
    "created_at": "2026-07-09T22:50:26.138Z",
    "updated_at": "2026-07-12T02:51:09.257Z"
  },
  {
    "id": 182,
    "codigo_socio": "SOCIO-113",
    "nombre": "GUSTAVO HUITRON",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "7b18dff6-e4a9-47a9-967c-a421f133d8b7",
    "activo": true,
    "created_at": "2026-07-10T18:47:16.900Z",
    "updated_at": "2026-07-12T02:51:09.262Z"
  },
  {
    "id": 183,
    "codigo_socio": "SOCIO-114",
    "nombre": "MIGUEL VARGAS",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "14693ab5-3bcf-4f35-9195-c07f6a2907dd",
    "activo": true,
    "created_at": "2026-07-10T21:15:27.299Z",
    "updated_at": "2026-07-12T02:51:09.267Z"
  },
  {
    "id": 184,
    "codigo_socio": "SOCIO-115",
    "nombre": "ENRIKE MAERO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "c1986ae6-4e34-45fe-93b2-9ed92484e140",
    "activo": true,
    "created_at": "2026-07-11T14:38:04.440Z",
    "updated_at": "2026-07-12T02:51:09.273Z"
  },
  {
    "id": 185,
    "codigo_socio": "SOCIO-116",
    "nombre": "ROBERTO ESPINOZA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "b2e9c22f-b909-4fb5-b0a0-a0584e8274a8",
    "activo": true,
    "created_at": "2026-07-11T15:03:52.862Z",
    "updated_at": "2026-07-12T02:51:09.278Z"
  },
  {
    "id": 186,
    "codigo_socio": "SOCIO-117",
    "nombre": "JOSE CABALLERO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "a1f895d7-0edc-4f95-a3a3-1dffe4aedcc1",
    "activo": true,
    "created_at": "2026-07-11T15:16:59.550Z",
    "updated_at": "2026-07-12T02:51:09.282Z"
  },
  {
    "id": 187,
    "codigo_socio": "SOCIO-118",
    "nombre": "JONATHAN CADI",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "e4f772dc-d382-4523-bfcc-30abaef65945",
    "activo": true,
    "created_at": "2026-07-11T15:18:15.835Z",
    "updated_at": "2026-07-12T02:51:09.288Z"
  },
  {
    "id": 188,
    "codigo_socio": "SOCIO-119",
    "nombre": "LUIS CARLOS (TOTO JOVEN)",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "6b657656-332d-40c2-8780-7c64ef77228d",
    "activo": true,
    "created_at": "2026-07-11T15:28:16.425Z",
    "updated_at": "2026-07-12T02:51:09.295Z"
  },
  {
    "id": 189,
    "codigo_socio": "SOCIO-120",
    "nombre": "ENRIQUE MORENO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "7d18306c-4362-419a-a8ab-6349d5a6d8ba",
    "activo": true,
    "created_at": "2026-07-11T16:34:11.420Z",
    "updated_at": "2026-07-12T02:51:09.300Z"
  },
  {
    "id": 190,
    "codigo_socio": "SOCIO-121",
    "nombre": "PAULINA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "149fa913-3b34-45e3-8bae-adcf51f279d6",
    "activo": true,
    "created_at": "2026-07-11T16:34:55.587Z",
    "updated_at": "2026-07-12T02:51:09.308Z"
  },
  {
    "id": 191,
    "codigo_socio": "SOCIO-122",
    "nombre": "GUILLERMO AGUIRRE/MEMO",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "d1232a2b-f23a-4eff-ae07-e37fe2c985d8",
    "activo": true,
    "created_at": "2026-07-11T20:38:00.563Z",
    "updated_at": "2026-07-12T02:51:09.314Z"
  },
  {
    "id": 192,
    "codigo_socio": "SOCIO-123",
    "nombre": "ISMAEL",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "bac48d0c-afce-45e2-8459-a9ca4c073d91",
    "activo": true,
    "created_at": "2026-07-11T20:45:08.064Z",
    "updated_at": "2026-07-12T02:51:09.321Z"
  },
  {
    "id": 193,
    "codigo_socio": "SOCIO-124",
    "nombre": "ANDRÉS RIVA",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "f306272c-e3ff-42c1-af82-6808f3322967",
    "activo": true,
    "created_at": "2026-07-12T00:17:31.065Z",
    "updated_at": "2026-07-12T02:51:09.328Z"
  },
  {
    "id": 194,
    "codigo_socio": "SOCIO-125",
    "nombre": "ROBERTO PEREZ",
    "email": null,
    "password_hash": null,
    "telefono": null,
    "qr_token": "3eca1313-4dc8-4d52-9f90-6eced3358478",
    "activo": true,
    "created_at": "2026-07-12T02:02:11.123Z",
    "updated_at": "2026-07-12T02:51:09.333Z"
  }
]
  });

  // 6. Cadis
  console.log('Insertando cadis...');
  await prisma.cadi.createMany({
    data: [
  {
    "id": 5,
    "numero_cadi": "CADI-1",
    "nombre": "JUAN PEREZ",
    "telefono": null,
    "estado": "DISPONIBLE",
    "created_at": "2026-07-12T02:51:09.364Z",
    "updated_at": "2026-07-12T02:51:09.364Z"
  },
  {
    "id": 6,
    "numero_cadi": "CADI-2",
    "nombre": "PEDRO GOMEZ",
    "telefono": null,
    "estado": "DISPONIBLE",
    "created_at": "2026-07-12T02:51:09.370Z",
    "updated_at": "2026-07-12T02:51:09.370Z"
  },
  {
    "id": 7,
    "numero_cadi": "CADI-3",
    "nombre": "CARLOS RODRIGUEZ",
    "telefono": null,
    "estado": "DISPONIBLE",
    "created_at": "2026-07-12T02:51:09.374Z",
    "updated_at": "2026-07-12T02:51:09.374Z"
  },
  {
    "id": 8,
    "numero_cadi": "CADI-4",
    "nombre": "LUIS HERNANDEZ",
    "telefono": null,
    "estado": "DISPONIBLE",
    "created_at": "2026-07-12T02:51:09.378Z",
    "updated_at": "2026-07-12T02:51:09.378Z"
  },
  {
    "id": 9,
    "numero_cadi": "CADI-5",
    "nombre": "JOSE MARTINEZ",
    "telefono": null,
    "estado": "DISPONIBLE",
    "created_at": "2026-07-12T02:51:09.383Z",
    "updated_at": "2026-07-12T02:51:09.383Z"
  },
  {
    "id": 10,
    "numero_cadi": "CADI-6",
    "nombre": "JESUS GARCIA",
    "telefono": null,
    "estado": "DISPONIBLE",
    "created_at": "2026-07-12T02:51:09.387Z",
    "updated_at": "2026-07-12T02:51:09.387Z"
  },
  {
    "id": 11,
    "numero_cadi": "CADI-7",
    "nombre": "ANTONIO FLORES",
    "telefono": null,
    "estado": "DISPONIBLE",
    "created_at": "2026-07-12T02:51:09.391Z",
    "updated_at": "2026-07-12T02:51:09.391Z"
  },
  {
    "id": 12,
    "numero_cadi": "CADI-8",
    "nombre": "FRANCISCO LOPEZ",
    "telefono": null,
    "estado": "DISPONIBLE",
    "created_at": "2026-07-12T02:51:09.395Z",
    "updated_at": "2026-07-12T02:51:09.395Z"
  },
  {
    "id": 13,
    "numero_cadi": "CADI-9",
    "nombre": "MANUEL SANCHEZ",
    "telefono": null,
    "estado": "DISPONIBLE",
    "created_at": "2026-07-12T02:51:09.400Z",
    "updated_at": "2026-07-12T02:51:09.400Z"
  },
  {
    "id": 14,
    "numero_cadi": "CADI-10",
    "nombre": "ROBERTO DIAZ",
    "telefono": null,
    "estado": "DISPONIBLE",
    "created_at": "2026-07-12T02:51:09.404Z",
    "updated_at": "2026-07-12T02:51:09.404Z"
  }
]
  });

  // 7. Productos
  console.log('Insertando productos...');
  await prisma.producto.createMany({
    data: [
  {
    "id": 396,
    "codigo_barras": "7502026300001",
    "nombre": "Agua de sabor",
    "descripcion": null,
    "precio_venta": "35",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.311Z",
    "updated_at": "2026-07-04T15:58:56.572Z"
  },
  {
    "id": 397,
    "codigo_barras": "7502026300002",
    "nombre": "Agua Mineral",
    "descripcion": null,
    "precio_venta": "35",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.327Z",
    "updated_at": "2026-06-23T16:50:07.520Z"
  },
  {
    "id": 398,
    "codigo_barras": "7502026300003",
    "nombre": "Agua Mineral Prep",
    "descripcion": null,
    "precio_venta": "45",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.333Z",
    "updated_at": "2026-06-23T06:14:12.333Z"
  },
  {
    "id": 399,
    "codigo_barras": "7502026300004",
    "nombre": "Agua Natural 500 ml",
    "descripcion": null,
    "precio_venta": "20",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.342Z",
    "updated_at": "2026-06-23T16:51:45.940Z"
  },
  {
    "id": 400,
    "codigo_barras": "7502026300005",
    "nombre": "Agua natural Lt",
    "descripcion": null,
    "precio_venta": "30",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.350Z",
    "updated_at": "2026-06-23T16:51:55.503Z"
  },
  {
    "id": 401,
    "codigo_barras": "7502026300006",
    "nombre": "Agua tonica",
    "descripcion": null,
    "precio_venta": "30",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.358Z",
    "updated_at": "2026-07-01T19:20:01.779Z"
  },
  {
    "id": 402,
    "codigo_barras": "7502026300007",
    "nombre": "Amper",
    "descripcion": null,
    "precio_venta": "40",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.364Z",
    "updated_at": "2026-06-23T16:52:25.102Z"
  },
  {
    "id": 403,
    "codigo_barras": "7502026300008",
    "nombre": "Coca Vidrio",
    "descripcion": null,
    "precio_venta": "30",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.370Z",
    "updated_at": "2026-06-24T16:11:29.234Z"
  },
  {
    "id": 404,
    "codigo_barras": "7502026300009",
    "nombre": "Electrolit",
    "descripcion": null,
    "precio_venta": "38",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.377Z",
    "updated_at": "2026-06-23T16:53:26.565Z"
  },
  {
    "id": 405,
    "codigo_barras": "7502026300010",
    "nombre": "Fuze tea",
    "descripcion": null,
    "precio_venta": "33",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.384Z",
    "updated_at": "2026-06-23T16:53:46.627Z"
  },
  {
    "id": 406,
    "codigo_barras": "7502026300011",
    "nombre": "Gatorade",
    "descripcion": null,
    "precio_venta": "38",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.393Z",
    "updated_at": "2026-06-23T16:54:19.564Z"
  },
  {
    "id": 407,
    "codigo_barras": "7502026300012",
    "nombre": "Jugo de naranja",
    "descripcion": null,
    "precio_venta": "45",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.400Z",
    "updated_at": "2026-06-23T06:14:12.400Z"
  },
  {
    "id": 408,
    "codigo_barras": "7502026300013",
    "nombre": "Juguito Jumex",
    "descripcion": null,
    "precio_venta": "25",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.407Z",
    "updated_at": "2026-06-23T16:54:35.898Z"
  },
  {
    "id": 409,
    "codigo_barras": "7502026300014",
    "nombre": "Monster",
    "descripcion": null,
    "precio_venta": "55",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.413Z",
    "updated_at": "2026-06-23T16:54:50.753Z"
  },
  {
    "id": 410,
    "codigo_barras": "7502026300015",
    "nombre": "Peñafiel Twist",
    "descripcion": null,
    "precio_venta": "33",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.419Z",
    "updated_at": "2026-07-10T16:38:40.939Z"
  },
  {
    "id": 411,
    "codigo_barras": "7502026300016",
    "nombre": "Powerade",
    "descripcion": null,
    "precio_venta": "38",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.426Z",
    "updated_at": "2026-06-24T16:07:03.537Z"
  },
  {
    "id": 412,
    "codigo_barras": "7502026300017",
    "nombre": "Refresco",
    "descripcion": null,
    "precio_venta": "33",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.434Z",
    "updated_at": "2026-06-23T17:26:00.537Z"
  },
  {
    "id": 413,
    "codigo_barras": "7502026300018",
    "nombre": "Cacahuates con ajo",
    "descripcion": null,
    "precio_venta": "35",
    "categoria": "botanas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.442Z",
    "updated_at": "2026-06-23T17:02:16.210Z"
  },
  {
    "id": 414,
    "codigo_barras": "7502026300019",
    "nombre": "Cacahuates japoneses",
    "descripcion": null,
    "precio_venta": "20",
    "categoria": "botanas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.448Z",
    "updated_at": "2026-06-23T17:03:13.633Z"
  },
  {
    "id": 415,
    "codigo_barras": "7502026300020",
    "nombre": "Cacahuates salados",
    "descripcion": null,
    "precio_venta": "30",
    "categoria": "botanas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.454Z",
    "updated_at": "2026-06-23T17:04:11.082Z"
  },
  {
    "id": 416,
    "codigo_barras": "7502026300021",
    "nombre": "Chicharrones",
    "descripcion": null,
    "precio_venta": "30",
    "categoria": "botanas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.461Z",
    "updated_at": "2026-06-23T17:26:11.690Z"
  },
  {
    "id": 417,
    "codigo_barras": "7502026300022",
    "nombre": "Chocolate",
    "descripcion": null,
    "precio_venta": "40",
    "categoria": "botanas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.466Z",
    "updated_at": "2026-06-23T17:06:00.851Z"
  },
  {
    "id": 418,
    "codigo_barras": "7502026300023",
    "nombre": "Cigarro suelto",
    "descripcion": null,
    "precio_venta": "10",
    "categoria": "botanas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.474Z",
    "updated_at": "2026-06-23T06:14:12.474Z"
  },
  {
    "id": 419,
    "codigo_barras": "7502026300024",
    "nombre": "Cigarros caja",
    "descripcion": null,
    "precio_venta": "100",
    "categoria": "botanas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.481Z",
    "updated_at": "2026-06-23T06:14:12.481Z"
  },
  {
    "id": 420,
    "codigo_barras": "7502026300025",
    "nombre": "Galletas",
    "descripcion": null,
    "precio_venta": "30",
    "categoria": "botanas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.490Z",
    "updated_at": "2026-06-23T06:14:12.490Z"
  },
  {
    "id": 421,
    "codigo_barras": "7502026300026",
    "nombre": "Kinder delice",
    "descripcion": null,
    "precio_venta": "25",
    "categoria": "botanas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.496Z",
    "updated_at": "2026-06-23T17:07:37.133Z"
  },
  {
    "id": 422,
    "codigo_barras": "7502026300027",
    "nombre": "Sabritas",
    "descripcion": null,
    "precio_venta": "25",
    "categoria": "botanas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.501Z",
    "updated_at": "2026-06-24T16:11:18.089Z"
  },
  {
    "id": 423,
    "codigo_barras": "7502026300028",
    "nombre": "Aderezo Extra",
    "descripcion": null,
    "precio_venta": "35",
    "categoria": "cenas",
    "activo": false,
    "created_at": "2026-06-23T06:14:12.507Z",
    "updated_at": "2026-06-23T16:58:37.219Z"
  },
  {
    "id": 424,
    "codigo_barras": "7502026300029",
    "nombre": "Boneless",
    "descripcion": null,
    "precio_venta": "109",
    "categoria": "cenas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.513Z",
    "updated_at": "2026-06-23T06:14:12.513Z"
  },
  {
    "id": 425,
    "codigo_barras": "7502026300030",
    "nombre": "Dedos de queso",
    "descripcion": null,
    "precio_venta": "99",
    "categoria": "cenas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.519Z",
    "updated_at": "2026-06-23T06:14:12.519Z"
  },
  {
    "id": 426,
    "codigo_barras": "7502026300031",
    "nombre": "Extra papas",
    "descripcion": null,
    "precio_venta": "20",
    "categoria": "cenas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.526Z",
    "updated_at": "2026-07-02T19:18:11.243Z"
  },
  {
    "id": 427,
    "codigo_barras": "7502026300032",
    "nombre": "Hamburguesa",
    "descripcion": null,
    "precio_venta": "115",
    "categoria": "cenas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.532Z",
    "updated_at": "2026-06-23T06:14:12.532Z"
  },
  {
    "id": 428,
    "codigo_barras": "7502026300033",
    "nombre": "Hotdog",
    "descripcion": null,
    "precio_venta": "69",
    "categoria": "cenas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.539Z",
    "updated_at": "2026-06-23T06:14:12.539Z"
  },
  {
    "id": 429,
    "codigo_barras": "7502026300034",
    "nombre": "Papas a la francesa",
    "descripcion": null,
    "precio_venta": "69",
    "categoria": "cenas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.547Z",
    "updated_at": "2026-06-23T06:14:12.547Z"
  },
  {
    "id": 430,
    "codigo_barras": "7502026300035",
    "nombre": "Papas preparadas",
    "descripcion": null,
    "precio_venta": "89",
    "categoria": "cenas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.555Z",
    "updated_at": "2026-06-23T06:14:12.555Z"
  },
  {
    "id": 431,
    "codigo_barras": "7502026300036",
    "nombre": "Tacos de bistec",
    "descripcion": null,
    "precio_venta": "110",
    "categoria": "cenas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.564Z",
    "updated_at": "2026-07-01T19:00:37.198Z"
  },
  {
    "id": 432,
    "codigo_barras": "7502026300037",
    "nombre": "Amstel Ultra",
    "descripcion": null,
    "precio_venta": "35",
    "categoria": "cervezas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.572Z",
    "updated_at": "2026-06-23T16:56:19.753Z"
  },
  {
    "id": 433,
    "codigo_barras": "7502026300038",
    "nombre": "Carta Blanca",
    "descripcion": null,
    "precio_venta": "30",
    "categoria": "cervezas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.579Z",
    "updated_at": "2026-06-23T18:26:03.827Z"
  },
  {
    "id": 434,
    "codigo_barras": "7502026300039",
    "nombre": "Indio",
    "descripcion": null,
    "precio_venta": "28",
    "categoria": "cervezas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.589Z",
    "updated_at": "2026-06-23T16:56:54.892Z"
  },
  {
    "id": 435,
    "codigo_barras": "7502026300040",
    "nombre": "Miller High Life",
    "descripcion": null,
    "precio_venta": "40",
    "categoria": "cervezas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.596Z",
    "updated_at": "2026-06-23T16:57:11.628Z"
  },
  {
    "id": 436,
    "codigo_barras": "7502026300041",
    "nombre": "Prep Chelada",
    "descripcion": null,
    "precio_venta": "65",
    "categoria": "cervezas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.602Z",
    "updated_at": "2026-06-23T06:14:12.602Z"
  },
  {
    "id": 437,
    "codigo_barras": "7502026300042",
    "nombre": "Prep. Clamato",
    "descripcion": null,
    "precio_venta": "35",
    "categoria": "cervezas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.608Z",
    "updated_at": "2026-07-01T17:55:27.267Z"
  },
  {
    "id": 438,
    "codigo_barras": "7502026300043",
    "nombre": "Prep. Michelada",
    "descripcion": null,
    "precio_venta": "70",
    "categoria": "cervezas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.614Z",
    "updated_at": "2026-06-23T06:14:12.614Z"
  },
  {
    "id": 439,
    "codigo_barras": "7502026300044",
    "nombre": "Tecate Light",
    "descripcion": null,
    "precio_venta": "28",
    "categoria": "cervezas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.620Z",
    "updated_at": "2026-07-11T22:15:13.961Z"
  },
  {
    "id": 440,
    "codigo_barras": "7502026300045",
    "nombre": "XX Lager",
    "descripcion": null,
    "precio_venta": "30",
    "categoria": "cervezas",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.627Z",
    "updated_at": "2026-06-23T16:58:02.106Z"
  },
  {
    "id": 441,
    "codigo_barras": "7502026300046",
    "nombre": "Puro Don gal coronita",
    "descripcion": null,
    "precio_venta": "100",
    "categoria": "cigarros",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.633Z",
    "updated_at": "2026-06-23T17:10:27.594Z"
  },
  {
    "id": 442,
    "codigo_barras": "7502026300047",
    "nombre": "Puro don gal doble robusto",
    "descripcion": null,
    "precio_venta": "150",
    "categoria": "cigarros",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.642Z",
    "updated_at": "2026-06-23T17:10:35.809Z"
  },
  {
    "id": 443,
    "codigo_barras": "7502026300048",
    "nombre": "Puro don gal robusto",
    "descripcion": null,
    "precio_venta": "120",
    "categoria": "cigarros",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.677Z",
    "updated_at": "2026-06-23T17:10:47.513Z"
  },
  {
    "id": 444,
    "codigo_barras": "7502026300049",
    "nombre": "Puro gabriel'o robusto",
    "descripcion": null,
    "precio_venta": "120",
    "categoria": "cigarros",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.686Z",
    "updated_at": "2026-06-23T17:11:01.086Z"
  },
  {
    "id": 445,
    "codigo_barras": "7502026300050",
    "nombre": "Puro grabiel'o coronita",
    "descripcion": null,
    "precio_venta": "100",
    "categoria": "cigarros",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.696Z",
    "updated_at": "2026-06-23T17:11:08.502Z"
  },
  {
    "id": 446,
    "codigo_barras": "7502026300051",
    "nombre": "Descuento Empleado",
    "descripcion": null,
    "precio_venta": "0",
    "categoria": "descuentos",
    "activo": true,
    "created_at": "2026-06-23T06:14:12.703Z",
    "updated_at": "2026-07-01T18:58:50.501Z"
  },
  {
    "id": 447,
    "codigo_barras": "7502026400001",
    "nombre": "Arroz frito c/ verduras",
    "descripcion": null,
    "precio_venta": "75",
    "categoria": "comida",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.581Z",
    "updated_at": "2026-06-23T06:15:16.581Z"
  },
  {
    "id": 448,
    "codigo_barras": "7502026400002",
    "nombre": "Chicharron de Ribeye",
    "descripcion": null,
    "precio_venta": "290",
    "categoria": "comida",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.604Z",
    "updated_at": "2026-07-01T19:20:35.046Z"
  },
  {
    "id": 449,
    "codigo_barras": "7502026400003",
    "nombre": "Enchiladas Suizas",
    "descripcion": null,
    "precio_venta": "110",
    "categoria": "comida",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.612Z",
    "updated_at": "2026-06-23T06:15:16.612Z"
  },
  {
    "id": 450,
    "codigo_barras": "7502026400004",
    "nombre": "Panini de pollo al chipotle",
    "descripcion": null,
    "precio_venta": "95",
    "categoria": "comida",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.621Z",
    "updated_at": "2026-06-23T06:15:16.621Z"
  },
  {
    "id": 451,
    "codigo_barras": "7502026400005",
    "nombre": "Pechuga de pollo",
    "descripcion": null,
    "precio_venta": "110",
    "categoria": "comida",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.627Z",
    "updated_at": "2026-06-23T06:15:16.627Z"
  },
  {
    "id": 452,
    "codigo_barras": "7502026400006",
    "nombre": "Platillo",
    "descripcion": null,
    "precio_venta": "95",
    "categoria": "comida",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.634Z",
    "updated_at": "2026-06-23T17:11:30.318Z"
  },
  {
    "id": 453,
    "codigo_barras": "7502026400007",
    "nombre": "Queso fundido",
    "descripcion": null,
    "precio_venta": "139",
    "categoria": "comida",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.640Z",
    "updated_at": "2026-06-23T06:15:16.640Z"
  },
  {
    "id": 454,
    "codigo_barras": "7502026400008",
    "nombre": "Tacos de fideo c/ chicharron",
    "descripcion": null,
    "precio_venta": "149",
    "categoria": "comida",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.647Z",
    "updated_at": "2026-07-01T19:00:40.925Z"
  },
  {
    "id": 455,
    "codigo_barras": "7502026400009",
    "nombre": "Tiradito de atún",
    "descripcion": null,
    "precio_venta": "195",
    "categoria": "comida",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.654Z",
    "updated_at": "2026-07-10T16:38:40.953Z"
  },
  {
    "id": 456,
    "codigo_barras": "7502026400010",
    "nombre": "Tostada de ceviche de pescado",
    "descripcion": null,
    "precio_venta": "65",
    "categoria": "comida",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.660Z",
    "updated_at": "2026-06-23T06:15:16.660Z"
  },
  {
    "id": 457,
    "codigo_barras": "7502026400011",
    "nombre": "1/2 menudo",
    "descripcion": null,
    "precio_venta": "80",
    "categoria": "desayunos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.666Z",
    "updated_at": "2026-06-23T17:11:56.580Z"
  },
  {
    "id": 458,
    "codigo_barras": "7502026400012",
    "nombre": "Menudo",
    "descripcion": null,
    "precio_venta": "110",
    "categoria": "desayunos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.672Z",
    "updated_at": "2026-06-23T06:15:16.672Z"
  },
  {
    "id": 459,
    "codigo_barras": "7502026400013",
    "nombre": "Chilaquiles",
    "descripcion": null,
    "precio_venta": "110",
    "categoria": "desayunos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.678Z",
    "updated_at": "2026-06-23T06:15:16.678Z"
  },
  {
    "id": 460,
    "codigo_barras": "7502026400014",
    "nombre": "Fruta con yogurt",
    "descripcion": null,
    "precio_venta": "75",
    "categoria": "desayunos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.684Z",
    "updated_at": "2026-06-23T06:15:16.684Z"
  },
  {
    "id": 461,
    "codigo_barras": "7502026400015",
    "nombre": "Huevos al gusto",
    "descripcion": null,
    "precio_venta": "80",
    "categoria": "desayunos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.691Z",
    "updated_at": "2026-06-23T06:15:16.691Z"
  },
  {
    "id": 462,
    "codigo_barras": "7502026400016",
    "nombre": "Huevos divorciados",
    "descripcion": null,
    "precio_venta": "85",
    "categoria": "desayunos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.698Z",
    "updated_at": "2026-06-23T06:15:16.698Z"
  },
  {
    "id": 463,
    "codigo_barras": "7502026400017",
    "nombre": "Molletes",
    "descripcion": null,
    "precio_venta": "69",
    "categoria": "desayunos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.707Z",
    "updated_at": "2026-06-23T06:15:16.707Z"
  },
  {
    "id": 464,
    "codigo_barras": "7502026400018",
    "nombre": "Molletes Especiales",
    "descripcion": null,
    "precio_venta": "85",
    "categoria": "desayunos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.715Z",
    "updated_at": "2026-06-23T06:15:16.715Z"
  },
  {
    "id": 465,
    "codigo_barras": "7502026400019",
    "nombre": "Omelette",
    "descripcion": null,
    "precio_venta": "79",
    "categoria": "desayunos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.722Z",
    "updated_at": "2026-06-23T06:15:16.722Z"
  },
  {
    "id": 466,
    "codigo_barras": "7502026400020",
    "nombre": "Quesadillas",
    "descripcion": null,
    "precio_venta": "70",
    "categoria": "desayunos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.729Z",
    "updated_at": "2026-06-23T06:15:16.729Z"
  },
  {
    "id": 467,
    "codigo_barras": "7502026400021",
    "nombre": "Nuggets con papas",
    "descripcion": null,
    "precio_venta": "85",
    "categoria": "niños",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.735Z",
    "updated_at": "2026-07-10T16:38:40.959Z"
  },
  {
    "id": 468,
    "codigo_barras": "7502026400022",
    "nombre": "Tenders con papas",
    "descripcion": null,
    "precio_venta": "95",
    "categoria": "niños",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.741Z",
    "updated_at": "2026-07-10T16:38:41.045Z"
  },
  {
    "id": 469,
    "codigo_barras": "7502026400023",
    "nombre": "Bacardi añejo Botella",
    "descripcion": null,
    "precio_venta": "499",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.748Z",
    "updated_at": "2026-07-01T19:20:50.475Z"
  },
  {
    "id": 470,
    "codigo_barras": "7502026400024",
    "nombre": "Bacardi Añejo prep",
    "descripcion": null,
    "precio_venta": "60",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.754Z",
    "updated_at": "2026-07-01T19:21:01.187Z"
  },
  {
    "id": 471,
    "codigo_barras": "7502026400025",
    "nombre": "Bacardi Añejo shot",
    "descripcion": null,
    "precio_venta": "50",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.760Z",
    "updated_at": "2026-07-01T19:21:08.711Z"
  },
  {
    "id": 472,
    "codigo_barras": "7502026400026",
    "nombre": "Bacardi Bco prep",
    "descripcion": null,
    "precio_venta": "60",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.767Z",
    "updated_at": "2026-06-23T17:13:11.635Z"
  },
  {
    "id": 473,
    "codigo_barras": "7502026400027",
    "nombre": "Bacardi Bco. Botella",
    "descripcion": null,
    "precio_venta": "499",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.773Z",
    "updated_at": "2026-06-23T17:13:25.506Z"
  },
  {
    "id": 474,
    "codigo_barras": "7502026400028",
    "nombre": "Bacardi Bco. Shot",
    "descripcion": null,
    "precio_venta": "50",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.781Z",
    "updated_at": "2026-06-23T17:13:33.168Z"
  },
  {
    "id": 475,
    "codigo_barras": "7502026400029",
    "nombre": "Beefeater Botella",
    "descripcion": null,
    "precio_venta": "799",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.787Z",
    "updated_at": "2026-06-23T17:14:00.506Z"
  },
  {
    "id": 476,
    "codigo_barras": "7502026400030",
    "nombre": "Capitan Morgan Botella",
    "descripcion": null,
    "precio_venta": "450",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.794Z",
    "updated_at": "2026-06-23T17:14:11.543Z"
  },
  {
    "id": 477,
    "codigo_barras": "7502026400031",
    "nombre": "Capitan Morgan prep",
    "descripcion": null,
    "precio_venta": "60",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.801Z",
    "updated_at": "2026-06-23T17:14:20.064Z"
  },
  {
    "id": 478,
    "codigo_barras": "7502026400032",
    "nombre": "Capitan Morgan shot",
    "descripcion": null,
    "precio_venta": "50",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.809Z",
    "updated_at": "2026-06-23T17:14:26.945Z"
  },
  {
    "id": 479,
    "codigo_barras": "7502026400033",
    "nombre": "Don Pedro Botella",
    "descripcion": null,
    "precio_venta": "399",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.815Z",
    "updated_at": "2026-06-23T17:14:38.837Z"
  },
  {
    "id": 480,
    "codigo_barras": "7502026400034",
    "nombre": "Don Pedro Prep",
    "descripcion": null,
    "precio_venta": "60",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.826Z",
    "updated_at": "2026-06-23T17:14:44.186Z"
  },
  {
    "id": 481,
    "codigo_barras": "7502026400035",
    "nombre": "Don Pedro Shot",
    "descripcion": null,
    "precio_venta": "50",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.839Z",
    "updated_at": "2026-06-23T17:14:48.662Z"
  },
  {
    "id": 482,
    "codigo_barras": "7502026400036",
    "nombre": "Matusalem Platino Botella",
    "descripcion": null,
    "precio_venta": "599",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.851Z",
    "updated_at": "2026-06-23T17:15:06.528Z"
  },
  {
    "id": 483,
    "codigo_barras": "7502026400037",
    "nombre": "Matusalem Platino prep",
    "descripcion": null,
    "precio_venta": "60",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.864Z",
    "updated_at": "2026-06-23T17:15:12.532Z"
  },
  {
    "id": 484,
    "codigo_barras": "7502026400038",
    "nombre": "Matusalem Platino shot",
    "descripcion": null,
    "precio_venta": "50",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.872Z",
    "updated_at": "2026-06-23T17:15:18.488Z"
  },
  {
    "id": 485,
    "codigo_barras": "7502026400039",
    "nombre": "Util",
    "descripcion": null,
    "precio_venta": "1",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.881Z",
    "updated_at": "2026-07-07T18:35:45.391Z"
  },
  {
    "id": 486,
    "codigo_barras": "7502026400040",
    "nombre": "Vodka Botella",
    "descripcion": null,
    "precio_venta": "499",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.891Z",
    "updated_at": "2026-06-23T17:15:34.755Z"
  },
  {
    "id": 487,
    "codigo_barras": "7502026400041",
    "nombre": "Vodka Prep",
    "descripcion": null,
    "precio_venta": "70",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.901Z",
    "updated_at": "2026-06-23T17:15:45.689Z"
  },
  {
    "id": 488,
    "codigo_barras": "7502026400042",
    "nombre": "Vodka Shot",
    "descripcion": null,
    "precio_venta": "50",
    "categoria": "ron, brandy y vodka",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.911Z",
    "updated_at": "2026-06-23T17:15:56.256Z"
  },
  {
    "id": 489,
    "codigo_barras": "7502026400043",
    "nombre": "Gorditas",
    "descripcion": null,
    "precio_venta": "33",
    "categoria": "tacos de guisos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.921Z",
    "updated_at": "2026-06-23T17:18:18.157Z"
  },
  {
    "id": 490,
    "codigo_barras": "7502026400044",
    "nombre": "Quesadilla con guiso",
    "descripcion": null,
    "precio_venta": "33",
    "categoria": "tacos de guisos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.930Z",
    "updated_at": "2026-06-23T17:18:36.553Z"
  },
  {
    "id": 491,
    "codigo_barras": "7502026400045",
    "nombre": "Taco de barbacoa",
    "descripcion": null,
    "precio_venta": "28",
    "categoria": "tacos de guisos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.936Z",
    "updated_at": "2026-07-01T18:59:06.028Z"
  },
  {
    "id": 492,
    "codigo_barras": "7502026400046",
    "nombre": "Taco de chicharron",
    "descripcion": null,
    "precio_venta": "28",
    "categoria": "tacos de guisos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.944Z",
    "updated_at": "2026-07-01T18:59:14.491Z"
  },
  {
    "id": 493,
    "codigo_barras": "7502026400047",
    "nombre": "Taco de choriqueso",
    "descripcion": null,
    "precio_venta": "28",
    "categoria": "tacos de guisos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.951Z",
    "updated_at": "2026-07-01T18:59:19.986Z"
  },
  {
    "id": 494,
    "codigo_barras": "7502026400048",
    "nombre": "Taco de huevo",
    "descripcion": null,
    "precio_venta": "24",
    "categoria": "tacos de guisos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.958Z",
    "updated_at": "2026-07-01T18:59:25.339Z"
  },
  {
    "id": 495,
    "codigo_barras": "7502026400049",
    "nombre": "Taco de papa c/ chorizo",
    "descripcion": null,
    "precio_venta": "24",
    "categoria": "tacos de guisos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.965Z",
    "updated_at": "2026-07-01T19:00:22.994Z"
  },
  {
    "id": 496,
    "codigo_barras": "7502026400050",
    "nombre": "Taco de picadillo",
    "descripcion": null,
    "precio_venta": "24",
    "categoria": "tacos de guisos",
    "activo": true,
    "created_at": "2026-06-23T06:15:16.971Z",
    "updated_at": "2026-07-01T19:00:32.398Z"
  },
  {
    "id": 497,
    "codigo_barras": "7502026500001",
    "nombre": "Black & White Botella",
    "descripcion": null,
    "precio_venta": "480",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.115Z",
    "updated_at": "2026-06-23T17:23:12.097Z"
  },
  {
    "id": 498,
    "codigo_barras": "7502026500002",
    "nombre": "Black & White Prep",
    "descripcion": null,
    "precio_venta": "70",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.129Z",
    "updated_at": "2026-06-23T17:23:20.089Z"
  },
  {
    "id": 499,
    "codigo_barras": "7502026500003",
    "nombre": "Black & White Shot",
    "descripcion": null,
    "precio_venta": "50",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.139Z",
    "updated_at": "2026-06-23T17:23:25.901Z"
  },
  {
    "id": 500,
    "codigo_barras": "7502026500004",
    "nombre": "Buchanans 12 Botella",
    "descripcion": null,
    "precio_venta": "999",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.147Z",
    "updated_at": "2026-06-23T17:23:39.255Z"
  },
  {
    "id": 501,
    "codigo_barras": "7502026500005",
    "nombre": "Buchanans 12 prep",
    "descripcion": null,
    "precio_venta": "95",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.155Z",
    "updated_at": "2026-06-23T17:23:47.439Z"
  },
  {
    "id": 502,
    "codigo_barras": "7502026500006",
    "nombre": "Buchanans 12 Shot",
    "descripcion": null,
    "precio_venta": "75",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.161Z",
    "updated_at": "2026-06-23T17:23:54.107Z"
  },
  {
    "id": 503,
    "codigo_barras": "7502026500007",
    "nombre": "Chivas 12 Botella",
    "descripcion": null,
    "precio_venta": "999",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.168Z",
    "updated_at": "2026-06-23T17:24:05.323Z"
  },
  {
    "id": 504,
    "codigo_barras": "7502026500008",
    "nombre": "Chivas 12 prep",
    "descripcion": null,
    "precio_venta": "95",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.174Z",
    "updated_at": "2026-06-23T17:24:13.143Z"
  },
  {
    "id": 505,
    "codigo_barras": "7502026500009",
    "nombre": "Chivas 12 Shot",
    "descripcion": null,
    "precio_venta": "75",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.181Z",
    "updated_at": "2026-06-23T17:24:29.053Z"
  },
  {
    "id": 506,
    "codigo_barras": "7502026500010",
    "nombre": "Etiq. Negra Botella",
    "descripcion": null,
    "precio_venta": "1099",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.187Z",
    "updated_at": "2026-06-23T17:24:42.299Z"
  },
  {
    "id": 507,
    "codigo_barras": "7502026500011",
    "nombre": "Etiq. Negra Prep.",
    "descripcion": null,
    "precio_venta": "95",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.195Z",
    "updated_at": "2026-06-23T17:24:47.408Z"
  },
  {
    "id": 508,
    "codigo_barras": "7502026500012",
    "nombre": "Etiq. Negra Shot",
    "descripcion": null,
    "precio_venta": "75",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.201Z",
    "updated_at": "2026-06-23T17:24:52.625Z"
  },
  {
    "id": 509,
    "codigo_barras": "7502026500013",
    "nombre": "Etiq. Roja Botella",
    "descripcion": null,
    "precio_venta": "499",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.207Z",
    "updated_at": "2026-06-23T17:25:05.295Z"
  },
  {
    "id": 510,
    "codigo_barras": "7502026500014",
    "nombre": "Etiq. Roja prep",
    "descripcion": null,
    "precio_venta": "70",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.215Z",
    "updated_at": "2026-06-23T17:25:12.171Z"
  },
  {
    "id": 511,
    "codigo_barras": "7502026500015",
    "nombre": "Etiq. Roja shot",
    "descripcion": null,
    "precio_venta": "50",
    "categoria": "whisky",
    "activo": true,
    "created_at": "2026-06-23T06:17:05.221Z",
    "updated_at": "2026-06-23T17:25:18.323Z"
  },
  {
    "id": 512,
    "codigo_barras": "7502026600001",
    "nombre": "Centenario Añejo",
    "descripcion": null,
    "precio_venta": "100",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:08.914Z",
    "updated_at": "2026-07-01T19:21:57.174Z"
  },
  {
    "id": 513,
    "codigo_barras": "7502026600002",
    "nombre": "Centenario plata botella",
    "descripcion": null,
    "precio_venta": "798",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:08.928Z",
    "updated_at": "2026-06-23T17:19:57.831Z"
  },
  {
    "id": 514,
    "codigo_barras": "7502026600003",
    "nombre": "Centenario plata prep",
    "descripcion": null,
    "precio_venta": "70",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:08.936Z",
    "updated_at": "2026-06-23T17:20:07.666Z"
  },
  {
    "id": 515,
    "codigo_barras": "7502026600004",
    "nombre": "Centenario plata shot",
    "descripcion": null,
    "precio_venta": "50",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:08.943Z",
    "updated_at": "2026-06-23T17:20:15.603Z"
  },
  {
    "id": 516,
    "codigo_barras": "7502026600005",
    "nombre": "Don Julio 70 Botella",
    "descripcion": null,
    "precio_venta": "1499",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:08.949Z",
    "updated_at": "2026-06-23T17:20:27.590Z"
  },
  {
    "id": 517,
    "codigo_barras": "7502026600006",
    "nombre": "Don Julio 70 Prep",
    "descripcion": null,
    "precio_venta": "130",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:08.956Z",
    "updated_at": "2026-06-23T17:20:32.426Z"
  },
  {
    "id": 518,
    "codigo_barras": "7502026600007",
    "nombre": "Don Julio 70 Shot",
    "descripcion": null,
    "precio_venta": "110",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:08.962Z",
    "updated_at": "2026-06-23T17:20:38.920Z"
  },
  {
    "id": 519,
    "codigo_barras": "7502026600008",
    "nombre": "Don Julio Reposado Botella",
    "descripcion": null,
    "precio_venta": "1299",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:08.969Z",
    "updated_at": "2026-06-23T17:20:47.722Z"
  },
  {
    "id": 520,
    "codigo_barras": "7502026600009",
    "nombre": "Don Julio Reposado Prep",
    "descripcion": null,
    "precio_venta": "120",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:08.975Z",
    "updated_at": "2026-06-23T17:20:53.980Z"
  },
  {
    "id": 521,
    "codigo_barras": "7502026600010",
    "nombre": "Don Julio Reposado Shot",
    "descripcion": null,
    "precio_venta": "100",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:08.981Z",
    "updated_at": "2026-06-23T17:21:01.635Z"
  },
  {
    "id": 522,
    "codigo_barras": "7502026600011",
    "nombre": "Hacienda tepa shot",
    "descripcion": null,
    "precio_venta": "50",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:08.987Z",
    "updated_at": "2026-06-23T17:21:41.916Z"
  },
  {
    "id": 523,
    "codigo_barras": "7502026600012",
    "nombre": "Hacienda tepa botella",
    "descripcion": null,
    "precio_venta": "799",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:08.993Z",
    "updated_at": "2026-06-23T17:21:52.160Z"
  },
  {
    "id": 524,
    "codigo_barras": "7502026600013",
    "nombre": "Hacienda tepa prep",
    "descripcion": null,
    "precio_venta": "70",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:09.000Z",
    "updated_at": "2026-06-23T17:21:59.826Z"
  },
  {
    "id": 525,
    "codigo_barras": "7502026600014",
    "nombre": "Maestro Dobel Botella",
    "descripcion": null,
    "precio_venta": "1299",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:09.007Z",
    "updated_at": "2026-06-23T17:22:13.471Z"
  },
  {
    "id": 526,
    "codigo_barras": "7502026600015",
    "nombre": "Maestro Dobel Prep",
    "descripcion": null,
    "precio_venta": "120",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:09.013Z",
    "updated_at": "2026-06-23T17:22:21.342Z"
  },
  {
    "id": 527,
    "codigo_barras": "7502026600016",
    "nombre": "Maestro Dobel Shot",
    "descripcion": null,
    "precio_venta": "100",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:09.019Z",
    "updated_at": "2026-06-23T17:22:26.767Z"
  },
  {
    "id": 528,
    "codigo_barras": "7502026600017",
    "nombre": "Tradicional Repo Botella",
    "descripcion": null,
    "precio_venta": "799",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:09.025Z",
    "updated_at": "2026-06-23T17:22:38.675Z"
  },
  {
    "id": 529,
    "codigo_barras": "7502026600018",
    "nombre": "Tradicional repo prep",
    "descripcion": null,
    "precio_venta": "70",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:09.031Z",
    "updated_at": "2026-06-23T17:22:51.341Z"
  },
  {
    "id": 530,
    "codigo_barras": "7502026600019",
    "nombre": "Tradicional Reposado",
    "descripcion": null,
    "precio_venta": "50",
    "categoria": "tequilas",
    "activo": true,
    "created_at": "2026-06-23T06:19:09.038Z",
    "updated_at": "2026-06-23T17:23:00.294Z"
  },
  {
    "id": 545,
    "codigo_barras": null,
    "nombre": "Agua Mineral Grande",
    "descripcion": "Agua mineral grande para preparado (no para venta directa)",
    "precio_venta": "0",
    "categoria": "Bebidas",
    "activo": true,
    "created_at": "2026-06-23T17:36:05.585Z",
    "updated_at": "2026-07-02T17:58:40.942Z"
  },
  {
    "id": 546,
    "codigo_barras": null,
    "nombre": "Consumo General",
    "descripcion": null,
    "precio_venta": "0",
    "categoria": "bebidas",
    "activo": true,
    "created_at": "2026-07-01T17:35:28.498Z",
    "updated_at": "2026-07-01T17:35:28.498Z"
  },
  {
    "id": 547,
    "codigo_barras": null,
    "nombre": "borrarcuenta",
    "descripcion": null,
    "precio_venta": "0.01",
    "categoria": "cigarros",
    "activo": true,
    "created_at": "2026-07-01T19:01:31.251Z",
    "updated_at": "2026-07-01T19:01:31.251Z"
  },
  {
    "id": 548,
    "codigo_barras": null,
    "nombre": "SABRITAS DE 30",
    "descripcion": null,
    "precio_venta": "30",
    "categoria": "botanas",
    "activo": true,
    "created_at": "2026-07-08T21:31:04.620Z",
    "updated_at": "2026-07-08T21:31:04.620Z"
  },
  {
    "id": 549,
    "codigo_barras": null,
    "nombre": "chile relleno",
    "descripcion": null,
    "precio_venta": "120",
    "categoria": "comida",
    "activo": true,
    "created_at": "2026-07-11T20:18:20.014Z",
    "updated_at": "2026-07-11T20:18:20.014Z"
  }
]
  });

  // 8. Inventario por área
  console.log('Insertando inventario por área...');
  await prisma.inventarioArea.createMany({
    data: [
  {
    "area_id": 3,
    "producto_id": 397,
    "stock": "98",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:41.687Z"
  },
  {
    "area_id": 1,
    "producto_id": 398,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:41.902Z"
  },
  {
    "area_id": 2,
    "producto_id": 398,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:41.907Z"
  },
  {
    "area_id": 3,
    "producto_id": 398,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:41.918Z"
  },
  {
    "area_id": 2,
    "producto_id": 399,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:41.924Z"
  },
  {
    "area_id": 3,
    "producto_id": 399,
    "stock": "97",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:41.934Z"
  },
  {
    "area_id": 3,
    "producto_id": 400,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:41.940Z"
  },
  {
    "area_id": 2,
    "producto_id": 401,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:41.951Z"
  },
  {
    "area_id": 3,
    "producto_id": 401,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:41.957Z"
  },
  {
    "area_id": 3,
    "producto_id": 403,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:41.965Z"
  },
  {
    "area_id": 3,
    "producto_id": 404,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:41.973Z"
  },
  {
    "area_id": 2,
    "producto_id": 405,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:41.985Z"
  },
  {
    "area_id": 3,
    "producto_id": 405,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:41.990Z"
  },
  {
    "area_id": 1,
    "producto_id": 407,
    "stock": "98",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T02:15:58.631Z"
  },
  {
    "area_id": 2,
    "producto_id": 407,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.006Z"
  },
  {
    "area_id": 3,
    "producto_id": 407,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.017Z"
  },
  {
    "area_id": 3,
    "producto_id": 408,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.022Z"
  },
  {
    "area_id": 3,
    "producto_id": 409,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.034Z"
  },
  {
    "area_id": 2,
    "producto_id": 410,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.057Z"
  },
  {
    "area_id": 3,
    "producto_id": 410,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.070Z"
  },
  {
    "area_id": 3,
    "producto_id": 411,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.076Z"
  },
  {
    "area_id": 2,
    "producto_id": 412,
    "stock": "97",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T18:47:16.769Z"
  },
  {
    "area_id": 3,
    "producto_id": 412,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.092Z"
  },
  {
    "area_id": 3,
    "producto_id": 413,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.103Z"
  },
  {
    "area_id": 3,
    "producto_id": 414,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.240Z"
  },
  {
    "area_id": 3,
    "producto_id": 415,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.391Z"
  },
  {
    "area_id": 3,
    "producto_id": 416,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.422Z"
  },
  {
    "area_id": 2,
    "producto_id": 417,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.519Z"
  },
  {
    "area_id": 3,
    "producto_id": 417,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.667Z"
  },
  {
    "area_id": 1,
    "producto_id": 418,
    "stock": "79",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T00:26:14.418Z"
  },
  {
    "area_id": 2,
    "producto_id": 418,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.889Z"
  },
  {
    "area_id": 3,
    "producto_id": 418,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.935Z"
  },
  {
    "area_id": 2,
    "producto_id": 419,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.940Z"
  },
  {
    "area_id": 3,
    "producto_id": 419,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.956Z"
  },
  {
    "area_id": 3,
    "producto_id": 420,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.970Z"
  },
  {
    "area_id": 3,
    "producto_id": 422,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.975Z"
  },
  {
    "area_id": 1,
    "producto_id": 424,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:42.987Z"
  },
  {
    "area_id": 2,
    "producto_id": 424,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:43.152Z"
  },
  {
    "area_id": 3,
    "producto_id": 424,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:43.171Z"
  },
  {
    "area_id": 1,
    "producto_id": 425,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:43.307Z"
  },
  {
    "area_id": 2,
    "producto_id": 425,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:43.559Z"
  },
  {
    "area_id": 3,
    "producto_id": 425,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:43.575Z"
  },
  {
    "area_id": 1,
    "producto_id": 426,
    "stock": "94",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T19:54:59.877Z"
  },
  {
    "area_id": 2,
    "producto_id": 426,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:43.619Z"
  },
  {
    "area_id": 3,
    "producto_id": 426,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:43.792Z"
  },
  {
    "area_id": 1,
    "producto_id": 427,
    "stock": "94",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T19:54:59.887Z"
  },
  {
    "area_id": 2,
    "producto_id": 427,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:43.821Z"
  },
  {
    "area_id": 3,
    "producto_id": 427,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:43.904Z"
  },
  {
    "area_id": 1,
    "producto_id": 428,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:43.973Z"
  },
  {
    "area_id": 1,
    "producto_id": 411,
    "stock": "93",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T19:17:50.231Z"
  },
  {
    "area_id": 1,
    "producto_id": 397,
    "stock": "48",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T02:21:43.725Z"
  },
  {
    "area_id": 1,
    "producto_id": 420,
    "stock": "89",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T21:58:12.602Z"
  },
  {
    "area_id": 1,
    "producto_id": 402,
    "stock": "93",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T02:21:43.879Z"
  },
  {
    "area_id": 2,
    "producto_id": 403,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:44.405Z"
  },
  {
    "area_id": 1,
    "producto_id": 412,
    "stock": "10",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T02:48:49.954Z"
  },
  {
    "area_id": 1,
    "producto_id": 405,
    "stock": "93",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T02:21:43.913Z"
  },
  {
    "area_id": 1,
    "producto_id": 422,
    "stock": "85",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T22:29:27.506Z"
  },
  {
    "area_id": 1,
    "producto_id": 410,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:44.805Z"
  },
  {
    "area_id": 2,
    "producto_id": 406,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:45.040Z"
  },
  {
    "area_id": 3,
    "producto_id": 406,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:45.186Z"
  },
  {
    "area_id": 1,
    "producto_id": 406,
    "stock": "86",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T20:10:41.515Z"
  },
  {
    "area_id": 1,
    "producto_id": 408,
    "stock": "98",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T02:15:58.727Z"
  },
  {
    "area_id": 1,
    "producto_id": 409,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:45.608Z"
  },
  {
    "area_id": 1,
    "producto_id": 404,
    "stock": "88",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T02:21:44.009Z"
  },
  {
    "area_id": 3,
    "producto_id": 396,
    "stock": "0",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:45.820Z"
  },
  {
    "area_id": 1,
    "producto_id": 403,
    "stock": "60",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T02:21:43.990Z"
  },
  {
    "area_id": 1,
    "producto_id": 413,
    "stock": "97",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T22:20:16.320Z"
  },
  {
    "area_id": 1,
    "producto_id": 415,
    "stock": "97",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T22:42:15.052Z"
  },
  {
    "area_id": 1,
    "producto_id": 417,
    "stock": "96",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T16:23:02.327Z"
  },
  {
    "area_id": 1,
    "producto_id": 421,
    "stock": "94",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T14:40:07.888Z"
  },
  {
    "area_id": 2,
    "producto_id": 421,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:46.190Z"
  },
  {
    "area_id": 3,
    "producto_id": 421,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:46.206Z"
  },
  {
    "area_id": 1,
    "producto_id": 401,
    "stock": "95",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T02:21:43.821Z"
  },
  {
    "area_id": 1,
    "producto_id": 416,
    "stock": "93",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T23:25:52.625Z"
  },
  {
    "area_id": 2,
    "producto_id": 397,
    "stock": "96",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T19:14:34.783Z"
  },
  {
    "area_id": 2,
    "producto_id": 396,
    "stock": "0",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:46.818Z"
  },
  {
    "area_id": 2,
    "producto_id": 409,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:46.826Z"
  },
  {
    "area_id": 2,
    "producto_id": 402,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:46.851Z"
  },
  {
    "area_id": 2,
    "producto_id": 411,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:46.884Z"
  },
  {
    "area_id": 2,
    "producto_id": 404,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:46.891Z"
  },
  {
    "area_id": 2,
    "producto_id": 400,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:46.901Z"
  },
  {
    "area_id": 2,
    "producto_id": 408,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:46.971Z"
  },
  {
    "area_id": 2,
    "producto_id": 422,
    "stock": "97",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T19:10:30.916Z"
  },
  {
    "area_id": 2,
    "producto_id": 416,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T19:16:00.606Z"
  },
  {
    "area_id": 2,
    "producto_id": 414,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T19:56:51.145Z"
  },
  {
    "area_id": 2,
    "producto_id": 420,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.019Z"
  },
  {
    "area_id": 2,
    "producto_id": 413,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.025Z"
  },
  {
    "area_id": 2,
    "producto_id": 415,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.037Z"
  },
  {
    "area_id": 1,
    "producto_id": 419,
    "stock": "90",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T21:38:54.984Z"
  },
  {
    "area_id": 1,
    "producto_id": 414,
    "stock": "90",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T23:30:31.398Z"
  },
  {
    "area_id": 2,
    "producto_id": 428,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.083Z"
  },
  {
    "area_id": 3,
    "producto_id": 428,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.271Z"
  },
  {
    "area_id": 1,
    "producto_id": 429,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.284Z"
  },
  {
    "area_id": 2,
    "producto_id": 429,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.291Z"
  },
  {
    "area_id": 3,
    "producto_id": 429,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.397Z"
  },
  {
    "area_id": 1,
    "producto_id": 430,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.486Z"
  },
  {
    "area_id": 2,
    "producto_id": 430,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.537Z"
  },
  {
    "area_id": 3,
    "producto_id": 430,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.600Z"
  },
  {
    "area_id": 1,
    "producto_id": 431,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.623Z"
  },
  {
    "area_id": 2,
    "producto_id": 431,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.722Z"
  },
  {
    "area_id": 3,
    "producto_id": 431,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.818Z"
  },
  {
    "area_id": 3,
    "producto_id": 432,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.901Z"
  },
  {
    "area_id": 3,
    "producto_id": 433,
    "stock": "95",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:47.969Z"
  },
  {
    "area_id": 3,
    "producto_id": 434,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:48.082Z"
  },
  {
    "area_id": 3,
    "producto_id": 435,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:48.207Z"
  },
  {
    "area_id": 1,
    "producto_id": 436,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:48.287Z"
  },
  {
    "area_id": 2,
    "producto_id": 436,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:48.456Z"
  },
  {
    "area_id": 3,
    "producto_id": 436,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:48.571Z"
  },
  {
    "area_id": 1,
    "producto_id": 437,
    "stock": "86",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T22:31:46.385Z"
  },
  {
    "area_id": 2,
    "producto_id": 437,
    "stock": "91",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T00:38:28.053Z"
  },
  {
    "area_id": 3,
    "producto_id": 437,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:49.034Z"
  },
  {
    "area_id": 1,
    "producto_id": 438,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:49.056Z"
  },
  {
    "area_id": 2,
    "producto_id": 438,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T19:09:12.217Z"
  },
  {
    "area_id": 3,
    "producto_id": 438,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:49.401Z"
  },
  {
    "area_id": 3,
    "producto_id": 439,
    "stock": "96",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:49.422Z"
  },
  {
    "area_id": 3,
    "producto_id": 440,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:49.474Z"
  },
  {
    "area_id": 2,
    "producto_id": 441,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:49.490Z"
  },
  {
    "area_id": 3,
    "producto_id": 441,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:49.519Z"
  },
  {
    "area_id": 2,
    "producto_id": 442,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:49.540Z"
  },
  {
    "area_id": 3,
    "producto_id": 442,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:49.717Z"
  },
  {
    "area_id": 2,
    "producto_id": 443,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:49.938Z"
  },
  {
    "area_id": 3,
    "producto_id": 443,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:50.086Z"
  },
  {
    "area_id": 2,
    "producto_id": 444,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:50.241Z"
  },
  {
    "area_id": 3,
    "producto_id": 444,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:50.273Z"
  },
  {
    "area_id": 2,
    "producto_id": 445,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:50.442Z"
  },
  {
    "area_id": 3,
    "producto_id": 445,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:50.488Z"
  },
  {
    "area_id": 2,
    "producto_id": 446,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:50.604Z"
  },
  {
    "area_id": 3,
    "producto_id": 446,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:50.832Z"
  },
  {
    "area_id": 1,
    "producto_id": 447,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:50.992Z"
  },
  {
    "area_id": 2,
    "producto_id": 447,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:51.302Z"
  },
  {
    "area_id": 3,
    "producto_id": 447,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:51.509Z"
  },
  {
    "area_id": 1,
    "producto_id": 448,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:51.658Z"
  },
  {
    "area_id": 2,
    "producto_id": 448,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:51.788Z"
  },
  {
    "area_id": 3,
    "producto_id": 448,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.088Z"
  },
  {
    "area_id": 1,
    "producto_id": 449,
    "stock": "95",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T20:46:08.894Z"
  },
  {
    "area_id": 2,
    "producto_id": 449,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.356Z"
  },
  {
    "area_id": 3,
    "producto_id": 449,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.482Z"
  },
  {
    "area_id": 1,
    "producto_id": 450,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.486Z"
  },
  {
    "area_id": 2,
    "producto_id": 450,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.492Z"
  },
  {
    "area_id": 3,
    "producto_id": 450,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.504Z"
  },
  {
    "area_id": 1,
    "producto_id": 451,
    "stock": "95",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.509Z"
  },
  {
    "area_id": 2,
    "producto_id": 451,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.522Z"
  },
  {
    "area_id": 3,
    "producto_id": 451,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.538Z"
  },
  {
    "area_id": 2,
    "producto_id": 452,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.550Z"
  },
  {
    "area_id": 3,
    "producto_id": 452,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.555Z"
  },
  {
    "area_id": 1,
    "producto_id": 453,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.566Z"
  },
  {
    "area_id": 2,
    "producto_id": 453,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.571Z"
  },
  {
    "area_id": 3,
    "producto_id": 453,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.581Z"
  },
  {
    "area_id": 1,
    "producto_id": 454,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T16:36:41.345Z"
  },
  {
    "area_id": 2,
    "producto_id": 454,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.591Z"
  },
  {
    "area_id": 3,
    "producto_id": 454,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.601Z"
  },
  {
    "area_id": 1,
    "producto_id": 455,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.607Z"
  },
  {
    "area_id": 2,
    "producto_id": 455,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.618Z"
  },
  {
    "area_id": 3,
    "producto_id": 455,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.623Z"
  },
  {
    "area_id": 1,
    "producto_id": 456,
    "stock": "86",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T20:45:34.138Z"
  },
  {
    "area_id": 2,
    "producto_id": 456,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.648Z"
  },
  {
    "area_id": 3,
    "producto_id": 456,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.653Z"
  },
  {
    "area_id": 2,
    "producto_id": 457,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.664Z"
  },
  {
    "area_id": 3,
    "producto_id": 457,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.670Z"
  },
  {
    "area_id": 1,
    "producto_id": 458,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T15:44:16.513Z"
  },
  {
    "area_id": 2,
    "producto_id": 458,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.685Z"
  },
  {
    "area_id": 3,
    "producto_id": 458,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.689Z"
  },
  {
    "area_id": 1,
    "producto_id": 459,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.700Z"
  },
  {
    "area_id": 2,
    "producto_id": 459,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.823Z"
  },
  {
    "area_id": 3,
    "producto_id": 459,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:52.936Z"
  },
  {
    "area_id": 1,
    "producto_id": 460,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:53.020Z"
  },
  {
    "area_id": 2,
    "producto_id": 460,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:53.117Z"
  },
  {
    "area_id": 2,
    "producto_id": 439,
    "stock": "89",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T00:02:44.981Z"
  },
  {
    "area_id": 1,
    "producto_id": 446,
    "stock": "86",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T19:17:53.436Z"
  },
  {
    "area_id": 1,
    "producto_id": 439,
    "stock": "485",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T23:30:31.462Z"
  },
  {
    "area_id": 1,
    "producto_id": 440,
    "stock": "27",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T02:03:03.671Z"
  },
  {
    "area_id": 1,
    "producto_id": 442,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:53.558Z"
  },
  {
    "area_id": 1,
    "producto_id": 443,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:53.576Z"
  },
  {
    "area_id": 1,
    "producto_id": 444,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:53.587Z"
  },
  {
    "area_id": 1,
    "producto_id": 445,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T15:57:51.660Z"
  },
  {
    "area_id": 1,
    "producto_id": 452,
    "stock": "87",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T20:13:00.979Z"
  },
  {
    "area_id": 1,
    "producto_id": 457,
    "stock": "98",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T15:10:43.473Z"
  },
  {
    "area_id": 1,
    "producto_id": 434,
    "stock": "80",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T23:50:44.238Z"
  },
  {
    "area_id": 1,
    "producto_id": 433,
    "stock": "33",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T23:59:51.192Z"
  },
  {
    "area_id": 2,
    "producto_id": 432,
    "stock": "94",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T00:02:00.599Z"
  },
  {
    "area_id": 2,
    "producto_id": 434,
    "stock": "90",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T00:07:10.916Z"
  },
  {
    "area_id": 2,
    "producto_id": 435,
    "stock": "98",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T21:10:35.033Z"
  },
  {
    "area_id": 2,
    "producto_id": 440,
    "stock": "96",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T20:51:43.617Z"
  },
  {
    "area_id": 2,
    "producto_id": 433,
    "stock": "85",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T00:43:04.889Z"
  },
  {
    "area_id": 1,
    "producto_id": 435,
    "stock": "78",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T23:25:52.587Z"
  },
  {
    "area_id": 3,
    "producto_id": 460,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.173Z"
  },
  {
    "area_id": 1,
    "producto_id": 461,
    "stock": "98",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T16:39:34.990Z"
  },
  {
    "area_id": 2,
    "producto_id": 461,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.187Z"
  },
  {
    "area_id": 3,
    "producto_id": 461,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.198Z"
  },
  {
    "area_id": 1,
    "producto_id": 462,
    "stock": "94",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T20:16:10.346Z"
  },
  {
    "area_id": 2,
    "producto_id": 462,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.207Z"
  },
  {
    "area_id": 3,
    "producto_id": 462,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.218Z"
  },
  {
    "area_id": 1,
    "producto_id": 463,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.223Z"
  },
  {
    "area_id": 2,
    "producto_id": 463,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.234Z"
  },
  {
    "area_id": 3,
    "producto_id": 463,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.282Z"
  },
  {
    "area_id": 1,
    "producto_id": 464,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.287Z"
  },
  {
    "area_id": 2,
    "producto_id": 464,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.300Z"
  },
  {
    "area_id": 3,
    "producto_id": 464,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.307Z"
  },
  {
    "area_id": 1,
    "producto_id": 465,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.317Z"
  },
  {
    "area_id": 2,
    "producto_id": 465,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.323Z"
  },
  {
    "area_id": 3,
    "producto_id": 465,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.333Z"
  },
  {
    "area_id": 1,
    "producto_id": 466,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.338Z"
  },
  {
    "area_id": 2,
    "producto_id": 466,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.471Z"
  },
  {
    "area_id": 3,
    "producto_id": 466,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.477Z"
  },
  {
    "area_id": 1,
    "producto_id": 467,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.671Z"
  },
  {
    "area_id": 2,
    "producto_id": 467,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:54.859Z"
  },
  {
    "area_id": 3,
    "producto_id": 467,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.107Z"
  },
  {
    "area_id": 1,
    "producto_id": 468,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.121Z"
  },
  {
    "area_id": 2,
    "producto_id": 468,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.134Z"
  },
  {
    "area_id": 3,
    "producto_id": 468,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.138Z"
  },
  {
    "area_id": 2,
    "producto_id": 469,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.157Z"
  },
  {
    "area_id": 3,
    "producto_id": 469,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.253Z"
  },
  {
    "area_id": 2,
    "producto_id": 470,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.270Z"
  },
  {
    "area_id": 3,
    "producto_id": 470,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.372Z"
  },
  {
    "area_id": 2,
    "producto_id": 471,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.586Z"
  },
  {
    "area_id": 3,
    "producto_id": 471,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.593Z"
  },
  {
    "area_id": 2,
    "producto_id": 472,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.603Z"
  },
  {
    "area_id": 3,
    "producto_id": 472,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.609Z"
  },
  {
    "area_id": 2,
    "producto_id": 473,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.619Z"
  },
  {
    "area_id": 3,
    "producto_id": 473,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.625Z"
  },
  {
    "area_id": 2,
    "producto_id": 474,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.637Z"
  },
  {
    "area_id": 3,
    "producto_id": 474,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.644Z"
  },
  {
    "area_id": 2,
    "producto_id": 475,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.653Z"
  },
  {
    "area_id": 3,
    "producto_id": 475,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.663Z"
  },
  {
    "area_id": 2,
    "producto_id": 476,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.672Z"
  },
  {
    "area_id": 3,
    "producto_id": 476,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.690Z"
  },
  {
    "area_id": 2,
    "producto_id": 477,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.702Z"
  },
  {
    "area_id": 3,
    "producto_id": 477,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.707Z"
  },
  {
    "area_id": 2,
    "producto_id": 478,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.721Z"
  },
  {
    "area_id": 3,
    "producto_id": 478,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.733Z"
  },
  {
    "area_id": 2,
    "producto_id": 479,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.739Z"
  },
  {
    "area_id": 3,
    "producto_id": 479,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.750Z"
  },
  {
    "area_id": 2,
    "producto_id": 480,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.755Z"
  },
  {
    "area_id": 3,
    "producto_id": 480,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.767Z"
  },
  {
    "area_id": 2,
    "producto_id": 481,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.773Z"
  },
  {
    "area_id": 3,
    "producto_id": 481,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.784Z"
  },
  {
    "area_id": 2,
    "producto_id": 482,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.790Z"
  },
  {
    "area_id": 3,
    "producto_id": 482,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.801Z"
  },
  {
    "area_id": 2,
    "producto_id": 483,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.806Z"
  },
  {
    "area_id": 3,
    "producto_id": 483,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:55.940Z"
  },
  {
    "area_id": 2,
    "producto_id": 484,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:56.175Z"
  },
  {
    "area_id": 3,
    "producto_id": 484,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:56.285Z"
  },
  {
    "area_id": 2,
    "producto_id": 485,
    "stock": "9997020",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T00:15:34.253Z"
  },
  {
    "area_id": 3,
    "producto_id": 485,
    "stock": "999828",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:56.455Z"
  },
  {
    "area_id": 2,
    "producto_id": 486,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:56.469Z"
  },
  {
    "area_id": 3,
    "producto_id": 486,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:56.839Z"
  },
  {
    "area_id": 2,
    "producto_id": 487,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:57.235Z"
  },
  {
    "area_id": 3,
    "producto_id": 487,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:57.716Z"
  },
  {
    "area_id": 2,
    "producto_id": 488,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:57.769Z"
  },
  {
    "area_id": 3,
    "producto_id": 488,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:57.933Z"
  },
  {
    "area_id": 2,
    "producto_id": 489,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:58.015Z"
  },
  {
    "area_id": 3,
    "producto_id": 489,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:58.355Z"
  },
  {
    "area_id": 2,
    "producto_id": 490,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:58.540Z"
  },
  {
    "area_id": 3,
    "producto_id": 490,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:58.623Z"
  },
  {
    "area_id": 1,
    "producto_id": 491,
    "stock": "42",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T20:10:41.542Z"
  },
  {
    "area_id": 2,
    "producto_id": 491,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:58.973Z"
  },
  {
    "area_id": 3,
    "producto_id": 491,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:58.986Z"
  },
  {
    "area_id": 2,
    "producto_id": 492,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:58.991Z"
  },
  {
    "area_id": 3,
    "producto_id": 492,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.002Z"
  },
  {
    "area_id": 1,
    "producto_id": 470,
    "stock": "91",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T02:48:50.003Z"
  },
  {
    "area_id": 1,
    "producto_id": 471,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.017Z"
  },
  {
    "area_id": 1,
    "producto_id": 472,
    "stock": "94",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T19:02:04.811Z"
  },
  {
    "area_id": 1,
    "producto_id": 473,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.039Z"
  },
  {
    "area_id": 1,
    "producto_id": 474,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.050Z"
  },
  {
    "area_id": 1,
    "producto_id": 476,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.055Z"
  },
  {
    "area_id": 1,
    "producto_id": 477,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.061Z"
  },
  {
    "area_id": 1,
    "producto_id": 478,
    "stock": "98",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.073Z"
  },
  {
    "area_id": 1,
    "producto_id": 479,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.084Z"
  },
  {
    "area_id": 1,
    "producto_id": 480,
    "stock": "97",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T19:07:56.578Z"
  },
  {
    "area_id": 1,
    "producto_id": 481,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.103Z"
  },
  {
    "area_id": 1,
    "producto_id": 482,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.125Z"
  },
  {
    "area_id": 1,
    "producto_id": 483,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.150Z"
  },
  {
    "area_id": 1,
    "producto_id": 484,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.156Z"
  },
  {
    "area_id": 1,
    "producto_id": 486,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.170Z"
  },
  {
    "area_id": 1,
    "producto_id": 487,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.219Z"
  },
  {
    "area_id": 1,
    "producto_id": 488,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.257Z"
  },
  {
    "area_id": 1,
    "producto_id": 489,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.267Z"
  },
  {
    "area_id": 1,
    "producto_id": 490,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.273Z"
  },
  {
    "area_id": 1,
    "producto_id": 492,
    "stock": "66",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T00:24:44.286Z"
  },
  {
    "area_id": 1,
    "producto_id": 485,
    "stock": "999999999982276",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T22:25:46.848Z"
  },
  {
    "area_id": 1,
    "producto_id": 493,
    "stock": "93",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T16:51:25.681Z"
  },
  {
    "area_id": 2,
    "producto_id": 493,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.418Z"
  },
  {
    "area_id": 3,
    "producto_id": 493,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.591Z"
  },
  {
    "area_id": 2,
    "producto_id": 494,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.656Z"
  },
  {
    "area_id": 3,
    "producto_id": 494,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.754Z"
  },
  {
    "area_id": 2,
    "producto_id": 495,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:38:59.908Z"
  },
  {
    "area_id": 3,
    "producto_id": 495,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:00.105Z"
  },
  {
    "area_id": 2,
    "producto_id": 496,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:00.308Z"
  },
  {
    "area_id": 3,
    "producto_id": 496,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:00.356Z"
  },
  {
    "area_id": 2,
    "producto_id": 497,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:00.442Z"
  },
  {
    "area_id": 3,
    "producto_id": 497,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:00.473Z"
  },
  {
    "area_id": 2,
    "producto_id": 498,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:00.550Z"
  },
  {
    "area_id": 3,
    "producto_id": 498,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:00.581Z"
  },
  {
    "area_id": 2,
    "producto_id": 499,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:00.692Z"
  },
  {
    "area_id": 3,
    "producto_id": 499,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:00.854Z"
  },
  {
    "area_id": 2,
    "producto_id": 500,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:00.938Z"
  },
  {
    "area_id": 3,
    "producto_id": 500,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.147Z"
  },
  {
    "area_id": 2,
    "producto_id": 501,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.171Z"
  },
  {
    "area_id": 3,
    "producto_id": 501,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.179Z"
  },
  {
    "area_id": 2,
    "producto_id": 502,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.192Z"
  },
  {
    "area_id": 3,
    "producto_id": 502,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.204Z"
  },
  {
    "area_id": 2,
    "producto_id": 503,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.214Z"
  },
  {
    "area_id": 3,
    "producto_id": 503,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.222Z"
  },
  {
    "area_id": 2,
    "producto_id": 504,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.235Z"
  },
  {
    "area_id": 3,
    "producto_id": 504,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.240Z"
  },
  {
    "area_id": 2,
    "producto_id": 505,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.254Z"
  },
  {
    "area_id": 3,
    "producto_id": 505,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.259Z"
  },
  {
    "area_id": 2,
    "producto_id": 506,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.472Z"
  },
  {
    "area_id": 3,
    "producto_id": 506,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.503Z"
  },
  {
    "area_id": 2,
    "producto_id": 507,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.508Z"
  },
  {
    "area_id": 3,
    "producto_id": 507,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.519Z"
  },
  {
    "area_id": 2,
    "producto_id": 508,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.524Z"
  },
  {
    "area_id": 3,
    "producto_id": 508,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.534Z"
  },
  {
    "area_id": 2,
    "producto_id": 509,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.573Z"
  },
  {
    "area_id": 3,
    "producto_id": 509,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.591Z"
  },
  {
    "area_id": 2,
    "producto_id": 510,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.605Z"
  },
  {
    "area_id": 3,
    "producto_id": 510,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.612Z"
  },
  {
    "area_id": 2,
    "producto_id": 511,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.621Z"
  },
  {
    "area_id": 3,
    "producto_id": 511,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.625Z"
  },
  {
    "area_id": 2,
    "producto_id": 512,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.637Z"
  },
  {
    "area_id": 3,
    "producto_id": 512,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.641Z"
  },
  {
    "area_id": 2,
    "producto_id": 513,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.653Z"
  },
  {
    "area_id": 3,
    "producto_id": 513,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.658Z"
  },
  {
    "area_id": 2,
    "producto_id": 514,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:01.758Z"
  },
  {
    "area_id": 3,
    "producto_id": 514,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:02.063Z"
  },
  {
    "area_id": 2,
    "producto_id": 515,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:02.234Z"
  },
  {
    "area_id": 3,
    "producto_id": 515,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:02.336Z"
  },
  {
    "area_id": 2,
    "producto_id": 516,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:02.420Z"
  },
  {
    "area_id": 3,
    "producto_id": 516,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:02.732Z"
  },
  {
    "area_id": 2,
    "producto_id": 517,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:02.856Z"
  },
  {
    "area_id": 3,
    "producto_id": 517,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.121Z"
  },
  {
    "area_id": 2,
    "producto_id": 518,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.137Z"
  },
  {
    "area_id": 3,
    "producto_id": 518,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.152Z"
  },
  {
    "area_id": 2,
    "producto_id": 519,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.165Z"
  },
  {
    "area_id": 3,
    "producto_id": 519,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.173Z"
  },
  {
    "area_id": 2,
    "producto_id": 520,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.184Z"
  },
  {
    "area_id": 3,
    "producto_id": 520,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.190Z"
  },
  {
    "area_id": 2,
    "producto_id": 521,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.199Z"
  },
  {
    "area_id": 3,
    "producto_id": 521,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.205Z"
  },
  {
    "area_id": 2,
    "producto_id": 522,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.216Z"
  },
  {
    "area_id": 3,
    "producto_id": 522,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.222Z"
  },
  {
    "area_id": 2,
    "producto_id": 523,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.232Z"
  },
  {
    "area_id": 3,
    "producto_id": 523,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.238Z"
  },
  {
    "area_id": 2,
    "producto_id": 524,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.247Z"
  },
  {
    "area_id": 3,
    "producto_id": 524,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.252Z"
  },
  {
    "area_id": 1,
    "producto_id": 495,
    "stock": "83",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T00:11:38.447Z"
  },
  {
    "area_id": 1,
    "producto_id": 496,
    "stock": "66",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T00:24:44.355Z"
  },
  {
    "area_id": 1,
    "producto_id": 512,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.282Z"
  },
  {
    "area_id": 1,
    "producto_id": 513,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.287Z"
  },
  {
    "area_id": 1,
    "producto_id": 514,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.305Z"
  },
  {
    "area_id": 1,
    "producto_id": 516,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.314Z"
  },
  {
    "area_id": 1,
    "producto_id": 517,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.319Z"
  },
  {
    "area_id": 1,
    "producto_id": 518,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.325Z"
  },
  {
    "area_id": 1,
    "producto_id": 519,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.386Z"
  },
  {
    "area_id": 1,
    "producto_id": 520,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.642Z"
  },
  {
    "area_id": 1,
    "producto_id": 521,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.722Z"
  },
  {
    "area_id": 1,
    "producto_id": 522,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.808Z"
  },
  {
    "area_id": 1,
    "producto_id": 523,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.839Z"
  },
  {
    "area_id": 1,
    "producto_id": 524,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.851Z"
  },
  {
    "area_id": 1,
    "producto_id": 525,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:03.859Z"
  },
  {
    "area_id": 1,
    "producto_id": 497,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:04.105Z"
  },
  {
    "area_id": 1,
    "producto_id": 498,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:04.268Z"
  },
  {
    "area_id": 1,
    "producto_id": 499,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:04.316Z"
  },
  {
    "area_id": 1,
    "producto_id": 500,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:04.332Z"
  },
  {
    "area_id": 1,
    "producto_id": 501,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:04.505Z"
  },
  {
    "area_id": 1,
    "producto_id": 502,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:04.575Z"
  },
  {
    "area_id": 1,
    "producto_id": 503,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:04.639Z"
  },
  {
    "area_id": 1,
    "producto_id": 504,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:04.722Z"
  },
  {
    "area_id": 1,
    "producto_id": 505,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:04.782Z"
  },
  {
    "area_id": 1,
    "producto_id": 506,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:04.837Z"
  },
  {
    "area_id": 1,
    "producto_id": 508,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:04.904Z"
  },
  {
    "area_id": 1,
    "producto_id": 509,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:04.990Z"
  },
  {
    "area_id": 1,
    "producto_id": 510,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.135Z"
  },
  {
    "area_id": 1,
    "producto_id": 511,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.147Z"
  },
  {
    "area_id": 2,
    "producto_id": 525,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.157Z"
  },
  {
    "area_id": 3,
    "producto_id": 525,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.168Z"
  },
  {
    "area_id": 2,
    "producto_id": 526,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.224Z"
  },
  {
    "area_id": 3,
    "producto_id": 526,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.236Z"
  },
  {
    "area_id": 2,
    "producto_id": 527,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.382Z"
  },
  {
    "area_id": 3,
    "producto_id": 527,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.548Z"
  },
  {
    "area_id": 2,
    "producto_id": 528,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.649Z"
  },
  {
    "area_id": 3,
    "producto_id": 528,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.656Z"
  },
  {
    "area_id": 2,
    "producto_id": 529,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.718Z"
  },
  {
    "area_id": 3,
    "producto_id": 529,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.818Z"
  },
  {
    "area_id": 2,
    "producto_id": 530,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.832Z"
  },
  {
    "area_id": 3,
    "producto_id": 530,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.837Z"
  },
  {
    "area_id": 3,
    "producto_id": 423,
    "stock": "0",
    "stock_minimo": "5",
    "stock_maximo": "50",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.903Z"
  },
  {
    "area_id": 2,
    "producto_id": 423,
    "stock": "0",
    "stock_minimo": "5",
    "stock_maximo": "50",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.915Z"
  },
  {
    "area_id": 1,
    "producto_id": 423,
    "stock": "0",
    "stock_minimo": "5",
    "stock_maximo": "50",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.921Z"
  },
  {
    "area_id": 3,
    "producto_id": 402,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.950Z"
  },
  {
    "area_id": 1,
    "producto_id": 432,
    "stock": "73",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T23:50:44.218Z"
  },
  {
    "area_id": 1,
    "producto_id": 441,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.982Z"
  },
  {
    "area_id": 1,
    "producto_id": 469,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.988Z"
  },
  {
    "area_id": 1,
    "producto_id": 475,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:05.999Z"
  },
  {
    "area_id": 1,
    "producto_id": 494,
    "stock": "62",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T17:23:25.113Z"
  },
  {
    "area_id": 1,
    "producto_id": 515,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T22:47:55.687Z"
  },
  {
    "area_id": 1,
    "producto_id": 526,
    "stock": "97",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T20:27:31.189Z"
  },
  {
    "area_id": 1,
    "producto_id": 527,
    "stock": "80",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T23:15:42.312Z"
  },
  {
    "area_id": 1,
    "producto_id": 528,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:06.141Z"
  },
  {
    "area_id": 1,
    "producto_id": 529,
    "stock": "98",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T21:05:51.778Z"
  },
  {
    "area_id": 1,
    "producto_id": 530,
    "stock": "90",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T21:48:37.181Z"
  },
  {
    "area_id": 1,
    "producto_id": 507,
    "stock": "91",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-11T23:59:51.180Z"
  },
  {
    "area_id": 3,
    "producto_id": 545,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": null,
    "updated_at": "2026-07-03T21:00:19.350Z"
  },
  {
    "area_id": 1,
    "producto_id": 545,
    "stock": "86.71",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": null,
    "updated_at": "2026-07-12T00:02:25.406Z"
  },
  {
    "area_id": 1,
    "producto_id": 396,
    "stock": "0",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-10T16:39:06.189Z"
  },
  {
    "area_id": 2,
    "producto_id": 545,
    "stock": "98.34",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": null,
    "updated_at": "2026-07-12T00:04:17.225Z"
  },
  {
    "area_id": 1,
    "producto_id": 399,
    "stock": "69",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T02:21:43.955Z"
  },
  {
    "area_id": 1,
    "producto_id": 400,
    "stock": "78",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": "Almacén general área",
    "updated_at": "2026-07-12T02:21:43.781Z"
  },
  {
    "area_id": 1,
    "producto_id": 547,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": null,
    "updated_at": "2026-07-03T21:00:16.489Z"
  },
  {
    "area_id": 2,
    "producto_id": 547,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": null,
    "updated_at": "2026-07-03T21:00:18.117Z"
  },
  {
    "area_id": 3,
    "producto_id": 547,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "1000",
    "ubicacion_estante": null,
    "updated_at": "2026-07-03T21:00:19.364Z"
  },
  {
    "area_id": 1,
    "producto_id": 546,
    "stock": "100",
    "stock_minimo": "0",
    "stock_maximo": "1000",
    "ubicacion_estante": null,
    "updated_at": "2026-07-03T21:00:16.475Z"
  },
  {
    "area_id": 2,
    "producto_id": 546,
    "stock": "100",
    "stock_minimo": "0",
    "stock_maximo": "1000",
    "ubicacion_estante": null,
    "updated_at": "2026-07-03T21:00:18.104Z"
  },
  {
    "area_id": 3,
    "producto_id": 546,
    "stock": "100",
    "stock_minimo": "0",
    "stock_maximo": "1000",
    "ubicacion_estante": null,
    "updated_at": "2026-07-03T21:00:19.356Z"
  },
  {
    "area_id": 1,
    "producto_id": 548,
    "stock": "93",
    "stock_minimo": "5",
    "stock_maximo": "999",
    "ubicacion_estante": null,
    "updated_at": "2026-07-11T21:58:39.141Z"
  },
  {
    "area_id": 2,
    "producto_id": 548,
    "stock": "99",
    "stock_minimo": "5",
    "stock_maximo": "999",
    "ubicacion_estante": null,
    "updated_at": "2026-07-11T18:50:51.995Z"
  },
  {
    "area_id": 3,
    "producto_id": 548,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "999",
    "ubicacion_estante": null,
    "updated_at": "2026-07-08T21:31:04.633Z"
  },
  {
    "area_id": 1,
    "producto_id": 549,
    "stock": "95",
    "stock_minimo": "5",
    "stock_maximo": "999",
    "ubicacion_estante": null,
    "updated_at": "2026-07-11T22:43:09.977Z"
  },
  {
    "area_id": 2,
    "producto_id": 549,
    "stock": "100",
    "stock_minimo": "5",
    "stock_maximo": "999",
    "ubicacion_estante": null,
    "updated_at": "2026-07-11T20:18:20.020Z"
  },
  {
    "area_id": 3,
    "producto_id": 549,
    "stock": "0",
    "stock_minimo": "5",
    "stock_maximo": "999",
    "ubicacion_estante": null,
    "updated_at": "2026-07-11T20:18:20.022Z"
  }
]
  });

  // 9. Insumos
  console.log('Insertando insumos...');
  await prisma.insumo.createMany({
    data: []
  });

  // 10. Recetas
  console.log('Insertando recetas...');
  await prisma.recetaIngrediente.createMany({
    data: []
  });

  // Activar llaves foráneas nuevamente
  console.log('Activando llaves foráneas de nuevo...');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');

  console.log('Seed ejecutado con éxito. Se importaron todos los catálogos y stock locales.');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
