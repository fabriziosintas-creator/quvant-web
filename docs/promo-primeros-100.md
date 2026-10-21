# Promo "Primeros 100": prompt para Claude Code

Sumar a quvant-web una promoción de lanzamiento: **las primeras 100 personas que se registren eligen un beneficio**, 50 % de descuento en el desarrollo de su web o app, o 2 meses sin cargo del sistema de gestión. Va acompañada de un video corto e interactivo con las funciones del sistema que más le importan a un comerciante. El video todavía no existe: todo tiene que quedar armado para que funcione sin él y se enchufe cuando esté.

Trabajá en una rama nueva `promo-primeros-100` desde `master`, un commit por paso, sin push ni deploy (publicar se hace solo con mi OK). Avanzá de paso a paso sin pedir permiso; frená únicamente para lo marcado como **PREGUNTAR**.

---

## 1. Decisiones de fabrizio (completar antes de correr este prompt)

Lo que quede sin completar va con el valor **por defecto**, y lo anotás en el resumen final.

| # | Decisión | Por defecto |
|---|---|---|
| 1 | Nombre visible de la promo | "Primeros 100" |
| 2 | Fecha límite (se cierra al llegar a 100 o en esta fecha, lo que pase primero) | 31 de enero de 2027 |
| 3 | Qué cuenta como lugar | Cuenta con **email confirmado** (registrarse sin confirmar no ocupa lugar) |
| 4 | Beneficio A: 50 % sobre el presupuesto de desarrollo de una web o una app | Sin tope. No incluye dominio, hosting, mantenimiento mensual ni contenidos. El presupuesto se aprueba dentro de los 90 días |
| 5 | Beneficio B: 2 meses sin cargo del sistema de gestión | Solo rubros con sistema disponible hoy (Industria y comercio; Gimnasios y fitness). Sin tarjeta y sin débito automático: al terminar los 2 meses se pregunta si sigue. Se activa dentro de los 60 días |
| 6 | Precio del abono después de los 2 meses (va en las bases) | TODO: `$____ por mes` |
| 7 | ¿Se elige uno o los dos beneficios? | Uno solo |
| 8 | Teléfono obligatorio para reservar el lugar | Sí (para coordinar por WhatsApp) |
| 9 | Cuántas puestas en marcha pueden hacer por semana | 5: se agenda por orden de lugar |
| 10 | ¿Las cuentas que ya existen pueden reservar? | Sí, desde /cuenta, mientras queden lugares |
| 11 | Mostrar el contador "Quedan N de 100" | Sí, siempre con el número real |
| 12 | Lista de espera cuando se completen los 100 | Sí: la persona se registra igual y queda anotada |

---

## 2. Lo que ya existe (usalo, no lo rehagas)

- **Registro y cuenta** con Supabase: `src/servidor/cuenta/`, `src/componentes/cuenta/`, `app/(sitio)/{registro,ingresar,cuenta}`, la confirmación en `app/auth/confirmar` (corre `despuesDeConfirmar` con `after()`). La tabla `perfiles` tiene rubro, objetivo, empresa, ciudad y teléfono.
- **Emails** con Resend y React Email: `src/emails/`, `src/servidor/emails/`, la bienvenida y el aviso interno (`AVISO_REGISTROS_PARA`). Vista previa con `npm run emails:vista`.
- **Medición propia**, sin terceros: `src/componentes/medicion/medir.ts` (respeta Do Not Track y GPC) → `POST /api/eventos` → tabla `eventos`.
- **Panel de los socios** (`/panel`, solo admin): Resumen, Plantillas, Núcleos, Mapa, Bandeja. Las piezas de gráficos están en `src/componentes/panel/Graficos.tsx`.
- **Contenido que solo aparece si hay datos reales**: el patrón de `src/datos/fotos.ts` y `src/datos/testimonios.ts`. En desarrollo se ve un recuadro con el TODO; en producción, nada.
- **Video**: el proyecto Remotion en `video/` (el spot 2026 está en `video/src/spot2026/`; `npm run grabar` graba la demo del sistema en 4K). En la web, `RecorridoTablero` ya muestra capturas reales del sistema con paradas.
- **El manual de tono** en `docs/web-quvant-mas-humana.md`: voseo, frases cortas, palabras de mostrador, movimiento suave, nada de efectos de máquina.

---

## 3. Reglas (no se negocian)

