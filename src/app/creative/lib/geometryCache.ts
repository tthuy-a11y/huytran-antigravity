import * as THREE from 'three';

const cache = new Map<string, THREE.BufferGeometry>();

export const getCachedGeometry = (
  key: string,
  creator: () => THREE.BufferGeometry
): THREE.BufferGeometry => {
  if (cache.has(key)) return cache.get(key)!;
  const geometry = creator();
  cache.set(key, geometry);
  return geometry;
};

export const disposeAllCachedGeometries = () => {
  cache.forEach((geo) => geo.dispose());
  cache.clear();
};

// ==================== COMMON GEOMETRIES ====================

export const getStarfieldGeometry = (count: number) =>
  getCachedGeometry(`starfield-${count}`, () => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Far shell
      const r = 80 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Star color: white/blue-tinted/yellow-tinted
      const r2 = Math.random();
      let cr: number, cg: number, cb: number;
      if (r2 > 0.9) { cr = 1.0; cg = 0.92; cb = 0.75; }      // yellow
      else if (r2 > 0.75) { cr = 0.78; cg = 0.85; cb = 1.0; } // blue
      else { cr = 0.95; cg = 0.95; cb = 1.0; }                // white
      colors[i * 3] = cr; colors[i * 3 + 1] = cg; colors[i * 3 + 2] = cb;
      sizes[i] = Math.random() > 0.97 ? 3 + Math.random() * 3 : 0.6 + Math.random() * 1.4;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.computeBoundingSphere();
    return geo;
  });
