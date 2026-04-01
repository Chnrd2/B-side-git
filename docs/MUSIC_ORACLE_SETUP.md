# Music Oracle

El Oraculo Musical usa una Edge Function para que la clave de IA no viva en el frontend.

## 1. Cargar el secreto

En la raiz del proyecto:

```powershell
npx.cmd supabase secrets set OPENAI_API_KEY="tu_openai_api_key"
```

## 2. Deployar la function

```powershell
npx.cmd supabase functions deploy music-oracle --project-ref ziflidzcoqqsrjxiitpo
```

## 3. Agregar la URL a `.env`

```env
EXPO_PUBLIC_MUSIC_ORACLE_URL=https://ziflidzcoqqsrjxiitpo.supabase.co/functions/v1/music-oracle
```

## 4. Reiniciar Expo

```powershell
npm run web:19006
```

## 5. Verificar

- En `Buscar`, deberias ver el bloque `Oraculo B-Side`.
- Al tocar `Preguntarle`, devuelve 3 discos a partir de tu Top 5, tus reseñas y tus escuchas.
- Si la function no esta disponible o falta la clave, B-Side usa un fallback local en vez de romper la UI.
