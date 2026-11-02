let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambient: { stop: () => void } | null = null;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(m: boolean) {
  const c = ac();
  if (c && master) master.gain.setTargetAtTime(m ? 0 : 1, c.currentTime, 0.05);
}

/** Clear clock tick; "urgent" for the last seconds. */
export function tick(urgent: boolean) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "square";
  o.frequency.value = urgent ? 1400 : 950;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(urgent ? 0.35 : 0.22, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.1);
}

function bubble(c: AudioContext, out: AudioNode) {
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  const f = 300 + Math.random() * 700;
  o.type = "sine";
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * 2.5, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.02, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.2);
}

/** Underwater ambience: deep filtered rumble + random bubbles + slow swell. Loops forever. */
export function startAmbient() {
  const c = ac();
  if (!c || !master || ambient) return;
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 350;
  const g = c.createGain();
  g.gain.value = 0.07;
  const lfo = c.createOscillator();
  const lfoG = c.createGain();
  lfo.frequency.value = 0.12;
  lfoG.gain.value = 0.03;
  lfo.connect(lfoG).connect(g.gain);
  src.connect(lp).connect(g).connect(master);
  src.start();
  lfo.start();
  let alive = true;
  const loop = () => {
    if (!alive) return;
    bubble(c, master!);
    setTimeout(loop, 2500 + Math.random() * 4000);
  };
  loop();
  const stopMusic = startTurkishMusic(c, master);
  ambient = { stop: () => { alive = false; src.stop(); lfo.stop(); stopMusic(); } };
}

/** Soft Turkish-style loop: plucked saz melody in maqam Hicaz + darbuka rhythm. */
function startTurkishMusic(c: AudioContext, out: AudioNode) {
  const bus = c.createGain();
  bus.gain.value = 0.12;
  bus.connect(out);
  // D Hicaz: D Eb F# G A Bb C D
  const scale = [293.7, 311.1, 370, 392, 440, 466.2, 523.3, 587.3];
  const melody = [0, 1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2, -1, 4, 5, 6, 5, 4, 3, 2, 1, 2, 1, 0, -1, 0, 2, 1, 0];
  const step = 0.3;
  const pluck = (f: number, t: number, len: number, vol: number) => {
    const o = c.createOscillator();
    const o2 = c.createOscillator();
    const g = c.createGain();
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(3000, t);
    lp.frequency.exponentialRampToValueAtTime(600, t + len);
    o.type = "sawtooth";
    o2.type = "triangle";
    o.frequency.value = f;
    o2.frequency.value = f * 2.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(lp); o2.connect(lp); lp.connect(g).connect(bus);
    o.start(t); o2.start(t); o.stop(t + len + 0.05); o2.stop(t + len + 0.05);
  };
  const drum = (t: number, low: boolean) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(low ? 110 : 330, t);
    o.frequency.exponentialRampToValueAtTime(low ? 60 : 200, t + 0.12);
    g.gain.setValueAtTime(low ? 0.6 : 0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (low ? 0.25 : 0.1));
    o.connect(g).connect(bus);
    o.start(t); o.stop(t + 0.3);
  };
  // darbuka "maqsum": D T - T D - T -
  const rhythm: (0 | 1 | 2)[] = [1, 2, 0, 2, 1, 0, 2, 0];
  let next = c.currentTime + 0.2;
  let i = 0;
  let alive = true;
  const schedule = () => {
    if (!alive) return;
    while (next < c.currentTime + 1) {
      const n = melody[i % melody.length]!;
      if (n >= 0) pluck(scale[n]! / 2, next, step * 1.6, 0.25);
      if (i % 8 === 0) pluck(scale[0]! / 4, next, step * 6, 0.18);
      const r = rhythm[i % 8]!;
      if (r) drum(next, r === 1);
      next += step;
      i++;
    }
    setTimeout(schedule, 250);
  };
  schedule();
  return () => { alive = false; };
}
