# Spotify setup para B-Side

## Que completar en "Create app"

- App name: `B-Side`
- App description: `B-Side es una red social musical y plataforma de descubrimiento para verdaderos amantes de la musica. Permite reseñar discos, seguir perfiles y descubrir albums desde una comunidad real.`
- Website: dejalo vacio por ahora si no tenes una landing propia. Si Spotify te obliga a cargar algo mas adelante, usa una URL real que controles, por ejemplo una landing en Vercel o Carrd.
- Redirect URI de desarrollo: `http://127.0.0.1:19006/spotify/callback`

## Que casillas conviene marcar

- `Web API`: si
- `Web Playback SDK`: no, por ahora
- `Android`: no, por ahora
- `iOS`: no, por ahora
- `Ads API`: no

## Por que usamos 127.0.0.1 y no localhost

Spotify ya no acepta redirects HTTP comunes. Para desarrollo local deja usar loopback IPs, por eso conviene `127.0.0.1` y no `localhost`.

## Como conectarlo sin exponer secretos

La app no debe guardar `client secret` en el frontend. El flujo recomendado para esta base es:

1. Crear la app en Spotify for Developers.
2. Copiar `Client ID` y `Client Secret`.
3. Guardarlos como secrets en Supabase Edge Functions:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
4. Deployar la function `supabase/functions/spotify-search`.
5. Poner en `.env`:

```env
EXPO_PUBLIC_SPOTIFY_PROXY_URL=https://TU-PROYECTO.supabase.co/functions/v1/spotify-search
```

6. Reiniciar Expo.

## Funcion incluida en este repo

Ya queda preparada esta function:

- `supabase/functions/spotify-search/index.ts`

Hace busqueda de tracks en Spotify con `client_credentials`, y la app despues deduplica albums del lado cliente para mantener la UX actual del buscador.

## Lo que sigue despues

Cuando esto este estable, el paso natural es sumar:

- login opcional con Spotify usando PKCE,
- import de artistas/albums favoritos,
- recomendaciones por afinidad real,
- deep links hacia Spotify para escuchar completo.
