const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('\n=========================================');
  console.log('    Asistente de Configuración (Template)  ');
  console.log('=========================================\n');

  // 1. Selección de Base de Datos
  console.log('1. Seleccione el motor de base de datos:');
  console.log('   [1] SQLite (Predeterminado - local, sin dependencias)');
  console.log('   [2] PostgreSQL (Recomendado para producción)');
  const dbChoice = await askQuestion('Elija una opción [1-2]: ');
  
  let dbProvider = 'sqlite';
  let dbUrl = 'file:./dev.db';
  if (dbChoice.trim() === '2') {
    dbProvider = 'postgresql';
    const pgUrl = await askQuestion('Ingrese el DATABASE_URL de PostgreSQL [ej: postgresql://user:pass@localhost:5432/db]: ');
    dbUrl = pgUrl.trim() || 'postgresql://postgres:postgres@localhost:5432/campestre';
  }

  // 2. Selección de Módulos / Características
  console.log('\n2. Habilitar Módulos en la Interfaz:');
  
  const features = {
    pos: { enabled: true, label: "Ventas" },
    cargos: { enabled: true, label: "Cargos a Socios" },
    dividirCadi: { enabled: true, label: "Dividir Cuentas (Cadi)" },
    ventasTurno: { enabled: true, label: "Ventas de Turno" },
    admin: { enabled: true, label: "Gestión Administrativa" },
    stock: { enabled: true, label: "Inventario y Stock" },
    insumos: { enabled: true, label: "Insumos de Comida" }
  };

  const checkFeature = async (key, name) => {
    const ans = await askQuestion(`¿Desea habilitar "${name}"? [S/n]: `);
    features[key].enabled = ans.trim().toLowerCase() !== 'n';
  };

  await checkFeature('pos', 'Ventas');
  await checkFeature('cargos', 'Cargos a Socios');
  await checkFeature('dividirCadi', 'Dividir Cuentas (Cadi)');
  await checkFeature('ventasTurno', 'Ventas de Turno');
  await checkFeature('admin', 'Gestión Administrativa / Corte de Caja');
  await checkFeature('stock', 'Inventario y Stock');
  await checkFeature('insumos', 'Insumos de Comida');

  // Guardar configuración de características
  const configPath = path.join(__dirname, '..', 'frontend', 'src', 'config', 'features.json');
  fs.writeFileSync(configPath, JSON.stringify(features, null, 2), 'utf-8');
  console.log(`\n✔ Configuración de UI guardada en: ${configPath}`);

  // 3. Personalización de Marca (Branding)
  console.log('\n3. Personalización de Marca (Branding):');
  const companyName = await askQuestion('Nombre de la Empresa/Negocio [default: MI NEGOCIO]: ');
  const appName = await askQuestion('Nombre del Sistema [default: POS SYSTEM]: ');
  const tagline = await askQuestion('Eslogan / Subtítulo [default: Sistema de Punto de Venta]: ');

  const branding = {
    appName: appName.trim() || 'POS SYSTEM',
    companyName: companyName.trim() || 'MI NEGOCIO',
    tagline: tagline.trim() || 'Sistema de Punto de Venta',
    logoUrl: '',
    theme: {
      primaryColor: '#1c663c',
      accentColor: '#c5a059'
    }
  };

  const brandingPath = path.join(__dirname, '..', 'frontend', 'src', 'config', 'branding.json');
  fs.writeFileSync(brandingPath, JSON.stringify(branding, null, 2), 'utf-8');
  console.log(`✔ Marca de la empresa guardada en: ${brandingPath}`);

  // Configurar base de datos en Prisma
  const schemaDest = path.join(__dirname, '..', 'backend', 'prisma', 'schema.prisma');
  const schemaHeaderSrc = path.join(__dirname, '..', 'backend', 'prisma', `schema.${dbProvider}.prisma`);
  
  if (fs.existsSync(schemaHeaderSrc)) {
    // Leer el header
    const header = fs.readFileSync(schemaHeaderSrc, 'utf-8');
    
    // Extraer los modelos del schema.prisma actual (a partir del primer model)
    const currentSchema = fs.readFileSync(schemaDest, 'utf-8');
    const firstModelIndex = currentSchema.indexOf('model ');
    
    if (firstModelIndex !== -1) {
      const models = currentSchema.substring(firstModelIndex);
      const newSchemaContent = header + '\n' + models;
      fs.writeFileSync(schemaDest, newSchemaContent, 'utf-8');
      console.log(`✔ Archivo backend/prisma/schema.prisma actualizado para usar ${dbProvider}.`);
    } else {
      console.log('⚠ No se pudieron encontrar los modelos en schema.prisma actual.');
    }
  }

  // Generar archivos .env
  const envContent = `DATABASE_URL="${dbUrl}"\nPORT=3000\nJWT_SECRET="mi_secreto_super_seguro_campestre"\n`;
  fs.writeFileSync(path.join(__dirname, '..', 'backend', '.env'), envContent, 'utf-8');
  fs.writeFileSync(path.join(__dirname, '..', '.env'), envContent, 'utf-8');
  console.log('✔ Archivos .env generados con la configuración de base de datos.');

  console.log('\n=========================================');
  console.log(' ¡Configuración Completada con Éxito!');
  console.log('=========================================');
  console.log('\nPróximos pasos:');
  console.log('1. Ejecutar: npm run install:all');
  console.log('2. Ejecutar: npx prisma db push (en la carpeta backend)');
  console.log('3. Ejecutar: npm run db:seed (en la carpeta backend si desea cargar datos iniciales)');
  console.log('4. Iniciar desarrollo: npm run dev\n');

  rl.close();
}

main().catch(console.error);
