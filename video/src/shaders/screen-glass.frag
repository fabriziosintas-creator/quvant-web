// Vidrio de pantalla: inserta una captura (Yunque, Forja) o un clip de stock
// en un plano 3D como si estuviera detrás de un vidrio limpio. Sin
// curvatura ni "monitor CRT":
//
// - Refracción mínima: la lectura se corre apenas según el ángulo de vista.
// - Reflejo especular del 1–2 %: una franja de softbox que barre el vidrio
//   cuando el plano gira, más un fresnel leve.
// - Borde de 1 px en blanco al 8 %.
// - uSaturacion baja el color del stock (las capturas van en 1).

uniform sampler2D uMapa;
uniform float uOpacidad;
uniform float uSaturacion;
uniform float uRefraccion;   // corrimiento máximo, en uv (~0.002)
uniform float uReflejo;      // 0.01–0.02
uniform vec3 uBlanco;

varying vec2 vUv;
varying vec3 vNormalMundo;
varying vec3 vPosicionMundo;

void main() {
  vec3 n = normalize(vNormalMundo);
  vec3 v = normalize(cameraPosition - vPosicionMundo);
  float frente = clamp(dot(n, v), 0.0, 1.0);

  // Refracción: cuanto más de costado se mira, más se corre la imagen.
  vec2 corrimiento = (v.xy - n.xy * frente) * uRefraccion;
  vec3 color = texture2D(uMapa, clamp(vUv + corrimiento, 0.0, 1.0)).rgb;

  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, uSaturacion);

  // Reflejo: una franja diagonal que se mueve con el ángulo, y fresnel.
  vec3 r = reflect(-v, n);
  float franja = smoothstep(0.25, 0.0, abs(r.x * 0.8 + r.y * 0.6 - 0.15));
  float fresnel = pow(1.0 - frente, 5.0);
  color += uBlanco * uReflejo * (0.4 + 0.6 * franja) + uBlanco * fresnel * 0.04;

  // Borde de 1 px, blanco al 8 %.
  vec2 w = fwidth(vUv);
  vec2 aBorde = min(vUv, 1.0 - vUv) / max(w, vec2(0.000001));
  float borde = 1.0 - step(1.0, min(aBorde.x, aBorde.y));
  color = mix(color, uBlanco, borde * 0.08);

  gl_FragColor = vec4(color, uOpacidad);
}
