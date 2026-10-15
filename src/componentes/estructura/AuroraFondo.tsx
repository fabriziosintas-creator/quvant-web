import { AURORA } from "@/datos/colores";

/**
 * El brillo de fondo: tres manchas de color muy desenfocadas que se mueven
 * despacio detrás del contenido (portada y cierre). Van en mix-blend-mode
 * screen: sobre el negro casi no cambian nada, y al video de la portada
 * (la Q de cromo) le prestan un poco de color. Sin movimiento con prefers-reduced-motion ni en
 * vista texto (ver .aurora en globals.css).
 */
export function AuroraFondo({ intensidad = 0.55 }: { intensidad?: number }) {
  const manchas = [
    { color: AURORA[0], clase: "left-[8%] top-[10%]", animacion: "aurora-a 26s ease-in-out infinite" },
    { color: AURORA[1], clase: "right-[4%] top-[30%]", animacion: "aurora-b 33s ease-in-out infinite" },
    { color: AURORA[2], clase: "left-[38%] bottom-[-10%]", animacion: "aurora-c 39s ease-in-out infinite" },
  ];

  return (
    <div
      aria-hidden
      className="aurora pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity: intensidad, mixBlendMode: "screen" }}
    >
      {manchas.map((mancha) => (
        <span
          key={mancha.color}
          className={`absolute size-[52vmax] rounded-full ${mancha.clase}`}
          style={{
            background: `radial-gradient(circle, ${mancha.color}66 0%, ${mancha.color}1f 35%, transparent 62%)`,
            filter: "blur(70px)",
            animation: mancha.animacion,
          }}
        />
      ))}
    </div>
  );
}
