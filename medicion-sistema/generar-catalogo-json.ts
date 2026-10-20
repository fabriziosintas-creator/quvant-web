/**
 * Genera catalogo.json a partir de catalogo.ts, para las apps que no
 * importan TypeScript. Uso: npm run catalogo:json
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { DISPOSITIVOS, EVENTOS, FUNCIONES_CLAVE, MODULOS, PLANTILLAS, PROPIEDADES_COMUNES, ROLES, VERSION_CATALOGO } from "./catalogo";

const salida = path.join(import.meta.dirname, "catalogo.json");
const json = {
  version_catalogo: VERSION_CATALOGO,
  generado: "npm run catalogo:json (no editar a mano)",
  plantillas: PLANTILLAS,
  roles: ROLES,
  dispositivos: DISPOSITIVOS,
  modulos: MODULOS,
  propiedades_comunes: PROPIEDADES_COMUNES,
  eventos: EVENTOS,
  funciones_clave: FUNCIONES_CLAVE,
};
writeFileSync(salida, `${JSON.stringify(json, null, 2)}\n`);
console.log(`catalogo.json: ${Object.keys(EVENTOS).length} eventos, versión ${VERSION_CATALOGO}`);
