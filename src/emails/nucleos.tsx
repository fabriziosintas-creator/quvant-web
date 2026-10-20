import { Text } from "@react-email/components";
import { SITIO } from "@/datos/sitio";
import type { AlertaNueva } from "@/nucleos/tipos";
import { armarEmail } from "./armar";
import { Boton, Cuadradito, estilos, MarcoEmail } from "./MarcoEmail";

/**
 * El resumen diario de alertas rojas de Núcleos, para fabrizio y Michel.
 * Solo indicadores de uso: nunca datos del negocio del cliente.
 */

const NOMBRES: Record<AlertaNueva["tipo"], string> = {
  dejo_de_usar: "dejó de usar una función clave",
  nunca_uso: "nunca usó una función clave",
  cayo_actividad: "cayó la actividad",
  sucursal_sin_actividad: "una sucursal sin actividad",
  bajo_semaforo: "bajó de color",
  sin_sesiones: "nadie inició sesión",
};

export function EmailResumenAlertas({ alertas, dia }: { alertas: Array<{ cliente: string; alerta: AlertaNueva }>; dia: string }) {
  return (
    <MarcoEmail vistaPrevia={`${alertas.length} alertas rojas en Núcleos`} porque={false}>
      <Text style={estilos.titulo}>
        <Cuadradito />
        {alertas.length} {alertas.length === 1 ? "alerta roja" : "alertas rojas"} · {dia}
      </Text>
      {alertas.map(({ cliente, alerta }, i) => (
        <Text key={i} style={estilos.textoClaro}>
          <strong>{cliente}</strong>: {NOMBRES[alerta.tipo]}
          {alerta.funcionClave ? ` (${String(alerta.detalle.funcion ?? alerta.funcionClave)})` : ""}
          {alerta.detalle.porcentaje !== undefined ? ` (${alerta.detalle.porcentaje} %)` : ""}
        </Text>
      ))}
      <Boton href={`${SITIO.url}/panel/nucleos`} respaldo={false}>
        Ver en el panel
      </Boton>
      <Text style={estilos.chico}>Medido por uso del sistema, no por ventas. Sin datos del negocio de los clientes.</Text>
    </MarcoEmail>
  );
}

export const armarResumenAlertas = (alertas: Array<{ cliente: string; alerta: AlertaNueva }>, dia: string) =>
  armarEmail(`Núcleos: ${alertas.length} ${alertas.length === 1 ? "alerta roja" : "alertas rojas"} · ${dia}`, <EmailResumenAlertas alertas={alertas} dia={dia} />);
