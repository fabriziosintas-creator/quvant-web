"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { idVisita, medir } from "@/componentes/medicion/medir";
import { CUENTA } from "@/datos/textos";
import { reenviarConfirmacion, registrarse, type EstadoFormulario } from "@/servidor/cuenta/acciones";
import { Aviso, CampoContrasena, Campo, Casilla } from "./Campos";
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO, CLASE_ENLACE } from "./estilos";
import { enviarSinReiniciar } from "./enviarSinReiniciar";
import { EleccionObjetivo, EleccionRubro, acentoDeNicho } from "./EleccionPerfil";
import { FichaRegistro } from "./registro/FichaRegistro";
import { EleccionBeneficio } from "@/componentes/promo/EleccionBeneficio";
import { TarjetaPromo } from "@/componentes/promo/TarjetaPromo";
import { PROMO, PROMO_TEXTOS, type IdBeneficio } from "@/datos/promo";

/** Lo que el registro necesita saber de la promo "Primeros 100" (si vino con ?promo=primeros-100). */
export type PromoRegistro = { quedan: number; tope: number; abierta: boolean; rubrosSistema: readonly string[] };

const INICIAL: EstadoFormulario = { estado: "inicial" };
const { campos, registro } = CUENTA;
const P = registro.pasos;

type IdPaso = "negocio" | "objetivo" | "beneficio" | "cuenta";
/** Qué campos vive en cada paso (para volver al paso del error que marque el servidor). */
const CAMPOS_DEL_PASO: Record<IdPaso, readonly string[]> = {
  negocio: ["nicho", "nichoOtro"],
  objetivo: ["objetivo"],
  beneficio: ["promo_beneficio"],
  cuenta: ["nombre", "apellido", "email", "contrasena", "telefono", "empresa", "ciudad", "privacidad"],
};
const VERDE_PROMO = "#7BD389";
/** Cuánto se ve la tarjeta elegida antes de pasar solo al paso siguiente. */
const AVANCE_SOLO_MS = 420;

const nombreDeNicho = (id: string) => CUENTA.nichos.find((n) => n.id === id)?.nombre ?? null;
const textoDeObjetivo = (id: string) => CUENTA.objetivos.find((o) => o.id === id)?.texto ?? null;

/**
 * El registro, por pasos: primero lo fácil y lo que entusiasma (de qué es
 * el negocio, qué quiere lograr y, con la promo, qué beneficio elige), al
 * final lo que más cuesta dar (email y contraseña). Es un solo <form>: los
 * pasos que no se ven quedan ocultos pero se mandan igual, así la acción
 * del servidor y su validación son las mismas de siempre. Si el servidor
 * marca un error, vuelve al paso de ese campo.
 *
 * Elegir el rubro le da su color a todo el registro (--acento-registro,
 * una propiedad registrada que pasa de un color a otro con transición).
 * Las tarjetas se inclinan en 3D con el mouse, los pasos entran girando en
 * perspectiva y, en computadora, la Q de cromo acompaña al costado con la
 * ficha que se arma (FichaRegistro). Con el mouse, elegir una tarjeta
 * avanza solo; con el teclado, no (las flechas cambian la elección).
 *
 * Al terminar: "Revisá tu email", con el sobre que se abre, los tres pasos
 * y el botón para abrir el correo (Gmail, Outlook…), que es donde más gente
 * se pierde.
 */
