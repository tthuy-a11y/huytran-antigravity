// planet.vert.glsl
//
// Vertex shader chung cho mọi planet (gas, rocky, ice).
// Truyền UV + world position + normal xuống fragment shader.
//
// Three.js cung cấp sẵn các attributes: position, normal, uv
// Và uniforms: modelMatrix, viewMatrix, projectionMatrix, normalMatrix
// → KHÔNG cần khai báo lại (raw ShaderMaterial sẽ phải khai báo,
//   nhưng @react-three/drei shaderMaterial helper tự inject)

precision highp float;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
    vUv = uv;

    // World-space position cho fresnel calc trong fragment
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;

    // World-space normal — normalMatrix đã handle non-uniform scale
    vNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
