"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useLiviano } from "@/estado/liviano";
import { usePrefiereQuieto } from "@/estado/quieto";
import { useVista } from "@/estado/vista";

/**
 * El fondo de la portada: el hero-loop (24 s, sin texto, sale de video/ en
 * este repo con npm run entregas -- web). La Q cromada gira a la derecha
 * sobre capturas de Yunque y Forja; el tercio izquierdo es negro, para el
 * título y los botones.
 *
 * - En vista texto, con "menos movimiento", en modo liviano (celulares
 *   muy modestos o con ahorro de datos) y mientras se decide la vista
 *   (en el servidor) va el póster: el primer cuadro, con la Q de frente. El
 *   video arranca justo ahí, así que no hay salto al pasar del póster al
 *   video.
 * - mix-blend-mode: lighten. El negro del video es #0D0D0F, el mismo del
 *   sitio: con lighten, donde el video es negro gana el fondo (aunque el
 *   navegador lo decodifique un punto más oscuro) y donde hay imagen gana
 *   el video. Con screen el negro se levantaría a #191A1D.
 * - Fuera de pantalla se pausa.
 * - En el celular y la tablet ocupa la parte de arriba (la Q queda sobre
 *   el título) y se funde a negro hacia abajo.
 * - Desde lg es una ventana 16:9 a la derecha del título, con los bordes
 *   fundidos (.portada-video en globals.css): a pantalla completa la Q
 *   chocaba con la T de QUVANT.
 */

/** En la franja de arriba, anclado a la derecha: ahí está la Q. Desde lg la caja ya es 16:9. */
const ENCUADRE = "object-cover object-[69%_50%] mix-blend-lighten lg:object-center";

export function VideoPortada() {
  const video = useRef<HTMLVideoElement>(null);
  const vista = useVista();
  const quieto = usePrefiereQuieto();
  const liviano = useLiviano();
  const enMovimiento = vista === "3d" && !quieto && !liviano;

  useEffect(() => {
    const elemento = video.current;
    if (!elemento) return;
    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) elemento.play().catch(() => {});
      else elemento.pause();
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [enMovimiento]);

  return (
    <div
      aria-hidden
      className="portada-video pointer-events-none absolute inset-x-0 top-0 h-[64svh] overflow-hidden"
    >
      {enMovimiento ? (
        <video
          ref={video}
          className={`absolute inset-0 size-full ${ENCUADRE}`}
          poster="/hero/hero-poster.webp"
          autoPlay
          muted
          loop
          playsInline
        >
          {/* AV1 primero (pesa menos de 1 MB); el 4K solo en pantallas muy anchas; H.264 de respaldo. */}
          <source src="/hero/hero-loop-4k.webm" type='video/webm; codecs="av01.0.13M.08"' media="(min-width: 2561px)" />
          <source src="/hero/hero-loop-1080.webm" type='video/webm; codecs="av01.0.09M.08"' />
          <source src="/hero/hero-loop-1080.mp4" type="video/mp4" />
        </video>
      ) : (
        <Image
          src="/hero/hero-poster.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className={ENCUADRE}
        />
      )}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-b from-transparent to-negro lg:hidden" />
    </div>
  );
}