1. **Nada inventado.** El contador sale de la base; ningún "¡quedan pocos!" ni cuenta regresiva que no sea real. Si el lugar 100 ya se dio, la promo se cierra sola.
2. **Solo se promete lo que el sistema hace hoy.** Antes de escribir un texto o un guion, verificá cada función en la demo (`https://yunque-rust.vercel.app`) y en el catálogo `medicion-sistema/catalogo.ts`. Si una función no se puede verificar, queda como `TODO: confirmar con fabrizio` y **no** sale en la web ni en el video. Hoy:
   - *Sin internet se sigue vendiendo*: lo dice la web y está en el catálogo (`venta_confirmada.sin_conexion`). Confirmar que funciona en el sistema real y no solo en la demo.
   - *Aumento masivo con vista previa del margen*: está (`aumento_masivo_previsualizado`).
   - *Redondeo automático de precios*: **no aparece en el catálogo ni en la web.** PREGUNTAR antes de prometerlo.
   - *Aviso de stock bajo y orden de compra sugerida al proveedor*: está (`orden_sugerida_usada`, stock mínimo).
3. **No decir "contable" ni "contabilidad".** El sistema administra (caja, stock, precios, compras); no lleva la contabilidad ni factura electrónicamente. ARCA, Mercado Pago y WhatsApp aparecen solo como "en camino", nunca como funcionando. Usá "la administración de tu negocio" o "el sistema de gestión".
4. **"Yunque" no aparece en nada nuevo**: ni en textos ni en el video. En las capturas de la demo, recortá o tapá el logo y el nombre. El sistema se llama Quvant.
5. **Sin ventanas emergentes al entrar** (ver sección 4). Sin herramientas de terceros: ni Meta Pixel, ni Google Analytics, ni captchas externos sin preguntar.
6. **Bases y condiciones visibles** antes de reservar (Ley 24.240 de Defensa del Consumidor: la oferta tiene que decir vigencia, cantidad, qué incluye y qué no). Marcalas `TODO: revisar con un abogado antes de difundir`.
7. **El tono de la web más humana**: la promo habla de lo que le pasa al comerciante, no de tecnología. Nada de "¡OFERTA IMPERDIBLE!", mayúsculas gritadas ni signos de admiración en fila.

---

## 4. Dónde va en la web (decisión tomada)

**No va como ventana que tapa la página al entrar.** En la portada ya corre la intro de la tele: una ventana encima se cierra sin leer. Además, Google castiga en el celular las ventanas que tapan el contenido, y el tono que buscamos es el de alguien que te cuenta algo, no el de un cartel que te frena. La promo va en cinco lugares que no interrumpen:

### A. Una cinta fina arriba del encabezado (todas las páginas públicas)
- Una línea: "Lanzamiento: los primeros 100 eligen 50 % en su web o 2 meses gratis del sistema · Quedan 63 →". Lleva a `/primeros-100`.
- Aparece recién cuando terminó la intro de la tele (evento que ya emite `IntroTV`) y no se anima con nada más que un fundido.
- Se cierra con una cruz; queda cerrada 7 días en ese navegador (`localStorage`, con try/catch). No mueve el contenido al aparecer (reservá su alto o ponela antes del primer pintado: sin saltos de diseño).
- En el celular, en un renglón y con texto más corto ("Primeros 100: 50 % en tu web o 2 meses gratis · Quedan 63").
- No aparece en `/panel`, `/registro` ni `/cuenta` (ahí la promo ya está en la página).

### B. Una página propia: `/primeros-100`
En este orden:
1. **Arriba**: qué es, en una frase, el contador real ("Quedan 63 de 100") y el botón "Quiero mi lugar".
2. **Las tres situaciones**: el corazón de la página, interactivo (ver sección 6). "Se cortó internet", "Llegó la lista nueva del proveedor" y "Se está terminando algo".
3. **Los dos beneficios**, lado a lado, con qué incluye cada uno y para quién es el B (rubros con sistema).
4. **Cómo funciona**, en tres pasos: te registrás y elegís · confirmás tu email y tu lugar queda reservado con su número · te escribimos para empezar.
5. **Bases y condiciones**, desplegables, completas.
6. Cuando se completen los 100: la página dice "Se completaron los 100 lugares" y ofrece la lista de espera. No desaparece: los links compartidos tienen que seguir andando.

### C. El registro
- `/registro?promo=primeros-100` (y el botón de la cinta y de la página) muestra arriba la tarjeta de la promo con el contador.
- Un paso más: **"Elegí tu beneficio"** (dos tarjetas grandes, para el dedo). El B se apaga con su motivo si el rubro elegido no tiene sistema todavía ("Para tu rubro todavía no hay sistema: el beneficio de la web sí te sirve").
- Con promo, el teléfono pasa a ser obligatorio (decisión 8).
- Sin promo, el registro queda exactamente como está.

