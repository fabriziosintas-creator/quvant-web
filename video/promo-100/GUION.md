# Video de "Primeros 100" · Guion (para aprobar)

**Para qué:** que un comerciante vea en 40 segundos tres momentos que conoce y cómo los resuelve el sistema, y quiera probarlo dos meses. Va en la página `/primeros-100` (16:9, con un botón por capítulo) y en Reels y Stories (9:16, subtítulos quemados).

**Reglas:** solo lo verificado en la demo (`docs/promo-primeros-100-verificacion.md`); nada de "contable", ARCA, Mercado Pago ni WhatsApp como funciones; sin "Yunque" (las capturas van recortadas sin la barra lateral); subtítulos siempre (casi todos lo miran sin sonido); el tono de la web: frases cortas, de mostrador.

**Duración:** 42 s a 30 cuadros por segundo. Tres capítulos de 13 s (empiezan en 0, 13 y 26: son los saltos de los botones de la web) y un cierre de 3 s.

Los textos viven en `video/src/promo100/guion.ts`: si cambiás algo acá, cambialo ahí (de ahí salen la imagen y los subtítulos).

## Capítulo 1 · Se cortó internet (0:00 – 0:13)

| Segundo | Qué se ve | Qué se lee |
|---|---|---|
| 0 – 2,5 | Negro con la grilla de puntos; la frase grande entra suave. | **Se cortó internet. ¿Y ahora?** |
| 2,5 – 6,5 | La pantalla real del mostrador en una notebook, acercándose al aviso "Sin conexión. Seguís vendiendo normalmente: las ventas quedan en cola y se sincronizan solas." | El mostrador sigue cobrando: las ventas quedan en cola. |
| 6,5 – 10 | El mismo mostrador reconectado; se acerca al "Sincronizado" de arriba a la derecha. | Vuelve la conexión y se mandan solas. |
| 10 – 13 | Negro; la línea de cierre. | **Sin internet, se sigue vendiendo.** |

## Capítulo 2 · La lista nueva del proveedor (0:13 – 0:26)

| Segundo | Qué se ve | Qué se lee |
|---|---|---|
| 0 – 2,5 | La frase grande. | **Llegó la lista nueva del proveedor.** |
| 2,5 – 6,5 | Precios → Aumento masivo: el porcentaje, las listas y el **Redondeo "A $10"**. | Subís los costos y elegís cómo redondear. |
| 6,5 – 10 | La vista previa: precio de hoy, precio nuevo y el margen antes → después. | Ves los precios nuevos y tu margen antes de aplicar. |
| 10 – 13 | La línea de cierre. | **Precios al día en minutos, sin calcular a mano.** |

## Capítulo 3 · Se está terminando algo (0:26 – 0:39)

| Segundo | Qué se ve | Qué se lee |
|---|---|---|
| 0 – 2,5 | La frase grande. | **Se está terminando algo.** |
| 2,5 – 6,5 | El tablero con "Bajo el mínimo" y "Reponer pronto". | El sistema te avisa lo que está bajo el mínimo. |
| 6,5 – 10 | Compras: "Órdenes sugeridas por stock mínimo". | Y te arma el pedido para el proveedor. |
| 10 – 13 | La línea de cierre. | **Se acabaron los faltantes de sorpresa.** |

## Cierre (0:39 – 0:42)

La Q y **Primeros 100** · "2 meses gratis del sistema o 50 % en tu web o tu app." · `quvant.com.ar/primeros-100`

## Cómo se hace

1. `npm run preparar-promo100`: recorta las capturas de la demo (`marca/promo/capturas-demo/`) sin la barra lateral (ahí están el logo de la demo y "con yunque") y las deja en `public/promo100/`.
2. Revisar cuadros sueltos: `node scripts/fotogramas-promo100.mjs` (deja PNG en `out/promo100/cuadros/`).
3. **Con el guion aprobado**: `npm run render-promo100` (16:9) y `npm run render-promo100-vertical` (9:16), y `npm run promo100-vtt` para los subtítulos.
4. Copiar el MP4, el WebM, el póster y el `.vtt` a `../public/promo100/` y completar `VIDEO_PROMO` en `src/datos/promo.ts`. La página lo muestra sola.

**Si preferís grabarlo con el celular en un negocio real:** respetá los mismos tiempos (0, 13 y 26 s para los capítulos) y la página lo recibe igual.

**Música:** sin música por ahora (la mayoría lo mira sin sonido). Si querés, se compone una pista corta como la del spot.
