/**
 * Las clases de los formularios de cuenta, en un archivo común (sin "use
 * client") para que las usen tanto las páginas del servidor como los
 * componentes del navegador: un string exportado desde un archivo "use
 * client" no llega como string a un componente del servidor.
 */

export const CLASE_CAMPO =
  "w-full border border-profundo bg-transparent px-4 py-3 font-plex text-base text-blanco placeholder:text-acero/60 focus:border-acero focus:outline-none aria-[invalid=true]:border-blanco md:text-sm";

export const CLASE_ETIQUETA = "mb-2 block font-lectura text-sm font-medium text-acero";

export const CLASE_BOTON =
  "rounded-full inline-flex h-12 items-center justify-center gap-3 bg-blanco px-7 font-lectura text-sm font-medium text-negro transition-colors hover:bg-acero disabled:cursor-wait disabled:bg-acero";

export const CLASE_BOTON_SECUNDARIO =
  "rounded-full inline-flex h-12 items-center justify-center gap-3 border border-profundo px-7 font-lectura text-sm font-medium text-blanco transition-colors hover:border-acero disabled:cursor-wait";

export const CLASE_ENLACE = "text-blanco underline decoration-profundo underline-offset-4 hover:decoration-blanco";
