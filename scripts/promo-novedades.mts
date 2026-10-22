/**
 * npx tsx scripts/promo-novedades.mts            → cuenta a quién le llegaría y deja la vista previa
 * npx tsx scripts/promo-novedades.mts --enviar   → lo manda (SOLO con el OK de fabrizio)
 *
 * El email de "Primeros 100" a quienes ya tienen cuenta: confirmaron el
 * email, aceptaron recibir novedades, no son admin, no son de prueba y
 * todavía no tienen lugar. El número de lugares es el de la base en el
 * momento de mandar. Uno por uno, con una pausa entre cada uno (el límite
 * de Resend), y nunca a la misma persona dos veces en la misma corrida.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { armarNovedadPromo } from "../src/emails/armar";
import { EMAIL } from "../src/datos/emails";

const RAIZ = path.resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  readFileSync(path.join(RAIZ, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const enviar = process.argv.includes("--enviar");
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const { data: estado, error: errorEstado } = await admin.rpc("estado_promo");
if (errorEstado || !estado) throw new Error(`La base no tiene la promo: ${errorEstado?.message ?? "sin datos"}`);
if (!estado.activa || estado.quedan <= 0) {
  console.log("La promo no está abierta (o no quedan lugares): no se manda nada.");
  process.exit(0);
}

const { data: conLugar } = await admin.from("promo_lugares").select("perfil_id");
const yaTienen = new Set((conLugar ?? []).map((f) => f.perfil_id as string));
const { data: personas, error } = await admin
  .from("perfiles")
  .select("id, nombre, email")
  .eq("rol", "usuario")
  .eq("acepta_novedades", true)
  .not("email_confirmado_en", "is", null)
  .not("email", "like", "%@prueba.quvant.test");
if (error) throw new Error(error.message);
const destinatarios = (personas ?? []).filter((p) => !yaTienen.has(p.id));

const hasta = String(estado.hasta).split("-").reverse().join("/");
const armar = (nombre: string, urlImagenes?: string) => armarNovedadPromo({ nombre, quedan: estado.quedan, tope: estado.tope, hasta }, urlImagenes);

const vista = await armar("Ana", new URL(`file:///${path.join(RAIZ, "public").replace(/\\/g, "/")}`).href);
mkdirSync(path.join(RAIZ, ".emails-vista"), { recursive: true });
writeFileSync(path.join(RAIZ, ".emails-vista", "novedad-promo.html"), vista.html);
console.log(`Le llegaría a ${destinatarios.length} personas. Vista previa: .emails-vista/novedad-promo.html`);

if (!enviar) {
  console.log("No se mandó nada (para mandar: --enviar, solo con el OK de fabrizio).");
  process.exit(0);
}

let enviados = 0;
for (const persona of destinatarios) {
  const email = await armar(persona.nombre);
  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL.remitente, to: [persona.email], subject: email.asunto, html: email.html, text: email.texto }),
  });
  if (respuesta.ok) enviados++;
  else console.error("no salió a", persona.email, respuesta.status);
  await new Promise((r) => setTimeout(r, 600));
}
console.log(`Listo: ${enviados} de ${destinatarios.length}.`);
