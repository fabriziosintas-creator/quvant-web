/** Formatos del panel, en castellano de Argentina y en hora de Buenos Aires. */

const ZONA = "America/Argentina/Buenos_Aires";

const FECHA_HORA = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA,
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const FECHA = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, day: "2-digit", month: "2-digit", year: "numeric" });
const PESOS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const NUMERO = new Intl.NumberFormat("es-AR");
const DECIMAL = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

export const fechaHora = (iso: string) => FECHA_HORA.format(new Date(iso));
/** Las fechas sin hora (columna date) son días, no instantes: se leen tal cual. */
export const fecha = (dia: string) => (/^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia.split("-").reverse().join("/") : FECHA.format(new Date(dia)));
export const pesos = (monto: number) => PESOS.format(monto);
export const numero = (n: number) => NUMERO.format(n);
export const porcentaje = (parte: number, total: number) => (total > 0 ? `${Math.round((parte / total) * 100)}%` : "—");
/** Con un decimal por debajo del 10%: en una conversión, 2,4% y 2% no son lo mismo. */
export const porcentajeFino = (parte: number, total: number) => {
  if (total <= 0) return "—";
  const valor = (parte / total) * 100;
  return `${valor < 10 ? DECIMAL.format(valor) : Math.round(valor)}%`;
};

/** Hoy en Buenos Aires, como "AAAA-MM-DD" (para los campos de fecha). */
export const hoyEnBuenosAires = () => new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10);
