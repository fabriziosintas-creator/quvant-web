"use server";

import type { AuthError } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PROMO, PROMO_TEXTOS, esBeneficio } from "@/datos/promo";
import { CUENTA } from "@/datos/textos";
import { configSupabase } from "@/supabase/entorno";
import { crearClienteServidor } from "@/supabase/servidor";
import {
  destinoSeguro,
  emailValido,
  errorContrasena,
  erroresPerfil,
  leerPerfil,
  marcado,
  origenSeguro,
  texto,
  uuidValido,
  type DatosPerfil,
  type Errores,
} from "./validacion";

/**
 * Las acciones de cuenta: registrarse, ingresar, recuperar la contraseña,
 * guardar los datos y salir. Corren en el servidor con el cliente que
 * actúa como la persona (RLS); la clave secreta no se usa acá.
 *
 * Devuelven el estado del formulario (useActionState): los errores por
 * campo y lo que se había cargado, para no hacer escribir todo de nuevo.
 * Las contraseñas nunca vuelven al navegador.
 */

export type EstadoFormulario = {
  estado: "inicial" | "error" | "listo";
  mensaje?: string;
  errores?: Errores;
  valores?: Partial<Record<string, string | boolean>>;
  /** Ingreso: el email existe pero falta confirmarlo (ofrece reenviar el enlace). */
  sinConfirmar?: boolean;
};

const { errores: ERROR } = CUENTA;

/** La dirección del sitio que hizo el pedido, para los enlaces de los emails. */
async function origenDelSitio() {
  const cabeceras = await headers();
  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host") ?? "localhost:3000";
  const protocolo = cabeceras.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

const enlaceDeConfirmacion = async (siguiente: string) =>
  `${await origenDelSitio()}/auth/confirmar?siguiente=${encodeURIComponent(siguiente)}`;

/** Lo que dice Supabase, en castellano y sin revelar si una cuenta existe. */
function mensajeDeError(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return ERROR.credenciales;
    case "email_not_confirmed":
      return ERROR.sinConfirmar;
    case "weak_password":
      return ERROR.contrasenaDebil;
    case "same_password":
      return ERROR.contrasenaIgual;
    case "email_address_invalid":
    case "validation_failed":
      return ERROR.email;
    case "email_address_not_authorized":
      return ERROR.emailNoAutorizado;
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
    case "over_sms_send_rate_limit":
      return ERROR.demasiados;
    case "session_not_found":
    case "session_expired":
    case "refresh_token_not_found":
      return ERROR.sesion;
    case "signup_disabled":
    case "email_provider_disabled":
      return ERROR.sinConfigurar;
    default:
      console.error("[cuenta] Supabase respondió:", error.code, error.message);
      return ERROR.general;
  }
}

const valoresDePerfil = (perfil: DatosPerfil) => ({ ...perfil });

// ── Registro ──────────────────────────────────────────────────────────
export async function registrarse(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const perfil = leerPerfil(datos);
  const email = texto(datos, "email").toLowerCase();
  const contrasena = String(datos.get("contrasena") ?? "");
  const privacidad = marcado(datos, "privacidad");
  // La promo "Primeros 100": el beneficio elegido y el teléfono, obligatorio para coordinar.
  const conPromo = texto(datos, "promo") === PROMO.id;
  const beneficio = texto(datos, "promo_beneficio");
  const valores = { ...valoresDePerfil(perfil), email, privacidad, ...(conPromo ? { promo_beneficio: beneficio } : {}) };

  const errores = erroresPerfil(perfil);
  if (conPromo) {
    const E = PROMO_TEXTOS.registro.errores;
    if (!esBeneficio(beneficio)) errores.promo_beneficio = E.beneficio;
    else if (beneficio === "sistema_2_meses" && !(PROMO.rubrosSistema as readonly string[]).includes(perfil.nicho)) errores.promo_beneficio = E.noDisponible;
    if (!perfil.telefono) errores.telefono = E.telefono;
  }
  if (!emailValido(email)) errores.email = ERROR.email;
  const problemaContrasena = errorContrasena(contrasena);
  if (problemaContrasena) errores.contrasena = problemaContrasena;
  if (!privacidad) errores.privacidad = ERROR.privacidad;
  if (Object.keys(errores).length > 0) return { estado: "error", mensaje: ERROR.revisa, errores, valores };
  if (!configSupabase()) return { estado: "error", mensaje: ERROR.sinConfigurar, valores };

  const visita = texto(datos, "visita");
  const supabase = await crearClienteServidor();
  // El perfil lo crea la base con estos datos (trigger privado.crear_perfil).
  const { error } = await supabase.auth.signUp({
    email,
    password: contrasena,
    options: {
      emailRedirectTo: await enlaceDeConfirmacion("/cuenta"),
      data: {
        nombre: perfil.nombre,
        apellido: perfil.apellido,
        nicho: perfil.nicho,
        nicho_otro: perfil.nicho === "otro" ? perfil.nichoOtro : "",
        objetivo: perfil.objetivo,
        empresa: perfil.empresa,
        ciudad: perfil.ciudad,
        telefono: perfil.telefono,
        acepta_novedades: perfil.novedades,
        acepta_privacidad: true,
        origen: origenSeguro(texto(datos, "origen")),
        visita_id: uuidValido(visita) ? visita : null,
        // La base anota el pedido y da el lugar al confirmar el email (ver la migración de la promo).
        ...(conPromo ? { promo_beneficio: beneficio } : {}),
      },
    },
  });

  if (error) {
    return {
      estado: "error",
      mensaje: mensajeDeError(error),
      errores: error.code === "weak_password" ? { contrasena: ERROR.contrasenaDebil } : undefined,
      valores,
    };
  }
  return { estado: "listo", valores: { email, promo: conPromo } };
}

