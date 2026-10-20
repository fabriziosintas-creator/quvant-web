import "server-only";
import type { UsoCliente } from "@/nucleos/tipos";

/**
 * Lectura de PostHog desde el servidor con la API de consultas (HogQL):
 * POST {host}/api/projects/{id}/query/ con la clave personal como Bearer.
 * La clave nunca llega al navegador. Las consultas son fijas y van
 * parametrizadas con placeholders {x} y `values` (nada de SQL armado con
 * texto del usuario).
 *
 * Sin las variables (POSTHOG_HOST, POSTHOG_PROJECT_ID,
 * POSTHOG_PERSONAL_API_KEY) devuelve null y el panel usa el modo ejemplo.
 */

export function posthogConfigurado() {
  return Boolean(process.env.POSTHOG_PROJECT_ID && process.env.POSTHOG_PERSONAL_API_KEY);
}

type Fila = (string | number | boolean | null)[];

async function consultar(query: string, values: Record<string, string | number | boolean>): Promise<Fila[]> {
  const host = (process.env.POSTHOG_HOST ?? "https://us.posthog.com").replace(/\/$/, "");
  const proyecto = process.env.POSTHOG_PROJECT_ID;
  const clave = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!proyecto || !clave) throw new Error("PostHog sin configurar");
  const respuesta = await fetch(`${host}/api/projects/${proyecto}/query/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query, values } }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!respuesta.ok) throw new Error(`PostHog ${respuesta.status}: ${(await respuesta.text()).slice(0, 300)}`);
  const datos = (await respuesta.json()) as { results?: Fila[] };
  return datos.results ?? [];
}

const SEMANAS = 12;

/** Uso por organización en las últimas 12 semanas, en la forma que esperan los indicadores. */
export async function leerUsoDesdePostHog(organizaciones: string[], incluirPrueba: boolean, hoy = new Date()): Promise<Map<string, UsoCliente>> {
  const desde = new Date(hoy.getTime() - SEMANAS * 7 * 86_400_000).toISOString();
  const filtroPrueba = incluirPrueba ? "" : "AND (properties.prueba IS NULL OR properties.prueba = false)";
  const base = `FROM events WHERE timestamp >= toDateTime({desde}) AND properties.organizacion_id IN {orgs} ${filtroPrueba}`;
  const values = { desde, orgs: organizaciones } as unknown as Record<string, string>;

  const [porSemana, porModulo, porEvento, porSucursal, porRol] = await Promise.all([
    consultar(
      `SELECT properties.organizacion_id AS org, toString(toStartOfWeek(timestamp, 1)) AS semana,
              uniqExact(toDate(timestamp)) AS dias, count() AS acciones, uniq(distinct_id) AS usuarios,
              uniq(properties.sucursal_id) AS sucursales,
              countIf(event IN ('venta_confirmada', 'acceso_validado')) AS principales,
              countIf(event = 'sesion_iniciada') AS sesiones
       ${base} AND event != 'pantalla_vista' GROUP BY org, semana ORDER BY org, semana`,
      values,
    ),
    consultar(
      `SELECT properties.organizacion_id AS org, toString(toStartOfWeek(timestamp, 1)) AS semana, properties.modulo AS modulo, count() AS n
       ${base} AND event != 'pantalla_vista' GROUP BY org, semana, modulo`,
      values,
    ),
    consultar(
      `SELECT properties.organizacion_id AS org, event, toString(min(timestamp)) AS primera, toString(max(timestamp)) AS ultima,
              uniqExact(toStartOfWeek(timestamp, 1)) AS semanas
       ${base} GROUP BY org, event`,
      values,
    ),
    consultar(
      `SELECT properties.organizacion_id AS org, properties.sucursal_id AS sucursal, uniqExact(toDate(timestamp)) AS dias
       ${base} AND timestamp >= now() - INTERVAL 7 DAY AND event != 'pantalla_vista' GROUP BY org, sucursal`,
      values,
    ),
    consultar(
      `SELECT properties.organizacion_id AS org, properties.rol AS rol, count() AS n
       ${base} AND timestamp >= now() - INTERVAL 28 DAY AND event != 'pantalla_vista' GROUP BY org, rol`,
      values,
    ),
  ]);

  const resultado = new Map<string, UsoCliente>();
  const de = (org: string) => {
    let u = resultado.get(org);
    if (!u) {
      u = { organizacionId: org, semanas: [], eventos: {}, ultimaSesion: null, actividadPorSucursal: {}, accionesPorRol: {} };
      resultado.set(org, u);
    }
    return u;
  };
  for (const [org, semana, dias, acciones, usuarios, sucursales, principales, sesiones] of porSemana) {
    de(String(org)).semanas.push({
      inicio: String(semana).slice(0, 10),
      diasActivos: Number(dias),
      acciones: Number(acciones),
      accionesPorModulo: {},
      usuariosActivos: Number(usuarios),
      sucursalesActivas: Number(sucursales),
      accionesPrincipales: Number(principales),
      sesiones: Number(sesiones),
    });
  }
  for (const [org, semana, modulo, n] of porModulo) {
    const s = de(String(org)).semanas.find((x) => x.inicio === String(semana).slice(0, 10));
    if (s && modulo) s.accionesPorModulo[String(modulo)] = Number(n);
  }
  for (const [org, evento, primera, ultima, semanas] of porEvento) {
    const u = de(String(org));
    u.eventos[String(evento)] = { primera: new Date(String(primera)).toISOString(), ultima: new Date(String(ultima)).toISOString(), semanas: Number(semanas) };
    if (evento === "sesion_iniciada") u.ultimaSesion = new Date(String(ultima)).toISOString();
  }
  for (const [org, sucursal, dias] of porSucursal) if (sucursal) de(String(org)).actividadPorSucursal[String(sucursal)] = Number(dias);
  for (const [org, rol, n] of porRol) if (rol) de(String(org)).accionesPorRol[String(rol)] = Number(n);
  return resultado;
}
