/**
 * PostHog en el servidor del sistema (posthog-node), para las acciones que
 * se confirman del lado del servidor. Cada pedido arma su contexto (la
 * organización y el usuario que lo hacen) y mide con la hora original.
 *
 * Sin la clave, no se crea el cliente y medir() no hace nada: el sistema
 * sigue igual.
 */
import { PostHog } from "posthog-node";
import { Medicion, type Contexto } from "./medir";

let cliente: PostHog | null = null;

function clientePostHog(): PostHog | null {
  if (cliente) return cliente;
  const clave = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!clave) return null;
  cliente = new PostHog(clave, {
    host: process.env.POSTHOG_HOST ?? "https://us.i.posthog.com",
    flushAt: 20,
    flushInterval: 5000,
    // Nada de geolocalización por IP.
    disableGeoip: true,
  });
  return cliente;
}

/** Una medición por pedido, con el contexto de quien lo hace. */
export function medicionServidor(contexto: Contexto): Medicion {
  const ph = clientePostHog();
  const medicion = new Medicion({
    hayConexion: () => ph !== null,
    enviador: async ({ nombre, propiedades, hora, distinctId }) => {
      ph?.capture({ distinctId, event: nombre, properties: propiedades, timestamp: hora, disableGeoip: true });
    },
  });
  medicion.fijarContexto(contexto);
  return medicion;
}

/** Al apagar el proceso (o al final de una función serverless): que salga lo que quedó. */
export async function cerrarMedicionServidor() {
  await cliente?.shutdown();
  cliente = null;
}
