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
