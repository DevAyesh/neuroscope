// Web Audio API Sonification Engine for NeuroScope
// Translates neural network training dynamics, loss convergence, backprop error signals,
// and necrotic (Dying ReLU) flatlines into intuitive harmonic synth acoustics.

class NeuroAudioSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;

  // Audio Graph Nodes
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;

  // Drone Oscillators (Continuous convergence monitoring)
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private harmonicOsc: OscillatorNode | null = null;
  private harmonicGain: GainNode | null = null;

  // Necrotic Flatline Buzzer (Dying ReLU)
  private flatlineOsc: OscillatorNode | null = null;
  private flatlineGain: GainNode | null = null;

  // Pulse rate limiter
  private lastPulseTime: number = 0;
  private pulseCooldownMs: number = 70;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policy
  }

  private initContext(): boolean {
    if (typeof window === 'undefined') return false;

    if (!this.ctx) {
      try {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtxClass) return false;
        this.ctx = new AudioCtxClass();
      } catch (err) {
        console.warn('Web Audio API not supported in this environment', err);
        return false;
      }
    }

    if (this.ctx && !this.masterGain) {
      const ctx = this.ctx;

      // 1. Master Output Gain
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, ctx.currentTime);

      // 2. Master Low-Pass Filter (gentle, warm sci-fi warmth)
      this.masterFilter = ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.setValueAtTime(900, ctx.currentTime);
      this.masterFilter.Q.setValueAtTime(1.2, ctx.currentTime);

      this.masterFilter.connect(this.masterGain);
      this.masterGain.connect(ctx.destination);

      // 3. Drone Oscillator (Root carrier representing loss convergence)
      this.droneOsc = ctx.createOscillator();
      this.droneOsc.type = 'triangle';
      this.droneOsc.frequency.setValueAtTime(130.81, ctx.currentTime); // C3

      this.droneGain = ctx.createGain();
      this.droneGain.gain.setValueAtTime(0, ctx.currentTime);

      this.droneOsc.connect(this.droneGain);
      this.droneGain.connect(this.masterFilter);
      this.droneOsc.start();

      // 4. Harmonic Oscillator (Upper fifth / octave for convergence resonance)
      this.harmonicOsc = ctx.createOscillator();
      this.harmonicOsc.type = 'sine';
      this.harmonicOsc.frequency.setValueAtTime(196.0, ctx.currentTime); // G3

      this.harmonicGain = ctx.createGain();
      this.harmonicGain.gain.setValueAtTime(0, ctx.currentTime);

      this.harmonicOsc.connect(this.harmonicGain);
      this.harmonicGain.connect(this.masterFilter);
      this.harmonicOsc.start();

      // 5. Necrotic Flatline Buzzer (Flat 60Hz sawtooth buzz for dead neurons)
      this.flatlineOsc = ctx.createOscillator();
      this.flatlineOsc.type = 'sawtooth';
      this.flatlineOsc.frequency.setValueAtTime(58.0, ctx.currentTime);

      this.flatlineGain = ctx.createGain();
      this.flatlineGain.gain.setValueAtTime(0, ctx.currentTime);

      this.flatlineOsc.connect(this.flatlineGain);
      this.flatlineGain.connect(this.masterFilter);
      this.flatlineOsc.start();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return true;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;

    if (!muted) {
      this.initContext();
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      if (muted) {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.05);
        this.masterGain.gain.setValueAtTime(0, now + 0.06);
      } else {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0.0001, now);
        this.masterGain.gain.linearRampToValueAtTime(0.12, now + 0.1);
      }
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Updates ongoing convergence acoustics:
  // - High loss: higher tense frequency, darker filter
  // - Converging loss (< 0.05): resolves down to a warm root drone (C3/130Hz) with harmonic upper overtone
  // - Necrotic dead neurons > 0: flatlining atonal buzz
  public updateMetrics(
    loss: number,
    accuracy: number,
    gradNorm: number,
    deadNeurons: number,
    isPlaying: boolean
  ): void {
    if (this.isMuted || !this.ctx || !this.droneGain || !this.droneOsc || !this.harmonicGain || !this.harmonicOsc || !this.flatlineGain || !this.masterFilter) {
      return;
    }

    // Sanitize non-finite inputs (guards against exploding gradient NaNs crashing Web Audio AudioParam)
    const safeLoss = Number.isFinite(loss) ? Math.max(0, Math.min(2.0, loss)) : 2.0;
    const safeAccuracy = Number.isFinite(accuracy) ? Math.max(0, Math.min(100, accuracy)) : 0;
    const safeDead = Number.isFinite(deadNeurons) ? Math.max(0, Math.floor(deadNeurons)) : 0;

    const now = this.ctx.currentTime;

    try {
      if (!isPlaying) {
        this.droneGain.gain.setTargetAtTime(0, now, 0.1);
        this.harmonicGain.gain.setTargetAtTime(0, now, 0.1);
        this.flatlineGain.gain.setTargetAtTime(0, now, 0.1);
        return;
      }

      // Dying ReLU Necrotic Flatline Detection
      if (safeDead > 0) {
        // Dull, buzzing flatline
        this.droneGain.gain.setTargetAtTime(0.02, now, 0.1);
        this.harmonicGain.gain.setTargetAtTime(0, now, 0.1);
        this.flatlineGain.gain.setTargetAtTime(0.09, now, 0.08);
        this.masterFilter.frequency.setTargetAtTime(320, now, 0.1);
        return;
      } else {
        this.flatlineGain.gain.setTargetAtTime(0, now, 0.1);
      }

      // Normal Training Drone
      // Loss convergence maps to root frequencies:
      // Loss = 1.0 -> ~220Hz (A3, tense)
      // Loss = 0.0 -> ~130.81Hz (C3, resolved root)
      const targetFreq = 130.81 + Math.min(180, safeLoss * 80);
      this.droneOsc.frequency.setTargetAtTime(targetFreq, now, 0.15);

      // Filter opens up as loss drops and accuracy increases
      const filterCutoff = 350 + (1 - Math.min(1, safeLoss)) * 850 + (safeAccuracy / 100) * 300;
      this.masterFilter.frequency.setTargetAtTime(filterCutoff, now, 0.15);

      // Drone volume
      this.droneGain.gain.setTargetAtTime(0.06, now, 0.1);

      // Harmonic fifth fades in when loss is converging (< 0.25)
      if (safeLoss < 0.25) {
        const harmFreq = targetFreq * 1.5; // Perfect fifth
        this.harmonicOsc.frequency.setTargetAtTime(harmFreq, now, 0.15);
        const harmVol = 0.035 * (1 - safeLoss / 0.25);
        this.harmonicGain.gain.setTargetAtTime(harmVol, now, 0.15);
      } else {
        this.harmonicGain.gain.setTargetAtTime(0, now, 0.15);
      }
    } catch (_) {
      // AudioParam scheduling error protection
    }
  }

  // Periodic pulse sonification during continuous training (independent of visual particles)
  public triggerTrainingPulse(isPlaying: boolean, gradNorm: number): void {
    if (this.isMuted || !this.ctx || !isPlaying) return;
    const now = performance.now();
    if (now - this.lastPulseTime < this.pulseCooldownMs * 2.5) return;

    if (Math.random() < 0.35) {
      this.triggerPulse('forward');
    } else if (Number.isFinite(gradNorm) && gradNorm > 0.01 && Math.random() < 0.35) {
      this.triggerPulse('backward');
    }
  }

  // Trigger pulse sound for forward pass (soft musical crystal ping)
  // or backward backprop pass (resonant deep drop)
  public triggerPulse(type: 'forward' | 'backward'): void {
    if (this.isMuted || !this.ctx || !this.masterFilter) return;

    const now = performance.now();
    if (now - this.lastPulseTime < this.pulseCooldownMs) return;
    this.lastPulseTime = now;

    try {
      const audioNow = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };

      if (type === 'forward') {
        // Melodic forward ping in pentatonic scale
        const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
        const pitch = notes[Math.floor(Math.random() * notes.length)];
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, audioNow);

        gain.gain.setValueAtTime(0.04, audioNow);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioNow + 0.06);

        osc.connect(gain);
        gain.connect(this.masterFilter);

        osc.start(audioNow);
        osc.stop(audioNow + 0.07);
      } else {
        // Resonant deep backward drop (error cascade)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, audioNow);
        osc.frequency.exponentialRampToValueAtTime(75, audioNow + 0.08);

        gain.gain.setValueAtTime(0.05, audioNow);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioNow + 0.09);

        osc.connect(gain);
        gain.connect(this.masterFilter);

        osc.start(audioNow);
        osc.stop(audioNow + 0.1);
      }
    } catch (_) {}
  }

  // Sound effect when user clicks to kill/sever a neuron
  public triggerNeuronKill(): void {
    if (this.isMuted || !this.ctx || !this.masterFilter) return;

    try {
      const audioNow = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (_) {}
      };

      // Descending glitch zap
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, audioNow);
      osc.frequency.exponentialRampToValueAtTime(50, audioNow + 0.18);

      gain.gain.setValueAtTime(0.08, audioNow);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioNow + 0.2);

      osc.connect(gain);
      gain.connect(this.masterFilter);

      osc.start(audioNow);
      osc.stop(audioNow + 0.22);
    } catch (_) {}
  }

  // Sound effect when dead neurons are revived (Leaky ReLU protocol)
  public triggerRevival(): void {
    if (this.isMuted || !this.ctx || !this.masterFilter) return;

    try {
      const audioNow = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.0, 523.25]; // C major arpeggio
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterFilter) return;
        const t = audioNow + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (_) {}
        };

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

        osc.connect(gain);
        gain.connect(this.masterFilter);

        osc.start(t);
        osc.stop(t + 0.18);
      });
    } catch (_) {}
  }
}

// Global Singleton Instance
export const audioSynth = new NeuroAudioSynth();
