# Spotify setup para B-Side

Esta guia deja el catalogo de Spotify listo para la lupa sin exponer secretos en el frontend.

## Resumen corto

1. Crear la app en Spotify for Developers.
2. Copiar `Client ID` y `Client Secret`.
3. Guardar esos valores como secrets en Supabase.
4. Deployar la Edge Function `spotify-search`.
5. Agregar `EXPO_PUBLIC_SPOTIFY_PROXY_URL` en `.env`.
6. Correr `npm run spotify:check`.
7. Reiniciar Expo.

## 1. Crear la app en Spotify

En `Create app` completa asi:

- `App name`: `B-Side`
- `App description`:
  `B-Side es una red social musical y plataforma de descubrimiento para verdaderos amantes de la musica. Permite resenar discos, seguir perfiles y descubrir albums desde una comunidad real.`
- `Website`: dejalo vacio si Spotify te deja. Si te obliga, usa una URL real que controles.
- `Redirect URI de desarrollo`: `http://127.0.0.1:19006/spotify/callback`

Marca solo:

- `Web API`

No hace falta por ahora:

- `Web Playback SDK`
- `Android`
- `iOS`
- `Ads API`

## 2. Copiar credenciales de Spotify

Despues de crear la app, guardate:

- `Client ID`
- `Client Secret`

No pongas esos datos en `.env` del frontend.

## 3. Cargar los secrets en Supabase

Desde la carpeta del proyecto:

```powershell
cd C:\Users\Administrator\Desktop\b-side
npx supabase login
```

Después linkeá el proyecto:

```powershell
npx supabase link --project-ref ziflidzcoqqsrjxiitpo
```

Y cargá los secrets:

```powershell
npx supabase secrets set SPOTIFY_CLIENT_ID="TU_CLIENT_ID"
npx supabase secrets set SPOTIFY_CLIENT_SECRET="TU_CLIENT_SECRET"
```

## 4. Deployar la function

La function ya existe en este repo:

- `supabase/functions/spotify-search/index.ts`

Deploy:

```powershell
cd C:\Users\Administrator\Desktop\b-side
npx supabase functions deploy spotify-search --project-ref ziflidzcoqqsrjxiitpo
```

Si todo sale bien, la URL esperada queda asi:

```text
https://ziflidzcoqqsrjxiitpo.supabase.co/functions/v1/spotify-search
```

## 5. Agregar la URL al frontend

En tu `.env` tiene que quedar esto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://ziflidzcoqqsrjxiitpo.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
EXPO_PUBLIC_SPOTIFY_PROXY_URL=https://ziflidzcoqqsrjxiitpo.supabase.co/functions/v1/spotify-search
```

Si queres, podes copiar la plantilla desde:

- `.env.example`

## 6. Verificar que quedo bien

Tenes un chequeo nuevo:

```powershell
cd C:\Users\Administrator\Desktop\b-side
npm run spotify:check
```

Lo ideal es que te diga:

- `.env: encontrado`
- `Spotify proxy URL: ok`
- `Function spotify-search: ok`

Tambien podes revisar Supabase:

- `Edge Functions` > `spotify-search`
- `Project Settings` > `Functions` o logs de function

## 7. Reiniciar la app

```powershell
cd C:\Users\Administrator\Desktop\b-side
npm run web:19006
```

Si ves una version vieja:

- hace `Ctrl + F5`

## 8. Como saber si ya esta usando Spotify

Dentro de la app:

- en `Buscar`, arriba del input aparece una tarjeta de `Catalogo activo`
- si dice `Spotify`, ya esta entrando por el proxy
- si dice `iTunes`, sigue usando fallback

Desde terminal:

```powershell
npm run spotify:check
```

## Problemas comunes

### La function da `404`

Todavia no se deployo o se deployo en otro proyecto.

### La app sigue mostrando `iTunes`

Puede ser una de estas:

- falta `EXPO_PUBLIC_SPOTIFY_PROXY_URL`
- Expo no se reinicio
- la function falla y la app cae a fallback

### `spotify:check` devuelve error

Revisar:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- deploy de la function
- `.env` local

## Despues de esto

Cuando el catalogo quede estable, lo siguiente con mas valor es:

1. `Exportar a Spotify` para listas creadas en B-Side
2. login opcional con Spotify usando PKCE
3. importar favoritos o artistas seguidos
4. deep links mas prolijos hacia Spotify
