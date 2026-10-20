/**
 * Los emails, fuera de la web.
 *
 *   npm run emails:vista
 *     Arma todos los emails con datos de ejemplo en .emails-vista/ (HTML y
 *     texto plano) y un índice para mirarlos en el navegador.
 *
 *   npm run emails:supabase
 *     Arma las plantillas de Supabase (confirmación y recuperación) con sus
 *     variables en supabase/plantillas/, para pegarlas a mano si hace falta.
 *
 *   npm run emails:supabase -- --subir
 *     Además deja Supabase configurado por su API: el SMTP de Resend, las
 *     dos plantillas con sus asuntos y el límite de envíos. Necesita el
 *     dominio verificado en Resend (EMAIL.dominioVerificado en
 *     src/datos/emails.ts) y, en .env.local, SUPABASE_ACCESS_TOKEN y
 *     RESEND_API_KEY.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { EMAIL } from "@/datos/emails";
import { CUENTA, EMAILS } from "@/datos/textos";
import {
  armarAvisoRegistro,
  armarBienvenida,
  armarConfirmacion,
  armarRecuperacion,
  plantillasSupabase,
  type EmailArmado,
} from "@/emails/armar";

const RAIZ = process.cwd();
const [comando, ...opciones] = process.argv.slice(2);

function leerEntorno(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(path.join(RAIZ, ".env.local"), "utf8")
        .split(/\r?\n/)
        .filter((linea) => /^[A-Z_]+=/.test(linea))
        .map((linea) => [linea.slice(0, linea.indexOf("=")), linea.slice(linea.indexOf("=") + 1).trim()]),
    );
  } catch {
    return {};
  }
}

async function vista() {
  const carpeta = path.join(RAIZ, ".emails-vista");
  mkdirSync(carpeta, { recursive: true });
  // En la vista previa la firma sale de public/ (todavía no está publicada).
  const base = pathToFileURL(path.join(RAIZ, "public")).href;
  const ejemplo = { nombre: "Ana", nicho: "gimnasios" };

  const emails: Array<[string, EmailArmado]> = [
    ["confirmacion", await armarConfirmacion("Hola, Ana.", "https://www.quvant.com.ar/auth/confirmar?token_hash=ejemplo&type=email", base)],
    ["recuperacion", await armarRecuperacion("Hola, Ana.", "https://www.quvant.com.ar/auth/confirmar?token_hash=ejemplo&type=recovery", base)],
    ...(await Promise.all(
      CUENTA.objetivos.map(
        async (objetivo) =>
          [`bienvenida-${objetivo.id}`, await armarBienvenida({ ...ejemplo, objetivo: objetivo.id }, base)] as [string, EmailArmado],
      ),
    )),
    [
      "aviso-interno",
      await armarAvisoRegistro(
        {
          nombre: "Ana",
          apellido: "Pérez",
          email: "ana@ejemplo.com",
          nicho: "gimnasios",
          nichoOtro: null,
          objetivo: "mejorar_clientela",
          empresa: "Gimnasio de ejemplo",
          ciudad: "Rosario",
          novedades: true,
          origen: "plataformas-rubros",
        },
        base,
      ),
    ],
  ];

  for (const [nombre, email] of emails) {
    writeFileSync(path.join(carpeta, `${nombre}.html`), email.html);
    writeFileSync(path.join(carpeta, `${nombre}.txt`), `Asunto: ${email.asunto}\n\n${email.texto}`);
  }
  const indice = `<!doctype html><meta charset="utf-8"><title>Emails de Quvant</title>
<body style="margin:0;background:#26262B;font-family:ui-monospace,monospace;color:#ECECEE">
${emails
  .map(
    ([nombre, email]) => `<section style="padding:24px">
<h2 style="font-size:14px;margin:0 0 4px">${nombre}</h2>
<p style="font-size:13px;margin:0 0 12px;color:#9C9CA3">Asunto: ${email.asunto} · <a style="color:#ECECEE" href="${nombre}.txt">texto plano</a></p>
<div style="display:flex;gap:16px;flex-wrap:wrap">
<iframe src="${nombre}.html" style="width:640px;height:760px;border:1px solid #9C9CA3;background:#0D0D0F"></iframe>
<iframe src="${nombre}.html" style="width:375px;height:760px;border:1px solid #9C9CA3;background:#0D0D0F"></iframe>
</div></section>`,
  )
  .join("\n")}
</body>`;
  writeFileSync(path.join(carpeta, "index.html"), indice);
  console.log(`Listo: ${emails.length} emails en ${carpeta}`);
  console.log(`Abrí ${pathToFileURL(path.join(carpeta, "index.html")).href}`);
}

async function supabase() {
  const { confirmacion, recuperacion } = await plantillasSupabase();
  const carpeta = path.join(RAIZ, "supabase", "plantillas");
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(path.join(carpeta, "confirmacion.html"), confirmacion.html);
  writeFileSync(path.join(carpeta, "recuperacion.html"), recuperacion.html);
  writeFileSync(
    path.join(carpeta, "asuntos.txt"),
    `Confirm signup: ${EMAILS.confirmacion.asunto}\nReset password: ${EMAILS.recuperacion.asunto}\n`,
  );
  console.log(`Plantillas de Supabase en ${carpeta}`);

  if (!opciones.includes("--subir")) return;

  if (!EMAIL.dominioVerificado) {
    console.error(
      "\nNo subo nada: el dominio todavía no está verificado en Resend.\n" +
        "Cuando quvant.com.ar diga Verified en resend.com/domains, poné dominioVerificado = true en src/datos/emails.ts y repetí.",
    );
    process.exit(1);
  }
  const entorno = leerEntorno();
  const token = process.env.SUPABASE_ACCESS_TOKEN ?? entorno.SUPABASE_ACCESS_TOKEN;
  const claveResend = process.env.RESEND_API_KEY ?? entorno.RESEND_API_KEY;
  const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? entorno.NEXT_PUBLIC_SUPABASE_URL ?? "").match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (!token || !claveResend || !ref) {
    console.error("Faltan SUPABASE_ACCESS_TOKEN, RESEND_API_KEY o NEXT_PUBLIC_SUPABASE_URL en .env.local.");
    process.exit(1);
  }

  const respuesta = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      // SMTP de Resend (resend.com/docs/send-with-supabase-smtp).
      smtp_host: "smtp.resend.com",
      smtp_port: "465",
      smtp_user: "resend",
      smtp_pass: claveResend,
      smtp_admin_email: EMAIL.remitenteEmail,
      smtp_sender_name: EMAIL.remitenteNombre,
      // Con SMTP propio, Supabase deja subir el límite (por defecto, 2 por hora).
      rate_limit_email_sent: 60,
      mailer_subjects_confirmation: confirmacion.asunto,
      mailer_templates_confirmation_content: confirmacion.html,
      mailer_subjects_recovery: recuperacion.asunto,
      mailer_templates_recovery_content: recuperacion.html,
    }),
  });
  if (!respuesta.ok) {
    console.error(`Supabase respondió ${respuesta.status}: ${(await respuesta.text()).slice(0, 500)}`);
    process.exit(1);
  }
  console.log("Supabase configurado: SMTP de Resend, plantillas y asuntos de confirmación y recuperación.");
}

const comandos: Record<string, () => Promise<void>> = { vista, supabase };
const correr = comandos[comando ?? ""];
if (!correr) {
  console.error("Uso: npm run emails:vista  |  npm run emails:supabase [-- --subir]");
  process.exit(1);
}
correr().catch((error) => {
  console.error(error);
  process.exit(1);
});
