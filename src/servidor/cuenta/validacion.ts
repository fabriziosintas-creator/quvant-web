import { CUENTA } from "@/datos/textos";

/**
 * Validación de los formularios de cuenta. La usa el servidor (las
 * acciones) antes de mandar nada a Supabase; la base vuelve a controlar lo
 * importante (rubro, objetivo, privacidad) por su cuenta.
 */

export type IdNicho = (typeof CUENTA.nichos)[number]["id"];
export type IdObjetivo = (typeof CUENTA.objetivos)[number]["id"];

const NICHOS: readonly string[] = CUENTA.nichos.map((n) => n.id);
const OBJETIVOS: readonly string[] = CUENTA.objetivos.map((o) => o.id);

export const esNicho = (valor: unknown): valor is IdNicho => typeof valor === "string" && NICHOS.includes(valor);
export const esObjetivo = (valor: unknown): valor is IdObjetivo =>
  typeof valor === "string" && OBJETIVOS.includes(valor);

/** Los errores de cada campo, con el nombre del campo del formulario. */
export type Errores = Partial<Record<string, string>>;

export const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? "").trim();
export const marcado = (datos: FormData, campo: string) => datos.get(campo) === "on";

const FORMA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const emailValido = (email: string) => email.length <= 254 && FORMA_EMAIL.test(email);

/** Supabase corta en 72 caracteres (bcrypt): mejor avisar que truncar en silencio. */
export function errorContrasena(contrasena: string): string | undefined {
  if (contrasena.length < 8) return CUENTA.errores.contrasena;
  if (contrasena.length > 72) return CUENTA.errores.contrasenaLarga;
  return undefined;
}

/** Los datos del perfil que la persona puede editar (registro y cuenta). */
export type DatosPerfil = {
  nombre: string;
  apellido: string;
  nicho: IdNicho | "";
  nichoOtro: string;
  objetivo: IdObjetivo | "";
  empresa: string;
  ciudad: string;
  telefono: string;
  novedades: boolean;
};

export function leerPerfil(datos: FormData): DatosPerfil {
  const nicho = texto(datos, "nicho");
  const objetivo = texto(datos, "objetivo");
  return {
    nombre: texto(datos, "nombre"),
    apellido: texto(datos, "apellido"),
    nicho: esNicho(nicho) ? nicho : "",
    nichoOtro: texto(datos, "nichoOtro"),
    objetivo: esObjetivo(objetivo) ? objetivo : "",
    empresa: texto(datos, "empresa"),
    ciudad: texto(datos, "ciudad"),
    telefono: texto(datos, "telefono"),
    novedades: marcado(datos, "novedades"),
  };
}

/** Los mismos límites que la base (supabase/migrations). */
const LARGOS: Partial<Record<keyof DatosPerfil, number>> = {
  nombre: 80,
  apellido: 80,
  nichoOtro: 80,
  empresa: 120,
  ciudad: 80,
  telefono: 40,
};

export function erroresPerfil(perfil: DatosPerfil): Errores {
  const errores: Errores = {};
  if (!perfil.nombre) errores.nombre = CUENTA.errores.nombre;
  if (!perfil.nicho) errores.nicho = CUENTA.errores.nicho;
  if (perfil.nicho === "otro" && !perfil.nichoOtro) errores.nichoOtro = CUENTA.errores.nichoOtro;
  if (!perfil.objetivo) errores.objetivo = CUENTA.errores.objetivo;
  for (const [campo, maximo] of Object.entries(LARGOS)) {
    const valor = perfil[campo as keyof DatosPerfil];
    if (typeof valor === "string" && valor.length > (maximo ?? 0) && !errores[campo]) {
      errores[campo] = CUENTA.errores.largo;
    }
  }
  return errores;
}

/**
 * Adónde volver después de ingresar: solo rutas internas ("/cuenta"),
 * nunca otra web ("//otro.com", "https://…"), para que nadie use el
 * enlace de ingreso para mandar a alguien a un sitio trucho.
 */
export function destinoSeguro(valor: unknown, porDefecto = "/cuenta"): string {
  if (typeof valor !== "string") return porDefecto;
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) return porDefecto;
  return valor.slice(0, 200);
}

/** Para el campo "origen": utm_source o la sección donde tocó "Registrarme". */
export function origenSeguro(valor: unknown): string {
  if (typeof valor !== "string") return "";
  return valor.replace(/[^\w\-./:]/g, "").slice(0, 200);
}

const FORMA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const uuidValido = (valor: string) => FORMA_UUID.test(valor);
