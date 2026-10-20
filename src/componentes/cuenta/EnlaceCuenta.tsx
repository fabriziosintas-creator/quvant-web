"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAVEGACION } from "@/datos/textos";

type Quien = "nadie" | "persona" | "admin";

/** El rol ya consultado, para no volver a preguntarle a la base en cada página. */
let rolGuardado: { id: string; quien: Quien } | null = null;

/**
 * Quién está en la web, para el encabezado. Sin cookies de sesión de
 * Supabase ("sb-…") no se carga nada: la mayoría de las visitas no paga ni
 * un byte. Con cookie, se trae el cliente de Supabase recién ahí y se lee
 * la sesión guardada en el navegador y el rol del propio perfil (RLS).
 *
 * Es solo para mostrar el enlace correcto: lo que protege /cuenta y /panel
 * es el servidor, no esto.
 */
async function averiguarQuien(): Promise<Quien> {
  if (!document.cookie.includes("sb-")) return "nadie";
  const { crearClienteNavegador } = await import("@/supabase/navegador");
  const supabase = crearClienteNavegador();
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) return "nadie";
  if (rolGuardado?.id === id) return rolGuardado.quien;
  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", id).maybeSingle();
  const quien: Quien = perfil?.rol === "admin" ? "admin" : "persona";
  rolGuardado = { id, quien };
  return quien;
}

const CLASE =
  "inline-flex h-9 items-center gap-2 font-plex text-[11px] font-medium uppercase tracking-[0.14em] transition-colors md:h-10 md:text-xs";

/** "Ingresar", "Mi cuenta" y, solo para admin, "Panel". */
export function EnlaceCuenta() {
  const ruta = usePathname();
  const [quien, setQuien] = useState<Quien>("nadie");

  useEffect(() => {
    let vigente = true;
    averiguarQuien()
      .then((resultado) => vigente && setQuien(resultado))
      .catch(() => vigente && setQuien("nadie"));
    return () => {
      vigente = false;
    };
  }, [ruta]);

  const actual = (destino: string) => (ruta === destino || ruta.startsWith(`${destino}/`) ? "page" : undefined);

  if (quien === "nadie") {
    return (
      <Link href="/ingresar" aria-current={actual("/ingresar")} className={`${CLASE} px-1 text-acero hover:text-blanco aria-[current=page]:text-blanco`}>
        {NAVEGACION.ingresar}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 md:gap-4">
      {quien === "admin" ? (
        <Link href="/panel" aria-current={actual("/panel")} className={`${CLASE} text-acero hover:text-blanco aria-[current=page]:text-blanco`}>
          <span aria-hidden className="size-1.5 border border-acero" />
          {NAVEGACION.panel}
        </Link>
      ) : null}
      {/* En el celular no entran los tres: el admin ve solo "Panel" (desde el panel se llega a la cuenta). */}
      <Link
        href="/cuenta"
        aria-current={actual("/cuenta")}
        className={`${CLASE} text-acero hover:text-blanco aria-[current=page]:text-blanco ${quien === "admin" ? "max-md:hidden" : ""}`}
      >
        <span aria-hidden className="size-1.5 bg-acero" />
        <span className="md:hidden">{NAVEGACION.cuentaCorto}</span>
        <span className="hidden md:inline">{NAVEGACION.miCuenta}</span>
      </Link>
    </div>
  );
}
