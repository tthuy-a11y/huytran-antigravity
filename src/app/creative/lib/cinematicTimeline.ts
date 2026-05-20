/**
 * cinematicTimeline.ts
 *
 * GSAP timeline-based choreographer cho toàn bộ cinematic 32 giây.
 *
 * Vai trò:
 *   - Định nghĩa keyframes camera + global FX theo trục thời gian
 *   - Expose target object (cameraState, fxState) mà scene components subscribe
 *   - KHÔNG tự chạy time — được driven bởi useCinematicTime.getPlayheadMs()
 *
 * Lý do tách khỏi useCinematicTime:
 *   - useCinematicTime quản playhead (single source of truth cho "now")
 *   - cinematicTimeline.ts định nghĩa "ở thời điểm X, world state trông thế nào"
 *   - Component scene read target state, không cần biết về GSAP
 *
 * Usage:
 *   import { initCinematicTimeline, syncTimelineToMs, cinematicTargets } from '.../cinematicTimeline'
 *
 *   // Tại root:
 *   useEffect(() => { initCinematicTimeline() }, [])
 *
 *   // Trong rAF driver:
 *   useCinematicFrame((ms) => syncTimelineToMs(ms))
 *
 *   // Trong scene 3D:
 *   useFrame(() => { camera.position.lerp(cinematicTargets.camera.position, 0.1) })
 */

import { gsap } from 'gsap';

// ============================================================
// TARGET STATE — Scene components đọc các giá trị này mỗi frame
// ============================================================

export interface CameraTarget {
  // Position trong world units (Three.js space)
  positionX: number;
  positionY: number;
  positionZ: number;
  // Look-at target
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;
  // FOV cho dolly zoom effect (vertigo)
  fov: number;
  // Roll (z-axis rotation) — cho shake / barrel roll
  roll: number;
}

export interface FxTarget {
  // Post-processing
  bloomIntensity: number;          // 0..3
  chromaticAberration: number;     // 0..0.01
  vignetteDarkness: number;        // 0..1
  filmGrainIntensity: number;      // 0..1
  godRaysDensity: number;          // 0..1
  // Global scene
  starfieldSpeed: number;          // multiplier for star drift
  nebulaOpacity: number;           // 0..1
  ambientLightIntensity: number;   // 0..2
  // Shake (consumed bởi camera transform)
  shakeAmplitude: number;          // 0..1
  shakeFrequency: number;          // Hz
}

export const cinematicTargets = {
  camera: {
    positionX: 0,
    positionY: 0,
    positionZ: 10,
    lookAtX: 0,
    lookAtY: 0,
    lookAtZ: 0,
    fov: 60,
    roll: 0,
  } as CameraTarget,
  fx: {
    bloomIntensity: 0.5,
    chromaticAberration: 0.0005,
    vignetteDarkness: 0.4,
    filmGrainIntensity: 0.15,
    godRaysDensity: 0.3,
    starfieldSpeed: 1,
    nebulaOpacity: 0.4,
    ambientLightIntensity: 0.3,
    shakeAmplitude: 0,
    shakeFrequency: 0,
  } as FxTarget,
};

// ============================================================
// TIMELINE — paused, manually scrubbed
// ============================================================

let timeline: gsap.core.Timeline | null = null;
let initialized = false;

/**
 * Build timeline 1 lần khi mount root.
 *
 * Coordinate system (18s total):
 *   Scene 1 — quantum-birth:      0 → 5s
 *   Scene 2 — nebula-awakening:   4s → 8s
 *   Scene 3 — cosmic-inferno:     7s → 14s
 *   Scene 4 — eternal-message:    14s → 18s
 *
 * Tất cả time trong GSAP gọi với đơn vị SECONDS (chuẩn GSAP).
 * Khi sync, convert ms / 1000.
 */
