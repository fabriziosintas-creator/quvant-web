import { ImageResponse } from "next/og";

/** El ícono de la app del panel: la Q de cromo sobre el negro Quvant (la misma de icon.svg), en 192 y 512. */

const SVG_Q = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 105">
  <defs>
    <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="8" y1="20" x2="97" y2="85">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.1667" stop-color="#D9DCE0"/>
      <stop offset="0.3333" stop-color="#3A3D42"/><stop offset="0.5" stop-color="#F2F4F6"/>
      <stop offset="0.6667" stop-color="#6C7076"/><stop offset="0.8333" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#9DA1A7"/>
    </linearGradient>
  </defs>
  <circle cx="44" cy="44" r="31" fill="none" stroke="url(#g)" stroke-width="10"/>
  <line x1="63" y1="63" x2="80" y2="80" stroke="url(#g)" stroke-width="10"/>
  <rect x="86" y="86" width="11" height="11" fill="url(#g)"/>
</svg>`;

export async function GET(_pedido: Request, { params }: RouteContext<"/manifiesto-panel/icono/[tam]">) {
  const { tam } = await params;
  const lado = tam === "512" ? 512 : 192;
  // La Q ocupa el 60 %: entra entera también en el recorte de los íconos "maskable".
  const q = Math.round(lado * 0.6);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0D0D0F" }}>
        <div style={{ width: q, height: q, backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(SVG_Q)}")`, backgroundSize: `${q}px ${q}px` }} />
      </div>
    ),
    { width: lado, height: lado, headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
