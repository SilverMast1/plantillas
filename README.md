# 🌟 Template POS Campestre (Cadi System)

Este es un repositorio tipo plantilla (template) configurable del sistema POS Campestre. Permite seleccionar dinámicamente qué características de la interfaz están activas y configurar el motor de base de datos a utilizar (SQLite o PostgreSQL).

---

## 🛠️ Configuración Rápida

Para iniciar y personalizar tu POS, sigue estos pasos:

1. **Ejecutar el asistente de configuración**:
   ```bash
   npm run configure
   ```
   *Este comando te guiará de manera interactiva en la terminal para elegir tu base de datos y activar/desactivar módulos de la interfaz.*

2. **Instalar dependencias**:
   ```bash
   npm run install:all
   ```

3. **Aplicar migraciones de la base de datos**:
   ```bash
   # Ve al directorio del backend
   cd backend
   npx prisma db push
   ```

4. **Sembrar base de datos con datos de prueba (Opcional)**:
   ```bash
   # Dentro de la carpeta backend
   npm run seed
   ```

5. **Iniciar el entorno de desarrollo**:
   ```bash
   # Regresa a la raíz del proyecto y ejecuta:
   npm run dev
   ```

---

## ⚙️ Estructura del Monorepo

- `frontend/`: Aplicación de interfaz de usuario construida en React + Vite + Tailwind CSS.
  - La configuración de módulos activos se maneja en `frontend/src/config/features.json`.
- `backend/`: API Express + TypeScript + Prisma ORM.
  - Las variables de entorno para la base de datos se configuran en `backend/.env`.
- `scripts/`: Scripts de utilidad y el asistente de configuración interactivas.

---

## 🚀 Subir cambios a tu propio repositorio en GitHub

Si deseas inicializar este proyecto en un repositorio remoto limpio de GitHub:

```bash
git init
git add .
git commit -m "Initial commit of customized template"
git branch -M main
git remote add origin https://github.com/SilverMast1/plantillas.git
git push -u origin main
```