export function initCinematicTimeline() {
  if (initialized) return;
  initialized = true;

  timeline = gsap.timeline({ paused: true });

  // -----------------------------------------------------------
  // ACT I — QUANTUM BIRTH  (0s → 5s)
  // Camera bay từ xa vào nguyên tử, fov bóp lại tạo cảm giác tiến gần
  // -----------------------------------------------------------
  timeline
    .to(cinematicTargets.camera, {
      positionZ: 4,
      fov: 45,
      duration: 5,
      ease: 'power2.inOut',
    }, 0)
    .to(cinematicTargets.fx, {
      bloomIntensity: 1.2,
      vignetteDarkness: 0.55,
      nebulaOpacity: 0.7,
      ambientLightIntensity: 0.6,
      duration: 5,
      ease: 'sine.inOut',
    }, 0);

  // -----------------------------------------------------------
  // ACT II — NEBULA AWAKENING  (4s → 8s)
  // Dolly back, FOV mở ra để hé lộ scale vũ trụ
  // Slight roll tạo cảm giác trôi
  // -----------------------------------------------------------
  timeline
    .to(cinematicTargets.camera, {
      positionZ: 14,
      positionY: 1.5,
      fov: 75,
      roll: 0.05,
      duration: 4,
      ease: 'power3.out',
    }, 4)
    .to(cinematicTargets.fx, {
      bloomIntensity: 1.6,
      chromaticAberration: 0.0012,
      starfieldSpeed: 1.6,
      godRaysDensity: 0.6,
      duration: 4,
      ease: 'sine.out',
    }, 4);

  // -----------------------------------------------------------
  // ACT III — COSMIC INFERNO  (7s → 14s)
  // 7.0–9.5s: Hai sao thiên thạch lao vào nhau
  // 9.5–10.0s: SHATTER — camera shake mạnh, FOV co lại
  // 10.0–14.0s: Big Bang — camera đẩy lùi nhanh, bloom max
  // -----------------------------------------------------------
  // Sao chổi tiến vào: bay nhẹ
  timeline.to(cinematicTargets.camera, {
    positionZ: 12,
    fov: 70,
    duration: 2.5,
    ease: 'power1.in',
  }, 7);

  // SHATTER impact — camera punch + chromatic aberration spike
  timeline
    .to(cinematicTargets.camera, {
      positionZ: 8,
      fov: 35,
      roll: -0.15,
      duration: 0.5,
      ease: 'power4.out',
    }, 9.5)
    .to(cinematicTargets.fx, {
      shakeAmplitude: 1,
      shakeFrequency: 30,
      chromaticAberration: 0.008,
      bloomIntensity: 3,
      duration: 0.5,
      ease: 'expo.out',
    }, 9.5);

  // Big Bang — camera blast back
  timeline
    .to(cinematicTargets.camera, {
      positionZ: 28,
      positionY: 0,
      fov: 95,
      roll: 0.08,
      duration: 4,
      ease: 'power3.out',
    }, 10)
    .to(cinematicTargets.fx, {
      shakeAmplitude: 0.3,
      shakeFrequency: 12,
      chromaticAberration: 0.003,
      bloomIntensity: 2.2,
      godRaysDensity: 1,
      filmGrainIntensity: 0.3,
      duration: 4,
      ease: 'power2.out',
    }, 10);

  // -----------------------------------------------------------
  // ACT IV — ETERNAL MESSAGE  (14s → 18s)
  // Camera settle vào composition giữa khung, FX dịu xuống
  // -----------------------------------------------------------
  timeline
    .to(cinematicTargets.camera, {
      positionZ: 18,
      positionY: 0.5,
      fov: 65,
      roll: 0,
      duration: 4,
      ease: 'power2.inOut',
    }, 14)
    .to(cinematicTargets.fx, {
      shakeAmplitude: 0,
      shakeFrequency: 0,
      chromaticAberration: 0.0008,
      bloomIntensity: 1.4,
      vignetteDarkness: 0.5,
      filmGrainIntensity: 0.2,
      godRaysDensity: 0.4,
      starfieldSpeed: 0.6,
      nebulaOpacity: 0.5,
      duration: 4,
      ease: 'sine.inOut',
    }, 14);
}

/**
 * Sync timeline tới ms cụ thể — gọi mỗi frame từ rAF driver.
 *
 * GSAP timeline.totalTime(seconds) sẽ snap all tweens to that absolute time,
 * works perfectly cho scrubbing (debug shuttle) + play/pause/seek.
 */
export function syncTimelineToMs(ms: number) {
  if (!timeline) return;
  const seconds = Math.max(0, Math.min(18, ms / 1000));
  timeline.totalTime(seconds);
}

/**
 * Compute shake offset based on current fx target — gọi từ camera transform.
 * Trả về delta để cộng vào camera position.
 *
 * Note: shake là noise xen lẫn, không nên drive bằng GSAP (vì cần per-frame randomness)
 */
export function computeShakeOffset(elapsedSeconds: number): { dx: number; dy: number; droll: number } {
  const { shakeAmplitude: amp, shakeFrequency: freq } = cinematicTargets.fx;
  if (amp <= 0 || freq <= 0) return { dx: 0, dy: 0, droll: 0 };

  // Smooth pseudo-noise via 3 sin waves at different freqs
  const t = elapsedSeconds * freq;
  const dx = (Math.sin(t * 1.0) + Math.sin(t * 2.3) * 0.5) * amp * 0.3;
  const dy = (Math.cos(t * 1.7) + Math.sin(t * 3.1) * 0.5) * amp * 0.3;
  const droll = Math.sin(t * 0.8) * amp * 0.05;

  return { dx, dy, droll };
}

/**
 * Cleanup — gọi khi creative page unmount
 */
export function disposeCinematicTimeline() {
  if (timeline) {
    timeline.kill();
    timeline = null;
  }
  initialized = false;
}
