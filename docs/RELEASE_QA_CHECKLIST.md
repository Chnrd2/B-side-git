# Release QA Checklist

## Antes de mostrar B-Side

- Confirmar que la sesión abre bien en modo invitado y con cuenta real.
- Revisar que el perfil cargue avatar, fondo y Top 5 sin cortes.
- Probar el buscador con Spotify activo y un fallback de iTunes.
- Verificar que al menos una lista exporte a Spotify y muestre su resumen.
- Revisar que el inbox, el player y las notificaciones no dejen botones muertos.

## QA en iPhone

- Abrir la preview web o Expo Go y recorrer onboarding, feed, buscar, listas, perfil y chat.
- Probar scrolls largos, modales y la tarjeta de compartir perfil.
- Confirmar que el mini player no tape CTAs ni navegación.
- Verificar que los textos se vean bien con acentos y sin cortes raros.

## QA en Android

- Probar Expo Go para UI rápida.
- Probar dev build para notificaciones push reales y permisos del sistema.
- Confirmar que los avisos no muestren warnings de Expo Go en la entrada.
- Revisar playback, export a Spotify y el cierre del player expandido.

## Cuenta y sesión

- Crear cuenta por email.
- Iniciar sesión con cuenta existente.
- Enviar magic link.
- Cerrar sesión y confirmar que el modo vuelve a invitado.
- Ver que el estado de sesión quede claro en Cuenta y acceso.

## Push y dispositivo

- Activar permisos desde Cuenta y acceso.
- Revisar si el entorno es web, Expo Go Android, simulador o dispositivo real.
- En Android real con dev build, confirmar que el token se registre en `push_devices`.
- Enviar una notificación de prueba y validar banner/centro de notificaciones.

## Seguridad básica

- Confirmar que `public.notifications` no permita inserts desde cliente.
- Crear una notificación válida vía `notify-create`.
- Intentar mandar `actorId` distinto al usuario autenticado y confirmar que falla.
- Intentar spamear notificaciones, comentarios, likes y mensajes y confirmar que aparece rate limit.
- Confirmar que `push-dispatch` solo responde si recibe `PUSH_DISPATCH_SECRET`.

## Playback y discovery

- Buscar un álbum con preview y otro sin preview.
- Confirmar que B-Side reproduzca cuando hay audio y abra el origen cuando no.
- Entrar al perfil del artista desde buscar y desde detalle de álbum.
- Pedir otra tanda del Oráculo y revisar que no repita exactamente lo mismo.

## Listas y Spotify

- Crear una lista nueva y una privada.
- Guardar discos en `Por escuchar`.
- Exportar una lista a Spotify.
- Revisar el resumen: temas adentro, afuera y links a la playlist.

## Social

- Enviar un mensaje normal.
- Enviar una recomendación de disco.
- Verificar que el chat suba en el inbox.
- Dejar like, comentario y seguir/dejar de seguir.

## Cierre final

- Correr `npm.cmd run doctor`.
- Correr `npx.cmd expo export --platform web`.
- Si la demo pública cambió, correr `npm.cmd run deploy:web`.
- Subir cambios a `main`.