export function FormularioRegistro({ nicho = "", origen = "", promo = null }: { nicho?: string; origen?: string; promo?: PromoRegistro | null }) {
  const [estado, enviar, enviando] = useActionState(registrarse, INICIAL);
  // El id anónimo de la visita (el mismo de la medición) viaja con el
  // registro para unir "miró el rubro" con "se registró"; con "no rastrear"
  // no hay id y va vacío. Y se anota que empezó el registro.
  const [visita, setVisita] = useState("");
  useEffect(() => {
    const id = idVisita();
    if (id) queueMicrotask(() => setVisita(id));
    medir("inicio_registro", nicho || null);
    if (promo) medir("inicio_registro_promo", nicho || null);
  }, [nicho, promo]);

  const v = estado.valores ?? {};
  const e = estado.errores ?? {};
  const cadena = (campo: string) => (typeof v[campo] === "string" ? (v[campo] as string) : undefined);

  const pasos: IdPaso[] = promo ? ["negocio", "objetivo", "beneficio", "cuenta"] : ["negocio", "objetivo", "cuenta"];
  // Si llegó desde la página de un rubro, ese paso ya está hecho.
  const [paso, setPaso] = useState(() => (nicho ? 1 : 0));
  const [direccion, setDireccion] = useState<"adelante" | "atras">("adelante");
  const [aviso, setAviso] = useState<string | null>(null);
  const [nichoActual, setNichoActual] = useState(cadena("nicho") ?? nicho);
  const [objetivoActual, setObjetivoActual] = useState(cadena("objetivo") ?? "");
  const [beneficioActual, setBeneficioActual] = useState(cadena("promo_beneficio") ?? "");

  const formulario = useRef<HTMLFormElement>(null);
  const titulos = useRef<Array<HTMLHeadingElement | null>>([]);
  const enfocar = useRef(false);
  // El paso actual, para lo que corre fuera del render (el avance solo, después de una pausa).
  const pasoActual = useRef(paso);
  useEffect(() => {
    pasoActual.current = paso;
  }, [paso]);
  const ultimoToque = useRef(0);
  const tarjetaInclinada = useRef<HTMLElement | null>(null);

  // Si el servidor marca un error, se vuelve al primer paso que lo tiene.
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    if (estado.estado === "error") {
      const claves = Object.keys(estado.errores ?? {});
      const conError = pasos.findIndex((p) => claves.some((c) => CAMPOS_DEL_PASO[p].includes(c)));
      const destino = conError >= 0 ? conError : pasos.length - 1;
      if (destino !== paso) {
        setDireccion("atras");
        setPaso(destino);
      }
    }
  }

  // Al cambiar de paso: el foco va al título (lo anuncia el lector de pantalla) y el paso queda a la vista.
  useEffect(() => {
    if (!enfocar.current) return;
    enfocar.current = false;
    titulos.current[paso]?.focus({ preventScroll: true });
    const arriba = formulario.current?.getBoundingClientRect().top ?? 0;
    if (arriba < 90) window.scrollBy({ top: arriba - 120, behavior: "smooth" });
  }, [paso]);

  const acento = nichoActual ? acentoDeNicho(nichoActual) : promo ? VERDE_PROMO : "#9C9CA3";

  if (estado.estado === "listo") {
    return (
      <div className="registro" style={{ "--acento-registro": acento } as CSSProperties}>
        <div aria-hidden className="registro__fondo" />
        <RevisaTuEmail email={String(estado.valores?.email ?? "")} conPromo={estado.valores?.promo === true} />
      </div>
    );
  }

  const faltaEn = (p: IdPaso): string | null => {
    const datos = formulario.current ? new FormData(formulario.current) : null;
    if (!datos) return null;
    if (p === "negocio") {
      const elegido = String(datos.get("nicho") ?? "");
      if (!elegido) return P.faltaRubro;
      if (elegido === "otro" && !String(datos.get("nichoOtro") ?? "").trim()) return P.faltaOtro;
    }
    if (p === "objetivo" && !datos.get("objetivo")) return P.faltaObjetivo;
    if (p === "beneficio" && !datos.get("promo_beneficio")) return P.faltaBeneficio;
    return null;
  };

  const ir = (destino: number) => {
    setDireccion(destino > pasoActual.current ? "adelante" : "atras");
    setAviso(null);
    enfocar.current = true;
    setPaso(destino);
  };

  const seguir = () => {
    const desde = pasoActual.current;
    const falta = faltaEn(pasos[desde]);
    if (falta) {
      setAviso(falta);
      return;
    }
    if (desde < pasos.length - 1) ir(desde + 1);
  };

  const ultimo = paso === pasos.length - 1;

  // Inclinación 3D de las tarjetas (solo con mouse y sin "menos movimiento").
  const inclinar = (evento: PointerEvent<HTMLFormElement>) => {
    if (evento.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tarjeta = (evento.target as HTMLElement).closest<HTMLElement>(".tarjeta-3d");
    if (tarjetaInclinada.current && tarjetaInclinada.current !== tarjeta) {
      tarjetaInclinada.current.style.removeProperty("--rx");
      tarjetaInclinada.current.style.removeProperty("--ry");
    }
    tarjetaInclinada.current = tarjeta;
    if (!tarjeta) return;
    const caja = tarjeta.getBoundingClientRect();
    const x = (evento.clientX - caja.left) / caja.width - 0.5;
    const y = (evento.clientY - caja.top) / caja.height - 0.5;
    tarjeta.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
    tarjeta.style.setProperty("--rx", `${(-y * 12).toFixed(2)}deg`);
    tarjeta.style.setProperty("--luz-x", `${((x + 0.5) * 100).toFixed(0)}%`);
    tarjeta.style.setProperty("--luz-y", `${((y + 0.5) * 100).toFixed(0)}%`);
  };
  const enderezar = () => {
    tarjetaInclinada.current?.style.removeProperty("--rx");
    tarjetaInclinada.current?.style.removeProperty("--ry");
    tarjetaInclinada.current = null;
  };

  const tituloDe = (p: IdPaso) => {
    if (p === "objetivo") {
      const rubro = nichoActual && nichoActual !== "otro" ? nombreDeNicho(nichoActual) : null;
      return rubro ? P.objetivo.conRubro.replace("{rubro}", rubro) : P.objetivo.titulo;
    }
    return P[p].titulo;
  };

  const items = [
    { etiqueta: P.ficha.rubro, valor: nichoActual ? nombreDeNicho(nichoActual) : null },
    { etiqueta: P.ficha.objetivo, valor: objetivoActual ? textoDeObjetivo(objetivoActual) : null },
    ...(promo ? [{ etiqueta: P.ficha.beneficio, valor: beneficioActual ? (PROMO_TEXTOS.beneficiosCortos[beneficioActual as IdBeneficio] ?? null) : null }] : []),
  ];

  return (
    <div className="registro" style={{ "--acento-registro": acento } as CSSProperties}>
      <div aria-hidden className="registro__fondo" />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-14">
        <form
          ref={formulario}
          onSubmit={(evento) => {
            // Enter en un paso que no es el último: sigue, no manda.
            if (pasoActual.current < pasos.length - 1) {
              evento.preventDefault();
              seguir();
              return;
            }
            enviarSinReiniciar(enviar)(evento);
          }}
          onChange={(evento) => {
            const campo = evento.target as unknown as HTMLInputElement;
            if (campo.name === "nicho") setNichoActual(campo.value);
            if (campo.name === "objetivo") setObjetivoActual(campo.value);
            if (campo.name === "promo_beneficio") setBeneficioActual(campo.value);
            if (aviso) setAviso(null);
            // Con el mouse o el dedo, elegir una tarjeta pasa solo al paso siguiente.
            const conPuntero = Date.now() - ultimoToque.current < 1200;
            const pasaSolo = campo.type === "radio" && conPuntero && !(campo.name === "nicho" && campo.value === "otro");
            if (pasaSolo) {
              const desde = pasoActual.current;
              window.setTimeout(() => {
                if (pasoActual.current === desde) seguir();
              }, AVANCE_SOLO_MS);
            }
          }}
          onPointerDown={() => (ultimoToque.current = Date.now())}
          onKeyDown={(evento) => {
            ultimoToque.current = 0;
            // Enter sobre una tarjeta (radio) sigue al paso siguiente: el navegador solo manda con Enter desde un campo de texto.
            const campo = evento.target as HTMLInputElement;
            if (evento.key === "Enter" && campo.type === "radio") {
              evento.preventDefault();
              seguir();
            }
          }}
          onPointerMove={inclinar}
          onPointerLeave={enderezar}
          noValidate
          className="flex flex-col gap-8"
        >
          <input type="hidden" name="origen" value={origen} />
          <input type="hidden" name="visita" value={visita} />
          {promo ? <input type="hidden" name="promo" value={PROMO.id} /> : null}

          <Progreso pasos={pasos} actual={paso} />

          {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}

          <div className="registro-pasos" data-direccion={direccion}>
            {pasos.map((p, i) => (
              <section key={p} hidden={i !== paso} aria-labelledby={`paso-${p}`} className="paso-registro flex flex-col gap-6">
                <header>
                  <h2
                    id={`paso-${p}`}
                    ref={(nodo) => {
                      titulos.current[i] = nodo;
                    }}
                    tabIndex={-1}
                    className="titulo text-[clamp(1.5rem,4vw,2.1rem)] leading-tight text-blanco outline-none"
                  >
                    {tituloDe(p)}
                  </h2>
                  <p className="mt-2 font-lectura text-base leading-relaxed text-acero">{P[p].bajada}</p>
                </header>

                {p === "negocio" ? <EleccionRubro nicho={cadena("nicho") ?? nicho} nichoOtro={cadena("nichoOtro")} errores={e} /> : null}

                {p === "objetivo" ? <EleccionObjetivo objetivo={cadena("objetivo")} errores={e} /> : null}

                {p === "beneficio" && promo ? (
                  <>
                    <TarjetaPromo quedan={promo.quedan} tope={promo.tope} abierta={promo.abierta} />
                    <EleccionBeneficio nicho={nichoActual} rubrosSistema={promo.rubrosSistema} inicial={cadena("promo_beneficio")} error={e.promo_beneficio} />
                  </>
                ) : null}

                {p === "cuenta" ? (
                  <PasoCuenta cadena={cadena} errores={e} conPromo={Boolean(promo)} novedades={v.novedades === true} privacidad={v.privacidad === true} />
                ) : null}
              </section>
            ))}
          </div>

          {aviso ? <Aviso tipo="error">{aviso}</Aviso> : null}

          <div className="flex flex-col-reverse gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              {paso > 0 ? (
                <button type="button" onClick={() => ir(paso - 1)} className="inline-flex h-12 items-center gap-2 font-lectura text-sm font-medium text-acero transition-colors hover:text-blanco">
                  <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-none stroke-current" strokeWidth="1.8">
                    <path d="M19 12H5M11 6l-6 6 6 6" />
                  </svg>
                  {P.atras}
                </button>
              ) : null}
              <p className="font-plex text-sm text-acero">
                {registro.yaTenes}{" "}
                <Link href="/ingresar" className={CLASE_ENLACE}>
                  {registro.ingresar}
                </Link>
              </p>
            </div>
            {ultimo ? (
              <button type="submit" disabled={enviando} className={`${CLASE_BOTON} boton-registro`}>
                <span aria-hidden className="size-1.5 bg-[var(--acento-registro)]" />
                {enviando ? registro.enviando : promo ? P.botonPromo : registro.boton}
              </button>
            ) : (
              <button type="button" onClick={seguir} className={`${CLASE_BOTON} boton-registro`}>
                {P.seguir}
                <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-none stroke-current" strokeWidth="1.8">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            )}
          </div>
        </form>

        <FichaRegistro acento={acento} paso={paso} celebrar={enviando} items={items} conLugar={Boolean(promo)} />
      </div>
    </div>
  );
}

