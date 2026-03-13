const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const envPath = path.join(rootDir, '.env');

const parseEnvFile = (filePath) => {
  const env = {};

  if (!fs.existsSync(filePath)) {
    return env;
  }

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    env[key] = value;
  }

  return env;
};

const isPlaceholder = (value = '') =>
  !value ||
  value.includes('tu-proyecto') ||
  value.includes('tu-anon-key') ||
  value.includes('example.supabase.co');

const printPendingChecklist = ({ missingEnv, missingCredentials, schemaReady }) => {
  console.log('\nTodavia falta completar:');

  if (missingEnv) {
    console.log('- Crear .env. Puedes hacerlo con: npm run env:init');
  }

  if (missingCredentials) {
    console.log('- Copiar URL y anon key desde Project Settings > API.');
  }

  if (!schemaReady) {
    console.log('- Correr supabase/schema.sql desde SQL Editor.');
  }

  console.log('- Crear buckets avatars y wallpapers.');
  console.log('- Agregar http://localhost:19006 en Authentication > URL Configuration.');
};

const checkSchema = async (url, anonKey) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(url, anonKey);
    const { error } = await client.from('profiles').select('id').limit(1);

    if (error) {
      return {
        ok: false,
        message: error.message,
        code: error.code || null,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'No pudimos verificar el schema.',
      code: null,
    };
  }
};

(async () => {
  const env = parseEnvFile(envPath);
  const url = env.EXPO_PUBLIC_SUPABASE_URL || '';
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  const hasUrl = !isPlaceholder(url);
  const hasAnonKey = !isPlaceholder(anonKey);

  console.log('Estado Supabase local');
  console.log(`- .env: ${fs.existsSync(envPath) ? 'encontrado' : 'faltante'}`);
  console.log(`- URL: ${hasUrl ? 'ok' : 'pendiente'}`);
  console.log(`- Anon key: ${hasAnonKey ? 'ok' : 'pendiente'}`);
  console.log(
    `- Host: ${
      hasUrl
        ? url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
        : 'pendiente'
    }`
  );

  if (!hasUrl || !hasAnonKey) {
    printPendingChecklist({
      missingEnv: !fs.existsSync(envPath),
      missingCredentials: true,
      schemaReady: false,
    });
    process.exit(0);
  }

  const schemaCheck = await checkSchema(url, anonKey);

  if (schemaCheck.ok) {
    console.log('- Schema base: ok');
    console.log('\nSupabase ya tiene credenciales reales y schema accesible.');
    process.exit(0);
  }

  console.log(`- Schema base: pendiente (${schemaCheck.code || 'sin codigo'})`);
  console.log(`- Detalle schema: ${schemaCheck.message}`);

  printPendingChecklist({
    missingEnv: false,
    missingCredentials: false,
    schemaReady: false,
  });
})();
