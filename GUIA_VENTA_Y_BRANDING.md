# 💼 Guía Comercial y de Personalización (White-Labeling) - POS System

¡Felicidades! Este sistema tipo plantilla está diseñado para que puedas personalizarlo en minutos y vendérselo a diferentes clientes (restaurantes, bares, clubes, tiendas de autoservicio, snacks, etc.).

---

## 🌐 1. Activar tu Demo En Vivo en GitHub Pages

Para que tus clientes potenciales puedan probar la interfaz desde cualquier celular, tablet o computadora sin instalar nada:

1. El archivo `.github/workflows/deploy.yml` ya está subido a tu repositorio en GitHub. Cada vez que hagas un `git push`, GitHub construirá la demo automáticamente en la rama `gh-pages`.
2. En GitHub, entra a tu repositorio: `https://github.com/SilverMast1/plantillas`.
3. Ve a la pestaña **Settings** -> **Pages** (en el menú lateral izquierdo).
4. En **Build and deployment** -> **Source**, selecciona `Deploy from a branch`.
5. En **Branch**, selecciona `gh-pages` y guarda los cambios.
6. ¡Listo! Tu demo estará en vivo en unos minutos en:
   👉 **`https://SilverMast1.github.io/plantillas/`**

---

## 🎨 2. Personalizar para un Nuevo Cliente (Logo, Nombre y Colores)

### Opción A: Usando el Asistente de Terminal (Recomendado)
Ejecuta en la terminal de la plantilla:
```bash
npm run configure
```
El asistente te preguntará:
1. Motor de Base de datos (SQLite / PostgreSQL).
2. Botones y módulos a habilitar.
3. Nombre de la Empresa, Nombre del Sistema y Eslogan.

### Opción B: Colocar un Logo en Imagen
1. Guarda la imagen del logo del cliente en la carpeta `frontend/public/logo.png`.
2. Edita el archivo `frontend/src/config/branding.json`:
   ```json
   {
     "appName": "Mi Sistema POS",
     "companyName": "Restaurante El Sol",
     "tagline": "Alimentos y Bebidas",
     "logoUrl": "./logo.png",
     "theme": {
       "primaryColor": "#1c663c",
       "accentColor": "#c5a059"
     }
   }
   ```

---

## 🚀 3. Propuesta de Valor para Vender este Sistema

Puedes ofrecer este sistema en 2 modalidades:

### 1. Instalación Local / Offline (Servidor Local)
- **Ideal para**: Restaurantes, snacks, bares que quieren controlar todo en su red local sin pagar mensualidad.
- **Base de datos**: SQLite (se guarda todo en un archivo local sin instalar servidores de base de datos) o PostgreSQL.
- **Entregable**: Ejecutable `.bat` en el escritorio del cliente.

### 2. Sistema Cloud (Nube)
- **Ideal para**: Negocios con múltiples sucursales.
- **Hosting recomendados**: Render / Railway / Vercel / VPS en Hetzner o DigitalOcean.
- **Base de datos**: PostgreSQL en la nube (Supabase, Neon.tech o Render).

---

## 📦 4. Módulos que puedes encender o apagar según el cliente

Mediante `frontend/src/config/features.json` puedes personalizar qué módulos venderles:
- **Ventas (POS)**: Punto de venta rápido con escáner QR / código de barras.
- **Cargos a Socios / Clientes**: Cuentas abiertas y créditos a clientes.
- **Dividir Cuentas (Cadi)**: Cuentas compartidas entre varios comensales.
- **Ventas de Turno**: Corte de caja y control de fondo por cajero.
- **Inventario y Stock**: Control de insumos y recetas por producto.
