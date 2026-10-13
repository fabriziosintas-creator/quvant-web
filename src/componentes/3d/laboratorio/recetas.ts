/**
 * Recetas de cromo para el laboratorio interno (/laboratorio-cromo).
 * Cada receta define el material de la Q y el entorno que refleja.
 * Cuando fabrizio elija una, se aplica a la portada y este laboratorio
 * puede borrarse o quedar como herramienta.
 */

export type Panel = {
  posicion: [number, number, number];
  rotacion?: [number, number, number];
  escala: [number, number];
  intensidad: number;
  color?: string;
};

export type RecetaCromo = {
  letra: string;
  nombre: string;
  descripcion: string;
  rugosidad: number;
  intensidadReflejo: number;
  /** Si está definido, el material pasa a MeshPhysicalMaterial con laca. */
  laca?: number;
  /** Color base del entorno. Sin `paneles`, se usa el degradado literal del manual. */
  fondo?: string;
  paneles?: Panel[];
};

export const VARIANTES: RecetaCromo[] = [
  {
    letra: "A",
    nombre: "Estudio plata",
    descripcion: "Base gris plata, cielo blanco y una veta oscura. Fue la primera propuesta.",
    rugosidad: 0.05,
    intensidadReflejo: 1.45,
    fondo: "#7c7f85",
    paneles: [
      { posicion: [0, 6, 0], rotacion: [Math.PI / 2, 0, 0], escala: [16, 12], intensidad: 2.6 },
      { posicion: [-6, 1, 2], rotacion: [0, Math.PI / 2, 0], escala: [7, 2], intensidad: 1.4 },
      { posicion: [6, 2, 2], rotacion: [0, -Math.PI / 2, 0], escala: [7, 1.6], intensidad: 1 },
      { posicion: [0, -5, 2], rotacion: [-Math.PI / 2, 0, 0], escala: [14, 10], intensidad: 0.9 },
      { posicion: [0, -0.6, 5], rotacion: [0, Math.PI, 0], escala: [18, 1.3], intensidad: 1, color: "#26262b" },
      { posicion: [-3, 3.4, -5], escala: [12, 1], intensidad: 1, color: "#3a3d42" },
      { posicion: [2, 3, 4], rotacion: [Math.PI / 2.6, 0.4, 0], escala: [8, 0.6], intensidad: 3.2 },
    ],
  },
  {
    letra: "B",
    nombre: "Plata clara",
    descripcion: "Casi todo luz: plateado luminoso con una sola vena finita. El más claro.",
    rugosidad: 0.05,
    intensidadReflejo: 1.5,
    fondo: "#a4a8ae",
    paneles: [
      { posicion: [0, 6, 0], rotacion: [Math.PI / 2, 0, 0], escala: [18, 14], intensidad: 3 },
      { posicion: [0, -5, 2], rotacion: [-Math.PI / 2, 0, 0], escala: [16, 10], intensidad: 1.4 },
      { posicion: [0, -0.4, 5], rotacion: [0, Math.PI, 0], escala: [16, 0.9], intensidad: 1, color: "#4a4d52" },
      { posicion: [2, 3, 4], rotacion: [Math.PI / 2.6, 0.4, 0], escala: [8, 0.6], intensidad: 2.6 },
    ],
  },
  {
    letra: "C",
    nombre: "Automotor",
    descripcion: "Espejo brillante con una banda negra marcada, como paragolpes cromado.",
    rugosidad: 0.03,
    intensidadReflejo: 1.4,
    fondo: "#d9dce0",
    paneles: [
      { posicion: [0, 6, 0], rotacion: [Math.PI / 2, 0, 0], escala: [18, 14], intensidad: 2.2 },
      { posicion: [0, 0, 5], rotacion: [0, Math.PI, 0], escala: [20, 2.6], intensidad: 1, color: "#08080a" },
      { posicion: [0, 0, -5], escala: [20, 2.6], intensidad: 1, color: "#08080a" },
      { posicion: [0, -5, 1], rotacion: [-Math.PI / 2, 0, 0], escala: [16, 10], intensidad: 1, color: "#6c7076" },
    ],
  },
  {
    letra: "D",
    nombre: "Degradado del manual",
    descripcion: "La Q refleja, literal, las siete paradas del degradado oficial del logo.",
    rugosidad: 0.04,
    intensidadReflejo: 1.3,
  },
  {
    letra: "E",
    nombre: "Satinado",
    descripcion: "Aluminio cepillado: menos espejo, tono más parejo y siempre claro.",
    rugosidad: 0.22,
    intensidadReflejo: 1.3,
    fondo: "#9da1a7",
    paneles: [
      { posicion: [0, 6, 0], rotacion: [Math.PI / 2, 0, 0], escala: [18, 14], intensidad: 2.6 },
      { posicion: [0, -5, 2], rotacion: [-Math.PI / 2, 0, 0], escala: [16, 10], intensidad: 1.2 },
      { posicion: [0, -0.4, 5], rotacion: [0, Math.PI, 0], escala: [16, 1], intensidad: 1, color: "#3a3d42" },
    ],
  },
  {
    letra: "F",
    nombre: "Joya con laca",
    descripcion: "Cromo líquido: capa de laca brillante arriba del metal, reflejos dobles.",
    rugosidad: 0.14,
    intensidadReflejo: 1.35,
    laca: 1,
    fondo: "#c9ccd1",
    paneles: [
      { posicion: [0, 6, 0], rotacion: [Math.PI / 2, 0, 0], escala: [18, 14], intensidad: 2.8 },
      { posicion: [0, -0.6, 5], rotacion: [0, Math.PI, 0], escala: [16, 0.9], intensidad: 1, color: "#26262b" },
      { posicion: [-3, 3.2, -5], escala: [12, 0.8], intensidad: 1, color: "#3a3d42" },
      { posicion: [0, -5, 2], rotacion: [-Math.PI / 2, 0, 0], escala: [16, 10], intensidad: 1.1 },
      { posicion: [2, 3, 4], rotacion: [Math.PI / 2.6, 0.4, 0], escala: [8, 0.6], intensidad: 3 },
    ],
  },
];
