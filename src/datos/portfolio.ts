/**
 * El portfolio de la sección Webs: las páginas y sistemas que hizo el
 * equipo. Para sumar uno alcanza con agregar un objeto a PROYECTOS y sus
 * capturas en public/webs/<id>/ (se sacan con Playwright: la primera
 * pantalla y la página completa, en escritorio a 1440 px y en celular a
 * 390 px con pantalla doble).
 *
 * Por ahora están cargados los que mandó fabrizio el 18-oct-2026, a modo
 * de ejemplo hasta que se carguen todos.
 *
 * Reglas:
 *  - Nada inventado: lo que dice cada ficha sale de lo que muestra el sitio.
 *  - "embebible" solo en true si el sitio deja que lo muestren dentro de
 *    otra página (sin X-Frame-Options ni frame-ancestors que lo impidan).
 *    Revisado el 18-oct-2026: Yunque, Forja y Firmamento mandan
 *    frame-ancestors 'none'; Grimm y Millonarios, SAMEORIGIN. Si alguno lo
 *    habilita para quvant.com.ar, pasarlo a true y el visor lo abre en vivo.
 *  - Las capturas largas van en partes de hasta 8000 px (WebP no pasa de
 *    16.383 px de alto).
 */

export type Captura = { src: string; ancho: number; alto: number };

export type VistaProyecto = {
  id: string;
  /** Solo se muestra si el proyecto tiene más de una vista. */
  nombre: string;
  url: string;
  portada: Captura;
  portadaCelular: Captura;
  /** La página completa, en partes, de arriba hacia abajo. */
  escritorio: readonly Captura[];
  celular: readonly Captura[];
};

export type TipoProyecto = "sitio" | "sistema" | "app";

export type Proyecto = {
  id: string;
  nombre: string;
  /** Para quién o de quién es. */
  cliente: string;
  tipo: TipoProyecto;
  rubro: string;
  /** Si está publicado, en demo, en prueba... dicho tal cual. */
  estado: string;
  resumen: string;
  puntos: readonly string[];
  /** El color propio del proyecto: brillo, bordes y punto. */
  color: string;
  /** Cómo se luce mejor en la vitrina. */
  formato: "escritorio" | "celular";
  embebible: boolean;
  vistas: readonly VistaProyecto[];
};

export const TIPOS: Record<TipoProyecto, { singular: string; plural: string }> = {
  sitio: { singular: "Sitio web", plural: "Sitios" },
  sistema: { singular: "Sistema", plural: "Sistemas" },
  app: { singular: "App", plural: "Apps" },
};

/** Las medidas de cada captura salen del procesado (ver arriba). */
function vista(
  proyecto: string,
  id: string,
  nombre: string,
  url: string,
  altosEscritorio: readonly number[],
  altosCelular: readonly number[],
): VistaProyecto {
  const base = `/webs/${proyecto}/${id}`;
  return {
    id,
    nombre,
    url,
    portada: { src: `${base}-portada.webp`, ancho: 1200, alto: 750 },
    portadaCelular: { src: `${base}-portada-celular.webp`, ancho: 600, alto: 1298 },
    escritorio: altosEscritorio.map((alto, i) => ({ src: `${base}-escritorio-${i + 1}.webp`, ancho: 1440, alto })),
    celular: altosCelular.map((alto, i) => ({ src: `${base}-celular-${i + 1}.webp`, ancho: 780, alto })),
  };
}

