import type { CSSProperties, ReactNode } from "react";
import { CUENTA } from "@/datos/textos";

/**
 * El marco de las páginas de cuenta (registro, ingreso, cuenta,
 * privacidad): el mismo arranque que los canales (etiqueta en Michroma con
 * el punto de color, título y una línea de bajada) y el contenido en una
 * columna angosta, cómoda para completar en el celular.
 */
export function MarcoCuenta({
  titulo,
  bajada,
  etiqueta = CUENTA.etiqueta,
  acento = "#9C9CA3",
  ancho = "angosto",
  children,
}: {
  titulo: ReactNode;
  bajada?: ReactNode;
  etiqueta?: string;
  /** El color del punto y del brillo de arriba (en la cuenta, el del rubro de la persona). */
  acento?: string;
  ancho?: "angosto" | "lectura";
  children: ReactNode;
}) {
  return (
    <div className="relative" style={{ "--acento": acento } as CSSProperties}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{
          background:
            "radial-gradient(ellipse 55% 65% at 12% 0%, color-mix(in srgb, var(--acento) 12%, transparent), transparent 70%)",
        }}
      />
      <div className={`contenedor relative pb-20 pt-28 md:pb-28 md:pt-36 ${ancho === "angosto" ? "max-w-2xl" : "max-w-3xl"}`}>
        <p className="flex items-center gap-3 font-lectura text-sm font-medium text-acero">
          <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
          {etiqueta}
        </p>
        <h1 className="mt-6 titulo text-[clamp(2rem,6vw,3.25rem)] leading-[1.08] text-blanco">{titulo}</h1>
        {bajada ? (
          <p className="mt-5 font-lectura text-base leading-relaxed text-blanco md:text-lg">{bajada}</p>
        ) : null}
        <div className="mt-10 md:mt-12">{children}</div>
      </div>
    </div>
  );
}
