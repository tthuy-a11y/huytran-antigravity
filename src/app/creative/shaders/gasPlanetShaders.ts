export const vertexShader = `
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
`;

export const fragmentShader = `
// gasPlanet.frag.glsl
//
// Procedural fragment shader cho gas giant planet (style Jupiter/Saturn).
// Replaces external CDN texture từ Wikipedia bằng pure GPU computation.
//
// Inputs:
//   - vUv          : sphere UV (passed từ vertex shader)
//   - vWorldPos    : world position cho fresnel
//   - vNormal      : sphere normal world-space
//
// Uniforms:
//   - uTime        : seconds elapsed → drive band rotation, storm vortex
//   - uBaseColor   : ambient tint (vec3, ví dụ vec3(0.85, 0.6, 0.3) cho Jupiter)
//   - uAccentColor : storm/spot tint (vec3, ví dụ vec3(0.95, 0.4, 0.15))
//   - uBandSharp   : độ rõ của bands (0..1, default 0.5)
//   - uAudioBass   : 0..1 từ audio FFT → pulse atmosphere (audio-reactive)
//   - uCameraPos   : world camera position cho fresnel
//
// Trả về: vec4 final color (RGB + alpha=1)
//
// Performance:
//   - 3 octaves FBM = ~12 noise samples per pixel
//   - Phù hợp với mobile mid-tier nếu sphere ≤ 32 segments
//   - Có thể giảm xuống 2 octaves cho low-tier

precision highp float;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;

uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uAccentColor;
uniform float uBandSharp;
uniform float uAudioBass;
uniform vec3 uCameraPos;

// ----------------------------------------------------------------
// HASH + NOISE — classic Inigo Quilez style
// ----------------------------------------------------------------

float hash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
}

float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);

    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);

    return mix(nxy0, nxy1, f.z);
}

// 3 octaves FBM — đủ chi tiết cho gas planet
float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
        v += a * noise(p);
        p *= 2.07;
        a *= 0.5;
    }
    return v;
}

// ----------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------

void main() {
    // 1. BANDS — horizontal stripes drift theo uTime
    //    Lấy latitude (vUv.y) + warp nhẹ bằng noise để tránh straight bands
    float lat = vUv.y;
    float bandDrift = uTime * 0.02;
    float warpNoise = fbm(vec3(vUv.x * 4.0, lat * 8.0 + bandDrift, uTime * 0.1));
    float bandPos = lat * 8.0 + warpNoise * 0.6;

    // Sharpen bands: smoothstep on sine wave
    float band = sin(bandPos * 3.14159);
    band = smoothstep(-0.3 + uBandSharp * 0.3, 0.3 - uBandSharp * 0.3, band);

    // 2. STORM / GREAT RED SPOT — 1 vùng concentrated noise spinning
    vec2 stormCenter = vec2(0.3, 0.55);
    vec2 toStorm = vUv - stormCenter;
    float stormDist = length(toStorm);
    float stormAngle = atan(toStorm.y, toStorm.x) + uTime * 0.3 + stormDist * 4.0;
    float stormNoise = fbm(vec3(cos(stormAngle) * 3.0, sin(stormAngle) * 3.0, uTime * 0.2));
    float storm = smoothstep(0.18, 0.0, stormDist) * stormNoise;

    // 3. CLOUD DETAIL — high-freq noise layered on bands
    vec3 detailP = vec3(vUv.x * 12.0, vUv.y * 8.0, uTime * 0.05);
    float detail = fbm(detailP) * 0.4;

    // 4. AUDIO-REACTIVE PULSE — bass boost làm atmosphere sáng/đậm
    float pulse = uAudioBass * 0.35;

    // 5. MIX COLORS
    vec3 color = mix(uBaseColor, uBaseColor * 0.65, band);       // dark stripes
    color = mix(color, uAccentColor, storm * 0.85);              // storm tint
    color += detail * 0.15;                                       // cloud highlights
    color *= 1.0 + pulse;                                         // audio pulse

    // 6. FRESNEL RIM LIGHT — sáng ở rìa, tạo atmosphere glow
    vec3 viewDir = normalize(uCameraPos - vWorldPos);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
    vec3 rimColor = mix(uAccentColor, vec3(1.0, 0.95, 0.8), 0.4);
    color += rimColor * fresnel * (0.4 + pulse * 0.3);

    // 7. SUBTLE TERMINATOR (day/night) — fake với normal dot up vector
    //    (cho realistic mood, không phải shading thật)
    float terminator = max(dot(vNormal, normalize(vec3(0.6, 0.3, 0.7))), 0.0);
    color *= 0.55 + terminator * 0.45;

    gl_FragColor = vec4(color, 1.0);
}
`;
