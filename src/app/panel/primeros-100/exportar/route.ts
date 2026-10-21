import { hoyEnBuenosAires } from "@/componentes/panel/formato";
import { PROMO_TEXTOS } from "@/datos/promo";
import { adminDelPedido } from "@/servidor/panel/acceso";
import { armarCsv } from "@/servidor/panel/celdaCsv";
import { cargarNichos } from "@/servidor/panel/datos";
import { canalDe, cargarLugares } from "@/servidor/promo/panel";

/** Todos los lugares de "Primeros 100" en CSV (con las mismas defensas que la exportación del resumen). */
export async function GET() {
  const admin = await adminDelPedido();
  if (!admin) return new Response("Sin permiso", { status: 401 });

  const [lugares, nichos] = await Promise.all([cargarLugares(admin.supabase), cargarNichos(admin.supabase)]);
  const T = PROMO_TEXTOS.panel;
  const lineas = [
    ["N°", "Estado", "Beneficio", "Nombre", "Apellido", "Email", "Teléfono", "Empresa", "Ciudad", "Rubro", "Vino desde", "Pidió", "Lugar desde", "Notas", "Prueba"],
    ...lugares.map((l) => [
      l.numero,
      T.estados[l.estado],
      PROMO_TEXTOS.beneficiosCortos[l.beneficio],
      l.perfil?.nombre,
      l.perfil?.apellido,
      l.perfil?.email,
      l.perfil?.telefono,
      l.perfil?.empresa,
      l.perfil?.ciudad,
      l.perfil ? (l.perfil.nicho_id === "otro" && l.perfil.nicho_otro ? `Otro: ${l.perfil.nicho_otro}` : (nichos.find((n) => n.id === l.perfil?.nicho_id)?.nombre ?? l.perfil.nicho_id)) : "",
      canalDe(l.perfil?.origen),
      l.pedido_en,
      l.asignado_en,
      l.notas,
      l.es_prueba ? "sí" : "",
    ]),
  ];

  return new Response(armarCsv(lineas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="primeros-100-${hoyEnBuenosAires()}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
