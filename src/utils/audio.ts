// Self-contained Web Audio API Synthesizer for retro sounds and music

class AudioManager {
  private ctx: AudioContext | null = null;
  private musicInterval: number | null = null;
  private isMusicPlaying = false;
  private currentNoteNode: OscillatorNode | null = null;
  private currentGainNode: GainNode | null = null;

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playJump() {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playBell() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Create dual oscillators for metallic ring
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now); // B5 note
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now); // E6 note (harmonious fourth)

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  }

  playHurt() {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playWardOff() {
    // Special action effect - sweeping wave that wards off spirits
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  startMusic() {
    this.init();
    if (!this.ctx || this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    
    // Simple 4-chord progression of sweet pentatonic synth notes to create a Dan Sai atmospheric soundscape
    // Pentatonic notes that sound mysterious and magical
    const notes = [
      261.63, 293.66, 329.63, 392.00, 440.00, // C4 D4 E4 G4 A4
      523.25, 587.33, 659.25, 783.99, 880.00  // C5 D5 E5 G5 A5
    ];

    const melody = [
      4, 5, 7, 5, 4, 3, 4, 2,
      7, 8, 9, 8, 7, 5, 7, 6,
      0, 2, 4, 3, 2, 0, 1, 0
    ];

    let step = 0;

    const playStep = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      
      const now = this.ctx.currentTime;
      const noteFreq = notes[melody[step % melody.length] % notes.length];
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(noteFreq, now);
      
      // Gentle soft pad/melody
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.5);
      
      // Simple base drone note every 4 steps
      if (step % 4 === 0) {
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(noteFreq / 2, now); // An octave below
        
        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(0.05, now + 0.1);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        
        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        
        subOsc.start(now);
        subOsc.stop(now + 1.0);
      }
      
      step++;
    };

    // Trigger immediately
    playStep();
    this.musicInterval = window.setInterval(playStep, 500);
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const audio = new AudioManager();
