import { Section, Text } from "@react-email/components";
import { PROMO_TEXTOS } from "@/datos/promo";
import { SITIO } from "@/datos/sitio";
import { Boton, COLOR, Cuadradito, estilos, MarcoEmail } from "./MarcoEmail";

/**
 * El email de "Primeros 100" para quienes ya tienen cuenta y aceptaron
 * novedades: qué es, cuántos lugares quedan (el número del día, de la
 * base) y el botón para reservar desde su cuenta. Lo manda
 * scripts/promo-novedades.tsx, solo con --enviar.
 */
export type DatosNovedad = { nombre: string; quedan: number; tope: number; hasta: string };

export function EmailNovedadPromo({ datos, urlImagenes }: { datos: DatosNovedad; urlImagenes?: string }) {
  const t = PROMO_TEXTOS.novedad;
  return (
    <MarcoEmail vistaPrevia={t.vistaPrevia.replace("{n}", String(datos.quedan))} urlImagenes={urlImagenes} porque={false}>
      <Text style={estilos.titulo}>{t.titulo.replace("{nombre}", datos.nombre)}</Text>
      <Text style={estilos.texto}>{t.texto}</Text>
      <Section style={{ border: `1px solid ${COLOR.profundo}`, borderRadius: "16px", padding: "18px 20px", margin: "8px 0 0" }}>
        <Text style={{ ...estilos.textoClaro, margin: "0 0 10px", fontWeight: 600 }}>
          <Cuadradito />
          Primeros 100
        </Text>
        {t.beneficios.map((b) => (
          <Text key={b} style={{ ...estilos.texto, margin: "0 0 6px" }}>
            · {b}
          </Text>
        ))}
        <Text style={{ ...estilos.textoClaro, margin: "10px 0 0" }}>
          {t.quedan.replace("{n}", String(datos.quedan)).replace("{tope}", String(datos.tope)).replace("{hasta}", datos.hasta)}
        </Text>
      </Section>
      <Boton href={`${SITIO.url}/cuenta?utm_source=email`} respaldo={false}>
        {t.boton}
      </Boton>
      <Text style={estilos.chico}>{t.bases}</Text>
      <Text style={{ ...estilos.chico, margin: "16px 0 0" }}>{t.porque}</Text>
    </MarcoEmail>
  );
}
