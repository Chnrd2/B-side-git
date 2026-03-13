# Supabase setup para B-Side

## 1. Variables de entorno

Crear un archivo `.env` en la raiz y copiar:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

En Windows, desde la carpeta del proyecto puedes hacer:

```powershell
npm run env:init
```

Despues abre `.env`, pega tus valores reales y reinicia Expo:

```powershell
npm run web:19006
```

Si queres verificar rapido si ya quedo bien:

```powershell
npm run supabase:check
```

## 2. Proyecto base

1. Crear un proyecto nuevo en Supabase.
2. En `Project Settings > API`, copiar la `Project URL` y la `anon public key`.
3. Activar Email Auth.
4. Si despues queres, sumar Google y Apple desde Auth Providers.

## 3. Base de datos

1. Abrir el SQL Editor.
2. Copiar el contenido de `supabase/schema.sql`.
3. Ejecutarlo.

Eso crea:

- perfiles
- resenas
- likes
- comentarios
- listas
- follows y bloqueos
- mensajes
- reportes
- suscripciones

Tambien deja triggers para crear perfil y suscripcion free al registrarse.
Y ahora tambien deja preparados los buckets `avatars` y `wallpapers` con
politicas para que cada usuario solo suba archivos dentro de su propia carpeta.

## 4. Storage

Si corriste una version vieja de `supabase/schema.sql`, puedes elegir una de estas dos opciones:

- volver a ejecutar `supabase/schema.sql`, que ahora es re-ejecutable
- o correr solo `supabase/storage-setup.sql` para crear/actualizar Storage

- `avatars`
- `wallpapers`

Si prefieres hacerlo a mano desde `Storage`, deben existir ambos buckets para que
foto de perfil y wallpaper funcionen.

## 5. URL Configuration

En `Authentication > URL Configuration`, para esta etapa local agrega:

- `Site URL`: `http://localhost:19006`
- `Redirect URLs`: `http://localhost:19006`

Recomendacion:

- avatars: publico si queres URLs directas simples.
- wallpapers: privado o publico segun como quieras manejar visibilidad.

En el proyecto ya queda listo el helper para eso en `lib/profileAssets.js`.

Recomendacion simple para arrancar con seguridad:

- avatars: bucket publico o firmado, pero con revision manual antes de exponer la imagen.
- wallpapers: igual que avatars, porque tambien son contenido generado por usuarios.
- no confiar en URLs externas pegadas por el usuario para produccion sin pasarlas por revision o proxy.
- correr `npm run supabase:check` despues de tocar Storage para confirmar si los buckets ya aparecen como `ok`.

## 6. Primer flujo real para implementar

1. Registro por email.
2. Confirmacion por mail.
3. Login.
4. Perfil editable.
5. Crear resena.
6. Crear lista.
7. Like y comentario.

## 7. Antes de publicar

- Revisar RLS tabla por tabla.
- Definir politica de reportes y bloqueos.
- Dejar una cola basica de revision para avatar y wallpaper.
- Configurar dominios validos para magic link.
- Tener Terms y Privacy visibles en onboarding y perfil.
