'use client';

import * as Tone from 'tone';

// GlobalAudioEngine — Singleton Web Audio API engine.
// Powered by Tone.js to generate rich, cinematic, AAA-quality sci-fi sound effects procedurally.

class GlobalAudioEngine {
  private static instance: GlobalAudioEngine | null = null;

  private isInit = false;
  private muted = false;

  // Synths
  private subSynth!: Tone.Synth;
  private engineSynth!: Tone.FMSynth;
  private boomSynth!: Tone.MembraneSynth;
  private noiseSynth!: Tone.NoiseSynth;
  private chimeSynth!: Tone.MetalSynth;
  private uiSynth!: Tone.PolySynth;
  
  // Effects
  private reverb!: Tone.Reverb;
  private delay!: Tone.FeedbackDelay;
  private masterVolume!: Tone.Volume;

  private constructor() {}

  public static getInstance(): GlobalAudioEngine {
    if (!GlobalAudioEngine.instance) {
      GlobalAudioEngine.instance = new GlobalAudioEngine();
    }
    return GlobalAudioEngine.instance;
  }

  public async init() {
    if (this.isInit || typeof window === 'undefined') return;
    await Tone.start();
    
    // Master Output
    this.masterVolume = new Tone.Volume(this.muted ? -Infinity : -4).toDestination();
    
    // Cinematic Effects (Reverb and Delay for spatial depth)
    this.reverb = new Tone.Reverb({ decay: 5, wet: 0.6 }).connect(this.masterVolume);
    this.delay = new Tone.FeedbackDelay("8n", 0.4).connect(this.reverb);
    
    // --- Synth Definitions ---
    
    // Deep Sub-Bass for power up
    this.subSynth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 2 }
    }).connect(this.masterVolume);
    
    // Sci-Fi Engine Revving (FMSynth creates complex, metallic overtones)
    this.engineSynth = new Tone.FMSynth({
      harmonicity: 1.5,
      modulationIndex: 12,
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.2, decay: 0.2, sustain: 1, release: 2 }
    }).connect(this.delay);

    // Explosive Warp Boom (MembraneSynth is perfect for kicks/booms)
    this.boomSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 8,
      oscillator: { type: "square" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: "exponential" }
    }).connect(this.reverb);
    
    // Space Dust/Air Rush during warp
    this.noiseSynth = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 1 }
    }).connect(this.reverb);

    // Arrival Chime (MetalSynth gives a futuristic, metallic bell sound)
    this.chimeSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 2.5, release: 0.2 },
      harmonicity: 4.1,
      modulationIndex: 20,
      resonance: 4000,
      octaves: 1.5
    }).connect(this.delay);
    this.chimeSynth.frequency.value = 200;

    // High-tech UI sounds (PolySynth allows playing multiple notes/chords)
    this.uiSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.5 }
    }).connect(this.masterVolume);

    this.isInit = true;
  }

  public setMute(muted: boolean) {
    this.muted = muted;
    if (this.masterVolume) {
      this.masterVolume.volume.rampTo(muted ? -Infinity : -4, 0.1);
    }
  }

  public dispose() {
    this.stopAll();
    this.isInit = false;
    GlobalAudioEngine.instance = null;
  }

  public stopAll() {
    if (!this.isInit) return;
    
    // Release all active notes
    try {
      this.subSynth?.triggerRelease();
      this.engineSynth?.triggerRelease();
      this.boomSynth?.triggerRelease();
      this.noiseSynth?.triggerRelease();
      this.chimeSynth?.triggerRelease();
      this.uiSynth?.releaseAll();
    } catch (e) {
      // Ignore if not currently playing
    }
    
    // Briefly mute master to kill reverb/delay tails instantly
    if (this.masterVolume) {
      this.masterVolume.volume.rampTo(-Infinity, 0.05);
      setTimeout(() => {
        if (!this.muted && this.masterVolume) {
          this.masterVolume.volume.rampTo(-4, 0.1);
        }
      }, 100);
    }
  }

  // ── Cinematic Warp sequence ────────────────────────────────────────────

  public async playPowerUp() {
    await this.init();
    const now = Tone.now();
    
    // Deep bass sweeping up
    this.subSynth.triggerAttackRelease("C2", 1.5, now);
    this.subSynth.frequency.rampTo("C4", 1.5, now);
    
    // High-pitched engine revving up rapidly
    this.engineSynth.triggerAttackRelease("C3", 1.5, now, 0.4);
    this.engineSynth.frequency.exponentialRampTo("C6", 1.5, now);
  }

  public async playSonicBoom() {
    await this.init();
    const now = Tone.now();
    
    // Massive bass impact
    this.boomSynth.triggerAttackRelease("C1", "8n", now);
    // Air rush and debris
    this.noiseSynth.triggerAttackRelease("4n", now, 0.5);
  }

  public async playArrival() {
    await this.init();
    const now = Tone.now();
    
    // Futuristic metallic chime
    this.chimeSynth.triggerAttackRelease("2n", now);
    // Triumphant glowing chord
    this.uiSynth.triggerAttackRelease(["C5", "E5", "G5", "B5"], 1.5, now, 0.15);
  }

  // ── UI tones ──────────────────────────────────────────────────────────

  public async playHoverTone(freq: number, duration = 0.4) {
    await this.init();
    const now = Tone.now();
    // Soft high-tech blip
    this.uiSynth.triggerAttackRelease(freq, duration, now, 0.05);
  }

  public async playClickTone() {
    await this.init();
    const now = Tone.now();
    // Sharp interaction click
    this.uiSynth.triggerAttackRelease("C6", 0.1, now, 0.2);
  }
  // ── Ship Specific Motifs ─────────────────────────────────────────────

  public async playShipEngage(shipId: number) {
    await this.init();
    const now = Tone.now();
    switch (shipId) {
      case 0: // AI (Nexus) - Digital calculations
        this.uiSynth.triggerAttackRelease(["C5", "D#5", "G5"], 0.1, now);
        this.uiSynth.triggerAttackRelease(["C6", "D#6", "G6"], 0.1, now + 0.15);
        this.uiSynth.triggerAttackRelease(["C7", "D#7", "G7"], 0.2, now + 0.3);
        break;
      case 1: // Web3D (UIX) - Smooth sweep
        this.subSynth.triggerAttackRelease("C3", 1, now);
        this.subSynth.frequency.exponentialRampTo("C6", 1, now);
        break;
      case 2: // Prompt (Prmpt) - Glitchy/Typing
        for (let i = 0; i < 8; i++) {
          this.noiseSynth.triggerAttackRelease("32n", now + i * 0.05, 0.3);
          if (i % 2 === 0) this.uiSynth.triggerAttackRelease("C6", "32n", now + i * 0.05);
        }
        break;
      case 3: // Physics (Phys) - Gravity Bass Drop
        this.boomSynth.triggerAttackRelease("C1", 2, now);
        this.subSynth.triggerAttackRelease("C2", 2, now);
        this.subSynth.frequency.exponentialRampTo("C0", 1.5, now + 0.5);
        break;
      case 4: // Data (Cloud) - Ethereal Drone
        this.uiSynth.triggerAttackRelease(["C4", "G4", "D5"], 2, now, 0.3);
        this.engineSynth.triggerAttackRelease("G2", 2, now, 0.2);
        break;
      case 5: // Security (Shield) - Heavy lock
        this.chimeSynth.triggerAttackRelease("4n", now);
        setTimeout(() => this.boomSynth.triggerAttackRelease("C2", "8n", Tone.now()), 200);
        setTimeout(() => this.boomSynth.triggerAttackRelease("C1", "8n", Tone.now()), 400);
        break;
    }
  }

  public async playShipWarp(shipId: number) {
    await this.init();
    const now = Tone.now();
    // Universal warp boom but colored by ship
    this.boomSynth.triggerAttackRelease("C1", "4n", now);
    this.noiseSynth.triggerAttackRelease("2n", now, 0.6);
    switch (shipId) {
      case 0: this.engineSynth.triggerAttackRelease("C6", 1, now); break;
      case 1: this.uiSynth.triggerAttackRelease(["C4", "E4", "G4"], 1, now); break;
      case 2: this.noiseSynth.triggerAttackRelease("8n", now, 1); break;
      case 3: this.subSynth.triggerAttackRelease("C1", 1, now); break;
      case 4: this.chimeSynth.triggerAttackRelease("1n", now); break;
      case 5: this.boomSynth.triggerAttackRelease("C1", 1, now); break;
    }
  }
}


export const audioEngine = GlobalAudioEngine.getInstance();
