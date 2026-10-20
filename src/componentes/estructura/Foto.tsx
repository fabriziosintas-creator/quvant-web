import Image from "next/image";
import { fotoDe, pendienteDe } from "@/datos/fotos";
import { Grano } from "./Grano";

/**
 * Una foto real del sitio (web más humana, paso 6): esquinas de 16 px,
 * tamaños correctos, desenfoque mientras carga y el tratamiento de color
 * del sitio (clase .foto-real en globals.css: color real con un retoque
 * leve; cambiar ahí para pasar todo a blanco y negro).
 *
 * Toma la foto del registro (src/datos/fotos.ts). Sin permiso o sin
 * archivo: en producción no se muestra nada; en desarrollo, un recuadro
 * con el TODO. Nunca un recuadro gris en la web publicada.
 */

/** Un desenfoque neutro mientras carga (sin generar uno por foto). */
const DESENFOQUE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#26262B"/></svg>');

export function Foto({
  id,
  sizes,
  className = "",
  proporcion = "aspect-[4/3]",
  prioridad = false,
}: {
  id: string;
  /** El atributo sizes de next/image (por ejemplo "(min-width: 1024px) 50vw, 100vw"). */
  sizes: string;
  className?: string;
  proporcion?: string;
  prioridad?: boolean;
}) {
  const foto = fotoDe(id);
  if (!foto) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <div className={`flex ${proporcion} items-center justify-center rounded-2xl border border-dashed border-profundo p-4 ${className}`} aria-hidden>
        <p className="text-center font-plex text-xs text-acero">TODO: {pendienteDe(id)}</p>
      </div>
    );
  }
  return (
    <div className={`relative ${proporcion} overflow-hidden rounded-2xl bg-negro ${className}`}>
      <Image src={foto.archivo} alt={foto.alt} fill sizes={sizes} priority={prioridad} placeholder="blur" blurDataURL={DESENFOQUE} className="foto-real object-cover" />
      <Grano />
    </div>
  );
}

/** Una foto chica y redonda (las caras de Contacto y Nosotros). */
export function Cara({ id, tamano = "size-14", className = "" }: { id: string; tamano?: string; className?: string }) {
  const foto = fotoDe(id);
  if (!foto) {
    if (process.env.NODE_ENV === "production") return null;
    return <span aria-hidden title={`TODO: ${pendienteDe(id)}`} className={`inline-block ${tamano} shrink-0 rounded-full border border-dashed border-profundo ${className}`} />;
  }
  return (
    <span className={`relative inline-block ${tamano} shrink-0 overflow-hidden rounded-full bg-negro ${className}`}>
      <Image src={foto.archivo} alt={foto.alt} fill sizes="96px" className="foto-real object-cover" />
    </span>
  );
}
