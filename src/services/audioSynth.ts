/**
 * Audio Synthesizer & Speech Service
 * Provides Web Audio API ambient noise generators, sound effects, and Speech Synthesis
 */

class AudioSynthService {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientNodes: AudioNode[] = [];
  private activeSoundType: string | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Play Notification Chime / Bell
  playChime(type: "bell" | "success" | "ping" = "bell") {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (type === "bell") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.5, this.ctx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
      } else if (type === "success") {
        // Major triad chime
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          if (!this.ctx) return;
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = "triangle";
          o.frequency.setValueAtTime(freq, now + idx * 0.08);
          g.gain.setValueAtTime(0.2, now + idx * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(now + idx * 0.08);
          o.stop(now + idx * 0.08 + 0.6);
        });
        return;
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.2);
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  }

  // Ambient Focus Sound Generator (Rain, White Noise, Lofi, Waves)
  startAmbientSound(soundType: "rain" | "whitenoise" | "lofi" | "waves") {
    this.stopAmbientSound();
    try {
      this.initCtx();
      if (!this.ctx) return;

      this.activeSoundType = soundType;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      this.ambientGain.connect(this.ctx.destination);

      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      if (soundType === "rain" || soundType === "whitenoise") {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (soundType === "rain") {
            // Pink/Brown noise filtering for rain
            output[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
          } else {
            output[i] = white * 0.2;
          }
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Lowpass filter to make soft rain/room noise
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(soundType === "rain" ? 800 : 1200, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(this.ambientGain);
        whiteNoise.start();

        this.ambientNodes.push(whiteNoise, filter);
      } else if (soundType === "lofi" || soundType === "waves") {
        // Soft sine chord drone
        const freqs = soundType === "lofi" ? [220, 277.18, 329.63, 392.0] : [110, 164.81, 220]; // A major 7 / soft ocean drone
        freqs.forEach((freq) => {
          if (!this.ctx || !this.ambientGain) return;
          const osc = this.ctx.createOscillator();
          const lfo = this.ctx.createOscillator();
          const lfoGain = this.ctx.createGain();

          osc.type = soundType === "lofi" ? "sine" : "triangle";
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          // Modulation
          lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
          lfoGain.gain.setValueAtTime(soundType === "lofi" ? 5 : 15, this.ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);

          osc.connect(this.ambientGain);
          osc.start();
          lfo.start();
          this.ambientNodes.push(osc, lfo, lfoGain);
        });
      }
    } catch (e) {
      console.warn("Ambient sound error:", e);
    }
  }

  stopAmbientSound() {
    this.ambientNodes.forEach((node) => {
      try {
        if ("stop" in node) (node as any).stop();
        node.disconnect();
      } catch (e) {}
    });
    this.ambientNodes = [];
    if (this.ambientGain) {
      this.ambientGain.disconnect();
      this.ambientGain = null;
    }
    this.activeSoundType = null;
  }

  getActiveSound(): string | null {
    return this.activeSoundType;
  }

  // Text-To-Speech (Speech Synthesis)
  speak(text: string, onEnd?: () => void) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop current
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      if (onEnd) utterance.onend = onEnd;
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech Synthesis not supported in this browser.");
      if (onEnd) onEnd();
    }
  }

  stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  isSpeaking(): boolean {
    return "speechSynthesis" in window ? window.speechSynthesis.speaking : false;
  }
}

export const audioSynth = new AudioSynthService();
