/**
 * Texto base para los términos del servicio del sistema Quvant: qué se mide
 * y para qué. Para la sección de configuración del dueño y los términos.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  TODO: revisar con un abogado antes de publicarlo.      │
 * │  Ley 25.326 de Protección de Datos Personales.          │
 * └─────────────────────────────────────────────────────────┘
 */

export const OPCION_COMPARTIR = {
  titulo: "Compartir métricas de uso con Quvant",
  explicacion:
    "Nos cuenta qué partes del sistema usan y cuáles no (por ejemplo, cuántas ventas se confirmaron o si se usó el conteo con la cámara), nunca montos, precios ni datos de tus clientes. Lo usamos para ayudarte a aprovechar mejor el sistema. Podés apagarlo cuando quieras.",
} as const;

export const TERMINOS_MEDICION = {
  titulo: "Qué medimos del uso del sistema y para qué",
  parrafos: [
    "Para ayudarte a aprovechar el sistema y mejorarlo, Quvant registra cómo se usa: qué módulos se abren, qué acciones se confirman (por ejemplo, 'se cerró la caja' o 'se aplicó un aumento a 120 precios'), desde qué tipo de dispositivo, con qué rol y si fue sin conexión.",
    "Nunca registramos montos, precios, márgenes, nombres de productos, datos de tus clientes, CUIT, teléfonos, emails ni textos que escriban los usuarios. No grabamos la pantalla ni lo que se escribe.",
    "Los usuarios viajan con un identificador seudónimo (un código que no permite saber quién es la persona). Sí registramos el rol (por ejemplo, caja o dueño) para entender cómo usa el sistema cada puesto.",
    "Estos datos se procesan con PostHog, un servicio de analítica de producto, en servidores que pueden estar fuera de la Argentina. Al usar el sistema con la opción 'Compartir métricas de uso con Quvant' prendida, el titular de la organización presta su consentimiento para ese tratamiento.",
    "La opción se puede apagar en cualquier momento desde la configuración del dueño. Apagada, no se envía ningún dato de uso de la organización.",
    "El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.",
  ],
} as const;
