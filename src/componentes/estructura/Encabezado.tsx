"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type CSSProperties } from "react";
import { tipoTransicion } from "@/componentes/canales/navegacion";
import { EnlaceCuenta } from "@/componentes/cuenta/EnlaceCuenta";
import { Logotipo } from "@/componentes/marca/Logotipo";
import { ACENTO_CANAL } from "@/datos/colores";
import { ACCESIBILIDAD, CANALES, NAVEGACION } from "@/datos/textos";

/** Contacto va aparte, como botón: el resto son los canales de la píldora. */
const EN_LA_PILDORA = CANALES.filter((canal) => canal.id !== "contacto");
const CONTACTO = CANALES.find((canal) => canal.id === "contacto")!;

/**
 * El encabezado fijo, translúcido.
 *
 * Computadora: la firma a la izquierda, los canales en una píldora al
 * centro (el actual en blanco, con su color) y a la derecha "Hablemos".
 * Antes de "Hablemos", la cuenta: "Ingresar", "Mi cuenta" y "Panel"
 * (solo admin), ver EnlaceCuenta.
 * Celular: la firma, la cuenta y "Hablemos". Los canales están en la barra de abajo
 * (DockCanales), al alcance del pulgar.
 *
 * Lleva su propio nombre de transición: al cambiar de canal la página se
 * desliza y el encabezado queda quieto (ver globals.css).
 *
 * En el celular se va al bajar y vuelve apenas se sube (con la barra de
 * capítulos, que sube a ocupar su lugar): así no hay tres barras fijas
 * comiéndose la pantalla. Arriba de todo, con el chat o el visor abiertos,
 * o con el foco adentro, está siempre.
 */
export function Encabezado() {
  const ruta = usePathname();
  const enContacto = ruta === CONTACTO.ruta;

  useEffect(() => {
    const raiz = document.documentElement;
    const celular = window.matchMedia("(max-width: 47.99rem)");
    let ancla = window.scrollY;
    let cuadro = 0;
    raiz.dataset.encabezado = "visible";
    const medir = () => {
      cuadro = 0;
      const y = window.scrollY;
      const delta = y - ancla;
      const fijo = !celular.matches || y < 80 || raiz.classList.contains("chat-abierto") || raiz.classList.contains("visor-abierto");
      if (fijo) {
        raiz.dataset.encabezado = "visible";
        ancla = y;
        return;
      }
      // Un margen chico para que un temblor del dedo no lo haga ir y venir.
      if (Math.abs(delta) < 8) return;
      raiz.dataset.encabezado = delta > 0 ? "oculto" : "visible";
      ancla = y;
    };
    const alDesplazar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(medir);
    };
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => {
      window.removeEventListener("scroll", alDesplazar);
      cancelAnimationFrame(cuadro);
      raiz.dataset.encabezado = "visible";
    };
  }, [ruta]);

  return (
    <header
      style={{ viewTransitionName: "encabezado" }}
      className="encabezado-fijo fixed inset-x-0 top-0 z-50 border-b border-profundo/70 bg-negro/80 backdrop-blur-md"
    >
      <div className="contenedor flex h-16 items-center justify-between gap-4 md:h-20">
        <Link
          href="/"
          aria-label={ACCESIBILIDAD.irAlInicio}
          transitionTypes={[tipoTransicion(ruta, "/")]}
          className="shrink-0"
        >
          <Logotipo idGradiente="q-encabezado" className="text-[15px] lg:text-[20px]" />
        </Link>

        <nav aria-label={NAVEGACION.navPrincipal} className="hidden md:block">
          <ul className="flex items-center gap-0.5 rounded-full border border-profundo bg-profundo/30 p-1">
            {EN_LA_PILDORA.map((canal) => {
              const activo = ruta === canal.ruta;
              return (
                <li key={canal.id}>
                  <Link
                    href={canal.ruta}
                    aria-current={activo ? "page" : undefined}
                    transitionTypes={[tipoTransicion(ruta, canal.ruta)]}
                    style={{ "--acento": ACENTO_CANAL[canal.id] } as CSSProperties}
                    className={`group flex items-center gap-2 rounded-full px-3 py-2 font-lectura text-[13px] font-medium transition-colors lg:px-4 lg:text-xs ${
                      activo ? "bg-blanco text-negro" : "text-acero hover:text-blanco"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`size-1.5 transition-colors ${
                        activo ? "bg-[var(--acento)]" : "bg-profundo group-hover:bg-[var(--acento)]"
                      }`}
                    />
                    {canal.nombre}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <EnlaceCuenta />
          <Link
            href={CONTACTO.ruta}
            aria-current={enContacto ? "page" : undefined}
            data-medir="contacto"
            transitionTypes={[tipoTransicion(ruta, CONTACTO.ruta)]}
            className={`rounded-full inline-flex h-9 items-center gap-2 px-4 font-lectura text-sm font-medium transition-colors md:h-10 md:px-5 ${
              enContacto
                ? "border border-blanco text-blanco"
                : "bg-blanco text-negro hover:bg-acero"
            }`}
          >
            <span aria-hidden className="size-1.5" style={{ background: ACENTO_CANAL.contacto }} />
            {NAVEGACION.hablemos}
          </Link>
        </div>
      </div>
    </header>
  );
}
