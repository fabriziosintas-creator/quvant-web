import { Cara } from "@/componentes/estructura/Foto";
import { TESTIMONIOS } from "@/datos/testimonios";

/**
 * Lo que dicen los clientes, con su nombre. La cita grande en la fuente
 * de texto (itálica), el nombre abajo en chico; sin comillas gigantes ni
 * estrellas. No aparece mientras no haya testimonios reales.
 */
export function Testimonios() {
  if (TESTIMONIOS.length === 0) return null;
  return (
    <ul className="grid gap-8 md:grid-cols-2">
      {TESTIMONIOS.map((t) => (
        <li key={`${t.nombre}-${t.empresa}`} className="flex flex-col gap-5">
          <blockquote className="font-lectura text-xl italic leading-relaxed text-blanco md:text-2xl">{t.cita}</blockquote>
          <figcaption className="flex items-center gap-3">
            {t.foto ? <Cara id={t.foto} tamano="size-10" /> : null}
            <span className="font-lectura text-sm text-acero">
              <span className="text-blanco">{t.nombre}</span> · {t.cargo}, {t.empresa}
            </span>
          </figcaption>
        </li>
      ))}
    </ul>
  );
}
