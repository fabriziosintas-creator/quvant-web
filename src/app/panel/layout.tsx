import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { EncabezadoPanel } from "@/componentes/panel/EncabezadoPanel";
import { PANEL_ADMIN } from "@/datos/textos";
import { exigirAdmin } from "@/servidor/panel/acceso";

/**
 * El panel interno: solo admin. Sin el encabezado del sitio, fuera del
 * sitemap y de los buscadores (robots.ts también lo cierra).
 *
 * Lee la sesión, así que va detrás de un <Suspense>: sin sesión, a
 * /ingresar; con sesión pero sin ser admin, a la portada (sin decir que el
 * panel existe). Cada página vuelve a pedir los datos con la sesión del
 * admin, y la base (RLS) no le da nada a quien no lo sea.
 */
export const metadata: Metadata = {
  title: `${PANEL_ADMIN.titulo} · Quvant`,
  robots: { index: false, follow: false },
};

export default function LayoutPanel({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-negro [--alto-panel:6.25rem] md:[--alto-panel:3.5rem]">
      <Suspense fallback={<div className="h-[var(--alto-panel)] border-b border-profundo" />}>
        <Guardia>{children}</Guardia>
      </Suspense>
    </div>
  );
}

async function Guardia({ children }: { children: ReactNode }) {
  const { perfil } = await exigirAdmin("/panel");
  return (
    <>
      <EncabezadoPanel nombre={perfil.nombre} />
      {children}
    </>
  );
}
