# Proxy propio para PostHog (Next.js)

Los bloqueadores de anuncios cortan las llamadas a `*.posthog.com`. Con un proxy en el mismo dominio del sistema, los eventos salen igual. Es la guía vigente de PostHog para Next.js (rewrites), revisada el 20-oct-2026: https://posthog.com/docs/advanced/proxy/nextjs

La ruta tiene que ser **rara** (no `/analytics` ni `/posthog`, que los bloqueadores también conocen). Acá: `/_q/m`.

## `next.config.ts` del sistema

```ts
import type { NextConfig } from "next";

const HOST_POSTHOG = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com"; // o https://eu.i.posthog.com
const HOST_ASSETS = HOST_POSTHOG.replace("i.posthog.com", "-assets.i.posthog.com").replace("https://us", "https://us").replace("https://eu", "https://eu");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/_q/m/static/:path*", destination: `${HOST_ASSETS}/static/:path*` },
      { source: "/_q/m/:path*", destination: `${HOST_POSTHOG}/:path*` },
    ];
  },
  // PostHog manda algunos pedidos con barra final: sin esto Next los redirige y se pierden.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
```

> Assets: para `us.i.posthog.com` el host de assets es `https://us-assets.i.posthog.com`; para `eu.i.posthog.com`, `https://eu-assets.i.posthog.com`.

## En el navegador

```ts
iniciarMedicionNavegador(
  { clave: process.env.NEXT_PUBLIC_POSTHOG_KEY!, rutaProxy: "/_q/m", uiHost: "https://us.posthog.com" },
  contexto,
);
```

## Si Vercel (u otro host) altera las cabeceras

PostHog avisa que algunos hosts devuelven 503 o 400 con rewrites. En ese caso, la alternativa oficial es el archivo `proxy.ts` de Next 16 (antes `middleware.ts`): https://posthog.com/docs/advanced/proxy/nextjs-middleware
