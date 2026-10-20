/**
 * node scripts/supabase-urls.mjs            → muestra la configuración actual de URLs de Auth
 * node scripts/supabase-urls.mjs --aplicar  → deja site_url y las URLs de redirección para producción
 *
 * Usa la Management API con SUPABASE_ACCESS_TOKEN de .env.local (la misma
 * que usa la CLI). Las plantillas de email usan {{ .SiteURL }}: con
 * site_url en localhost, los enlaces de confirmación llevan a localhost.
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const token = env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error("Falta SUPABASE_ACCESS_TOKEN en .env.local");
const base = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const cabeceras = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

const SITIO = "https://www.quvant.com.ar";
const PERMITIDAS = ["http://localhost:3000/**", "https://www.quvant.com.ar/**", "https://quvant.com.ar/**", "https://*-yunque2.vercel.app/**"];

const actual = await (await fetch(base, { headers: cabeceras })).json();
console.log("site_url actual:", actual.site_url);
console.log("uri_allow_list actual:", actual.uri_allow_list || "(vacía)");

if (process.argv.includes("--aplicar")) {
  const respuesta = await fetch(base, { method: "PATCH", headers: cabeceras, body: JSON.stringify({ site_url: SITIO, uri_allow_list: PERMITIDAS.join(",") }) });
  if (!respuesta.ok) throw new Error(`PATCH ${respuesta.status}: ${await respuesta.text()}`);
  const nuevo = await respuesta.json();
  console.log("site_url nuevo:", nuevo.site_url);
  console.log("uri_allow_list nueva:", nuevo.uri_allow_list);
}
