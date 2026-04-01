# Spotify Playback Roadmap

## Estado actual

- B-Side reproduce previews cuando el catalogo entrega `preview_url`.
- Si no hay preview, intenta rescatar uno desde iTunes.
- Si tampoco hay preview rescatable, B-Side abre el release o track en el origen.

## Por que no siempre suena

- Spotify no garantiza preview en todos los tracks o albums.
- Muchos lanzamientos nuevos o de nicho vienen sin audio reproducible dentro de la app.
- En esos casos B-Side funciona como discovery + puente al origen.

## Full playback real

Para llegar a reproduccion completa dentro de B-Side haria falta:

1. Cuenta Spotify conectada.
2. Scopes de playback (`streaming`, `user-read-private`, `user-read-email`, `user-read-playback-state`, `user-modify-playback-state`).
3. Cuenta Spotify Premium del usuario.
4. Implementar el Web Playback SDK en web.
5. Para Android/iOS, migrar a una dev build y evaluar SDK nativo o App Remote.

## Monetizacion recomendada

No pensar el full playback como la parte que se cobra.
Lo sano para B-Side es monetizar:

- stats y perfil pro,
- IA y discovery premium,
- personalizacion avanzada,
- herramientas de export/import,
- promo para artistas o lanzamientos,
- analiticas para cuentas creator/artist.

## UX recomendada

- `Preview` cuando suena dentro de B-Side.
- `Abrir en Spotify` cuando el release existe pero no trae preview.
- `Sin audio` cuando solo queda como ficha de discovery, review o wishlist.
