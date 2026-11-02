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
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
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
  lp.frequency.value = 500;
  const g = c.createGain();
  g.gain.value = 0.25;
  const lfo = c.createOscillator();
  const lfoG = c.createGain();
  lfo.frequency.value = 0.12;
  lfoG.gain.value = 0.12;
  lfo.connect(lfoG).connect(g.gain);
  src.connect(lp).connect(g).connect(master);
  src.start();
  lfo.start();
  let alive = true;
  const loop = () => {
    if (!alive) return;
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) setTimeout(() => alive && bubble(c, master!), i * 90);
    setTimeout(loop, 400 + Math.random() * 1400);
  };
  loop();
  ambient = { stop: () => { alive = false; src.stop(); lfo.stop(); } };
}
