import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { EncabezadoPanel } from "@/componentes/panel/EncabezadoPanel";
import { MarcarEquipo } from "@/componentes/panel/MarcarEquipo";
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
  // App instalable solo para el panel (la web pública no enlaza manifiesto).
  manifest: "/manifiesto-panel",
  appleWebApp: { capable: true, title: "Quvant", statusBarStyle: "black-translucent" },
};

export default function LayoutPanel({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-negro [--alto-panel:6.25rem]">
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
      <MarcarEquipo />
      <EncabezadoPanel nombre={perfil.nombre} />
      {children}
    </>
  );
}
