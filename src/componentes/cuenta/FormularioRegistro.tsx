"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { idVisita, medir } from "@/componentes/medicion/medir";
import { CUENTA } from "@/datos/textos";
import { reenviarConfirmacion, registrarse, type EstadoFormulario } from "@/servidor/cuenta/acciones";
import { Aviso, CampoContrasena, Campo, Casilla } from "./Campos";
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO, CLASE_ENLACE } from "./estilos";
import { enviarSinReiniciar } from "./enviarSinReiniciar";
import { EleccionPerfil } from "./EleccionPerfil";
import { EleccionBeneficio } from "@/componentes/promo/EleccionBeneficio";
import { TarjetaPromo } from "@/componentes/promo/TarjetaPromo";
import { PROMO, PROMO_TEXTOS } from "@/datos/promo";

/** Lo que el registro necesita saber de la promo "Primeros 100" (si vino con ?promo=primeros-100). */
export type PromoRegistro = { quedan: number; tope: number; abierta: boolean; rubrosSistema: readonly string[] };

const INICIAL: EstadoFormulario = { estado: "inicial" };
const { campos, registro } = CUENTA;


/**
 * El registro: nombre, email y contraseña; rubro y objetivo (obligatorios);
 * empresa y ciudad (opcionales); novedades y privacidad. Si la persona
 * llegó desde un rubro, ese rubro viene elegido. Al terminar, la pantalla
 * de "Revisá tu email" con el botón para mandar el enlace de nuevo.
 *
 * Con la promo "Primeros 100": arriba la tarjeta con los lugares que
 * quedan, el paso "Elegí tu beneficio" y el teléfono obligatorio.
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
  }, [nicho]);

  const v = estado.valores ?? {};
  const e = estado.errores ?? {};
  const cadena = (campo: string) => (typeof v[campo] === "string" ? (v[campo] as string) : undefined);
  // El rubro elegido, para saber si los 2 meses del sistema se pueden elegir.
  const [nichoActual, setNichoActual] = useState(cadena("nicho") ?? nicho);

  if (estado.estado === "listo") {
    return <RevisaTuEmail email={String(estado.valores?.email ?? "")} conPromo={estado.valores?.promo === true} />;
  }

  return (
    <form
      onSubmit={enviarSinReiniciar(enviar)}
      onChange={(evento) => {
        const campo = evento.target as unknown as HTMLInputElement;
        if (campo.name === "nicho") setNichoActual(campo.value);
      }}
      noValidate
      className="flex flex-col gap-7"
    >
      <input type="hidden" name="origen" value={origen} />
      <input type="hidden" name="visita" value={visita} />
      {promo ? <input type="hidden" name="promo" value={PROMO.id} /> : null}

      {promo ? <TarjetaPromo quedan={promo.quedan} tope={promo.tope} abierta={promo.abierta} /> : null}

      {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          name="nombre"
          etiqueta={campos.nombre.etiqueta}
          placeholder={campos.nombre.marcador}
          autoComplete="given-name"
          defaultValue={cadena("nombre")}
          maxLength={80}
          required
          error={e.nombre}
        />
        <Campo
          name="apellido"
          etiqueta={campos.apellido.etiqueta}
          placeholder={campos.apellido.marcador}
          autoComplete="family-name"
          defaultValue={cadena("apellido")}
          maxLength={80}
          error={e.apellido}
        />
      </div>

      <Campo
        name="email"
        type="email"
        etiqueta={campos.email.etiqueta}
        placeholder={campos.email.marcador}
        autoComplete="email"
        inputMode="email"
        defaultValue={cadena("email")}
        maxLength={254}
        required
        error={e.email}
      />

      <CampoContrasena
        name="contrasena"
        etiqueta={campos.contrasena.etiqueta}
        ayuda={campos.contrasena.ayuda}
        autoComplete="new-password"
        minLength={8}
        maxLength={72}
        required
        error={e.contrasena}
      />

      <EleccionPerfil
        nicho={cadena("nicho") ?? nicho}
        nichoOtro={cadena("nichoOtro")}
        objetivo={cadena("objetivo")}
        errores={e}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          name="empresa"
          etiqueta={campos.empresa.etiqueta}
          placeholder={campos.empresa.marcador}
          autoComplete="organization"
          defaultValue={cadena("empresa")}
          maxLength={120}
          error={e.empresa}
        />
        <Campo
          name="ciudad"
          etiqueta={campos.ciudad.etiqueta}
          placeholder={campos.ciudad.marcador}
          autoComplete="address-level2"
          defaultValue={cadena("ciudad")}
          maxLength={80}
          error={e.ciudad}
        />
      </div>

      {promo ? (
        <>
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
          <EleccionBeneficio nicho={nichoActual} rubrosSistema={promo.rubrosSistema} inicial={cadena("promo_beneficio")} error={e.promo_beneficio} />
        </>
      ) : null}

      <div className="flex flex-col gap-4 border-t border-profundo pt-6">
        <Casilla name="novedades" defaultChecked={v.novedades === true}>
          {campos.novedades}
        </Casilla>
        <Casilla name="privacidad" defaultChecked={v.privacidad === true} required error={e.privacidad}>
          {campos.privacidad.antes}
          <Link href="/privacidad" target="_blank" className={CLASE_ENLACE}>
            {campos.privacidad.enlace}
          </Link>
          {campos.privacidad.despues}
        </Casilla>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? registro.enviando : registro.boton}
        </button>
        <p className="font-plex text-sm text-acero">
          {registro.yaTenes}{" "}
          <Link href="/ingresar" className={CLASE_ENLACE}>
            {registro.ingresar}
          </Link>
        </p>
      </div>
    </form>
  );
}

/** Después del registro: el aviso y el botón para mandar el enlace de nuevo. */
function RevisaTuEmail({ email, conPromo = false }: { email: string; conPromo?: boolean }) {
  const [estado, reenviar, reenviando] = useActionState(reenviarConfirmacion, INICIAL);
  const { listo } = registro;
  return (
    <div className="flex flex-col gap-6" aria-live="polite">
      <div className="rounded-2xl bg-profundo/35 p-6 md:p-8">
        <p className="flex items-center gap-3 font-lectura text-sm font-medium text-blanco">
          <span aria-hidden className="size-2.5 bg-blanco" />
          {listo.titulo}
        </p>
        <p className="mt-5 font-lectura text-base leading-relaxed text-blanco">
          {listo.texto.replace("{email}", email)}
        </p>
        {conPromo ? <p className="mt-3 font-lectura text-base leading-relaxed text-blanco">{PROMO_TEXTOS.registro.confirmar}</p> : null}
        <p className="mt-3 font-lectura text-sm leading-relaxed text-acero">{listo.nota}</p>
        <p className="mt-3 font-lectura text-sm leading-relaxed text-acero">{listo.yaTenia}</p>
      </div>
      <form action={reenviar} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
        {estado.estado === "listo" ? <Aviso tipo="listo">{listo.reenviado}</Aviso> : null}
        <div>
          <button type="submit" disabled={reenviando} className={CLASE_BOTON_SECUNDARIO}>
            {listo.reenviar}
          </button>
        </div>
      </form>
    </div>
  );
}