### D. La cuenta
- Con lugar: "Tu lugar: N° 37 de 100 · 2 meses gratis del sistema", el estado (reservado, coordinando, en uso) y el próximo paso, con un botón de WhatsApp con el mensaje armado ("Hola, soy Marta, tengo el lugar 37 de Primeros 100…").
- Sin lugar y con lugares libres: "Reservar mi lugar" (decisión 10).
- En lista de espera: lo dice, con su posición.

### E. Entradas secundarias
Una línea con link en los rubros disponibles de `/plataformas`, en `/contacto` (arriba del formulario) y en el pie. Para Instagram, un link con `?utm_source=instagram` que la medición ya guarda como origen.

---

## 5. Base de datos

Migración nueva en `supabase/migrations/`, validada en PGlite (scratchpad) antes de aplicarla. **No la apliques a la base real**: dejala lista y decime el comando.

- `promo_config`: una fila (activa, tope = 100, hasta = fecha límite, rubros del beneficio B). Solo admin escribe.
- `promo_lugares`: `perfil_id` (único), `numero` (1..100, único; nulo en lista de espera), `beneficio` (enum `web_app_50` | `sistema_2_meses`), `estado` (enum `reservado` | `coordinando` | `en_uso` | `usado` | `vencido` | `cancelado` | `espera`), `pedido_en`, `asignado_en`, `notas`, `es_prueba`.
- **La asignación del número tiene que ser segura con dos confirmaciones al mismo tiempo**: una función `privado.asignar_lugar_promo(perfil)` (security definer, `set search_path = ''`) que toma un `pg_advisory_xact_lock`, cuenta los asignados y da el siguiente número o deja a la persona en espera. Se llama al confirmar el email (si la persona pidió la promo al registrarse) o al tocar "Reservar mi lugar" con la cuenta ya confirmada.
- `lugares_restantes()`: función pública que devuelve **solo un número** (ningún dato de nadie). La web la cachea un minuto (`"use cache"` con `cacheLife`), así la cinta no consulta la base en cada visita.
- RLS: cada persona ve solo su fila; los admin, todas. Nadie puede elegir su número ni cambiar su estado desde el navegador.
- Sumá los controles a `supabase/pruebas/seguridad.sql` y extendé `privado.borrar_datos_de_prueba()` para que también borre los lugares de prueba.

---

## 6. Las tres situaciones y el video (todo armado, sin el video todavía)

### Mientras no haya video
Cada situación es una **mini demostración interactiva** hecha en la web, marcada "Ilustración: así funciona en el sistema" (la regla del sitio para lo que no es una captura), con capturas reales al lado cuando las haya:

1. **"Se cortó internet."** Un interruptor de wifi. Lo apagás: el mostrador sigue cobrando, las ventas quedan en una fila "para mandar". Lo prendés: se mandan solas, con su hora original.
2. **"Llegó la lista nueva del proveedor."** Escribís cuánto aumentaron los costos (por ejemplo, 12 %) y una tabla de cuatro productos muestra costo, margen y precio nuevo. El redondeo solo aparece si fabrizio confirma que el sistema lo hace (regla 2).
3. **"Se está terminando algo."** Un producto con su stock bajando venta a venta; al cruzar el mínimo aparece el aviso y la orden de compra sugerida para el proveedor.

Las tres funcionan con teclado y lector de pantalla, sin WebGL, y con "menos movimiento" se muestran en su estado final. Livianas: nada de 3D en esta página.

### Cuando llegue el video
- Un registro `src/datos/promo.ts` con `VIDEO = { archivo: null, poster: null, subtitulos: null, capitulos: [...] }`. Con `archivo: null` la página muestra las demostraciones; nunca un reproductor vacío ni un recuadro gris.
- **Formato**: tres capítulos de 10 a 15 segundos (uno por situación), que en la página se eligen tocándolos (la parte interactiva), y una versión corrida de 30 a 40 segundos en 16:9 para la web y 9:16 para Reels y Stories. **Subtítulos siempre** (quemados en el de redes y en un `.vtt` en la web): casi todos lo miran sin sonido.
- **Guion** (propuesta; fabrizio lo aprueba): cada capítulo arranca por el problema dicho como lo diría el comerciante, muestra la pantalla real resolviéndolo y cierra con una línea. Escribilo en `video/promo-100/GUION.md`, con lo que se ve y lo que se lee segundo a segundo.
- **Producción**: una composición `Promo100` en `video/` (Remotion, mismos tokens y letras que el spot 2026: Plex Sans, la curva de la web, color real de las pantallas al 35 %). Grabá las pantallas que faltan de la demo con `npm run grabar` (mostrador vendiendo, aumento masivo, stock y orden de compra) y dejá la composición armada con el guion y las capturas. **No renderices la versión final** hasta que fabrizio apruebe el guion: dejá cuadros sueltos de muestra (`scripts/fotogramas-*.mjs`).
- Si fabrizio prefiere grabarlo con el celular en un negocio real, la página lo recibe igual: es solo cargar el archivo en `promo.ts`.

