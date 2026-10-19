import { NextResponse, type NextRequest } from "next/server";
import { almacen } from "@/servidor/chat/almacen";
import { MODELO, hayIA } from "@/servidor/chat/asistente";
import {
  COOKIE_PANEL,
  EQUIPO,
  claveCorrecta,
  claveDelPanel,
  crearSesion,
  ipDe,
  leerSesion,
} from "@/servidor/chat/sesion";
import { canalAvisos } from "@/servidor/chat/whatsapp";

/**
 * La sesión del panel.
 *  GET → quién está adentro y cómo está configurado todo (para los avisos del panel).
 *  POST { nombre, clave } → entrar.  DELETE → salir.
 */

export async function GET(pedido: NextRequest) {
  const sesion = leerSesion(pedido);
  return NextResponse.json(
    {
      sesion,
      equipo: EQUIPO,
      configurado: claveDelPanel() !== null,
      claveDePrueba: !process.env.PANEL_CLAVE && claveDelPanel() !== null,
      // Lo que sigue solo se muestra adentro.
      ...(sesion
        ? { almacen: almacen().tipo, ia: hayIA() ? MODELO : null, avisos: canalAvisos() }
        : {}),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(pedido: NextRequest) {
  if (!claveDelPanel()) {
    return NextResponse.json({ error: "Falta configurar PANEL_CLAVE en el servidor." }, { status: 503 });
  }
  if ((await almacen().contar(`ingreso:${ipDe(pedido)}`, 900)) > 10) {
    return NextResponse.json({ error: "Demasiados intentos. Esperá unos minutos." }, { status: 429 });
  }
  let cuerpo: { nombre?: unknown; clave?: unknown };
  try {
    cuerpo = await pedido.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }
  const nombre = typeof cuerpo.nombre === "string" ? cuerpo.nombre : "";
  const clave = typeof cuerpo.clave === "string" ? cuerpo.clave : "";
  if (!EQUIPO.includes(nombre) || !claveCorrecta(clave)) {
    return NextResponse.json({ error: "La clave no es correcta." }, { status: 401 });
  }
  const sesion = crearSesion(nombre);
  const respuesta = NextResponse.json({ sesion: { nombre } });
  respuesta.cookies.set(COOKIE_PANEL, sesion.valor, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sesion.duracion,
  });
  return respuesta;
}

export async function DELETE() {
  const respuesta = NextResponse.json({ sesion: null });
  respuesta.cookies.delete(COOKIE_PANEL);
  return respuesta;
}
