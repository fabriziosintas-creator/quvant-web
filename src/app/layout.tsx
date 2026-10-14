import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Michroma } from "next/font/google";
import "./globals.css";
import { Encabezado } from "@/componentes/estructura/Encabezado";
import { InterruptorVista } from "@/componentes/estructura/InterruptorVista";
import { Pie } from "@/componentes/estructura/Pie";
import { ScrollSuave } from "@/componentes/estructura/ScrollSuave";
import { SITIO } from "@/datos/sitio";
import { ACCESIBILIDAD, MARCA } from "@/datos/textos";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${michroma.variable} ${plexMono.variable} antialiased`}>
      <body className="flex min-h-svh flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:bg-blanco focus:px-4 focus:py-2 focus:font-plex focus:text-sm focus:text-negro"
        >
          {ACCESIBILIDAD.saltarAlContenido}
        </a>
        <ScrollSuave />
        <Encabezado />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <Pie />
        <InterruptorVista />
      </body>
    </html>
  );
}
