import { Section, Text } from "@react-email/components";
import { urlWhatsApp } from "@/datos/contacto";
import { SITIO } from "@/datos/sitio";
import { CUENTA, EMAILS, PLATAFORMAS } from "@/datos/textos";
import { Boton, COLOR, Cuadradito, estilos, FUENTE, MarcoEmail } from "./MarcoEmail";

/**
 * Los cuatro emails de la cuenta.
 *
 * Confirmación y Recuperación los manda Supabase: se convierten a HTML con
 * las variables de Supabase en lugar de los datos ({{ .TokenHash }}, …)
 * con `npm run emails:supabase`. Bienvenida y Aviso los manda la web con
 * Resend (src/servidor/emails).
 */

// ── Confirmación (Supabase) ───────────────────────────────────────────
export function EmailConfirmacion({ saludo, enlace, urlImagenes }: { saludo: string; enlace: string; urlImagenes?: string }) {
  const t = EMAILS.confirmacion;
  return (
    <MarcoEmail vistaPrevia={t.vistaPrevia} urlImagenes={urlImagenes}>
      <Text style={estilos.textoClaro}>{saludo}</Text>
      <Text style={estilos.titulo}>{t.titulo}</Text>
      <Text style={estilos.texto}>{t.texto}</Text>
      <Boton href={enlace}>{t.boton}</Boton>
      <Text style={estilos.chico}>{t.vence}</Text>
    </MarcoEmail>
  );
}

// ── Recuperación (Supabase) ───────────────────────────────────────────
export function EmailRecuperacion({ saludo, enlace, urlImagenes }: { saludo: string; enlace: string; urlImagenes?: string }) {
  const t = EMAILS.recuperacion;
  return (
    <MarcoEmail vistaPrevia={t.vistaPrevia} urlImagenes={urlImagenes}>
      <Text style={estilos.textoClaro}>{saludo}</Text>
      <Text style={estilos.titulo}>{t.titulo}</Text>
      <Text style={estilos.texto}>{t.texto}</Text>
      <Boton href={enlace}>{t.boton}</Boton>
      <Text style={estilos.chico}>{t.vence}</Text>
    </MarcoEmail>
  );
}

// ── Bienvenida (web + Resend) ─────────────────────────────────────────
export type DatosBienvenida = { nombre: string; nicho: string; objetivo: string };

/** El único botón, según lo que la trajo: su plantilla, pedir la web o hablar. */
export function destinoBienvenida({ nicho, objetivo }: DatosBienvenida) {
  const urlBase = SITIO.url;
  if (objetivo === "mejorar_clientela") {
    const conPlantilla = PLATAFORMAS.rubros.items.some((item) => item.id === nicho);
    return `${urlBase}/plataformas${conPlantilla ? `#rubro-${nicho}` : "#rubros"}`;
  }
  if (objetivo === "hacer_web") return `${urlBase}/contacto`;
  return urlWhatsApp("Hola, me registré en Quvant y quiero hablar con ustedes.");
}

export function EmailBienvenida({ datos, urlImagenes }: { datos: DatosBienvenida; urlImagenes?: string }) {
  const t = EMAILS.bienvenida;
  const rubro = t.rubros[datos.nicho as keyof typeof t.rubros] ?? t.rubros.otro;
  const boton = t.botones[datos.objetivo as keyof typeof t.botones] ?? t.botones.curiosidad;
  return (
    <MarcoEmail vistaPrevia={t.vistaPrevia} urlImagenes={urlImagenes}>
      <Text style={estilos.titulo}>{t.titulo.replace("{nombre}", datos.nombre)}</Text>
      <Text style={estilos.texto}>{t.texto}</Text>
      <Section style={{ borderLeft: `2px solid ${COLOR.blanco}`, padding: "2px 0 2px 16px", margin: "8px 0 0" }}>
        <Text style={{ ...estilos.textoClaro, margin: 0 }}>{rubro}</Text>
      </Section>
      <Boton href={destinoBienvenida(datos)} respaldo={false}>
        {boton}
      </Boton>
      <Text style={estilos.texto}>{t.cierre}</Text>
      <Text style={{ ...estilos.textoClaro, margin: 0 }}>{t.firma}</Text>
    </MarcoEmail>
  );
}

// ── Aviso interno (web + Resend, a los socios) ───────────────────────
export type DatosAviso = {
  nombre: string;
  apellido: string | null;
  email: string;
  nicho: string;
  nichoOtro: string | null;
  objetivo: string;
  empresa: string | null;
  ciudad: string | null;
  novedades: boolean;
  origen: string | null;
};

export const nombreRubro = (nicho: string, otro?: string | null) =>
  nicho === "otro" && otro ? `Otro: ${otro}` : (CUENTA.nichos.find((n) => n.id === nicho)?.nombre ?? nicho);

export function EmailAvisoRegistro({ datos, urlImagenes }: { datos: DatosAviso; urlImagenes?: string }) {
  const t = EMAILS.avisoInterno;
  const filas: Array<[string, string]> = [
    [t.campos.nombre, [datos.nombre, datos.apellido].filter(Boolean).join(" ")],
    [t.campos.email, datos.email],
    [t.campos.rubro, nombreRubro(datos.nicho, datos.nichoOtro)],
    [t.campos.objetivo, CUENTA.objetivos.find((o) => o.id === datos.objetivo)?.texto ?? datos.objetivo],
    [t.campos.empresa, datos.empresa || t.sinDato],
    [t.campos.ciudad, datos.ciudad || t.sinDato],
    [t.campos.novedades, datos.novedades ? t.si : t.no],
    [t.campos.origen, datos.origen || t.sinDato],
  ];
  return (
    <MarcoEmail vistaPrevia={t.vistaPrevia} urlImagenes={urlImagenes} porque={false}>
      <Text style={estilos.titulo}>
        <Cuadradito />
        {t.titulo}
      </Text>
      <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {filas.map(([etiqueta, valor]) => (
            <tr key={etiqueta}>
              <td
                style={{
                  padding: "10px 12px 10px 0",
                  borderBottom: `1px solid ${COLOR.profundo}`,
                  fontFamily: FUENTE,
                  fontSize: "13px",
                  color: COLOR.acero,
                  verticalAlign: "top",
                  whiteSpace: "nowrap",
                }}
              >
                {etiqueta}
              </td>
              <td
                style={{
                  padding: "10px 0",
                  borderBottom: `1px solid ${COLOR.profundo}`,
                  fontFamily: FUENTE,
                  fontSize: "14px",
                  lineHeight: "1.5",
                  color: COLOR.blanco,
                }}
              >
                {valor}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Boton href={`${SITIO.url}/panel`} respaldo={false}>
        {t.boton}
      </Boton>
    </MarcoEmail>
  );
}
