// El cromo de la Q, vértice: la normal y la posición en el mundo, para que
// el fragment refleje el estudio en coordenadas de mundo (como el entorno
// del sitio).

varying vec3 vNormalMundo;
varying vec3 vPosicionMundo;

void main() {
  vec4 mundo = modelMatrix * vec4(position, 1.0);
  vPosicionMundo = mundo.xyz;
  // La Q se escala parejo: alcanza con la matriz de modelo para la normal.
  vNormalMundo = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * mundo;
}
