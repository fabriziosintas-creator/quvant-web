# Bitácora: decisiones y cómo sumar más personas

Prompt 6 (21-oct-2026). Para fabrizio y Michel, y para quien construya los roles más adelante.

## Qué quedó hecho

- **Tabla `bitacora`** (migración `20261023150000_bitacora.sql`). Solo se agrega y se lee: nadie la edita ni la borra, ni siquiera los admins. Solo `service_role` puede, para la retención.
- **Un trigger genérico, `privado.anotar_bitacora()`**, anota cada alta, cambio y baja en estas tablas: `locales`, `visitas`, `clientes_plantilla`, `clientes_sistema`, `cobros_quvant`, `tipo_cambio_mensual`, `metas`, `avances_manuales`, `oportunidades`, `permisos_metricas` y `acompanamientos`.
  - En `perfiles` anota solo los cambios de rol.
  - En los cambios guarda solo los campos que cambiaron, con el antes y el después.
  - El "quién" sale de `auth.uid()`. Sin usuario (la clave secreta del proceso diario, o la consola) queda como "sistema".
- **Enmascarados:** email (`f•••@gmail.com`) y teléfono (`•••123`). Nunca se guarda nada de `auth` ni contraseñas.
- **Ingresos al panel:** uno por persona cada 8 horas.
- **Exportaciones de CSV:** qué se exportó y con qué filtro, nunca el contenido. Aplica a registrados, comercial, clientes, facturación y la propia bitácora.
- **Deshacer** (`public.deshacer_cambio`): solo cambios simples de un registro, con confirmación. La base revisa que los campos sigan como los dejó ese cambio; si alguien los tocó después, no pisa nada y lo dice. Queda anotado como "deshacer", nunca se borra historia.
  - Las bajas no se deshacen: el registro ya no existe, y recrearlo le cambiaría el identificador.
  - Las altas tampoco: se borran desde su pantalla, y eso también queda anotado.
- **Retención: 2 años.** La corre pg_cron (domingos 04:30) y, si no está, el proceso diario. Para cambiar el plazo, una migración nueva redefine `privado.limpiar_bitacora()` con otro intervalo.
- **`metas_cambios` sigue igual:** el motivo de un cambio de meta es parte del producto.
- **En pantalla:**
  - `/panel/bitacora`: filtros por persona, tabla, acción, fechas y registro, con exportación a CSV.
  - "Historial" plegable en la ficha del local (mapa), del cliente, de la oportunidad y del objetivo.
  - Los cobros y el tipo de cambio no tienen ficha propia: se ven en `/panel/bitacora`, filtrando por "Cobros" o "Tipo de cambio".

## Pensando en más personas (preparado, sin construir)

Hoy todos los admins pueden todo (`privado.es_admin()` en cada política). Si entra un vendedor a comisión o alguien de soporte, el camino sería este. **No se construye hasta que fabrizio lo pida.**

1. **Rol nuevo.** Sumar `vendedor` y `soporte` al enum `public.rol`, o una tabla `permisos (perfil_id, permiso)` si van a ser combinaciones.
2. **Funciones de ayuda en `privado`:** `es_vendedor()`, `es_soporte()` y `puede(permiso text)`, como `es_admin()`, en `security definer` y con `search_path = ''`.
3. **Qué tocaría en cada tabla:**
   - **`oportunidades`**: un vendedor ve y edita solo las suyas. Hace falta una columna `responsable_id uuid`; hoy `responsable` es texto: fabrizio o michel. La política sería `using (privado.es_admin() or responsable_id = auth.uid())`.
   - **`locales` y `visitas`**: un vendedor ve los locales que cargó o que tiene asignados (`cargado_por` o una columna `asignado_a`). Las visitas, solo a su nombre (`visitante_id = auth.uid()`; ya existe).
   - **`clientes_plantilla`, `clientes_sistema`, `cobros_quvant`, `tipo_cambio_mensual` y `metas`**: solo admin, como hoy. Un vendedor no ve montos de facturación ni objetivos de la empresa.
   - **Soporte**: lee `clientes_sistema`, `alertas` y `acompanamientos` y carga acompañamientos. No ve facturación ni la bitácora completa.
   - **`bitacora`**: un vendedor ve solo las filas con `quien = auth.uid()`. Los admin, todo.
4. **El panel:**
   - `exigirAdmin()` pasaría a `exigirPermiso(permiso)`.
   - El menú mostraría solo las secciones permitidas.
   - Las acciones del servidor ya corren con la sesión de quien las usa, así que la RLS manda sin cambios extra.
5. **La bitácora ya está lista para eso.** Guarda el `quien` de cada cambio, así que el día que haya un tercero se sabe qué hizo, y se puede deshacer.