export const PROYECTOS: readonly Proyecto[] = [
  {
    id: "grimm",
    nombre: "Grimm Travel",
    cliente: "Grupo Guttero · Puerto Madryn",
    tipo: "sitio",
    rubro: "Turismo",
    estado: "En línea",
    resumen:
      "La agencia de viajes de Puerto Madryn: ballenas, pingüinos y Península Valdés, y desde ahí viajes a todo el mundo.",
    puntos: [
      "Excursiones, paquetes, departamentos y autos en un solo sitio",
      "En español, inglés y portugués",
      "Calendario de fauna mes a mes y el clima de cada punto de salida",
      "Cada consulta sale directo por WhatsApp",
    ],
    color: "#3CCFCF",
    formato: "escritorio",
    embebible: false,
    vistas: [vista("grimm", "inicio", "Inicio", "https://grimm.com.ar/", [8000, 5953], [8000, 8000, 8000, 8000, 3172])],
  },
  {
    id: "yunque",
    nombre: "Yunque",
    cliente: "Producto propio · by Quvant",
    tipo: "sistema",
    rubro: "Industria",
    estado: "Demo funcional",
    resumen:
      "El sistema de gestión para ferreterías industriales y distribuidores: el sitio que lo presenta y el sistema por dentro.",
    puntos: [
      "Si se corta internet, el mostrador sigue vendiendo",
      "Un tablero por rol con lo que hay que atender hoy",
      "Mostrador, presupuestos, servicio técnico, stock y entregas",
    ],
    color: "#5B7CFA",
    formato: "escritorio",
    embebible: false,
    vistas: [
      vista("yunque", "sitio", "El sitio", "https://yunque-rust.vercel.app/", [8000, 5289], [8000, 8000, 8000, 8000, 8000, 266]),
      vista("yunque", "sistema", "El sistema", "https://yunque-rust.vercel.app/app", [900], [3448]),
    ],
  },
  {
    id: "forja",
    nombre: "Forja",
    cliente: "Producto propio · complemento de Yunque",
    tipo: "sistema",
    rubro: "Industria",
    estado: "Demo · simulación",
    resumen: "La red de sucursales en vivo: el mapa, los envíos en camino y la repetición de todo el día.",
    puntos: [
      "Sucursales y envíos en tránsito sobre un mapa",
      "Las ventas del día en una línea de tiempo que se repite hasta 1200×",
      "Avisos cuando un producto baja del mínimo",
    ],
    color: "#F0A33A",
    formato: "escritorio",
    embebible: false,
    vistas: [vista("forja", "red", "La red", "https://yunque-rust.vercel.app/forja", [900], [1688])],
  },
  {
    id: "millonarios",
    nombre: "Millonarios",
    cliente: "Casino online · Argentina",
    tipo: "sitio",
    rubro: "Entretenimiento +18",
    estado: "Modo prueba",
    resumen: "Un casino online para Argentina, en modo prueba: se juega con fichas sin valor.",
    puntos: [
      "Verificación de edad antes de entrar",
      "Tragamonedas, casino en vivo, juegos crash y más, por categoría",
      "Juego responsable y la línea de ayuda siempre a la vista",
    ],
    color: "#F28C38",
    formato: "escritorio",
    embebible: false,
    vistas: [vista("millonarios", "inicio", "Inicio", "https://millonarios-test.netlify.app/", [900], [2196])],
  },
  {
    id: "ideario",
    nombre: "Ideario",
    cliente: "App web para equipos",
    tipo: "app",
    rubro: "Productividad",
    estado: "En línea",
    resumen:
      "Las ideas del equipo, fuera del chat: proyectos, tablero, pizarra y un agente de IA que propone cosas nuevas todos los días.",
    puntos: [
      "Colaboración en vivo: cada cambio aparece al instante",
      "Kanban, lista y pizarra con notas, cajas y flechas",
      "Un agente de IA que lee el contexto y no repite ideas descartadas",
    ],
    color: "#8B7CF6",
    formato: "escritorio",
    embebible: true,
    vistas: [
      vista(
        "ideario",
        "inicio",
        "Inicio",
        "https://ideario-two.vercel.app/app/projects/1ebb554f-5eb8-4c06-917a-2484637a72f1?view=ai",
        [900],
        [1688],
      ),
    ],
  },
  {
    id: "firmamento",
    nombre: "Firmamento",
    cliente: "Panel de proyectos",
    tipo: "sistema",
    rubro: "Monitoreo",
    estado: "Demo",
    resumen: "Todos tus proyectos en un mismo cielo: cada web es un mundo, con su estado y sus alertas.",
    puntos: [
      "Estado en línea y disponibilidad de cada sitio",
      "Aviso antes de que venza un dominio",
      "Los proyectos en formación, aparte de los que ya están en línea",
    ],
    color: "#B388FF",
    formato: "escritorio",
    embebible: false,
    vistas: [vista("firmamento", "inicio", "Inicio", "https://firmamento-demo.vercel.app/", [900], [1722])],
  },
  {
    id: "hackfit",
    nombre: "HackFit",
    cliente: "Producto propio · by Quvant",
    tipo: "app",
    rubro: "Gimnasios y fitness",
    estado: "En desarrollo",
    resumen: "La app para los socios del gimnasio: la dieta a medida, las calorías del día y rutinas que se adaptan.",
    puntos: [
      "Un plan de comidas según tu objetivo, tus gustos y tu presupuesto",
      "Escaneás el código de barras y se registra lo que comés",
      "Rutinas con series y el progreso de cada día",
    ],
    color: "#B5E048",
    formato: "celular",
    embebible: true,
    // La página que mandó fabrizio (/equipo/plataforma) es solo para el
    // rol admin; se muestra la entrada de la app.
    vistas: [vista("hackfit", "inicio", "Inicio", "https://hackfit-app-fabri.netlify.app/", [900], [1688])],
  },
  {
    id: "gene-keys",
    nombre: "Gene Keys",
    cliente: "Claves Genéticas",
    tipo: "app",
    rubro: "Bienestar",
    estado: "En línea",
    resumen: "Un viaje de autoconocimiento a través de las Claves Genéticas: tus dones, tus sombras y tu propósito.",
    puntos: [
      "Cuenta propia para seguir tu recorrido",
      "La información se guarda solo en tu dispositivo",
      "Pensada para leer con calma, también en el celular",
    ],
    color: "#E58FC8",
    formato: "celular",
    embebible: true,
    vistas: [vista("gene-keys", "inicio", "Inicio", "https://gene-keys.onrender.com/", [1129], [1960])],
  },
];
