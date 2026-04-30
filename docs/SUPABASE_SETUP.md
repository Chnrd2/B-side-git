# Supabase setup para B-Side

## 1. Variables de entorno

Creá un archivo `.env` en la raíz con estas variables mínimas:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
EXPO_PUBLIC_SUPABASE_REDIRECT_URL=bside://auth/callback
EXPO_PUBLIC_SUPPORT_EMAIL=hola@bside.app
```

Opcionales según lo que quieras activar:

```bash
EXPO_PUBLIC_SPOTIFY_PROXY_URL=
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=
EXPO_PUBLIC_SPOTIFY_REDIRECT_URI=http://127.0.0.1:19006/spotify/callback
EXPO_PUBLIC_MUSIC_ORACLE_URL=
EXPO_PUBLIC_EAS_PROJECT_ID=
```

En Windows, desde la carpeta del proyecto:

```powershell
npm run env:init
```

Después abrí `.env`, pegá tus valores reales y reiniciá Expo:

```powershell
npm run web:19006
```

Chequeo rápido:

```powershell
npm run supabase:check
```

## 2. Proyecto base

1. Crear un proyecto nuevo en Supabase.
2. En `Project Settings > API`, copiar la `Project URL` y la `anon public key`.
3. Activar `Email Auth`.
4. Si más adelante querés, sumar Google y Apple desde `Auth Providers`.

## 3. Base de datos

1. Abrí el SQL Editor.
2. Copiá el contenido de [supabase/schema.sql](/C:/Users/Administrator/Desktop/b-side/supabase/schema.sql).
3. Ejecutalo completo.

Eso deja lista la base para:

- perfiles
- reseñas
- likes
- comentarios
- listas
- follows y bloqueos
- mensajes
- reportes
- suscripciones
- dispositivos para push
- rate limiting de acciones sensibles

También crea triggers para:

- generar el perfil al registrarse
- dejar la cuenta en plan free
- guardar `birth_date`
- guardar `profile_completed_at`
- validar tamaños de inputs
- frenar spam básico en reseñas, comentarios, likes, follows, mensajes, reportes y escuchas

## 4. Storage

Si corriste una versión vieja del schema, podés:

- volver a ejecutar [supabase/schema.sql](/C:/Users/Administrator/Desktop/b-side/supabase/schema.sql)
- o correr solo [supabase/storage-setup.sql](/C:/Users/Administrator/Desktop/b-side/supabase/storage-setup.sql)

Buckets necesarios:

- `avatars`
- `wallpapers`

## 5. URL Configuration

En `Authentication > URL Configuration`, para desarrollo local:

- `Site URL`: `http://localhost:19006`
- `Redirect URLs`:
  - `http://localhost:19006`
  - `bside://auth/callback`

Si usás la preview web pública, sumá también:

- `https://chnrd2.github.io/B-side-git/`

## 6. Emails de auth

Por defecto Supabase manda emails con su branding de prueba. Para producción conviene:

1. Ir a `Authentication > Email Templates`
2. Personalizar asunto, título y texto
3. Configurar `Custom SMTP`

Referencia interna:

- [SUPABASE_EMAIL_BRANDING.md](/C:/Users/Administrator/Desktop/b-side/docs/SUPABASE_EMAIL_BRANDING.md)

## 7. Funciones que hay que desplegar

Para beta real conviene desplegar estas funciones:

- [supabase/functions/notify-create/index.ts](/C:/Users/Administrator/Desktop/b-side/supabase/functions/notify-create/index.ts)
- [supabase/functions/push-dispatch/index.ts](/C:/Users/Administrator/Desktop/b-side/supabase/functions/push-dispatch/index.ts)
- [supabase/functions/delete-account/index.ts](/C:/Users/Administrator/Desktop/b-side/supabase/functions/delete-account/index.ts)
- [supabase/functions/spotify-search/index.ts](/C:/Users/Administrator/Desktop/b-side/supabase/functions/spotify-search/index.ts)
- [supabase/functions/music-oracle/index.ts](/C:/Users/Administrator/Desktop/b-side/supabase/functions/music-oracle/index.ts)

`notify-create` es el camino seguro para crear notificaciones sociales. El cliente ya no puede insertar directamente en `public.notifications`.

`delete-account`, `notify-create` y las funciones que usen datos privilegiados necesitan este secret en Supabase:

```bash
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

`push-dispatch` también necesita un secret interno para que no pueda llamarse desde cliente:

```bash
PUSH_DISPATCH_SECRET=un_valor_largo_y_privado
```

Deploy recomendado:

```powershell
npx supabase functions deploy notify-create --project-ref tu-project-ref
npx supabase functions deploy push-dispatch --project-ref tu-project-ref
npx supabase functions deploy delete-account --project-ref tu-project-ref
npx supabase functions deploy spotify-search --project-ref tu-project-ref
npx supabase functions deploy music-oracle --project-ref tu-project-ref
```

## 8. Primer flujo real a validar

1. Registro por email
2. Confirmación por mail
3. Login
4. Completar perfil
5. Recuperar contraseña
6. Cerrar sesión
7. Cerrar otras sesiones
8. Borrar cuenta

## 9. Antes de publicar

- Revisar RLS tabla por tabla
- Dejar política de reportes y bloqueos
- Configurar dominio y SMTP para auth
- Verificar deep links reales en Android/iOS
- Tener visibles Términos y Privacidad
