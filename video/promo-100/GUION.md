# Video de "Primeros 100" · Guion (aprobado por fabrizio el 22-oct-2026)

**Para qué:** que un comerciante vea en 40 segundos tres momentos que conoce y cómo los resuelve el sistema, y quiera probarlo dos meses. Va en la página `/primeros-100` (16:9, con un botón por capítulo) y en Reels y Stories (9:16, subtítulos quemados).

**Reglas:** solo lo verificado en la demo (`docs/promo-primeros-100-verificacion.md`); nada de "contable", ARCA, Mercado Pago ni WhatsApp como funciones; sin "Yunque" (las capturas van recortadas sin la barra lateral); subtítulos siempre (casi todos lo miran sin sonido); el tono de la web: frases cortas, de mostrador.

**Música:** una pista original compuesta en código (`npm run musica-promo100`), cálida y liviana, a 110,77 BPM para que cada capítulo dure justo 6 compases: la frase grande con solo el colchón, el ritmo entra cuando aparece la pantalla, respira en la línea de cierre y resuelve en Do mayor con campanas en el cierre. Es de fondo: los subtítulos siguen quemados porque casi todos lo miran sin sonido. Va a −14 LUFS, pico real −1 dBTP (lo de redes).

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
3. `npm run render-promo100` (16:9) y `npm run render-promo100-vertical` (9:16, para Reels y Stories). Los subtítulos van quemados en los dos: el video no tiene sonido, así que en la web no se agrega el `.vtt` (se leería dos veces).
4. `npm run musica-promo100`: compone la pista en `out/promo100/musica-promo100.wav` (unos 6 segundos; siempre sale igual).
5. `npm run web-promo100`: del render 16:9 saca el MP4 liviano (con la música) y el póster, y los deja en `../public/promo100/`, que es donde los busca `VIDEO_PROMO` en `src/datos/promo.ts`.
6. Si ya tenés los renders y solo cambió la música: `npm run sonorizar-promo100` le pone la pista actual al video de la web (en el lugar) y al vertical (queda como `promo-100-vertical-con-musica.mp4`), sin volver a renderizar la imagen.

## En la compu con placa de video

El video que está hoy en la web se renderizó el 22-oct-2026 en la notebook (Intel, unos 6 minutos el 16:9). Hace falta volver a renderizar solo si cambia algo: los textos (`src/promo100/guion.ts`), las capturas o la música.

Lo que hace falta: Git y Node 24. Chrome no: Remotion baja el suyo la primera vez. Las capturas recortadas (`video/public/promo100/`) y las letras (`video/public/fonts/`) ya están en el repo, así que no hace falta el paso 1.

```
git pull
cd video
npm ci
npm run estudio                    # opcional: mirarlo antes en el navegador (Remotion Studio)
npm run render-promo100            # 16:9 → out/promo100/promo-100-1080.mp4
npm run render-promo100-vertical   # 9:16 → out/promo100/promo-100-vertical.mp4 (Reels y Stories)
npm run web-promo100               # MP4 liviano + póster → ../public/promo100/
```

- `--gl=angle` (ya está en los comandos) usa la placa de video en Windows. Con más núcleos se puede subir `--concurrency=3` a 6 u 8 en `package.json`.
- Para verlo en la página antes de publicar: `cd ..`, `npm ci`, `npm run dev` y abrir `http://localhost:3000/primeros-100`. Los botones de capítulo saltan a 0, 13 y 26 s.
- Para publicarlo: commitear `public/promo100/` y pushear a master (Vercel lo publica solo).
- El vertical no va a la web: queda en `video/out/promo100/` (no se versiona) para subirlo a Instagram a mano. El que se sube es el `-con-musica`.

**Si preferís grabarlo con el celular en un negocio real:** respetá los mismos tiempos (0, 13 y 26 s para los capítulos) y la página lo recibe igual.


