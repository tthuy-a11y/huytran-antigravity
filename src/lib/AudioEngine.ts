'use client';

// GlobalAudioEngine — singleton Web Audio API engine.
// All warp SFX and UI tones share a single AudioContext.

class GlobalAudioEngine {
  private static instance: GlobalAudioEngine | null = null;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private isInit = false;

  private constructor() {}

  public static getInstance(): GlobalAudioEngine {
    if (!GlobalAudioEngine.instance) {
      GlobalAudioEngine.instance = new GlobalAudioEngine();
    }
    return GlobalAudioEngine.instance;
  }

  public init() {
    if (this.isInit || typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.65;
    this.masterGain.connect(this.ctx.destination);
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.isInit = true;
  }

  public setMute(muted: boolean) {
    this.muted = muted;
    if (this.masterGain) this.masterGain.gain.value = muted ? 0 : 0.65;
  }

  public dispose() {
    this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
    this.isInit = false;
    GlobalAudioEngine.instance = null;
  }

  // ── Warp sequence ────────────────────────────────────────────

  public playPowerUp() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const duration = 1.6;

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(28, t);
    sub.frequency.exponentialRampToValueAtTime(85, t + duration);
    subGain.gain.setValueAtTime(0, t);
    subGain.gain.linearRampToValueAtTime(0.95, t + 0.9);

    const engine = this.ctx.createOscillator();
    const engineGain = this.ctx.createGain();
    engine.type = 'sawtooth';
    engine.frequency.setValueAtTime(90, t);
    engine.frequency.exponentialRampToValueAtTime(3200, t + duration);
    engineGain.gain.setValueAtTime(0, t);
    engineGain.gain.linearRampToValueAtTime(0.38, t + duration);

    sub.connect(subGain).connect(this.masterGain);
    engine.connect(engineGain).connect(this.masterGain);
    sub.start(t); sub.stop(t + duration);
    engine.start(t); engine.stop(t + duration);
  }

  public playSonicBoom() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'square';
    boom.frequency.setValueAtTime(160, t);
    boom.frequency.exponentialRampToValueAtTime(18, t + 0.95);
    boomGain.gain.setValueAtTime(1.15, t);
    boomGain.gain.exponentialRampToValueAtTime(0.01, t + 1.15);

    const bufferSize = this.ctx.sampleRate * 1.65;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.frequency.exponentialRampToValueAtTime(35, t + 1.45);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.88, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 1.65);

    boom.connect(boomGain).connect(this.masterGain);
    noise.connect(filter).connect(noiseGain).connect(this.masterGain);
    boom.start(t); boom.stop(t + 1.35);
    noise.start(t);
  }

  public playArrival() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(920, t);
    chime.frequency.exponentialRampToValueAtTime(420, t + 1.25);
    chimeGain.gain.setValueAtTime(0, t);
    chimeGain.gain.linearRampToValueAtTime(0.58, t + 0.15);
    chimeGain.gain.exponentialRampToValueAtTime(0.01, t + 2.4);
    chime.connect(chimeGain).connect(this.masterGain);
    chime.start(t); chime.stop(t + 2.5);
  }

  // ── UI tones (formerly src/lib/audio.ts) ─────────────────────

  public playHoverTone(freq: number, duration = 0.4) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + duration);
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(filter).connect(gain).connect(this.masterGain);
    osc.start(t); osc.stop(t + duration);
  }

  public playClickTone() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.15);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

    osc.connect(gain).connect(this.masterGain);
    osc.start(t); osc.stop(t + 0.3);
  }
}

export const audioEngine = GlobalAudioEngine.getInstance();
