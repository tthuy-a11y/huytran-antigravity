/**
 * audioEngine.ts
 * ──────────────────────────────────────────────────────────────────
 * Centralized audio engine cho toàn cinematic.
 *
 * SO VỚI CODE CŨ:
 * - Trước: AudioContext mới mỗi mount, oscillator viết tay, dễ leak
 * - Sau:   Singleton Tone.js, asset-based, sync với SceneId
 *
 * Cấu trúc 3 layer:
 *   1. AMBIENT (loop, always-on): cosmic hum, background pad
 *   2. CUE     (one-shot, scene-bound): big bang, shatter, swoosh
 *   3. SFX     (UI, instant): hover, click, type
 *
 * Mỗi SceneId mapping với một AudioMixState (volume các layer).
 *
 * BUNDLE COST:
 * - tone: ~80KB gzip (lazy load)
 * - howler: ~30KB gzip (lazy load)
 * - Tổng asset (CC0 freesound): ~400KB nén, lazy fetched on user gesture
 */

import type { SceneId } from './cinematicStore';

// ═══════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════

export type CueId =
  | 'big-bang'
  | 'glass-shatter'
  | 'meteor-impact'
  | 'shockwave'
  | 'warp-jump'
  | 'data-beep'
  | 'laser'
  | 'planet-discover';

export type SfxId =
  | 'hover'
  | 'click'
  | 'type'
  | 'modal-open'
  | 'modal-close';

interface AudioMixState {
  hum: number;       // 0-1
  pad: number;
  drone: number;
  ambient: number;
  reverb: number;
}

// Mix preset cho từng scene (khớp với cinematicStore.ts)
const SCENE_MIX: Record<SceneId, AudioMixState> = {
  'creation':     { hum: 0.3, pad: 0.2, drone: 0.0, ambient: 0.4, reverb: 0.5 },
  'technology':   { hum: 0.5, pad: 0.4, drone: 0.2, ambient: 0.3, reverb: 0.6 },
  'convergence':  { hum: 0.9, pad: 0.7, drone: 1.0, ambient: 0.0, reverb: 0.8 },
  'awakening':    { hum: 0.4, pad: 0.6, drone: 0.0, ambient: 0.5, reverb: 0.7 },
};

// ═══════════════════════════════════════════════════════════
//  ASSET REGISTRY
// ═══════════════════════════════════════════════════════════

/**
 * CC0/CC-BY assets từ Freesound.org — preload on user gesture.
 * Thay bằng asset thật của bạn. Tất cả file đặt tại /public/audio/
 */
export const AUDIO_ASSETS = {
  cues: {
    'big-bang':       '/audio/cues/big-bang.mp3',
    'glass-shatter':  '/audio/cues/glass-shatter.mp3',
    'meteor-impact':  '/audio/cues/meteor-impact.mp3',
    'shockwave':      '/audio/cues/shockwave.mp3',
    'warp-jump':      '/audio/cues/warp-jump.mp3',
    'data-beep':      '/audio/cues/data-beep.mp3',
    'laser':          '/audio/cues/laser.mp3',
    'planet-discover':'/audio/cues/discover.mp3',
  },
  sfx: {
    'hover':       '/audio/sfx/hover.mp3',
    'click':       '/audio/sfx/click.mp3',
    'type':        '/audio/sfx/type.mp3',
    'modal-open':  '/audio/sfx/modal-open.mp3',
    'modal-close': '/audio/sfx/modal-close.mp3',
  },
  ambient: {
    'cosmic-hum':   '/audio/ambient/cosmic-hum.mp3',  // loop
    'space-pad':    '/audio/ambient/space-pad.mp3',   // loop
    'sub-drone':    '/audio/ambient/sub-drone.mp3',   // loop
  },
} as const;

// ═══════════════════════════════════════════════════════════
//  ENGINE SINGLETON
// ═══════════════════════════════════════════════════════════

