"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { PANEL_ADMIN } from "@/datos/textos";
import { contarPorTipo, type Operacion, type TipoOperacion } from "@/sinconexion/cola";
import { EVENTO_COLA, avisarEstado, descartar, procesarCola, reintentar, type DetalleCola } from "@/sinconexion/sincronizador";

/**
 * "Sin señal · 2 pendientes": discreto, con su palabra. Registra el service
 * worker del panel, manda la cola al volver la conexión, al abrir el panel,
 * cada minuto y cuando el service worker avisa (Background Sync), y
 * muestra "Se mandaron 3 visitas" y lo que el servidor no aceptó.
 */

const S = PANEL_ADMIN.sinSenal;

const suscribirConexion = (aviso: () => void) => {
  window.addEventListener("online", aviso);
  window.addEventListener("offline", aviso);
  return () => {
    window.removeEventListener("online", aviso);
    window.removeEventListener("offline", aviso);
  };
};

const cantidad = (n: number, t: { uno: string; varios: string }) => (n === 1 ? t.uno : t.varios.replace("{n}", String(n)));

export function textoEnviadas(ops: Operacion[]) {
  const c = contarPorTipo(ops);
  const partes = (Object.keys(c) as TipoOperacion[]).filter((t) => c[t] > 0).map((t) => cantidad(c[t], S.tipos[t]));
  return S.enviadas.replace("{detalle}", partes.length > 1 ? `${partes.slice(0, -1).join(", ")}${S.y}${partes.at(-1)}` : (partes[0] ?? ""));
}

export function IndicadorConexion() {
  const quieto = useReducedMotion();
  const enLinea = useSyncExternalStore(suscribirConexion, () => navigator.onLine, () => true);
  const montado = useSyncExternalStore(suscribirConexion, () => true, () => false);
  const [cola, setCola] = useState<DetalleCola>({ pendientes: 0, rechazadas: [], sinSesion: false });
  const [aviso, setAviso] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const alCambiar = (e: Event) => {
      const d = (e as CustomEvent<DetalleCola>).detail;
      setCola(d);
      if (d.enviadas?.length) setAviso(textoEnviadas(d.enviadas));
    };
    window.addEventListener(EVENTO_COLA, alCambiar);
    const mandar = () => void procesarCola();
    window.addEventListener("online", mandar);
    const alMensaje = (e: MessageEvent) => {
      if (e.data === "quvant:sincronizar") mandar();
    };
    navigator.serviceWorker?.addEventListener("message", alMensaje);
    // El service worker solo vive en /panel/: la web pública queda igual.
    navigator.serviceWorker?.register("/sw-panel.js", { scope: "/panel/" }).catch((error) => console.error("[sin señal] service worker:", error));
    void avisarEstado().then(mandar);
    const reloj = setInterval(mandar, 60_000);
    return () => {
      window.removeEventListener(EVENTO_COLA, alCambiar);
      window.removeEventListener("online", mandar);
      navigator.serviceWorker?.removeEventListener("message", alMensaje);
      clearInterval(reloj);
    };
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const hayAlgo = !enLinea || cola.pendientes > 0 || cola.rechazadas.length > 0 || cola.sinSesion;
  const etiqueta = [!enLinea ? S.sinSenal : null, cola.pendientes > 0 ? cantidad(cola.pendientes, S.pendientes) : null, cola.rechazadas.length > 0 ? `${cola.rechazadas.length} ${S.rechazadas.toLowerCase()}` : null].filter(Boolean).join(" · ");

  return (
    <>
      {hayAlgo ? (
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
          aria-label={etiqueta || S.conSenal}
          className="flex items-center gap-2 whitespace-nowrap border border-profundo px-2 py-1 font-plex text-[10px] uppercase tracking-etiqueta text-acero hover:text-blanco"
        >
          <span aria-hidden className={`size-1.5 ${enLinea ? "bg-[#FFB547]" : "bg-[#F8717A]"}`} />
          {/* En el celular, solo el punto y cuántas quedan: el encabezado no da para más. */}
          <span aria-hidden className="sm:hidden">{cola.pendientes + cola.rechazadas.length || (enLinea ? "" : "✕")}</span>
          <span aria-hidden className="hidden sm:inline">{etiqueta || S.conSenal}</span>
        </button>
      ) : null}

      {montado
        ? createPortal(
            <>
              <AnimatePresence>
                {abierto && hayAlgo ? (
                  <motion.div
                    role="dialog"
                    aria-label={etiqueta}
                    initial={quieto ? false : { y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed right-4 top-[calc(var(--alto-panel,3.5rem)+0.5rem)] z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 border border-profundo bg-negro p-4 font-plex text-xs text-acero"
                  >
                    {!enLinea ? <p>{S.guardado}</p> : null}
                    {cola.sinSesion ? (
                      <p>
                        {S.sinSesion}{" "}
                        <Link href={`/ingresar?siguiente=${encodeURIComponent("/panel/mapa")}`} className="text-blanco underline underline-offset-4">
                          {S.ingresar}
                        </Link>
                      </p>
                    ) : null}
                    {enLinea && cola.pendientes > 0 ? (
                      <button type="button" onClick={() => void procesarCola(true)} className="w-fit border border-profundo px-3 py-1.5 uppercase tracking-etiqueta text-blanco hover:border-acero">
                        {S.mandarAhora}
                      </button>
                    ) : null}
                    {cola.rechazadas.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <p className="uppercase tracking-etiqueta text-blanco">{S.rechazadas}</p>
                        <p>{S.rechazadasAyuda}</p>
                        <ul className="flex flex-col gap-2">
                          {cola.rechazadas.map((op) => (
                            <li key={op.clave} className="flex flex-col gap-1 border-t border-profundo pt-2">
                              <span className="font-lectura text-sm text-blanco">{op.titulo}</span>
                              {op.motivo ? <span>{op.motivo}</span> : null}
                              <span className="flex gap-3 uppercase tracking-etiqueta">
                                <button type="button" onClick={() => void reintentar(op)} className="text-blanco hover:underline">
                                  {S.reintentar}
                                </button>
                                <button type="button" onClick={() => void descartar(op)} className="hover:text-blanco">
                                  {S.descartar}
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <AnimatePresence>
                {aviso ? (
                  <motion.p
                    role="status"
                    initial={quieto ? false : { y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed bottom-4 left-4 z-50 border border-profundo bg-negro px-4 py-3 font-plex text-xs text-blanco"
                  >
                    {aviso}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
