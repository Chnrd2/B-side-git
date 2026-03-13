# B-Side

App hecha con Expo y React Native para descubrir discos, escribir resenas,
armar listas personales y compartir musica en una comunidad con identidad
propia.

## Que ya incluye

- Feed con likes, comentarios y scratches persistidos en local.
- Busqueda de discos usando iTunes Search API.
- Mini player con previews de audio.
- Listas personalizadas.
- Perfil editable con foto, fondo y tema visual.
- Inbox, chat mock y centro de notificaciones.
- Onboarding demo para entrar como invitado.
- Centro de producto/prelanzamiento dentro de la app.
- Base lista para conectar auth y base de datos con Supabase.
- Persistencia local con AsyncStorage para perfil, resenas, listas, top 5,
  chats, notificaciones y preferencias.

## Como levantarla

1. Instala dependencias con `npm install`.
2. Corre `npm run web:19006` si queres verla en navegador y abrir
   `http://localhost:19006`.
3. Si preferis Expo normal, usa `npm run start`.
4. Tambien podes abrir Android o iOS con `npm run android` y `npm run ios`.

## Scripts utiles

- `npm run start`: inicia el servidor de Expo.
- `npm run start:clear`: limpia cache de Expo y vuelve a iniciar.
- `npm run web`: abre la app en web.
- `npm run web:19006`: abre la app en web en el puerto 19006.
- `npm run doctor`: corre `expo-doctor`.

## Auth y backend

La app queda preparada para usar Supabase.

1. Copia `.env.example` a `.env`.
2. Completa las dos variables publicas.
3. Corre `supabase/schema.sql` en el SQL Editor del proyecto.
4. Revisa `docs/SUPABASE_SETUP.md`.

## Proximos pasos recomendados

- Conectar auth real con Supabase.
- Mover likes, comentarios, listas y mensajes al backend.
- Agregar tests sobre los flujos de listas, perfil y persistencia.
- Publicar Terms, Privacy y Community Guidelines dentro de la app.