/** La barra de progreso: un tramo por paso, del color del rubro. */
function Progreso({ pasos, actual }: { pasos: IdPaso[]; actual: number }) {
  return (
    <div>
      <p className="flex items-center justify-between gap-4 font-plex text-[11px] uppercase tracking-etiqueta">
        <span className="text-blanco">{P[pasos[actual]].corto}</span>
        <span className="text-acero">{P.progreso.replace("{n}", String(actual + 1)).replace("{total}", String(pasos.length))}</span>
      </p>
      <ol aria-hidden className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${pasos.length}, minmax(0, 1fr))` }}>
        {pasos.map((p, i) => (
          <li key={p} className="registro-progreso__tramo" data-estado={i < actual ? "hecho" : i === actual ? "actual" : "falta"} />
        ))}
      </ol>
    </div>
  );
}

/** El último paso: los datos de la cuenta. Empresa y ciudad, plegadas (opcionales). */
function PasoCuenta({
  cadena,
  errores: e,
  conPromo,
  novedades,
  privacidad,
}: {
  cadena: (campo: string) => string | undefined;
  errores: Partial<Record<string, string>>;
  conPromo: boolean;
  novedades: boolean;
  privacidad: boolean;
}) {
  const abrirOpcionales = Boolean(e.empresa || e.ciudad || cadena("empresa") || cadena("ciudad"));
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo name="nombre" etiqueta={campos.nombre.etiqueta} placeholder={campos.nombre.marcador} autoComplete="given-name" defaultValue={cadena("nombre")} maxLength={80} required error={e.nombre} />
        <Campo name="apellido" etiqueta={campos.apellido.etiqueta} placeholder={campos.apellido.marcador} autoComplete="family-name" defaultValue={cadena("apellido")} maxLength={80} error={e.apellido} />
      </div>
      <Campo name="email" type="email" etiqueta={campos.email.etiqueta} placeholder={campos.email.marcador} autoComplete="email" inputMode="email" defaultValue={cadena("email")} maxLength={254} required error={e.email} />
      <CampoContrasena name="contrasena" etiqueta={campos.contrasena.etiqueta} ayuda={campos.contrasena.ayuda} autoComplete="new-password" minLength={8} maxLength={72} required error={e.contrasena} />
      {conPromo ? (
        <Campo
          name="telefono"
          type="tel"
          inputMode="tel"
          etiqueta={PROMO_TEXTOS.registro.telefono.etiqueta}
          placeholder={PROMO_TEXTOS.registro.telefono.marcador}
          ayuda={PROMO_TEXTOS.registro.telefono.ayuda}
          autoComplete="tel"
          defaultValue={cadena("telefono")}
          maxLength={40}
          required
          error={e.telefono}
        />
      ) : null}
      <details open={abrirOpcionales} className="group rounded-2xl border border-profundo px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-lectura text-sm font-medium text-acero hover:text-blanco">
          {P.cuenta.opcionales}
          <span aria-hidden className="transition-transform duration-(--duracion-rapida) group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="mt-4 grid gap-5 pb-1 sm:grid-cols-2">
          <Campo name="empresa" etiqueta={campos.empresa.etiqueta} placeholder={campos.empresa.marcador} autoComplete="organization" defaultValue={cadena("empresa")} maxLength={120} error={e.empresa} />
          <Campo name="ciudad" etiqueta={campos.ciudad.etiqueta} placeholder={campos.ciudad.marcador} autoComplete="address-level2" defaultValue={cadena("ciudad")} maxLength={80} error={e.ciudad} />
        </div>
      </details>
      <div className="flex flex-col gap-4 border-t border-profundo pt-6">
        <Casilla name="novedades" defaultChecked={novedades}>
          {campos.novedades}
        </Casilla>
        <Casilla name="privacidad" defaultChecked={privacidad} required error={e.privacidad}>
          {campos.privacidad.antes}
          <Link href="/privacidad" target="_blank" className={CLASE_ENLACE}>
            {campos.privacidad.enlace}
          </Link>
          {campos.privacidad.despues}
        </Casilla>
      </div>
    </div>
  );
}

/** Para el botón "Abrir Gmail / Outlook…": el correo web según el dominio del email. */
function correoDe(email: string): { nombre: string; url: string } | null {
  const dominio = email.split("@")[1]?.toLowerCase() ?? "";
  if (/^(gmail|googlemail)\.com$/.test(dominio)) return { nombre: "Gmail", url: "https://mail.google.com/mail/u/0/#inbox" };
  if (/^(hotmail|outlook|live|msn)\.(com|com\.ar|es)$/.test(dominio)) return { nombre: "Outlook", url: "https://outlook.live.com/mail/0/inbox" };
  if (/^(yahoo|ymail)\.(com|com\.ar)$/.test(dominio)) return { nombre: "Yahoo Mail", url: "https://mail.yahoo.com" };
  if (/^(icloud|me|mac)\.com$/.test(dominio)) return { nombre: "iCloud Mail", url: "https://www.icloud.com/mail" };
  return null;
}

/** Después del registro: el sobre que se abre, los tres pasos, abrir el correo y mandar el enlace de nuevo. */
function RevisaTuEmail({ email, conPromo = false }: { email: string; conPromo?: boolean }) {
  const [estado, reenviar, reenviando] = useActionState(reenviarConfirmacion, INICIAL);
  const { listo } = registro;
  const correo = correoDe(email);
  const pasosConfirmar = [listo.pasos[0], listo.pasos[1], conPromo ? listo.pasoPromo : listo.pasos[2]];
  const marco = useRef<HTMLDivElement>(null);
  const titulo = useRef<HTMLParagraphElement>(null);
  // Venía scrolleado hasta el último paso: se vuelve al sobre y el foco va al título.
  useEffect(() => {
    marco.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    titulo.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={marco} className="flex flex-col items-start gap-8" aria-live="polite">
      <div aria-hidden className="sobre-3d">
        <div className="sobre-3d__fondo" />
        <div className="sobre-3d__carta">
          <span className="sobre-3d__tilde">
            <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-negro" strokeWidth="2.6">
              <path d="M5 12.5 10 17l9-10" />
            </svg>
          </span>
        </div>
        <div className="sobre-3d__frente" />
        <div className="sobre-3d__solapa" />
      </div>

      <div className="max-w-xl">
        <p ref={titulo} tabIndex={-1} className="titulo text-[clamp(1.75rem,5vw,2.5rem)] leading-tight text-blanco outline-none">
          {listo.titulo}
        </p>
        <p className="mt-4 font-lectura text-base leading-relaxed text-blanco md:text-lg">{listo.texto.replace("{email}", email)}</p>
      </div>

      <ol className="flex w-full max-w-xl flex-col gap-3">
        {pasosConfirmar.map((texto, i) => (
          <li key={texto} className="flex items-start gap-4 rounded-2xl bg-profundo/35 p-4">
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--acento-registro)] font-plex text-xs font-medium text-negro">
              {i + 1}
            </span>
            <span className="pt-0.5 font-lectura text-[15px] leading-relaxed text-blanco">{texto}</span>
          </li>
        ))}
      </ol>

      <form action={reenviar} className="flex w-full max-w-xl flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
        {estado.estado === "listo" ? <Aviso tipo="listo">{listo.reenviado}</Aviso> : null}
        <div className="flex flex-wrap gap-3">
          {correo ? (
            <a href={correo.url} target="_blank" rel="noopener noreferrer" className={`${CLASE_BOTON} boton-registro`}>
              <span aria-hidden className="size-1.5 bg-[var(--acento-registro)]" />
              {listo.abrir.replace("{proveedor}", correo.nombre)}
            </a>
          ) : null}
          <button type="submit" disabled={reenviando} className={CLASE_BOTON_SECUNDARIO}>
            {listo.reenviar}
          </button>
        </div>
        <p className="font-lectura text-sm leading-relaxed text-acero">{listo.nota}</p>
        <p className="font-lectura text-sm leading-relaxed text-acero">{listo.yaTenia}</p>
      </form>
    </div>
  );
}
