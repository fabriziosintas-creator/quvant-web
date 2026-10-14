// Un plano de 2×2 que cubre el cuadro entero: va directo a coordenadas de recorte.
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
