# B-Side

App hecha con Expo y React Native para descubrir discos, escribir reseñas,
armar listas personales y compartir música desde una comunidad con identidad
propia.

## Qué ya incluye

- Auth real con Supabase.
- Flujo de onboarding con invitado, registro, login, magic link y recuperación.
- Paso obligatorio de completar perfil para cerrar alta real.
- Banner de verificación de email y pantallas de cuenta, sesiones y ayuda.
- Feed social, búsqueda híbrida, listas, wishlist y perfil editable.
- Mini player con previews y fallback a salida externa cuando no hay audio.
- Inbox, chat y centro de notificaciones.
- Persistencia local con AsyncStorage para estado y experiencia offline básica.

## Cómo levantarla

1. Instalá dependencias con `npm install`.
2. Copiá `.env.example` a `.env` y completá Supabase.
3. Corré `npm run web:19006` para verla en `http://localhost:19006`.
4. Si preferís Expo normal, usá `npm run start`.
5. Para Android o iPhone físico, usá `npm run android` o `npm run start`.

## Scripts útiles

- `npm run start`: inicia el servidor de Expo.
- `npm run start:clear`: limpia caché de Expo y vuelve a iniciar.
- `npm run web`: abre la app en web.
- `npm run web:19006`: abre la app en web en el puerto 19006.
- `npm run doctor`: corre `expo-doctor`.
- `npm run supabase:check`: valida URL, anon key, tablas y buckets.
- `npm run spotify:check`: valida la integración de Spotify.

## Auth y backend

La app ya usa Supabase para:

- registro
- inicio de sesión
- verificación de email
- recuperación de contraseña
- perfiles
- follows, reseñas, listas, mensajes y notificaciones

Checklist base:

1. Revisar `.env`.
2. Ejecutar `supabase/schema.sql` en el SQL Editor del proyecto.
3. Verificar `Authentication > URL Configuration`.
4. Revisar `docs/SUPABASE_SETUP.md`.

## Próximos pasos recomendados

- Branding final de emails con SMTP propio.
- QA real en iPhone y Android físico.
- Push remotas fuera de Expo Go.
- Políticas finales de privacidad, soporte y publicación en stores.
