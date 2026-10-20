/**
 * Lectura de un CSV chico (las planillas de prospección exportadas):
 * detecta el separador (coma o punto y coma), entiende las comillas y
 * saca el BOM. Devuelve una fila por línea con las columnas por su nombre
 * normalizado (minúsculas, sin acentos, sin espacios de más).
 */

export function normalizarEncabezado(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function leerCsv(contenido: string): Array<Record<string, string>> {
  const texto = contenido.replace(/^﻿/, "");
  const primeraLinea = texto.slice(0, texto.indexOf("\n") < 0 ? undefined : texto.indexOf("\n"));
  const separador = (primeraLinea.match(/;/g)?.length ?? 0) > (primeraLinea.match(/,/g)?.length ?? 0) ? ";" : ",";

  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let entreComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          celda += '"';
          i++;
        } else entreComillas = false;
      } else celda += c;
    } else if (c === '"') entreComillas = true;
    else if (c === separador) {
      fila.push(celda);
      celda = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(celda);
      celda = "";
      if (fila.some((v) => v.trim() !== "")) filas.push(fila);
      fila = [];
    } else celda += c;
  }
  fila.push(celda);
  if (fila.some((v) => v.trim() !== "")) filas.push(fila);

  const [encabezado, ...cuerpo] = filas;
  if (!encabezado) return [];
  const claves = encabezado.map(normalizarEncabezado);
  return cuerpo.map((valores) => {
    const registro: Record<string, string> = {};
    claves.forEach((clave, i) => {
      if (clave) registro[clave] = (valores[i] ?? "").trim();
    });
    return registro;
  });
}

/** El primer valor que exista entre varias columnas posibles. */
export function columna(fila: Record<string, string>, ...nombres: string[]) {
  for (const nombre of nombres) {
    const valor = fila[nombre];
    if (valor) return valor;
  }
  return "";
}
