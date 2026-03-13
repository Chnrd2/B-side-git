# Auth, seguridad y freemium

## Stack recomendado

- Auth: Supabase Auth.
- Base de datos: Postgres en Supabase.
- Storage: Supabase Storage para avatars e imagenes subidas por usuarios.
- Reglas: Row Level Security por tabla.

## Tablas minimas

1. `profiles`
2. `reviews`
3. `review_likes`
4. `review_comments`
5. `lists`
6. `list_items`
7. `follows`
8. `messages`
9. `reports`
10. `subscriptions`

## Flujo inicial sugerido

1. Usuario se registra por mail.
2. Se crea `profile` automaticamente.
3. El plan arranca en `free`.
4. Puede personalizar avatar, fondo y tema.
5. Si compra Plus, se actualiza `subscriptions`.
6. Las politicas quedan visibles en onboarding, perfil y registro.

## Seguridad minima razonable

- Verificacion por mail.
- Rate limit en auth y endpoints sensibles.
- RLS en tablas con datos del usuario.
- Reportes y bloqueo.
- Logs de errores y auditoria basica.
- Buckets separados para avatar y wallpaper.

## Freemium viable sin romper la esencia

### Free

- Feed, busqueda, resenas y listas base.
- Perfil publico.
- Chat simple.
- Personalizacion basica.

### Plus

- Personalizacion avanzada de perfil y fondo.
- Stats y resumenes.
- Listas avanzadas y templates.
- Extras de descubrimiento y curacion.

## Cosas para no hacer todavia

- Marketplace complejo.
- Wallet o pagos raros.
- Algoritmos pesados de recomendacion.
- Infraestructura innecesaria para una etapa temprana.
