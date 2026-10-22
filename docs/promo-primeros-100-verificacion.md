# Primeros 100 · Qué se puede prometer (paso 1)

Verificado el 21 de octubre de 2026 en la demo del sistema (`https://yunque-rust.vercel.app`), entrando con los roles Compras (Valeria Luna) y Mostrador (Diego Sosa). Las capturas están en `marca/promo/capturas-demo/` (fuera del repo).

| Promesa | ¿Se puede decir? | Qué se ve en el sistema |
|---|---|---|
| **Sin internet se sigue vendiendo** | Sí | Con la red cortada, el mostrador muestra "Sin conexión. Seguís vendiendo normalmente: las ventas quedan en cola y se sincronizan solas." Al volver, "Sincronizado". El tablero marca las ventas "hechas sin conexión". |
| **Subís los costos y te redondea los precios** | Sí | Precios → Aumento masivo: elegís productos (marca, categoría, proveedor), el porcentaje, las listas (Minorista, Gremio, Mayorista) y el **redondeo** (a $10, a $100, a $1.000, terminado en ,99 o sin redondeo). La vista previa muestra precio de hoy, precio nuevo y margen antes → después, y el aumento real después del redondeo. Recién después se aplica. Redondea al más cercano (104.511,6 → 104.510; 94.057,2 → 94.060). |
| **Te avisa cuando queda poco stock para comprarle al proveedor** | Sí | El tablero tiene "Bajo el mínimo" y "Reponer pronto". Compras: "Órdenes sugeridas por stock mínimo y recepción con ingreso de stock", con una pestaña de sugerencias. |
| La lista del proveedor se carga desde un Excel | Sí | Importar datos (ya lo dice la web). |

**Lo que sigue sin poder decirse:** contabilidad o facturación electrónica (ARCA), cobros con Mercado Pago, avisos por WhatsApp. Siguen como "en camino".

**Pendiente para fabrizio:** confirmar que la venta sin conexión funciona igual en el sistema de los clientes, no solo en la demo (la demo emula la sincronización).

**Para el video:** las capturas muestran "con yunque" abajo a la izquierda, el logo de la demo arriba y las marcas "DEMO". Hay que recortarlos o taparlos (regla 4 del prompt).

---

# Paso 10 · Prueba de punta a punta

Corrida el 21 de octubre de 2026 contra la base real, con la promo abierta solo mientras duraba la prueba (tope 3) y todo lo de prueba borrado al final. **30/30**: cinta con los lugares, página con contador y vigencia, demostración medida, registro con teléfono obligatorio, lugar al confirmar el email, reserva desde la cuenta, carrera por el último lugar (uno lo gana, el otro queda en espera, nunca más lugares que el tope), panel (estado, exportar CSV, pausar y reabrir sin perder la fecha de comienzo), lista de espera que reserva al ampliar el cupo, la cruz de la cinta y sin errores de JavaScript.

**Lighthouse (celular, build de producción):** la cinta no mueve nada (CLS 0) y no cambia el rendimiento: el inicio da 43 a 54 con la promo abierta y 45 a 47 cerrada. /primeros-100: rendimiento 60, accesibilidad 96, buenas prácticas 100, SEO 100. Los avisos de accesibilidad del inicio (el "QUVANT" del pie, las fichas y los puntos del carrusel de trabajos) son de antes de la promo.

**Lo que se arregló en el camino:**
- En desarrollo, las páginas quedaban recargándose sin parar. Tailwind recorría todo el proyecto y vigilaba también `.next/`, donde el servidor escribe todo el tiempo. Ahora busca clases solo en `src/` (`globals.css`). Además, Next 16.4.0 → 16.4.2, que también corrige fallas de seguridad de 16.4.1.
- Al confirmar el email, la base da el lugar y el contador de la web se vence en ese momento (`/auth/confirmar`), no al minuto.
