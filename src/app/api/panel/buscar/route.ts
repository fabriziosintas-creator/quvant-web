import { NextResponse, type NextRequest } from "next/server";
import { accionesQueCoinciden, buscarEnCharlas, comoVisita, interpretar, paginasQueCoinciden, unir, type Resultado, type TipoResultado } from "@/buscador/buscador";
import { PANEL_ADMIN } from "@/datos/textos";
import { listarParaPanel } from "@/servidor/chat/servicio";
import { adminDelPedido } from "@/servidor/panel/acceso";

/**
 * El buscador del panel (Ctrl+K): una llamada por tecla. La base busca
 * fichas con buscar_panel() (RLS: solo admin; tolera tildes y errores de
 * tipeo); acá se suman las acciones, las páginas y las charlas del chat.
 */

const B = PANEL_ADMIN.buscador;
const PAGINAS = [...PANEL_ADMIN.secciones.map((s) => ({ ruta: s.ruta, nombre: s.nombre })), ...B.paginasExtra];
const TIPOS: TipoResultado[] = ["local", "cliente", "socio", "registro", "oportunidad", "objetivo", "nicho"];

export async function GET(pedido: NextRequest) {
  const admin = await adminDelPedido();
  if (!admin) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const texto = (pedido.nextUrl.searchParams.get("q") ?? "").slice(0, 120);
  const p = interpretar(texto);
  const sinCache = { headers: { "Cache-Control": "no-store" } };
  if (p.resto.length < 2 && p.tipo !== "visita") return NextResponse.json({ resultados: [], pedido: p.tipo }, sinCache);

  const [base, charlas] = await Promise.all([
    p.resto.length >= 2 ? admin.supabase.rpc("buscar_panel", { texto: p.resto, limite: 30 }) : Promise.resolve({ data: [], error: null }),
    p.tipo === "texto" && p.resto.length >= 3 ? listarParaPanel().catch(() => []) : Promise.resolve([]),
  ]);
  if (base.error) console.error("[buscador]", base.error.message);
  const deLaBase: Resultado[] = (base.data ?? [])
    .filter((r) => (TIPOS as string[]).includes(r.tipo))
    .map((r) => ({ tipo: r.tipo as TipoResultado, id: r.id, titulo: r.titulo, contexto: r.contexto, enlace: r.enlace, nicho: r.nicho, puntaje: Number(r.puntaje) }));

  let resultados: Resultado[];
  if (p.tipo === "visita") {
    resultados = comoVisita(deLaBase);
  } else if (p.tipo === "ir") {
    resultados = unir([deLaBase.filter((r) => r.tipo === "nicho"), paginasQueCoinciden(p.resto, PAGINAS), deLaBase.filter((r) => r.tipo !== "nicho")]);
  } else {
    const charlasEncontradas = buscarEnCharlas(
      p.resto,
      charlas.map((c) => ({ id: c.id, nombre: c.pedido?.nombre ?? null, empresa: c.pedido?.empresa ?? null, rubro: c.pedido?.rubro ?? null, necesidad: c.pedido?.necesidad ?? null, ultimo: c.ultimo?.texto ?? null, actualizada: c.actualizada })),
    );
    resultados = unir([accionesQueCoinciden(texto, B.acciones), paginasQueCoinciden(p.resto, PAGINAS), deLaBase, charlasEncontradas]);
  }
  return NextResponse.json({ resultados, pedido: p.tipo, falta: Boolean(base.error) }, sinCache);
}
