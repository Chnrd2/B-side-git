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
  value.includes('TU-PROYECTO') ||
  value.includes('tu-proyecto') ||
  value.includes('example') ||
  value.endsWith('/functions/v1/spotify-search') === false && value.includes('functions/v1');

const buildExpectedProxyUrl = (supabaseUrl = '') => {
  if (!supabaseUrl) {
    return '';
  }

  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/spotify-search`;
};

const printChecklist = ({
  hasEnv,
  hasProxy,
  expectedProxyUrl,
  functionReachable,
  hasClientId,
  redirectUri,
}) => {
  console.log('\nTodavia falta completar:');

  if (!hasEnv) {
    console.log('- Crear .env a partir de .env.example.');
  }

  if (!hasProxy) {
    console.log(
      `- Agregar EXPO_PUBLIC_SPOTIFY_PROXY_URL=${expectedProxyUrl || 'https://TU-PROYECTO.supabase.co/functions/v1/spotify-search'}`
    );
  }

  if (!hasClientId) {
    console.log('- Agregar EXPO_PUBLIC_SPOTIFY_CLIENT_ID para login/export real.');
  }

  if (redirectUri) {
    console.log(`- Confirmar Redirect URI de Spotify: ${redirectUri}`);
  }

  console.log('- Cargar SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET como secrets en Supabase.');
  console.log('- Deployar la function spotify-search.');

  if (!functionReachable) {
    console.log('- Verificar que la function responda en /functions/v1/spotify-search.');
  }
};

const checkFunction = async (url, anonKey) => {
  if (!url) {
    return {
      ok: false,
      status: 'sin-url',
      detail: 'No hay EXPO_PUBLIC_SPOTIFY_PROXY_URL configurada.',
    };
  }

  try {
    const response = await fetch(
      `${url}${url.includes('?') ? '&' : '?'}q=kendrick&limit=1`,
      {
        headers: anonKey
          ? {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
            }
          : {},
      }
    );

    if (response.ok) {
      const payload = await response.json();
      return {
        ok: true,
        status: response.status,
        detail: `Function accesible. Items devueltos: ${
          Array.isArray(payload?.items) ? payload.items.length : 0
        }`,
      };
    }

    const body = await response.text();
    return {
      ok: false,
      status: response.status,
      detail: body || `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 'network-error',
      detail: error?.message || 'No pudimos consultar la function.',
    };
  }
};

(async () => {
  const env = parseEnvFile(envPath);
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL || '';
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  const proxyUrl = env.EXPO_PUBLIC_SPOTIFY_PROXY_URL || '';
  const clientId = env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '';
  const redirectUri = env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI || '';
  const expectedProxyUrl = buildExpectedProxyUrl(supabaseUrl);
  const hasEnv = fs.existsSync(envPath);
  const hasProxy = proxyUrl && !isPlaceholder(proxyUrl);
  const hasClientId = Boolean(clientId);

  console.log('Estado Spotify local');
  console.log(`- .env: ${hasEnv ? 'encontrado' : 'faltante'}`);
  console.log(`- Supabase URL: ${supabaseUrl ? 'ok' : 'pendiente'}`);
  console.log(`- Supabase anon key: ${anonKey ? 'ok' : 'pendiente'}`);
  console.log(`- Spotify proxy URL: ${hasProxy ? 'ok' : 'pendiente'}`);
  console.log(`- Spotify client id: ${hasClientId ? 'ok' : 'pendiente'}`);
  console.log(`- Spotify redirect URI: ${redirectUri ? 'ok' : 'pendiente'}`);

  if (expectedProxyUrl) {
    console.log(`- Proxy esperado: ${expectedProxyUrl}`);
  }

  if (!hasProxy) {
    printChecklist({
      hasEnv,
      hasProxy,
      expectedProxyUrl,
      functionReachable: false,
      hasClientId,
      redirectUri,
    });
    return;
  }

  const functionCheck = await checkFunction(proxyUrl, anonKey);

  console.log(
    `- Function spotify-search: ${
      functionCheck.ok ? 'ok' : `pendiente (${functionCheck.status})`
    }`
  );
  console.log(`- Detalle function: ${functionCheck.detail}`);

  if (!functionCheck.ok) {
    printChecklist({
      hasEnv,
      hasProxy,
      expectedProxyUrl,
      functionReachable: false,
      hasClientId,
      redirectUri,
    });
    return;
  }

  console.log('\nSpotify ya esta listo para usarse desde la app.');
})();
