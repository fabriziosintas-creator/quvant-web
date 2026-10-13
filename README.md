# Quvant — sitio web

Sitio de una sola página de **Quvant** («kúvant»): _Software a la vanguardia de cada nicho._

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- 3D: three + @react-three/fiber + @react-three/drei (desde la fase 2)
- Tipografías: Michroma e IBM Plex Mono vía `next/font/google`

## Comandos

```bash
npm run dev     # desarrollo (http://localhost:3000)
npm run build   # build de producción
npm run lint    # ESLint
```

Para probar desde el celular en la misma red:

```bash
npm run dev -- -H 0.0.0.0
```

y abrir `http://<IP-de-la-PC>:3000` en el teléfono.

## Estructura

- `src/datos/textos.ts` — **todos los textos del sitio** (editá acá, no en los componentes).
- `src/datos/contacto.ts` — WhatsApp, email e Instagram (**TODO: completar con datos reales**).
- `src/componentes/marca/` — isotipo Q y firma horizontal en SVG, según el manual de identidad.
- `src/componentes/estructura/` — menú fijo y pie de página.
- `src/componentes/3d/` — la Q de cromo en React Three Fiber (fase 2).

## Reglas de marca (resumen)

- Colores: negro `#0D0D0F`, blanco `#ECECEE`, gris acero `#9C9CA3`, gris profundo `#26262B`. Sin otros colores ni degradados; la única excepción es el cromado oficial de la Q.
- Michroma siempre en mayúsculas y con tracking amplio; IBM Plex Mono para todo el resto.
- No prometer integraciones que todavía no existen.
