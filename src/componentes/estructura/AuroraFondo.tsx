import { AURORA } from "@/datos/colores";

/**
 * El brillo de fondo: tres manchas de color muy desenfocadas que se mueven
 * despacio detrás del contenido (portada y cierre). Van en mix-blend-mode
 * screen: sobre el negro casi no cambian nada, y al video de la portada
 * (la Q de cromo) le prestan un poco de color. Sin movimiento con prefers-reduced-motion ni en
 * vista texto (ver .aurora en globals.css).
 *
 * La suavidad sale del degradé, no de un filter: blur (que en un celular
 * de gama media se recalculaba en cada cuadro), y fuera de pantalla las
 * manchas quedan en pausa (data-pausable).
 */
export function AuroraFondo({ intensidad = 0.55 }: { intensidad?: number }) {
  const manchas = [
    { color: AURORA[0], clase: "left-[8%] top-[10%]", animacion: "aurora-a 26s var(--ease-vaiven) infinite" },
    { color: AURORA[1], clase: "right-[4%] top-[30%]", animacion: "aurora-b 33s var(--ease-vaiven) infinite" },
    { color: AURORA[2], clase: "left-[38%] bottom-[-10%]", animacion: "aurora-c 39s var(--ease-vaiven) infinite" },
  ];

  return (
    <div
      aria-hidden
      data-pausable
      className="aurora pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity: intensidad, mixBlendMode: "screen" }}
    >
      {manchas.map((mancha) => (
        <span
          key={mancha.color}
          className={`absolute size-[52vmax] rounded-full ${mancha.clase}`}
          style={{
            background: `radial-gradient(circle, ${mancha.color}52 0%, ${mancha.color}33 18%, ${mancha.color}1a 36%, ${mancha.color}0a 52%, transparent 68%)`,
            animation: mancha.animacion,
          }}
        />
      ))}
    </div>
  );
}