/** Manda de nuevo el enlace de confirmación (desde "Revisá tu email" o desde el ingreso). */
export async function reenviarConfirmacion(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const email = texto(datos, "email").toLowerCase();
  if (!emailValido(email)) return { estado: "error", mensaje: ERROR.email, valores: { email } };
  if (!configSupabase()) return { estado: "error", mensaje: ERROR.sinConfigurar, valores: { email } };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: await enlaceDeConfirmacion("/cuenta") },
  });
  if (error) return { estado: "error", mensaje: mensajeDeError(error), valores: { email } };
  return { estado: "listo", valores: { email } };
}

// ── Ingreso y salida ──────────────────────────────────────────────────
export async function ingresar(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const email = texto(datos, "email").toLowerCase();
  const contrasena = String(datos.get("contrasena") ?? "");
  const siguiente = destinoSeguro(texto(datos, "siguiente"));
  const valores = { email };

  const errores: Errores = {};
  if (!emailValido(email)) errores.email = ERROR.email;
  if (!contrasena) errores.contrasena = ERROR.credenciales;
  if (Object.keys(errores).length > 0) return { estado: "error", mensaje: ERROR.revisa, errores, valores };
  if (!configSupabase()) return { estado: "error", mensaje: ERROR.sinConfigurar, valores };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: contrasena });
  if (error) {
    return {
      estado: "error",
      mensaje: mensajeDeError(error),
      sinConfirmar: error.code === "email_not_confirmed",
      valores,
    };
  }
  redirect(siguiente);
}

export async function salir() {
  if (configSupabase()) {
    const supabase = await crearClienteServidor();
    await supabase.auth.signOut();
  }
  redirect("/");
}

// ── Contraseña ────────────────────────────────────────────────────────
export async function pedirRecuperacion(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const email = texto(datos, "email").toLowerCase();
  if (!emailValido(email)) return { estado: "error", errores: { email: ERROR.email }, valores: { email } };
  if (!configSupabase()) return { estado: "error", mensaje: ERROR.sinConfigurar, valores: { email } };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await enlaceDeConfirmacion("/cuenta?contrasena=nueva"),
  });
  // Mismo mensaje haya o no una cuenta con ese email; solo se avisa si hay que esperar.
  if (error && (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit")) {
    return { estado: "error", mensaje: ERROR.demasiados, valores: { email } };
  }
  if (error) console.error("[cuenta] recuperación:", error.code, error.message);
  return { estado: "listo", valores: { email } };
}

export async function cambiarContrasena(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const nueva = String(datos.get("nueva") ?? "");
  const repetida = String(datos.get("repetida") ?? "");
  const problema = errorContrasena(nueva);
  if (problema) return { estado: "error", errores: { nueva: problema } };
  if (nueva !== repetida) return { estado: "error", errores: { repetida: ERROR.noCoinciden } };
  if (!configSupabase()) return { estado: "error", mensaje: ERROR.sinConfigurar };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) {
    return {
      estado: "error",
      mensaje: mensajeDeError(error),
      errores:
        error.code === "weak_password" || error.code === "same_password"
          ? { nueva: mensajeDeError(error) }
          : undefined,
    };
  }
  return { estado: "listo", mensaje: CUENTA.cuenta.contrasena.cambiada };
}

// ── Datos del perfil ──────────────────────────────────────────────────
export async function guardarPerfil(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const perfil = leerPerfil(datos);
  const valores = valoresDePerfil(perfil);
  const errores = erroresPerfil(perfil);
  if (Object.keys(errores).length > 0) return { estado: "error", mensaje: ERROR.revisa, errores, valores };
  if (!configSupabase()) return { estado: "error", mensaje: ERROR.sinConfigurar, valores };

  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return { estado: "error", mensaje: ERROR.sesion, valores };

  // Solo las columnas que la persona puede tocar (la base frena el resto igual).
  const { error } = await supabase
    .from("perfiles")
    .update({
      nombre: perfil.nombre,
      apellido: perfil.apellido || null,
      nicho_id: perfil.nicho,
      nicho_otro: perfil.nicho === "otro" ? perfil.nichoOtro : null,
      objetivo_id: perfil.objetivo,
      empresa: perfil.empresa || null,
      ciudad: perfil.ciudad || null,
      telefono: perfil.telefono || null,
      acepta_novedades: perfil.novedades,
    })
    .eq("id", id);

  if (error) {
    console.error("[cuenta] guardar perfil:", error.code, error.message);
    return { estado: "error", mensaje: ERROR.general, valores };
  }
  refresh();
  return { estado: "listo", mensaje: CUENTA.cuenta.datos.guardado, valores };
}
