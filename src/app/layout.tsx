import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Michroma } from "next/font/google";
import "./globals.css";
import { DECIDIR_INTRO } from "@/componentes/estructura/introDecision";
import { SITIO } from "@/datos/sitio";
import { MARCA } from "@/datos/textos";

const michroma = Michroma({
  weight: "400",
  subsets: ["latin"],
  variable: "--fuente-michroma",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--fuente-plex",
  display: "swap",
});

/** Para párrafos y títulos: la misma familia Plex, sin el ancho fijo que cansa en textos largos. */
const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--fuente-lectura",
  display: "swap",
});

export const metadata: Metadata = {
  // Título con la búsqueda real en español y con lugar (estudio de referencia, 9.1).
  title: SITIO.titulo,
  description: SITIO.descripcion,
  metadataBase: new URL(SITIO.url),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: MARCA.nombre,
    title: SITIO.titulo,
    description: SITIO.descripcion,
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: SITIO.titulo,
    description: SITIO.descripcion,
  },
};

export const viewport: Viewport = {
  themeColor: "#0D0D0F",
};

/**
 * La raíz: fuentes y metadatos, nada más. El sitio público (encabezado,
 * pie, barra de canales, cursor y chat) vive en app/(sitio)/layout.tsx;
 * el panel de mensajes (app/panel) usa solo esta raíz.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${michroma.variable} ${plexMono.variable} ${plexSans.variable} antialiased`}
      // El script de abajo marca data-intro antes de que React llegue.
      suppressHydrationWarning
    >
      <head>
        {/* Decide la intro de la tele antes de pintar (ver IntroTV). */}
        <script dangerouslySetInnerHTML={{ __html: DECIDIR_INTRO }} />
      </head>
      {/* En el celular, aire abajo para la barra de canales (solo donde la hay). */}
      <body className="flex min-h-svh flex-col max-md:has-[[data-dock]]:pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {children}
      </body>
    </html>
  );
}
