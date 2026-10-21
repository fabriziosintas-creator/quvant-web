import type { Textos } from "@/bitacora/bitacora";
import { PANEL_ADMIN } from "@/datos/textos";

const B = PANEL_ADMIN.bitacora;

/** Los textos de la bitácora, con los nombres de estados y etapas que ya usa el panel (servidor y navegador). */
export const TEXTOS_BITACORA: Textos = {
  sistema: B.sistema,
  frases: B.frases,
  tablas: B.tablas,
  campos: B.campos,
  valores: { ...PANEL_ADMIN.mapa.estados, ...PANEL_ADMIN.mapa.volver, ...PANEL_ADMIN.mapa.feedback, ...PANEL_ADMIN.comercial.etapas },
  si: B.si,
  no: B.no,
  vacio: B.vacio2,
};