class AudioEngine {
  private isInitialized = false;
  private isInitializing = false;
  private isMuted = false;
  private masterVolume = 0.7;

  // Tone.js & Howler instances (lazy loaded)
  private Tone: typeof import('tone') | null = null;
  private Howl: typeof import('howler').Howl | null = null;

  // Ambient loops (always-on, gain modulated)
  private humPlayer: any = null;
  private padPlayer: any = null;
  private dronePlayer: any = null;

  // Effects
  private masterGain: any = null;
  private reverb: any = null;
  private compressor: any = null;

  // SFX cache (Howler instances)
  private sfxCache = new Map<string, any>();
  private cueCache = new Map<string, any>();

  // — Analyser cho audio-reactive visuals —
  private analyser: any = null;
  private fftSize = 64;
  private fftData: Uint8Array = new Uint8Array(64);

  /**
   * Init engine — PHẢI gọi từ user gesture (click/keydown)
   * để bypass browser autoplay policy.
   */
  async init(): Promise<void> {
    if (this.isInitialized || this.isInitializing) return;
    this.isInitializing = true;

    try {
      // Dynamic import để tree-shake nếu user mute
      const [Tone, howlerModule] = await Promise.all([
        import('tone'),
        import('howler'),
      ]);

      this.Tone = Tone;
      this.Howl = howlerModule.Howl;

      await Tone.start();

      // Build signal chain
      this.masterGain = new Tone.Gain(this.masterVolume).toDestination();
      this.compressor = new Tone.Compressor(-24, 4).connect(this.masterGain);
      this.reverb = new Tone.Reverb({ decay: 8, wet: 0.3 }).connect(this.compressor);

      // Analyser (cho audio-reactive)
      this.analyser = new Tone.Analyser('fft', this.fftSize);
      this.compressor.connect(this.analyser);

      // Ambient loops
      this.humPlayer = new Tone.Player({
        url: AUDIO_ASSETS.ambient['cosmic-hum'],
        loop: true,
        volume: -60, // dB
        autostart: false,
      }).connect(this.reverb);

      this.padPlayer = new Tone.Player({
        url: AUDIO_ASSETS.ambient['space-pad'],
        loop: true,
        volume: -60,
        autostart: false,
      }).connect(this.reverb);

      this.dronePlayer = new Tone.Player({
        url: AUDIO_ASSETS.ambient['sub-drone'],
        loop: true,
        volume: -60,
        autostart: false,
      }).connect(this.compressor);

      // Wait for buffers to load
      await Tone.loaded();

      this.humPlayer.start();
      this.padPlayer.start();
      this.dronePlayer.start();

      this.isInitialized = true;
    } catch (error) {
      console.warn('[AudioEngine] init failed:', error);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Set mix preset cho scene hiện tại.
   * Smooth crossfade trong `rampSec` giây.
   */
  setSceneMix(scene: SceneId, rampSec: number = 1.5): void {
    if (!this.isInitialized || !this.Tone) return;
    const mix = SCENE_MIX[scene];
    const dbify = (v: number) => (v <= 0 ? -60 : 20 * Math.log10(v));
    const now = this.Tone.now();

    this.humPlayer?.volume.rampTo(dbify(mix.hum), rampSec, now);
    this.padPlayer?.volume.rampTo(dbify(mix.pad), rampSec, now);
    this.dronePlayer?.volume.rampTo(dbify(mix.drone), rampSec, now);

    if (this.reverb) this.reverb.wet.rampTo(mix.reverb, rampSec, now);
  }

  /**
   * Play one-shot cue (big bang, shatter, etc.)
   */
  playCue(id: CueId, options: { volume?: number; rate?: number } = {}): void {
    if (this.isMuted || !this.Howl) return;
    let sound = this.cueCache.get(id);

    if (!sound) {
      sound = new this.Howl({
        src: [AUDIO_ASSETS.cues[id]],
        volume: options.volume ?? 0.8,
        rate: options.rate ?? 1.0,
      });
      this.cueCache.set(id, sound);
    }
    sound.volume(options.volume ?? 0.8);
    sound.rate(options.rate ?? 1.0);
    sound.play();
  }

  /**
   * Play UI SFX (hover, click) — phải instant, không await.
   */
  playSfx(id: SfxId, options: { volume?: number } = {}): void {
    if (this.isMuted || !this.Howl) return;
    let sound = this.sfxCache.get(id);

    if (!sound) {
      sound = new this.Howl({
        src: [AUDIO_ASSETS.sfx[id]],
        volume: options.volume ?? 0.4,
      });
      this.sfxCache.set(id, sound);
    }
    sound.volume(options.volume ?? 0.4);
    sound.play();
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (!this.isInitialized || !this.Tone) return;
    const target = muted ? 0 : this.masterVolume;
    this.masterGain?.gain.rampTo(target, 0.5);
  }

  setVolume(v: number): void {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (!this.isInitialized || this.isMuted) return;
    this.masterGain?.gain.rampTo(this.masterVolume, 0.3);
  }

  /**
   * Lấy FFT data cho audio-reactive visuals.
   * Trả về Uint8Array (0-255).
   * Gọi mỗi frame trong useFrame() của R3F.
   */
  getFftData(): Uint8Array {
    if (!this.analyser) return this.fftData;
    const value = this.analyser.getValue() as Float32Array;
    // Tone FFT trả về dB (-100 to 0). Map về 0-255.
    for (let i = 0; i < this.fftSize; i++) {
      const db = value[i] ?? -100;
      this.fftData[i] = Math.max(0, Math.min(255, ((db + 100) / 100) * 255));
    }
    return this.fftData;
  }

  /**
   * Lấy bass energy (avg low-frequency FFT bins) → drive planet pulse.
   */
  getBassEnergy(): number {
    const data = this.getFftData();
    let sum = 0;
    const bins = Math.min(8, data.length);
    for (let i = 0; i < bins; i++) sum += data[i];
    return sum / bins / 255; // 0-1
  }

  dispose(): void {
    if (!this.isInitialized) return;
    this.humPlayer?.dispose();
    this.padPlayer?.dispose();
    this.dronePlayer?.dispose();
    this.reverb?.dispose();
    this.compressor?.dispose();
    this.analyser?.dispose();
    this.masterGain?.dispose();
    this.sfxCache.forEach((s) => s.unload());
    this.cueCache.forEach((s) => s.unload());
    this.sfxCache.clear();
    this.cueCache.clear();
    this.isInitialized = false;
  }
}

// ═══════════════════════════════════════════════════════════
//  EXPORT SINGLETON
// ═══════════════════════════════════════════════════════════

export const audioEngine = new AudioEngine();

/**
 * Convenience: bridge React + engine.
 * Gọi trong useEffect ở root cinematic.
 */
export function setupAudioBridge(opts: {
  onSceneChange: (scene: SceneId) => void;
  getMuted: () => boolean;
  getVolume?: () => number;
  getScene: () => SceneId;
}): () => void {
  const doInit = () => {
    audioEngine.init().then(() => {
      audioEngine.setMuted(opts.getMuted());
      audioEngine.setVolume(opts.getVolume ? opts.getVolume() : 0.7);
      audioEngine.setSceneMix(opts.getScene());
    });
  };

  // Try immediately! Since users navigate here from the home page,
  // the user gesture is already preserved by the browser!
  doInit();

  // Fallback: If they hard-refreshed, audio might be blocked.
  // Listening for the first click to re-init just in case.
  const initOnGesture = () => {
    doInit();
    window.removeEventListener('pointerdown', initOnGesture);
    window.removeEventListener('keydown', initOnGesture);
  };
  
  window.addEventListener('pointerdown', initOnGesture, { once: true });
  window.addEventListener('keydown', initOnGesture, { once: true });

  return () => {
    window.removeEventListener('pointerdown', initOnGesture);
    window.removeEventListener('keydown', initOnGesture);
  };
}
