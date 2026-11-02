import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import bg from "@/assets/spiel.png.asset.json";
import chars from "@/assets/characters.png.asset.json";
import { CASES, CATEGORIES, COUNTRIES, nextTime, START_TIME } from "@/lib/game";
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
  const [limit, setLimit] = useState(START_TIME);
  const [left, setLeft] = useState(START_TIME);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
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
      setOptions(shuffle([c.answer, ...wrong]));
      setPicked(null);
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
    const ord = shuffle(CASES.map((_, i) => i));
    setOrder(ord);
    setIdx(0);
    setScore(0);
    setStars(0);
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
      if (idx + 1 >= order.length) {
        setPhase("end");
      } else {
        setIdx(idx + 1);
        load(order, idx + 1, t);
      }
    }, 1800);
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

  const charIdx = (idx + (order[0] ?? 0)) % COUNTRIES.length;
  const col = charIdx % 6;
  const row = Math.floor(charIdx / 6);

  return (
    <main className="flex min-h-screen items-center justify-center bg-game-deep">
      <div className="relative w-full max-w-[560px] select-none" style={{ aspectRatio: "1122 / 1402" }}>
        <img src={bg.url} alt="Spielbrett am Strand" className="absolute inset-0 h-full w-full" draggable={false} />

        {/* Figur im Landeskostüm */}
        {(phase === "play" || phase === "feedback") && (
          <div
            key={charIdx}
            className="absolute left-[27%] top-[8%] w-[46%] overflow-hidden rounded-3xl game-frame animate-in fade-in zoom-in-95 duration-500"
            style={{ aspectRatio: "209 / 251" }}
          >
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `url(${chars.url})`,
                backgroundSize: "600% 500%",
                backgroundPosition: `${col * 20}% ${row * 25}%`,
              }}
            />
            <div className="absolute inset-x-0 bottom-0 py-1 text-center game-chip !border-0 !border-t-2 text-sm">
              {COUNTRIES[charIdx]}
            </div>
          </div>
        )}

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

        {/* Timer */}
        {(phase === "play" || phase === "feedback") && current && (
          <div className="absolute left-[30%] top-[3%] w-[40%]">
            <div className="game-timer-track h-4 overflow-hidden rounded-full">
              <div className="game-timer-fill h-full transition-[width] duration-100" style={{ width: `${(left / limit) * 100}%` }} />
            </div>
            <p className="mt-1 text-center game-label text-sm">
              Frage {idx + 1}/{order.length} · {Math.ceil(left)} s
            </p>
            <button onClick={() => speak(current.text, muted)} className="mx-auto mt-1 block rounded-full game-chip px-3 py-1 text-xs">
              ▶ Nochmal anhören
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
                disabled={phase !== "play"}
                className={`absolute flex items-center justify-center px-[6%] text-center game-answer text-[clamp(11px,3vw,18px)] leading-tight transition-transform hover:scale-105 ${isRight ? "game-right" : ""} ${isWrong ? "game-wrong" : ""}`}
                style={{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.width}%`, height: `${s.height}%` }}
              >
                {opt}
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
            <h1 className="text-2xl font-black">{phase === "start" ? "Was ist das Problem?" : "Spiel beendet!"}</h1>
            <p className="mt-2 text-sm">
              {phase === "start"
                ? "Hör dem Kunden zu und wähle die richtige Problemart. Du hast 10 Sekunden – bei jeder falschen Antwort bekommst du 2 Sekunden weniger."
                : `Du hast ${stars} von ${order.length} richtig beantwortet. Punkte: ${score}`}
            </p>
            <button onClick={start} className="mt-4 rounded-full game-play px-8 py-3 text-lg font-black">
              {phase === "start" ? "Spielen" : "Nochmal spielen"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
