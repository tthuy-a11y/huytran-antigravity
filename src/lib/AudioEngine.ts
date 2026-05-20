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

  // ── Ship Specific Motifs (5-Second Cinematic) ───────────────────────

  public async playShipRiser(shipId: number) {
    await this.init();
    const now = Tone.now();
    switch (shipId) {
      case 0: // Digital Phantom - Triangle + rapid arpeggio
        this.engineSynth.triggerAttackRelease("C3", 2.4, now);
        this.engineSynth.frequency.exponentialRampTo("C6", 2.4, now);
        for (let i = 0; i < 20; i++) {
          this.uiSynth.triggerAttackRelease(Math.random() > 0.5 ? "C5" : "G5", "32n", now + i * 0.12);
        }
        break;
      case 1: // Cosmic Explorer - Sine pad + long reverb
        this.subSynth.triggerAttackRelease("C3", 2.4, now, 0.5);
        this.subSynth.frequency.exponentialRampTo("G5", 2.4, now);
        this.uiSynth.triggerAttackRelease(["C4", "E4", "G4"], 2.4, now, 0.3);
        break;
      case 2: // Assault Fighter - Sawtooth + distortion riser
        this.engineSynth.triggerAttackRelease("C2", 2.4, now, 0.8);
        this.engineSynth.frequency.exponentialRampTo("C6", 2.4, now);
        break;
      case 3: // Heavy Dreadnought - Square + sub-bass
        this.subSynth.triggerAttackRelease("C1", 2.4, now, 1);
        this.subSynth.frequency.linearRampTo("C2", 2.4, now);
        break;
      case 4: // Ethereal Streamer - FM + overtones
        this.engineSynth.triggerAttackRelease("G2", 2.4, now, 0.4);
        this.engineSynth.frequency.exponentialRampTo("G5", 2.4, now);
        this.uiSynth.triggerAttackRelease(["G4", "D5", "A5"], 2.4, now, 0.2);
        break;
      case 5: // Fortress Ram - Heavy metallic charging
        this.chimeSynth.triggerAttackRelease("1n", now);
        this.subSynth.triggerAttackRelease("C2", 2.4, now, 0.8);
        this.subSynth.frequency.linearRampTo("C4", 2.4, now);
        break;
    }
  }

  public async playShipImpact(shipId: number) {
    await this.init();
    const now = Tone.now();
    switch (shipId) {
      case 0: 
        this.noiseSynth.triggerAttackRelease("16n", now, 1);
        this.uiSynth.triggerAttackRelease(["C6", "D#6", "G6"], 0.2, now);
        break;
      case 1: 
        this.boomSynth.triggerAttackRelease("C2", "8n", now);
        this.uiSynth.triggerAttackRelease(["C5", "G5"], 0.5, now);
        break;
      case 2: 
        this.boomSynth.triggerAttackRelease("C1", "4n", now);
        this.noiseSynth.triggerAttackRelease("8n", now, 0.8);
        break;
      case 3: 
        this.boomSynth.triggerAttackRelease("C0", "2n", now);
        break;
      case 4: 
        this.chimeSynth.triggerAttackRelease("8n", now);
        this.noiseSynth.triggerAttackRelease("4n", now, 0.5);
        break;
      case 5: 
        this.boomSynth.triggerAttackRelease("C1", "4n", now);
        this.chimeSynth.triggerAttackRelease("8n", now);
        break;
    }
  }

  public async playShipWarp(shipId: number) {
    await this.init();
    // 100ms silence gap before boom for dramatic effect
    const now = Tone.now() + 0.1; 
    
    // Massive decay boom for 5s cinematic
    this.boomSynth.triggerAttackRelease("C1", 1.5, now);
    this.noiseSynth.triggerAttackRelease("1n", now, 0.8);

    switch (shipId) {
      case 0: this.engineSynth.triggerAttackRelease("C6", 1.5, now); break;
      case 1: this.uiSynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], 1.5, now); break;
      case 2: this.noiseSynth.triggerAttackRelease("2n", now, 1); break;
      case 3: this.subSynth.triggerAttackRelease("C0", 1.5, now); break;
      case 4: this.chimeSynth.triggerAttackRelease("1n", now); break;
      case 5: this.boomSynth.triggerAttackRelease("C1", 1.5, now); break;
    }
  }

  // ── Nav Warp — Quick dimensional tear for nav buttons ────────────────
  public async playNavWarp() {
    await this.init();
    const rawCtx = Tone.getContext().rawContext as AudioContext;
    if (!rawCtx) return;
    const t = rawCtx.currentTime;

    const master = rawCtx.createGain();
    master.gain.setValueAtTime(this.muted ? 0 : 0.7, t);
    master.connect(rawCtx.destination);

    // Crystalline chime sweep
    const chime = rawCtx.createOscillator();
    const chimeGain = rawCtx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(600, t);
    chime.frequency.exponentialRampToValueAtTime(1800, t + 0.4);
    chimeGain.gain.setValueAtTime(0.5, t);
    chimeGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    chime.connect(chimeGain).connect(master);
    chime.start(t); chime.stop(t + 0.55);

    // Sub-bass thud
    const bass = rawCtx.createOscillator();
    const bassGain = rawCtx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(60, t + 0.1);
    bass.frequency.exponentialRampToValueAtTime(30, t + 0.6);
    bassGain.gain.setValueAtTime(0.8, t + 0.1);
    bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
    bass.connect(bassGain).connect(master);
    bass.start(t + 0.1); bass.stop(t + 0.75);

    // Noise whoosh
    const bufferSize = Math.floor(rawCtx.sampleRate * 0.6);
    const buffer = rawCtx.createBuffer(1, bufferSize, rawCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = rawCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = rawCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3000, t + 0.15);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, t + 0.6);
    noiseFilter.Q.value = 2;
    const noiseGain = rawCtx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t + 0.15);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);
    noise.connect(noiseFilter).connect(noiseGain).connect(master);
    noise.start(t + 0.15);

    // Resolution tone
    const resolve = rawCtx.createOscillator();
    const resolveGain = rawCtx.createGain();
    resolve.type = 'triangle';
    resolve.frequency.setValueAtTime(440, t + 0.3);
    resolve.frequency.exponentialRampToValueAtTime(880, t + 0.8);
    resolveGain.gain.setValueAtTime(0.35, t + 0.3);
    resolveGain.gain.exponentialRampToValueAtTime(0.01, t + 0.9);
    resolve.connect(resolveGain).connect(master);
    resolve.start(t + 0.3); resolve.stop(t + 0.95);

    // Master fade-out
    master.gain.setValueAtTime(master.gain.value, t + 0.9);
    master.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  }

  // ── Portal Warp — RAW WEB AUDIO API for ms-precise timing ───────────
  // Bypasses Tone.js scheduler for tighter control. Anti-clipping via per-voice gain.
  public async playPortalWarp() {
    await this.init();
    const rawCtx = Tone.getContext().rawContext as AudioContext;
    if (!rawCtx) return;
    const t = rawCtx.currentTime;

    // Portal master gain → connects to Tone.js master volume pipeline
    const portalMaster = rawCtx.createGain();
    portalMaster.gain.setValueAtTime(this.muted ? 0 : 0.85, t);
    // Connect through Tone.js master for global mute/volume control
    const toneDestination = this.masterVolume?.input;
    if (toneDestination && 'context' in toneDestination) {
      portalMaster.connect(rawCtx.destination);
    } else {
      portalMaster.connect(rawCtx.destination);
    }

    // ═══ PHASE 1 (0-0.6s): CHIME + CHORD — crystalline awakening ═══
    const chime = rawCtx.createOscillator();
    const chimeGain = rawCtx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(880, t);
    chime.frequency.exponentialRampToValueAtTime(1200, t + 0.6);
    chimeGain.gain.setValueAtTime(0.65, t);
    chimeGain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);
    chime.connect(chimeGain).connect(portalMaster);
    chime.start(t); chime.stop(t + 0.7);

    // Sustained chord (A3 + D#4) — rich harmonic bed
    const chord1 = rawCtx.createOscillator();
    const chord2 = rawCtx.createOscillator();
    const chordGain = rawCtx.createGain();
    chord1.frequency.setValueAtTime(220, t);
    chord2.frequency.setValueAtTime(277.18, t); // D#4
    chordGain.gain.setValueAtTime(0.28, t);
    chordGain.gain.exponentialRampToValueAtTime(0.01, t + 1.8);
    chord1.connect(chordGain);
    chord2.connect(chordGain);
    chordGain.connect(portalMaster);
    chord1.start(t); chord1.stop(t + 1.9);
    chord2.start(t); chord2.stop(t + 1.9);

    // ═══ PHASE 2 (0.5-1.5s): ENGINE RISER — sawtooth frequency sweep ═══
    const riser = rawCtx.createOscillator();
    const riserGain = rawCtx.createGain();
    riser.type = 'sawtooth';
    riser.frequency.setValueAtTime(80, t + 0.5);
    riser.frequency.exponentialRampToValueAtTime(1200, t + 1.5);
    riserGain.gain.setValueAtTime(0.42, t + 0.5);
    riserGain.gain.exponentialRampToValueAtTime(0.82, t + 1.45);
    riserGain.gain.exponentialRampToValueAtTime(0.01, t + 1.7);
    riser.connect(riserGain).connect(portalMaster);
    riser.start(t + 0.5); riser.stop(t + 1.75);

    // ═══ PHASE 3 (1.5-2.4s): SONIC BOOM + NOISE RUSH — detonation ═══
    const boom = rawCtx.createOscillator();
    const boomGain = rawCtx.createGain();
    boom.type = 'square';
    boom.frequency.setValueAtTime(180, t + 1.5);
    boom.frequency.exponentialRampToValueAtTime(40, t + 2.2);
    boomGain.gain.setValueAtTime(1.15, t + 1.5);
    boomGain.gain.exponentialRampToValueAtTime(0.01, t + 2.35);
    boom.connect(boomGain).connect(portalMaster);
    boom.start(t + 1.5); boom.stop(t + 2.4);

    // White noise rush through lowpass sweep
    const bufferSize = Math.floor(rawCtx.sampleRate * 1.1);
    const buffer = rawCtx.createBuffer(1, bufferSize, rawCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = rawCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = rawCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(2200, t + 1.5);
    noiseFilter.frequency.exponentialRampToValueAtTime(120, t + 2.3);
    const noiseGain = rawCtx.createGain();
    noiseGain.gain.setValueAtTime(0.92, t + 1.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 2.4);
    noise.connect(noiseFilter).connect(noiseGain).connect(portalMaster);
    noise.start(t + 1.5);

    // ═══ PHASE 4 (2-3.2s): ARRIVAL CHORD — triumphant resolution ═══
    const arrival = rawCtx.createOscillator();
    const arrivalGain = rawCtx.createGain();
    arrival.frequency.setValueAtTime(660, t + 2);
    arrival.frequency.exponentialRampToValueAtTime(880, t + 3);
    arrivalGain.gain.setValueAtTime(0.72, t + 2);
    arrivalGain.gain.exponentialRampToValueAtTime(0.01, t + 3.1);
    arrival.connect(arrivalGain).connect(portalMaster);
    arrival.start(t + 2); arrival.stop(t + 3.2);

    // Master fade-out to clean up
    portalMaster.gain.setValueAtTime(portalMaster.gain.value, t + 3.2);
    portalMaster.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
  }
}


export const audioEngine = GlobalAudioEngine.getInstance();
