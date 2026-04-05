# Email de Auth en B-Side

Hoy B-Side ya puede registrar e iniciar sesión con Supabase, pero el email que llega
todavía usa el remitente y la plantilla por defecto de Supabase.

## Qué podés cambiar ya mismo

En Supabase Dashboard:

1. `Authentication > URL Configuration`
   - `Site URL`: la URL principal donde querés abrir B-Side.
   - `Redirect URLs`: agregá tu web local, GitHub Pages y más adelante tu dominio real.
2. `Authentication > Email Templates`
   - Podés editar asunto y HTML de:
     - Confirm sign up
     - Magic link
     - Reset password
     - Change email
     - Invite user
   - Ahí podés reemplazar el texto genérico por una versión de B-Side.

Variables útiles de Supabase:

- `{{ .ConfirmationURL }}`
- `{{ .SiteURL }}`
- `{{ .RedirectTo }}`
- `{{ .Data }}`
- `{{ .Email }}`

Con `{{ .Data }}` podés usar metadata del alta, por ejemplo el nombre visible o el
handle que la persona eligió en el onboarding.

## Lo que no hace falta comprar ahora

No necesitás comprar un dominio para que el registro funcione.

Podés seguir usando:

- la URL pública de Supabase para Auth
- GitHub Pages o localhost como destino del flujo

Eso alcanza para desarrollar, probar y mostrar la app.

## Cuándo sí conviene comprar un dominio

Te conviene comprar uno cuando quieras que el mail salga con una identidad prolija,
por ejemplo:

- `hola@bside.app`
- `auth@bside.app`
- `no-reply@bside.app`

Para eso necesitás:

1. un dominio propio
2. un proveedor SMTP externo
3. configurar DNS del dominio

Proveedores comunes:

- Resend
- Postmark
- SendGrid
- Amazon SES
- Brevo

## Qué cambiar para que el mail se vea profesional

Según la documentación oficial de Supabase:

- las plantillas se editan desde `Authentication > Email Templates`
- el SMTP por defecto es solo de prueba y con límites muy bajos
- para producción recomiendan usar `Custom SMTP`

Checklist recomendado para B-Side:

1. Comprar dominio cuando definan el nombre final.
2. Crear `no-reply@tu-dominio`.
3. Configurar `Custom SMTP` en Supabase.
4. Editar asunto y HTML de confirmación, magic link y recuperación.
5. Ajustar `Site URL` y `Redirect URLs` al dominio final.

## Ejemplo de asunto

- Confirmación: `Confirmá tu cuenta de B-Side`
- Magic link: `Entrá a B-Side`
- Recuperación: `Cambiá tu contraseña de B-Side`

## Ejemplo de tono

- corto
- claro
- con marca
- sin mencionar “powered by Supabase” en el cuerpo principal

## Referencias oficiales

- Supabase Email Templates:
  [https://supabase.com/docs/guides/auth/auth-email-templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- Supabase Custom SMTP:
  [https://supabase.com/docs/guides/auth/auth-smtp](https://supabase.com/docs/guides/auth/auth-smtp)
