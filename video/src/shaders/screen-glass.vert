// Vidrio de pantalla, vértice: uv, normal y posición en el mundo.

varying vec2 vUv;
varying vec3 vNormalMundo;
varying vec3 vPosicionMundo;

void main() {
  vUv = uv;
  vec4 mundo = modelMatrix * vec4(position, 1.0);
  vPosicionMundo = mundo.xyz;
  vNormalMundo = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * mundo;
}
