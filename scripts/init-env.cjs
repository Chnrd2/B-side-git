const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const envPath = path.join(rootDir, '.env');
const examplePath = path.join(rootDir, '.env.example');

if (!fs.existsSync(examplePath)) {
  console.error('No encontramos .env.example para inicializar .env.');
  process.exit(1);
}

if (fs.existsSync(envPath)) {
  console.log('.env ya existe. No tocamos tus credenciales.');
  process.exit(0);
}

fs.copyFileSync(examplePath, envPath);
console.log('.env creado desde .env.example. Ahora reemplaza los valores pendientes.');
