export const LEGAL_DOCUMENTS = [
  {
    id: 'terms',
    title: 'Terminos y condiciones',
    shortTitle: 'Terminos',
    category: 'account',
    version: '0.1',
    updatedAt: '12 de marzo de 2026',
    summary:
      'Define quien puede usar B-Side, que tipo de actividad esta permitida y cuando una cuenta puede restringirse o cerrarse.',
    touchpoints: ['Onboarding', 'Registro', 'Perfil', 'Web'],
    sections: [
      {
        heading: '1. Uso de la app',
        body:
          'B-Side es una app para descubrir musica, publicar resenas, armar listas y participar de una comunidad musical. Para usarla, la persona debe brindar datos validos y respetar las reglas de convivencia de la plataforma.',
      },
      {
        heading: '2. Cuentas y acceso',
        body:
          'Cada cuenta debe representar a una persona real o un proyecto real. La persona es responsable por el acceso a su email, su contrasena y la actividad realizada desde su cuenta.',
      },
      {
        heading: '3. Conducta y contenido',
        body:
          'No se permite acoso, spam, suplantacion de identidad, fraude, contenido sexual explicito, violencia grafica ni materiales que infrinjan derechos de terceros. B-Side puede ocultar contenido o limitar funciones mientras se revisa un caso.',
      },
      {
        heading: '4. Suspensiones y cierres',
        body:
          'La app puede advertir, suspender o cerrar cuentas que incumplan estas reglas, afecten la seguridad del servicio o intenten abusar del producto, sus APIs o su comunidad.',
      },
      {
        heading: '5. Cambios del servicio',
        body:
          'La experiencia puede cambiar, agregar o quitar funciones y ajustar planes pagos o gratuitos. Cuando esos cambios sean relevantes, B-Side deberia avisarlos dentro de la app o por email.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Politica de privacidad',
    shortTitle: 'Privacidad',
    category: 'privacy',
    version: '0.1',
    updatedAt: '12 de marzo de 2026',
    summary:
      'Explica que datos usa B-Side, por que los guarda y como la persona puede pedir acceso, correccion o eliminacion.',
    touchpoints: ['Onboarding', 'Registro', 'Ajustes', 'Web'],
    sections: [
      {
        heading: '1. Datos que se recopilan',
        body:
          'B-Side puede guardar datos de cuenta como email, nombre visible, handle, foto de perfil, wallpaper y preferencias. Tambien puede almacenar actividad dentro de la app como resenas, listas, likes, comentarios, mensajes y reportes.',
      },
      {
        heading: '2. Para que se usan',
        body:
          'Estos datos se usan para operar la cuenta, mostrar el perfil, personalizar la experiencia, guardar actividad social, mejorar el producto y responder reportes o incidentes de seguridad.',
      },
      {
        heading: '3. Retencion y eliminacion',
        body:
          'Los datos deberian conservarse mientras la cuenta siga activa y durante un periodo razonable adicional para cumplir con obligaciones legales, resolver disputas o investigar abuso. La persona deberia poder pedir la eliminacion de su cuenta y de su informacion.',
      },
      {
        heading: '4. Comparticion y terceros',
        body:
          'B-Side puede usar proveedores externos para auth, base de datos, almacenamiento, analytics o moderacion. Tambien puede mostrar metadata musical de terceros respetando sus licencias y condiciones.',
      },
      {
        heading: '5. Derechos de la persona usuaria',
        body:
          'La persona deberia poder acceder a sus datos, corregirlos, descargarlos o pedir su eliminacion. Tambien deberia poder gestionar notificaciones, personalizacion y visibilidad de ciertos datos desde ajustes.',
      },
    ],
  },
  {
    id: 'community',
    title: 'Lineamientos de comunidad',
    shortTitle: 'Comunidad',
    category: 'safety',
    version: '0.1',
    updatedAt: '12 de marzo de 2026',
    summary:
      'Marca el tono de la comunidad: descubrir musica, debatir con respeto y cortar rapido el abuso o el spam.',
    touchpoints: ['Feed', 'Comentarios', 'Mensajes', 'Perfiles'],
    sections: [
      {
        heading: '1. Respeto entre personas',
        body:
          'Criticar un disco o una opinion esta bien; atacar a la persona no. No se permite hostigamiento, amenazas, humillacion publica ni coordinacion de acoso.',
      },
      {
        heading: '2. Resenas, comentarios y mensajes',
        body:
          'El contenido debe tener relacion con musica, cultura o la experiencia social de la app. Comentarios vacios, spam promocional repetido o cadenas agresivas pueden moderarse.',
      },
      {
        heading: '3. Fotos de perfil y wallpapers',
        body:
          'No se aceptan imagenes sexuales explicitas, violentas, discriminatorias o que suplanten a otra persona. Las imagenes nuevas pueden quedar pendientes de revision antes de volverse publicas.',
      },
      {
        heading: '4. Derechos de autor y arte de tapas',
        body:
          'La comunidad no deberia subir material que no tenga derecho a compartir. Si una persona reporta una infraccion valida, B-Side puede ocultar el contenido mientras revisa el caso.',
      },
      {
        heading: '5. Reportes y apelaciones',
        body:
          'Las personas pueden reportar perfiles, mensajes o contenido. B-Side deberia revisar los casos con criterios consistentes y ofrecer un canal de apelacion cuando corresponda.',
      },
    ],
  },
  {
    id: 'plus',
    title: 'Condiciones del plan Plus',
    shortTitle: 'Plan Plus',
    category: 'billing',
    version: '0.1',
    updatedAt: '12 de marzo de 2026',
    summary:
      'Ordena la futura capa freemium: que incluye el plan pago, como se renueva y como se cancela.',
    touchpoints: ['Paywall', 'Checkout', 'Perfil', 'Web'],
    sections: [
      {
        heading: '1. Beneficios incluidos',
        body:
          'El plan Plus puede incluir personalizacion avanzada, estadisticas personales, listas mas flexibles, templates de sharing, insignias y funciones premium futuras.',
      },
      {
        heading: '2. Facturacion y renovacion',
        body:
          'Si Plus pasa a cobro real, el precio, la moneda, el ciclo de renovacion y el proveedor de pagos deben mostrarse con claridad antes de confirmar la compra.',
      },
      {
        heading: '3. Cancelacion y reembolsos',
        body:
          'La persona deberia poder cancelar la renovacion desde la propia app o desde la tienda correspondiente. La politica de reembolsos debe alinearse con el medio de pago y la normativa aplicable.',
      },
      {
        heading: '4. Cambios del plan',
        body:
          'B-Side puede ajustar precios o beneficios, pero deberia avisarlo con anticipacion razonable para que la persona decida si quiere continuar.',
      },
    ],
  },
];

export const getLegalDocumentById = (documentId) =>
  LEGAL_DOCUMENTS.find((document) => document.id === documentId) || LEGAL_DOCUMENTS[0];
