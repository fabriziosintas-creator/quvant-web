/**
 * Una celda de CSV pensada para Excel en castellano (separador ";"): las
 * que empiezan con = + - @ van con un apóstrofo adelante para que Excel no
 * las tome como fórmulas, y las que tienen ; comillas o saltos de línea
 * van entre comillas. El archivo entero lleva BOM para que lea los acentos.
 */
export const celdaCsv = (valor: unknown) => {
  let texto = valor === null || valor === undefined ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

export const BOM = "﻿";

export const armarCsv = (lineas: unknown[][]) => `${BOM}${lineas.map((linea) => linea.map(celdaCsv).join(";")).join("\r\n")}\r\n`;
