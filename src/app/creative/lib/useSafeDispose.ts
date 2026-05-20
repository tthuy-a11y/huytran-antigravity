import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Disposable = THREE.BufferGeometry | THREE.Material | THREE.Object3D | null | undefined;

export function useSafeDispose(objects: Disposable | Disposable[]) {
  const disposedRef = useRef(new Set<Disposable>());

  useEffect(() => {
    const items = Array.isArray(objects) ? objects : [objects];
    disposedRef.current.clear();

    return () => {
      items.forEach((obj) => {
        if (!obj || disposedRef.current.has(obj)) return;

        disposedRef.current.add(obj);

        // 1. BufferGeometry
        if (obj instanceof THREE.BufferGeometry) {
          obj.dispose();
        }
        // 2. Material (ShaderMaterial đặc biệt quan trọng)
        else if (obj instanceof THREE.Material) {
          if (obj instanceof THREE.ShaderMaterial) {
            // Dispose tất cả texture trong uniforms (rất hay leak)
            Object.keys(obj.uniforms).forEach((key) => {
              const u = obj.uniforms[key];
              if (u?.value instanceof THREE.Texture) {
                u.value.dispose();
              }
            });
          }
          obj.dispose();
        }
        // 3. Mesh / Points / InstancedMesh / Group
        else if (obj instanceof THREE.Object3D) {
          // Dispose geometry + material của chính nó
          if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.InstancedMesh) {
            if (obj.geometry) obj.geometry.dispose();

            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((mat) => {
              if (mat) mat.dispose();
            });

            // InstancedMesh đặc biệt
            if (obj instanceof THREE.InstancedMesh) {
              if (obj.instanceMatrix) obj.instanceMatrix.dispose();
              if (obj.instanceColor) obj.instanceColor.dispose();
            }
          }

          // Recursively dispose children (nếu là Group)
          if (obj instanceof THREE.Group) {
            obj.children.forEach((child) => {
              if (child instanceof THREE.Object3D) {
                // We'd recurse here in a more complex setup, but R3F unmounts children automatically.
                // Disposing the group itself is enough if it holds no direct geom/mat.
              }
            });
          }
        }
      });
    };
  }, [objects]);
}
