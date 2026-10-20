import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { EMAILS } from "@/datos/textos";
import {
  EmailAvisoRegistro,
  EmailBienvenida,
  EmailConfirmacion,
  EmailRecuperacion,
  nombreRubro,
  type DatosAviso,
  type DatosBienvenida,
} from "./EmailsCuenta";

/**
 * Arma cada email listo para mandar: asunto, HTML y versión de texto plano
 * (la que leen los programas que no muestran HTML y la que ayuda a no caer
 * en spam). Sin "server-only": lo usan la web y los comandos de npm.
 */

export type EmailArmado = { asunto: string; html: string; texto: string };

async function armar(asunto: string, email: ReactElement): Promise<EmailArmado> {
  const [html, texto] = await Promise.all([render(email), render(email, { plainText: true })]);
  return { asunto, html, texto };
}

export const armarBienvenida = (datos: DatosBienvenida, urlImagenes?: string) =>
  armar(EMAILS.bienvenida.asunto, <EmailBienvenida datos={datos} urlImagenes={urlImagenes} />);

export const armarAvisoRegistro = (datos: DatosAviso, urlImagenes?: string) =>
  armar(
    EMAILS.avisoInterno.asunto.replace("{nombre}", datos.nombre).replace("{rubro}", nombreRubro(datos.nicho, datos.nichoOtro)),
    <EmailAvisoRegistro datos={datos} urlImagenes={urlImagenes} />,
  );

export const armarConfirmacion = (saludo: string, enlace: string, urlImagenes?: string) =>
  armar(EMAILS.confirmacion.asunto, <EmailConfirmacion saludo={saludo} enlace={enlace} urlImagenes={urlImagenes} />);

export const armarRecuperacion = (saludo: string, enlace: string, urlImagenes?: string) =>
  armar(EMAILS.recuperacion.asunto, <EmailRecuperacion saludo={saludo} enlace={enlace} urlImagenes={urlImagenes} />);

/**
 * Las plantillas de Supabase: el mismo email con sus variables en lugar de
 * los datos. El enlace va a /auth/confirmar con token_hash (anda aunque el
 * email se abra en otro dispositivo) y el saludo usa el nombre que mandó el
 * registro, si está.
 */
const SALUDO_SUPABASE = "{{ if .Data.nombre }}Hola, {{ .Data.nombre }}.{{ else }}Hola.{{ end }}";
const enlaceSupabase = (tipo: "email" | "recovery", siguiente: string) =>
  `{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=${tipo}&siguiente=${encodeURIComponent(siguiente)}`;

export const plantillasSupabase = (urlImagenes?: string) =>
  Promise.all([
    armarConfirmacion(SALUDO_SUPABASE, enlaceSupabase("email", "/cuenta"), urlImagenes),
    armarRecuperacion(SALUDO_SUPABASE, enlaceSupabase("recovery", "/cuenta?contrasena=nueva"), urlImagenes),
  ]).then(([confirmacion, recuperacion]) => ({ confirmacion, recuperacion }));