---

## 7. Emails

- **Bienvenida con lugar**: una variante de la bienvenida que dice el número y el beneficio, qué sigue y cuánto tiempo tiene para usarlo. La de lista de espera lo dice con la misma honestidad.
- **Aviso interno** a fabrizio y Michel en cada lugar asignado: número, beneficio, rubro, empresa, ciudad y un link de WhatsApp a esa persona.
- Mostrame la vista previa de cada uno (`npm run emails:vista`). **No mandes emails reales**: probá con casillas `delivered+…@resend.dev`.

---

## 8. Panel: sección "Primeros 100"

En `/panel/primeros-100`, con las mismas piezas del panel:
- Arriba: lugares dados, quedan, en lista de espera; cuántos eligieron cada beneficio; por rubro.
- **El embudo** (de la medición propia): vieron la cinta → entraron a la página → usaron una demostración → empezaron el registro → confirmaron → tienen lugar.
- La lista de los 100 por número, con el estado editable, notas, un botón de WhatsApp y la exportación CSV (con las mismas defensas que `/panel/exportar`).
- Un interruptor para pausar o cerrar la promo a mano (`promo_config.activa`).

---

## 9. Medición

Eventos nuevos en la tabla `eventos`, con el mismo `medir()` (respeta Do Not Track y GPC, sin datos personales): `vista_cinta_promo`, `cierre_cinta_promo`, `clic_cinta_promo`, `vista_promo`, `uso_demo_promo` (cuál), `play_video_promo` (qué capítulo, cuando haya video), `inicio_registro_promo` y `lugar_asignado`. Nada de terceros.

---

## 10. Orden de trabajo (un commit por paso)

1. **Verificación**: recorré la demo, sacá capturas de las tres situaciones y confirmá qué se puede prometer (regla 2). Anotá lo que no pudiste verificar. Si el redondeo no existe, PREGUNTAR antes de seguir con ese texto.
2. **Base de datos**: migración, funciones, RLS, pruebas de seguridad y la prueba de las dos confirmaciones al mismo tiempo en PGlite.
3. **Registro y cuenta**: el paso "Elegí tu beneficio", el teléfono, la reserva desde /cuenta, la lista de espera.
4. **La cinta** y las entradas secundarias.
5. **La página `/primeros-100`** con las tres demostraciones y las bases.
6. **Emails** (vista previa, sin envíos reales).
7. **Panel** "Primeros 100".
8. **Medición** y el embudo en el panel.
9. **Video**: guion, composición `Promo100` con las capturas, cuadros de muestra y `src/datos/promo.ts` listo para enchufar.
10. **Revisión final**: 375 px y 1440 px, teclado, lector de pantalla, "menos movimiento", sin WebGL; pruebas de punta a punta con usuarios de prueba (incluida una carrera por el lugar 100, que se borran solas al terminar); `npm run lint`, `npm test`, `npm run build`; Lighthouse en celular de `/` y `/primeros-100` (la cinta no puede empeorar la portada). Resumen corto: qué quedó, qué decisiones usaron el valor por defecto, qué TODO quedan (bases, precio del abono, video) y los comandos para aplicar la migración y publicar.

---

## 11. Qué no hay que hacer

- Ventanas emergentes al entrar, pantallas completas o avisos que tapen el contenido.
- Urgencia inventada: cuentas regresivas, "últimos lugares" cuando no lo son, números redondeados para que parezcan menos.
- Prometer funciones sin verificar, decir "contable", o mostrar ARCA, Mercado Pago o WhatsApp como funcionando.
- Mostrar "Yunque" en textos, capturas o video.
- Herramientas de terceros, píxeles de publicidad o captchas externos sin preguntar.
- Aplicar migraciones a la base real, mandar emails reales o publicar sin mi OK.
