# Emails de Auth en B-Side

Hoy B-Side ya puede registrar e iniciar sesión con Supabase, pero los emails todavía usan el remitente y la plantilla por defecto.

## Qué podés dejar listo ahora

En Supabase Dashboard:

1. `Authentication > URL Configuration`
   - `Site URL`: la URL principal donde querés abrir B-Side.
   - `Redirect URLs`: agregá localhost, GitHub Pages y más adelante tu dominio real.
2. `Authentication > Email Templates`
   - Editá asunto y HTML de:
     - Confirm sign up
     - Magic link
     - Reset password
     - Change email
     - Invite user

Variables útiles de Supabase:

- `{{ .ConfirmationURL }}`
- `{{ .SiteURL }}`
- `{{ .RedirectTo }}`
- `{{ .Data }}`
- `{{ .Email }}`

Con `{{ .Data }}` podés usar metadata del registro, como nombre visible o handle.

## Lo que no hace falta comprar todavía

No necesitás un dominio propio para que el registro funcione.

Podés seguir usando:

- la URL pública de Supabase para auth
- GitHub Pages o localhost como destino del flujo

Eso alcanza para desarrollar, probar y mostrar la app.

## Cuándo conviene sumar dominio + SMTP

Cuando quieras que el mail salga con identidad de marca, por ejemplo:

- `hola@bside.app`
- `auth@bside.app`
- `no-reply@bside.app`

Para eso vas a necesitar:

1. un dominio propio
2. un proveedor SMTP externo
3. configurar DNS del dominio

Opciones comunes:

- Resend
- Postmark
- SendGrid
- Amazon SES
- Brevo

## Recomendación para producción

Según la documentación oficial de Supabase:

- las plantillas se editan desde `Authentication > Email Templates`
- el SMTP por defecto es solo para pruebas y tiene límites bajos
- para producción recomiendan `Custom SMTP`

Checklist recomendado para B-Side:

1. Definir el dominio final.
2. Crear `no-reply@tu-dominio`.
3. Configurar `Custom SMTP` en Supabase.
4. Personalizar asunto y HTML de confirmación, magic link y recuperación.
5. Ajustar `Site URL` y `Redirect URLs` al dominio final.

## Asuntos sugeridos

- Confirmación: `Activá tu cuenta de B-Side`
- Magic link: `Entrá a B-Side`
- Recuperación: `Cambiá tu contraseña de B-Side`

## Tono recomendado

- corto
- claro
- cercano
- con marca
- sin hablar de infraestructura en el cuerpo principal

## Referencias oficiales

- Supabase Email Templates:
  [https://supabase.com/docs/guides/auth/auth-email-templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- Supabase Custom SMTP:
  [https://supabase.com/docs/guides/auth/auth-smtp](https://supabase.com/docs/guides/auth/auth-smtp)
