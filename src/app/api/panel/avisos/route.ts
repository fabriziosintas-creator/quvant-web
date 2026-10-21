import { NextResponse } from "next/server";
import { adminDelPedido } from "@/servidor/panel/acceso";

/**
 * Los avisos del admin (los suyos y los de los dos; RLS manda), con lo que
 * ya leyó y sin los tipos que apagó. La campanita los pide al abrir el
 * panel; los nuevos llegan después por Supabase Realtime.
 */
export async function GET() {
  const admin = await adminDelPedido();
  if (!admin) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const { supabase, perfil } = admin;
  const [avisos, leidos, preferencias] = await Promise.all([
    supabase.from("avisos").select("id, tipo, titulo, texto, enlace, prioridad, creado_en, es_prueba").eq("es_prueba", false).order("creado_en", { ascending: false }).limit(60),
    supabase.from("avisos_leidos").select("aviso_id").eq("perfil_id", perfil.id),
    supabase.from("avisos_preferencias").select("apagados").eq("perfil_id", perfil.id).maybeSingle(),
  ]);
  if (avisos.error) return NextResponse.json({ avisos: [], falta: true }, { headers: { "Cache-Control": "no-store" } });
  const leido = new Set((leidos.data ?? []).map((l) => l.aviso_id));
  const apagados = new Set(preferencias.data?.apagados ?? []);
  return NextResponse.json(
    {
      perfil: perfil.id,
      apagados: [...apagados],
      avisos: (avisos.data ?? []).filter((a) => !apagados.has(a.tipo)).map((a) => ({ id: a.id, tipo: a.tipo, titulo: a.titulo, texto: a.texto, enlace: a.enlace, prioridad: a.prioridad, creadoEn: a.creado_en, leido: leido.has(a.id) })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
