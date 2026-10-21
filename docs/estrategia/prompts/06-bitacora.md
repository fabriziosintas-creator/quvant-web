# Prompt 6 · Bitácora: quién cambió qué

Pedido de fabrizio (21-oct-2026). Hoy los dos socios ven y editan todo, sin historial, salvo los cambios de las metas (`metas_cambios`). Cuando entre una tercera persona (soporte, un vendedor a comisión), va a hacer falta saber quién cambió qué y cuándo, y poder deshacerlo.

**Antes que nada, leé `docs/estrategia/prompts/00-reglas-comunes.md`.**

## 1. Qué registrar

- **Todo alta, cambio y baja en las tablas del panel:** `locales`, `visitas`, `clientes_plantilla`, `clientes_sistema`, `cobros_quvant`, `tipo_cambio_mensual`, `metas`, `avances_manuales`, `oportunidades` (si existe) y lo que agreguen los próximos prompts. Además: ingresos al panel, exportaciones de CSV (qué se exportó y con qué filtro, nunca el contenido) y cambios de rol en `perfiles`.
- **Qué se guarda:** quién (perfil), cuándo, tabla, id del registro, acción (alta, cambio o baja) y, en los cambios, **solo los campos que cambiaron**, con el valor anterior y el nuevo.
- **Qué no se guarda:** contraseñas, tokens ni nada de `auth`. Los datos de las personas registradas, enmascarados (email y teléfono).

## 2. Cómo

- **En la base, con triggers** (un solo trigger genérico en `privado`, aplicado a cada tabla), así queda registro aunque el cambio venga de una acción, de la consola o de un script. El "quién" sale de `auth.uid()`. Si es la clave secreta (el proceso diario), se anota como "sistema".
- **`bitacora`**: se agrega y se lee, nunca se edita ni se borra (ni siquiera los admins: solo `service_role`). Con índices por tabla, registro, quién y fecha.
- **Retención:** 2 años. Lo más viejo se borra con un proceso periódico. Explicá en la migración por qué ese plazo y cómo se cambia.
- La tabla `metas_cambios` sigue como está: el motivo del cambio de una meta es parte del producto. La bitácora la complementa.

## 3. En pantalla (`/panel/bitacora`)

- **Línea de tiempo** filtrable por persona, tabla, acción y fechas, con búsqueda por registro. Cada fila dice algo como "fabrizio cambió el estado de Ferretería Norte: visitado → interesado", con el campo, el antes y el después.
- **En cada ficha** (local, cliente, cobro, objetivo, oportunidad): un "Historial" plegable con los cambios de ese registro.
- **Deshacer** un cambio simple, de un solo registro: vuelve los campos a como estaban y queda anotado como un cambio nuevo, nunca borrando historia. Pide confirmación. Las bajas no se deshacen desde acá (se dice por qué).
- **Exportar** el filtro a CSV, con el formato de las otras exportaciones del panel.

## 4. Pensando en más personas (dejalo preparado, sin construirlo)

- Hoy todos los admins pueden todo. Dejá anotado en `docs/estrategia/decisiones-bitacora.md` cómo se sumarían roles más finos (por ejemplo, "vendedor": solo sus oportunidades y sus locales), qué tablas tocaría y qué cambiaría en las políticas de RLS. No lo construyas sin que fabrizio lo pida.

## 5. Orden de trabajo

1. Paso 0 e inventario de tablas.
2. Migración: `bitacora`, trigger genérico y retención.
3. Lógica pura: describir un cambio en palabras y armar el "deshacer", con pruebas.
4. `/panel/bitacora` y el historial en cada ficha.
5. Deshacer y exportar.
6. Pulido y publicación.
