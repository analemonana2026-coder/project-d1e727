import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { CASES, CATEGORIES, formatClock, isLost, nextTime, QUESTION_COUNT, randomLabel, START_TIME } from "@/lib/game";
import { setMuted as setAudioMuted, startAmbient, tick } from "@/lib/sound";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Was ist das Problem? – Kundenservice-Spiel" },
      { name: "description", content: "Hör dem Kunden zu und wähle die richtige Problemart, bevor die Zeit abläuft." },
      { property: "og:title", content: "Was ist das Problem? – Kundenservice-Spiel" },
      { property: "og:description", content: "Hör zu, erkenne das Anliegen und antworte schnell." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Game,
});

type Phase = "start" | "play" | "feedback" | "end";

// Positions of the four fish on the board, in % of the image
const SLOTS = [
  { left: 9, top: 61, width: 40, height: 13 },
  { left: 56, top: 61, width: 37, height: 13 },
  { left: 11, top: 78, width: 39, height: 14 },
  { left: 57, top: 79, width: 38, height: 13 },
];

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => Math.random() - 0.5);
}

function speak(text: string, muted: boolean) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  if (muted) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "de-DE";
  const v = window.speechSynthesis.getVoices().find((x) => x.lang.startsWith("de"));
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

function Game() {
  const [phase, setPhase] = useState<Phase>("start");
  const [order, setOrder] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [limit, setLimit] = useState(START_TIME);
  const [left, setLeft] = useState(START_TIME);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [lost, setLost] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [jokers, setJokers] = useState(3);
  const [hidden, setHidden] = useState<string[]>([]);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = order.length ? CASES[order[idx] ?? 0] : null;

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const load = useCallback(
    (ord: number[], i: number, t: number) => {
      const c = CASES[ord[i] ?? 0]!;
      const wrong = shuffle(CATEGORIES.filter((x) => x !== c.answer)).slice(0, 3);
      const opts = shuffle([c.answer, ...wrong]);
      setOptions(opts);
      setLabels(Object.fromEntries(opts.map((o) => [o, randomLabel(o)])));
      setPicked(null);
      setHidden([]);
      setLimit(t);
      setLeft(t);
      setPhase("play");
      speak(c.text, muted);
    },
    [muted],
  );

  const start = () => {
    startAmbient();
    setAudioMuted(muted);
    const ord = shuffle(CASES.map((_, i) => i)).slice(0, QUESTION_COUNT);
    setOrder(ord);
    setIdx(0);
    setScore(0);
    setStars(0);
    setLost(false);
    setJokers(3);
    setHidden([]);
    startedAt.current = Date.now();
    setElapsed(0);
    load(ord, 0, START_TIME);
  };

  const answer = (opt: string | null) => {
    if (phase !== "play" || !current) return;
    stop();
    window.speechSynthesis?.cancel();
    const correct = opt === current.answer;
    setPicked(opt ?? "__timeout");
    if (correct) {
      setScore((s) => s + 10);
      setStars((s) => s + 1);
    }
    setPhase("feedback");
    const t = nextTime(limit, correct);
    setTimeout(() => {
      if (isLost(t)) {
        setLost(true);
        setPhase("end");
      } else if (idx + 1 >= order.length) {
        setPhase("end");
      } else {
        setIdx(idx + 1);
        load(order, idx + 1, t);
      }
    }, 1800);
  };

  // 50:50-Joker – entfernt zwei falsche Antworten
  const useJoker = () => {
    if (phase !== "play" || !current || jokers <= 0) return;
    const wrong = options.filter((o) => o !== current.answer && !hidden.includes(o));
    setHidden(shuffle(wrong).slice(0, 2));
    setJokers((j) => j - 1);
  };

  useEffect(() => {
    if (phase !== "play") return;
    stop();
    timer.current = setInterval(() => setLeft((l) => Math.max(0, l - 0.1)), 100);
    return stop;
  }, [phase, idx]);

  // tick sound every full second
  const sec = Math.ceil(left);
  useEffect(() => {
    if (phase === "play" && sec > 0) tick(sec <= 3);
  }, [sec, phase, idx]);

  useEffect(() => {
    if (phase === "play" && left <= 0) answer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, phase]);

  // whole-game clock
  useEffect(() => {
    if (phase !== "play" && phase !== "feedback") return;
    const id = setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 250);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-game-deep">
      <div className="relative w-full max-w-[560px] select-none" style={{ aspectRatio: "1122 / 1402" }}>
        <img src="/spiel.png" alt="Spielbrett am Strand" className="absolute inset-0 h-full w-full" draggable={false} />

        {/* Punkte */}
        <div className="absolute left-[12%] top-[3%] flex h-[4%] w-[13%] items-center justify-center game-label text-[clamp(12px,3.5vw,20px)]">
          {score}
        </div>
        {/* Sterne */}
        <div className="absolute right-[3%] top-[2.6%] flex h-[4%] w-[12%] items-center justify-center game-label text-[clamp(12px,3.5vw,20px)]">
          {stars}
        </div>
        {/* Startseite */}
        <button aria-label="Startseite" onClick={() => { stop(); window.speechSynthesis?.cancel(); setPhase("start"); }} className="absolute left-[3%] top-[9.3%] h-[7%] w-[8.5%] rounded-full" />
        {/* Ton */}
        <button aria-label={muted ? "Ton an" : "Ton aus"} onClick={() => { setMuted(!muted); setAudioMuted(!muted); window.speechSynthesis?.cancel(); }} className="absolute right-[2%] top-[9%] h-[7%] w-[8.5%] rounded-full">
          {muted && <span className="game-label text-2xl">✕</span>}
        </button>

        {/* Timer – rechts */}
        {(phase === "play" || phase === "feedback") && current && (
          <div className="absolute right-[3%] top-[18%] flex w-[27%] flex-col items-stretch gap-1 rounded-xl game-hud p-2">
            <div className="text-center text-[10px] font-black uppercase tracking-widest">Frage</div>
            <div className="text-center text-xl font-black tabular-nums leading-none">{idx + 1}<span className="text-xs opacity-70">/{order.length}</span></div>
            <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full game-sec text-xl font-black tabular-nums ${left <= 3 ? "game-pulse" : ""}`}>{Math.ceil(left)}</div>
            <div className="game-timer-track h-2 overflow-hidden rounded-full">
              <div className="game-timer-fill h-full transition-[width] duration-100" style={{ width: `${(left / limit) * 100}%` }} />
            </div>
            <div className="rounded-lg game-chip py-0.5 text-center text-sm tabular-nums" aria-label="Gesamtzeit">⏱ {formatClock(elapsed)}</div>
            <button onClick={() => speak(current.text, muted)} className="rounded-full game-play px-2 py-1 text-xs font-black transition-transform hover:scale-105 active:scale-95">
              🔊 Nochmal anhören
            </button>
            <button onClick={useJoker} disabled={jokers <= 0 || phase !== "play"} aria-label="Zwei falsche Antworten entfernen" className="rounded-full game-joker px-2 py-1 text-xs font-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-40">
              ✨ 50:50 ({jokers})
            </button>
          </div>
        )}

        {/* Antworten */}
        {(phase === "play" || phase === "feedback") &&
          options.map((opt, i) => {
            const s = SLOTS[i]!;
            const isRight = phase === "feedback" && opt === current?.answer;
            const isWrong = phase === "feedback" && picked === opt && !isRight;
            return (
              <button
                key={opt}
                onClick={() => answer(opt)}
                disabled={phase !== "play" || hidden.includes(opt)}
                className={`absolute flex items-center justify-center px-[6%] text-center game-answer text-[clamp(11px,3vw,18px)] leading-tight transition-transform hover:scale-105 ${isRight ? "game-right" : ""} ${isWrong ? "game-wrong" : ""} ${hidden.includes(opt) ? "opacity-0 pointer-events-none" : ""}`}
                style={{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.width}%`, height: `${s.height}%` }}
              >
                {labels[opt] ?? opt}
              </button>
            );
          })}

        {phase === "feedback" && (
          <div className="absolute left-1/2 top-[45%] -translate-x-1/2 rounded-2xl game-chip px-5 py-2 text-lg">
            {picked === current?.answer ? "Richtig! ⭐" : picked === "__timeout" ? "Zeit abgelaufen!" : "Leider falsch!"}
          </div>
        )}

        {(phase === "start" || phase === "end") && (
          <div className="absolute inset-x-[8%] top-[40%] rounded-3xl game-panel p-6 text-center">
            <h1 className="text-2xl font-black">{phase === "start" ? "Was ist das Problem?" : lost ? "Verloren!" : "Geschafft!"}</h1>
            {phase === "start" ? (
              <div className="mt-2 text-left text-xs leading-snug">
                <p className="text-center text-sm font-bold">Hör dem Kunden zu und wähle die richtige Problemart!</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>Ein Kunde erzählt dir sein Problem – hör gut zu! Tippe auf <b>„Nochmal anhören"</b>, wenn du es erneut hören willst.</li>
                  <li>Wähle die richtige Problemart aus den vier Fischen aus.</li>
                  <li>Du spielst <b>{QUESTION_COUNT} Fragen</b>. Jede Frage startet mit <b>{START_TIME} Sekunden</b>.</li>
                  <li>Falsche Antwort oder Zeit abgelaufen: Die nächste Frage hat <b>2 Sekunden weniger</b>.</li>
                  <li>Erreichst du <b>8 Sekunden</b>, hast du <b>verloren</b>!</li>
                  <li>Du weißt nicht weiter? Mit dem <b>✨ 50:50-Joker</b> verschwinden zwei falsche Antworten. Du hast <b>3 Joker</b> pro Spiel.</li>
                  <li>Die große Uhr zeigt deine <b>Gesamtzeit</b> für alle 100 Fragen.</li>
                </ul>
              </div>
            ) : (
              <p className="mt-2 text-sm">
                {`${lost ? "Deine Zeit ist auf 8 Sekunden gefallen. " : ""}Richtig: ${stars} von ${order.length} · Punkte: ${score} · Gesamtzeit: ${formatClock(elapsed)}`}
              </p>
            )}
            <button onClick={start} className="mt-4 rounded-full game-play px-8 py-3 text-lg font-black">
              {phase === "start" ? "Spielen" : "Nochmal spielen"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
