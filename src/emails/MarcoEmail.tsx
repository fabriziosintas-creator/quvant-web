import { Body, Button, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";
import { CONTACTO, urlInstagram, urlWhatsApp } from "@/datos/contacto";
import { SITIO } from "@/datos/sitio";
import { EMAILS } from "@/datos/textos";

/**
 * El marco de todos los emails: fondo negro, la firma (Q de cromo +
 * QUVANT) arriba, el contenido y el pie con la bajada y el contacto.
 *
 * Los emails no cargan las fuentes del sitio en todos los programas: IBM
 * Plex Mono va pedida a Google Fonts y, si no llega, cae en la monoespaciada
 * del sistema. Sin degradados (salvo la Q, que es imagen) y sin colores
 * fuera de la paleta.
 */

export const COLOR = { negro: "#0D0D0F", blanco: "#ECECEE", acero: "#9C9CA3", profundo: "#26262B" } as const;
export const FUENTE = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

export const estilos = {
  titulo: { margin: "0 0 20px", fontFamily: FUENTE, fontSize: "24px", lineHeight: "1.25", fontWeight: 600, color: COLOR.blanco },
  texto: { margin: "0 0 16px", fontFamily: FUENTE, fontSize: "15px", lineHeight: "1.7", color: COLOR.acero },
  textoClaro: { margin: "0 0 16px", fontFamily: FUENTE, fontSize: "15px", lineHeight: "1.7", color: COLOR.blanco },
  chico: { margin: "0 0 10px", fontFamily: FUENTE, fontSize: "12px", lineHeight: "1.6", color: COLOR.acero },
  boton: {
    display: "inline-block",
    backgroundColor: COLOR.blanco,
    color: COLOR.negro,
    fontFamily: FUENTE,
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    textDecoration: "none",
    padding: "16px 26px",
  },
  enlace: { color: COLOR.blanco, textDecoration: "underline" },
} satisfies Record<string, CSSProperties>;

/** El cuadradito de la marca, como viñeta. */
export function Cuadradito({ lleno = true }: { lleno?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "7px",
        height: "7px",
        marginRight: "10px",
        verticalAlign: "middle",
        backgroundColor: lleno ? COLOR.blanco : "transparent",
        border: lleno ? "none" : `1px solid ${COLOR.acero}`,
      }}
    />
  );
}

/** El botón (Button de React Email: arma el relleno también para Outlook) y debajo el enlace de respaldo. */
export function Boton({ href, children, respaldo = true }: { href: string; children: ReactNode; respaldo?: boolean }) {
  return (
    <Section style={{ margin: "28px 0 24px" }}>
      <Button href={href} style={estilos.boton}>
        {children}
      </Button>
      {respaldo ? (
        // En el texto plano el enlace ya va al lado del botón: el respaldo sobra.
        <Section data-skip-in-text={true}>
          <Text style={{ ...estilos.chico, margin: "24px 0 6px" }}>{EMAILS.respaldo}</Text>
          <Text style={{ ...estilos.chico, margin: 0, wordBreak: "break-all", overflowWrap: "anywhere" }}>
            <Link href={href} style={{ color: COLOR.acero, textDecoration: "underline" }}>
              {href}
            </Link>
          </Text>
        </Section>
      ) : null}
    </Section>
  );
}

export function MarcoEmail({
  vistaPrevia,
  urlImagenes = SITIO.url,
  porque = true,
  children,
}: {
  vistaPrevia: string;
  /** Dónde está publicada la imagen de la firma (en las vistas previas, la carpeta public/ local). Los links van siempre a la web. */
  urlImagenes?: string;
  /** El renglón "Recibís este email porque…" (el aviso interno no lo lleva). */
  porque?: boolean;
  children: ReactNode;
}) {
  return (
    <Html lang="es-AR" dir="ltr">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        {/* Es un email, no una página del sitio: la regla de fuentes de Next no aplica. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      <Preview>{vistaPrevia}</Preview>
      <Body style={{ margin: 0, padding: "32px 0", backgroundColor: COLOR.negro }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 24px", backgroundColor: COLOR.negro }}>
          {/* data-skip-in-text: en la versión de texto plano no va (sería un link suelto). */}
          <Section style={{ padding: "0 0 28px" }} data-skip-in-text={true}>
            <Link href={SITIO.url}>
              <Img
                src={`${urlImagenes}/email/quvant-firma.png`}
                width="190"
                height="46"
                alt="QUVANT"
                style={{ display: "block", border: 0, color: COLOR.blanco, fontFamily: FUENTE, fontSize: "18px", letterSpacing: "0.18em" }}
              />
            </Link>
          </Section>
          <Hr style={{ borderColor: COLOR.profundo, borderTopWidth: "1px", margin: "0 0 32px" }} />

          {children}

          <Hr style={{ borderColor: COLOR.profundo, borderTopWidth: "1px", margin: "36px 0 20px" }} />
          <Text style={estilos.chico}>
            <Cuadradito />
            Quvant · {EMAILS.pie.bajada}
          </Text>
          <Text style={{ ...estilos.chico, overflowWrap: "anywhere" }}>
            <Link href={urlWhatsApp()} style={{ color: COLOR.acero, textDecoration: "underline" }}>
              WhatsApp {CONTACTO.whatsappVisible}
            </Link>
            {"  ·  "}
            <Link href={urlInstagram} style={{ color: COLOR.acero, textDecoration: "underline" }}>
              @{CONTACTO.instagram}
            </Link>
            {"  ·  "}
            <Link href={SITIO.url} style={{ color: COLOR.acero, textDecoration: "underline" }}>
              {SITIO.url.replace(/^https?:\/\//, "")}
            </Link>
          </Text>
          {porque ? <Text style={{ ...estilos.chico, margin: 0 }}>{EMAILS.pie.porque}</Text> : null}
        </Container>
      </Body>
    </Html>
  );
}
