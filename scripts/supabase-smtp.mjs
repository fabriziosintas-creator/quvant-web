/**
 * node scripts/supabase-smtp.mjs            → muestra cómo manda los emails Supabase Auth (sin mostrar claves)
 * node scripts/supabase-smtp.mjs --aplicar  → los manda con Resend, desde hola@quvant.com.ar
 *
 * Por qué existe: el servicio de email que trae Supabase de fábrica solo
 * entrega a los emails de quienes están en el equipo del proyecto y con un
 * tope de 2 por hora. A cualquier otra persona que se registra le llega
 * nada: queda "sin confirmar" en Authentication → Users. La solución es
 * darle a Supabase un SMTP propio; usamos el de Resend, que la web ya usa
 * para los emails de bienvenida (dominio quvant.com.ar verificado).
 *
 * Usa la Management API con SUPABASE_ACCESS_TOKEN de .env.local (la misma
 * que usa la CLI) y, para aplicar, RESEND_API_KEY (de .env.local o de la
 * terminal; es la misma clave de Resend que está en Vercel). Nunca imprime
 * claves.
 */
import { readFileSync } from "node:fs";

let archivo = "";
try {
  archivo = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
} catch {
  // Sin .env.local: valen las variables de la terminal.
}
const env = {
  ...Object.fromEntries(
    archivo
      .split(/\r?\n/)
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
  ),
  ...Object.fromEntries(["SUPABASE_ACCESS_TOKEN", "RESEND_API_KEY", "NEXT_PUBLIC_SUPABASE_URL"].filter((k) => process.env[k]).map((k) => [k, process.env[k]])),
};

// El mismo que está en src/datos/emails.ts (remitente de todos los emails).
const REMITENTE_EMAIL = "hola@quvant.com.ar";
const REMITENTE_NOMBRE = "Quvant";
// Con SMTP propio el tope por defecto es 30 por hora; la promo puede traer más registros juntos.
const EMAILS_POR_HORA = 100;

const token = env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error("Falta SUPABASE_ACCESS_TOKEN (en .env.local o en la terminal)");
const ref = env.NEXT_PUBLIC_SUPABASE_URL ? new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0] : "uwwblklzzrajzdloubgn";
const base = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const cabeceras = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

function mostrar(titulo, c) {
  console.log(titulo);
  console.log("  servidor SMTP      :", c.smtp_host || "(ninguno: usa el servicio de fábrica de Supabase)");
  console.log("  puerto / usuario   :", c.smtp_port || "-", "/", c.smtp_user || "-");
  console.log("  remitente          :", c.smtp_sender_name || "-", "<" + (c.smtp_admin_email || "-") + ">");
  console.log("  emails por hora    :", c.rate_limit_email_sent ?? "-");
  console.log("  confirmar email    :", c.mailer_autoconfirm ? "NO (se confirma solo)" : "sí (hay que tocar el enlace)");
}

const actual = await (await fetch(base, { headers: cabeceras })).json();
mostrar("Ahora:", actual);
if (!actual.smtp_host) {
  console.log("\n→ Sin SMTP propio: Supabase solo entrega a los emails del equipo del proyecto. Es la causa de que no lleguen las confirmaciones.");
}

if (process.argv.includes("--aplicar")) {
  const clave = env.RESEND_API_KEY;
  if (!clave || !clave.startsWith("re_")) throw new Error("Falta RESEND_API_KEY (empieza con re_): ponela en .env.local o en la terminal");
  const respuesta = await fetch(base, {
    method: "PATCH",
    headers: cabeceras,
    body: JSON.stringify({
      smtp_host: "smtp.resend.com",
      smtp_port: "465",
      smtp_user: "resend",
      smtp_pass: clave,
      smtp_admin_email: REMITENTE_EMAIL,
      smtp_sender_name: REMITENTE_NOMBRE,
      rate_limit_email_sent: EMAILS_POR_HORA,
    }),
  });
  if (!respuesta.ok) throw new Error(`PATCH ${respuesta.status}: ${(await respuesta.text()).replaceAll(clave, "[clave]")}`);
  mostrar("\nAhora queda así:", await respuesta.json());
  console.log("\nListo. Probá registrándote con un email que no sea de tu equipo y mirá si llega.");
}
