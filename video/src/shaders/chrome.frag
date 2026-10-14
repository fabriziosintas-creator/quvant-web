// El cromo de la Q: metal puro (metalness 1) que refleja un estudio neutro.
//
// El estudio es el mismo "cielo" que usa la Q del sitio: el degradado
// oficial del cromo del manual (siete paradas, uParadas) según la altura,
// como un equirectangular. Encima, un softbox vertical blanco: cuando la Q
// gira, su brillo la recorre. Sin colores: blanco, plata y grises.
//
// - Rugosidad 0.12–0.18: el reflejo se promedia en un cono chico alrededor
//   de la dirección reflejada (16 muestras en espiral, siempre las mismas:
//   render determinístico).
// - Fresnel sutil: plata #B9BBBF en los medios tonos, blanco en el borde.
// - Mismo mapeo de tonos que el sitio (ACES filmic de three.js) y salida en
//   sRGB, para que sea reconociblemente la misma Q.

uniform vec3 uParadas[7];
uniform vec3 uPlata;
uniform float uTintePlata;     // cuánto tiñe la plata los medios tonos (0..1)
uniform float uRugosidad;
uniform float uIntensidad;     // como envMapIntensity del sitio (1.3)
uniform float uSoftbox;        // brillo del softbox
uniform float uSoftboxAzimut;  // dónde está, en radianes alrededor del eje Y

varying vec3 vNormalMundo;
varying vec3 vPosicionMundo;

vec3 aLineal(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}

vec3 aSRGB(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

// ACES filmic con el ajuste de Stephen Hill, el mismo que trae three.js.
vec3 ajusteRrtOdt(vec3 v) {
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return a / b;
}

vec3 aces(vec3 color) {
  const mat3 entrada = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
  const mat3 salida = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
  color *= 1.0 / 0.6;
  color = salida * ajusteRrtOdt(entrada * color);
  return clamp(color, 0.0, 1.0);
}

// El degradado del manual: p = 0 arriba, 1 abajo (en sRGB, como el canvas del sitio).
vec3 degradado(float p) {
  vec3 c = uParadas[0];
  for (int i = 1; i < 7; i++) {
    c = mix(c, uParadas[i], clamp((p - float(i - 1) / 6.0) * 6.0, 0.0, 1.0));
  }
  return c;
}

// El estudio, en lineal: el cielo según la altura y el softbox vertical.
vec3 estudio(vec3 d) {
  float p = 0.5 - asin(clamp(d.y, -1.0, 1.0)) / 3.14159265;
  vec3 cielo = aLineal(degradado(p));
  float azimut = atan(d.x, d.z);
  float desvio = abs(mod(azimut - uSoftboxAzimut + 3.14159265, 6.2831853) - 3.14159265);
  float franja = smoothstep(0.17, 0.1, desvio) * smoothstep(0.8, 0.5, abs(d.y));
  return cielo + vec3(franja * uSoftbox);
}

vec3 reflejo(vec3 r) {
  vec3 eje = abs(r.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t = normalize(cross(eje, r));
  vec3 b = cross(r, t);
  float abertura = uRugosidad * 0.35;
  vec3 suma = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    float f = (float(i) + 0.5) / 16.0;
    float angulo = float(i) * 2.39996323;
    vec3 d = normalize(r + (t * cos(angulo) + b * sin(angulo)) * sqrt(f) * abertura);
    suma += estudio(d);
  }
  return suma / 16.0;
}

void main() {
  vec3 n = normalize(vNormalMundo);
  vec3 v = normalize(cameraPosition - vPosicionMundo);
  vec3 r = reflect(-v, n);

  float fresnel = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 5.0);
  vec3 tinte = mix(mix(vec3(1.0), aLineal(uPlata), uTintePlata), vec3(1.0), fresnel);

  vec3 color = aces(reflejo(r) * tinte * uIntensidad);
  gl_FragColor = vec4(aSRGB(color), 1.0);
}
