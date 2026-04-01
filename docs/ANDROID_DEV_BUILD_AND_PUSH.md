# Android Dev Build y Push

## Qué deja listo esta base

- `expo-dev-client` instalado para salir de Expo Go.
- `expo-notifications` configurado con canal `bside-social`.
- Registro de `Expo push token` listo para persistirse en Supabase.
- Base para despacho remoto desde `supabase/functions/push-dispatch`.

## Qué hace falta para probar push reales

Las push remotas no se validan bien dentro de Expo Go. Para probarlas de verdad en Android:

1. Tener el proyecto conectado a EAS.
2. Definir `EXPO_PUBLIC_EAS_PROJECT_ID` en `.env`.
3. Correr el schema actualizado en Supabase.
4. Deployar la function `push-dispatch`.
5. Instalar una dev build o preview build en un Android real.

## Comandos útiles

```bash
npx eas login
npx eas init
npx eas build --profile development --platform android
```

Luego, para correr Metro para la dev build:

```bash
npm run start:dev-client
```

## Supabase

Después de actualizar el proyecto:

1. Re-corré `supabase/schema.sql`.
2. Deployá:

```bash
npx supabase functions deploy push-dispatch --project-ref TU_PROJECT_REF
```

## Nota realista

- En emulador vas a poder validar bastante UI y parte del flujo.
- Para push remota real, token real y comportamiento con app cerrada, conviene un Android físico.
