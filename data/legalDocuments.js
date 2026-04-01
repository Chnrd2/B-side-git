export const LEGAL_DOCUMENTS = [
  {
    id: 'terms',
    title: 'Términos y condiciones',
    shortTitle: 'Términos',
    category: 'account',
    version: '0.1',
    updatedAt: '12 de marzo de 2026',
    summary:
      'Define quién puede usar B-Side, qué tipo de actividad está permitida y cuándo una cuenta puede restringirse o cerrarse.',
    touchpoints: ['Onboarding', 'Registro', 'Perfil', 'Web'],
    sections: [
      {
        heading: '1. Uso de la app',
        body:
          'B-Side es una app para descubrir música, publicar reseñas, armar listas y participar de una comunidad musical. Para usarla, la persona debe brindar datos válidos y respetar las reglas de convivencia de la plataforma.',
      },
      {
        heading: '2. Cuentas y acceso',
        body:
          'Cada cuenta debe representar a una persona real o un proyecto real. La persona es responsable por el acceso a su email, su contraseña y la actividad realizada desde su cuenta.',
      },
      {
        heading: '3. Conducta y contenido',
        body:
          'No se permite acoso, spam, suplantación de identidad, fraude, contenido sexual explícito, violencia gráfica ni materiales que infrinjan derechos de terceros. B-Side puede ocultar contenido o limitar funciones mientras se revisa un caso.',
      },
      {
        heading: '4. Suspensiones y cierres',
        body:
          'La app puede advertir, suspender o cerrar cuentas que incumplan estas reglas, afecten la seguridad del servicio o intenten abusar del producto, sus APIs o su comunidad.',
      },
      {
        heading: '5. Cambios del servicio',
        body:
          'La experiencia puede cambiar, agregar o quitar funciones y ajustar planes pagos o gratuitos. Cuando esos cambios sean relevantes, B-Side debería avisarlos dentro de la app o por email.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Política de privacidad',
    shortTitle: 'Privacidad',
    category: 'privacy',
    version: '0.1',
    updatedAt: '12 de marzo de 2026',
    summary:
      'Explica qué datos usa B-Side, por qué los guarda y cómo la persona puede pedir acceso, corrección o eliminación.',
    touchpoints: ['Onboarding', 'Registro', 'Ajustes', 'Web'],
    sections: [
      {
        heading: '1. Datos que se recopilan',
        body:
          'B-Side puede guardar datos de cuenta como email, nombre visible, handle, foto de perfil, wallpaper y preferencias. También puede almacenar actividad dentro de la app como reseñas, listas, likes, comentarios, mensajes y reportes.',
      },
      {
        heading: '2. Para que se usan',
        body:
          'Estos datos se usan para operar la cuenta, mostrar el perfil, personalizar la experiencia, guardar actividad social, mejorar el producto y responder reportes o incidentes de seguridad.',
      },
      {
        heading: '3. Retencion y eliminacion',
        body:
          'Los datos deberían conservarse mientras la cuenta siga activa y durante un período razonable adicional para cumplir con obligaciones legales, resolver disputas o investigar abuso. La persona debería poder pedir la eliminación de su cuenta y de su información.',
      },
      {
        heading: '4. Comparticion y terceros',
        body:
          'B-Side puede usar proveedores externos para auth, base de datos, almacenamiento, analytics o moderación. También puede mostrar metadata musical de terceros respetando sus licencias y condiciones.',
      },
      {
        heading: '5. Derechos de la persona usuaria',
        body:
          'La persona debería poder acceder a sus datos, corregirlos, descargarlos o pedir su eliminación. También debería poder gestionar notificaciones, personalización y visibilidad de ciertos datos desde ajustes.',
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
      'Marca el tono de la comunidad: descubrir música, debatir con respeto y cortar rápido el abuso o el spam.',
    touchpoints: ['Feed', 'Comentarios', 'Mensajes', 'Perfiles'],
    sections: [
      {
        heading: '1. Respeto entre personas',
        body:
          'Criticar un disco o una opinión está bien; atacar a la persona no. No se permite hostigamiento, amenazas, humillación pública ni coordinación de acoso.',
      },
      {
        heading: '2. Reseñas, comentarios y mensajes',
        body:
          'El contenido debe tener relación con música, cultura o la experiencia social de la app. Comentarios vacíos, spam promocional repetido o cadenas agresivas pueden moderarse.',
      },
      {
        heading: '3. Fotos de perfil y wallpapers',
        body:
          'No se aceptan imágenes sexuales explícitas, violentas, discriminatorias o que suplanten a otra persona. Las imágenes nuevas pueden quedar pendientes de revisión antes de volverse públicas.',
      },
      {
        heading: '4. Derechos de autor y arte de tapas',
        body:
          'La comunidad no debería subir material que no tenga derecho a compartir. Si una persona reporta una infracción válida, B-Side puede ocultar el contenido mientras revisa el caso.',
      },
      {
        heading: '5. Reportes y apelaciones',
        body:
          'Las personas pueden reportar perfiles, mensajes o contenido. B-Side debería revisar los casos con criterios consistentes y ofrecer un canal de apelación cuando corresponda.',
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
      'Ordena la futura capa freemium: qué incluye el plan pago, cómo se renueva y cómo se cancela.',
    touchpoints: ['Paywall', 'Checkout', 'Perfil', 'Web'],
    sections: [
      {
        heading: '1. Beneficios incluidos',
        body:
          'El plan Plus puede incluir personalización avanzada, estadísticas personales, listas más flexibles, templates de sharing, insignias y funciones premium futuras.',
      },
      {
        heading: '2. Facturacion y renovacion',
        body:
          'Si Plus pasa a cobro real, el precio, la moneda, el ciclo de renovación y el proveedor de pagos deben mostrarse con claridad antes de confirmar la compra.',
      },
      {
        heading: '3. Cancelacion y reembolsos',
        body:
          'La persona debería poder cancelar la renovación desde la propia app o desde la tienda correspondiente. La política de reembolsos debe alinearse con el medio de pago y la normativa aplicable.',
      },
      {
        heading: '4. Cambios del plan',
        body:
          'B-Side puede ajustar precios o beneficios, pero debería avisarlo con anticipación razonable para que la persona decida si quiere continuar.',
      },
    ],
  },
];

export const getLegalDocumentById = (documentId) =>
  LEGAL_DOCUMENTS.find((document) => document.id === documentId) || LEGAL_DOCUMENTS[0];

