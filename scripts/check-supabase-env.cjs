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

const REQUIRED_BUCKETS = ['avatars', 'wallpapers'];
const REQUIRED_TABLES = ['profiles', 'listening_events', 'notifications'];

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
    const checks = await Promise.all(
      REQUIRED_TABLES.map(async (tableName) => {
        const { error } = await client
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        return {
          tableName,
          ok: !error,
          message: error?.message || '',
          code: error?.code || null,
        };
      })
    );
    const missingTables = checks
      .filter((check) => !check.ok)
      .map((check) => check.tableName);

    if (missingTables.length > 0) {
      return {
        ok: false,
        message: checks
          .filter((check) => !check.ok)
          .map(
            (check) =>
              `${check.tableName}: ${check.message || 'no accesible'}`
          )
          .join(' | '),
        code: checks.find((check) => !check.ok)?.code || null,
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

const checkStorageBuckets = async (url, anonKey) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(url, anonKey);
    const bucketChecks = await Promise.all(
      REQUIRED_BUCKETS.map(async (bucketName) => {
        const { error } = await client.storage.from(bucketName).list('', {
          limit: 1,
        });

        return {
          bucketName,
          ok: !error,
          message: error?.message || '',
        };
      })
    );
    const missingBuckets = bucketChecks
      .filter((bucket) => !bucket.ok)
      .map((bucket) => bucket.bucketName);

    return {
      ok: missingBuckets.length === 0,
      missingBuckets,
      message:
        missingBuckets.length > 0
          ? bucketChecks
              .filter((bucket) => !bucket.ok)
              .map(
                (bucket) =>
                  `${bucket.bucketName}: ${bucket.message || 'no accesible'}`
              )
              .join(' | ')
          : '',
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error?.message || 'No pudimos verificar los buckets de Storage.',
      missingBuckets: REQUIRED_BUCKETS,
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
    return;
  }

  const schemaCheck = await checkSchema(url, anonKey);

  if (schemaCheck.ok) {
    const storageCheck = await checkStorageBuckets(url, anonKey);

    console.log('- Schema base: ok');

    if (storageCheck.ok) {
      console.log('- Storage buckets: ok');
    } else {
      console.log(
        `- Storage buckets: pendiente (${storageCheck.missingBuckets.join(', ')})`
      );
    }

    console.log('\nSupabase ya tiene credenciales reales y schema accesible.');

    if (!storageCheck.ok) {
      console.log(`Detalle storage: ${storageCheck.message}`);
    }

    return;
  }

  console.log(`- Schema base: pendiente (${schemaCheck.code || 'sin codigo'})`);
  console.log(`- Detalle schema: ${schemaCheck.message}`);

  printPendingChecklist({
    missingEnv: false,
    missingCredentials: false,
    schemaReady: false,
  });
})();
