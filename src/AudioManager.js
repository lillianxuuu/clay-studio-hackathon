export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.nodes = [];
    this.touchNoise = null;
  }

  ensure() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.22;
    this.master.connect(this.ctx.destination);
    this.startWheel();
    this.startMusic();
  }

  setMuted(value) {
    this.muted = value;
    if (this.master) this.master.gain.value = value ? 0 : 0.22;
  }

  startWheel() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 52;
    gain.gain.value = 0.055;
    osc.connect(gain).connect(this.master);
    osc.start();
    this.nodes.push(osc);
  }

  startMusic() {
    const freqs = [220, 277.18, 329.63, 392];
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq / 2;
      gain.gain.value = 0.012;
      osc.connect(gain).connect(this.master);
      osc.start(this.ctx.currentTime + i * 0.08);
      this.nodes.push(osc);
    });
  }

  touch() {
    this.ensure();
    if (this.touchNoise) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 86;
    gain.gain.value = 0.025;
    osc.connect(gain).connect(this.master);
    osc.start();
    this.touchNoise = { osc, gain };
  }

  stopTouch() {
    if (!this.touchNoise) return;
    const { osc, gain } = this.touchNoise;
    gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
    osc.stop(this.ctx.currentTime + 0.18);
    this.touchNoise = null;
  }

  kiln() {
    this.ensure();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 110;
    gain.gain.value = 0.04;
    osc.connect(gain).connect(this.master);
    osc.start();
    gain.gain.setTargetAtTime(0, this.ctx.currentTime + 1.2, 0.5);
    osc.stop(this.ctx.currentTime + 2.4);
  }
}
