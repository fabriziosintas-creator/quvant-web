# Prompt 7 · Buscador rápido (Ctrl+K)

Pedido de fabrizio (21-oct-2026). Con locales, socios, registros, oportunidades y objetivos creciendo, buscar "Ferretería Norte" y caer directo en su ficha ahorra mucho. Además, sirve para hacer cosas sin navegar: "cargar cobro", "nueva visita", "ir a Industria".

**Antes que nada, leé `docs/estrategia/prompts/00-reglas-comunes.md`.**

## 1. Qué hace

- **Se abre** con Ctrl+K (Cmd+K en Mac) o con "/" desde cualquier página del panel, y con un botón con lupa en el encabezado, que en el celular abre a pantalla completa.
- **Busca, mientras se escribe, en:**
  - locales del mapa;
  - socios y clientes;
  - personas registradas (nombre, empresa, email);
  - oportunidades (si existen);
  - objetivos;
  - nichos;
  - conversaciones del chat;
  - páginas del panel.
- **Resultados agrupados por tipo,** con su ícono, el punto de color del nicho y una línea de contexto ("Local · Industria · por visitar · CABA"). Enter abre la ficha; con las flechas se recorre.
- **Acciones** que se escriben como comandos:
  - "cargar cobro", "nuevo objetivo", "agregar local", "cerrar período";
  - "ir a Industria" (entra al nicho, con su túnel);
  - "nueva visita a…" (busca el local y abre el formulario).
- **Recientes y sugerencias** cuando el cuadro está vacío: lo último que se abrió, guardado solo en ese navegador.

## 2. Cómo

- **Búsqueda en la base,** con una función `buscar_panel(texto, limite)` (`security invoker`, RLS manda): `pg_trgm` para tolerar errores de tipeo ("ferreteria nrte") y `unaccent` para las tildes. Revisá que las dos extensiones estén disponibles en Supabase y habilitalas en la migración, con los índices GIN que hagan falta. Devuelve tipo, id, título, contexto, enlace y puntaje.
- **Una sola llamada por tecla**, con espera de 150 ms y cancelando la anterior (AbortController), desde una ruta de la API que verifica al admin (`adminDelPedido`).
- **La paleta:** `cmdk` (revisá que siga mantenida y que ande con React 19) o una propia accesible. Diálogo modal con foco atrapado, lista como `listbox`, Escape cierra y el foco vuelve a donde estaba. Abre y cierra con una animación corta de Motion, quieta con "menos movimiento".
- **Sin datos personales de más:** de las personas registradas se muestra nombre y empresa, y el email solo si se buscó por email.

## 3. Orden de trabajo

1. Paso 0 e inventario de lo que se puede buscar.
2. Migración: extensiones, índices y `buscar_panel()`, con pruebas en SQL (con datos de prueba).
3. Ruta de la API y lógica pura de las acciones (interpretar "nueva visita a ferretería norte"), con pruebas.
4. La paleta: teclado, foco y celular.
5. Recientes y sugerencias.
6. Pulido y publicación.
