import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MiniLogo from '../components/MiniLogo';
import QCMOptions from '../components/QCMOptions';
import { getSongsByFilters, shuffle, generateOptions, songs as allSongs } from '../data/songs';
import type { Song } from '../types';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type SquareType = 'start' | 'music' | 'star' | 'skull' | 'npc' | 'random' | 'finish';
type GamePhase = 'board' | 'rolling' | 'music_q' | 'random_q' | 'npc_duel' | 'star_event' | 'skull_event' | 'victory';

interface NPC {
  id: string;
  name: string;
  emoji: string;
  title: string;
  genres: string[];
  decades: string[];
  maxDiff: number;
  winChance: number;
  quote: string;
  color: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Board layout  (30 cases, indices 0–29)
// ──────────────────────────────────────────────────────────────────────────────

const BOARD_TYPES: SquareType[] = [
  // row 0 (bas)
  'start', 'music', 'star',  'music', 'skull',
  // row 1
  'npc',   'music', 'music', 'star',  'skull',
  // row 2
  'npc',   'music', 'random','music', 'star',
  // row 3
  'npc',   'music', 'skull', 'music', 'star',
  // row 4
  'npc',   'music', 'skull', 'music', 'random',
  // row 5 (haut)
  'npc',   'music', 'star',  'music', 'finish',
];

// Affichage serpentin : rangées du haut vers le bas pour le rendu HTML
const BOARD_VISUAL: number[][] = [
  [29, 28, 27, 26, 25], // haut
  [20, 21, 22, 23, 24],
  [19, 18, 17, 16, 15],
  [10, 11, 12, 13, 14],
  [ 9,  8,  7,  6,  5],
  [ 0,  1,  2,  3,  4], // bas (départ)
];

// ──────────────────────────────────────────────────────────────────────────────
// NPCs musicaux
// ──────────────────────────────────────────────────────────────────────────────

const NPCS: NPC[] = [
  {
    id: 'mozart', name: 'Mozart', emoji: '🎹', title: 'Maître du Classique',
    genres: ['classique', 'jazz'], decades: ['1940s', '1950s'],
    maxDiff: 2, winChance: 0.25,
    quote: 'La musique adoucit les mœurs !',
    color: '#fbbf24',
  },
  {
    id: 'elvis', name: 'Elvis', emoji: '🕺', title: 'Le Roi du Rock',
    genres: ['rock'], decades: ['1950s', '1960s'],
    maxDiff: 3, winChance: 0.4,
    quote: 'Thank you, thank you very much!',
    color: '#f97316',
  },
  {
    id: 'mj', name: 'Michael J.', emoji: '🌙', title: 'King of Pop',
    genres: ['pop', 'soul', 'funk'], decades: ['1980s'],
    maxDiff: 4, winChance: 0.5,
    quote: 'Just beat it!',
    color: '#ec4899',
  },
  {
    id: 'daftpunk', name: 'Daft Punk', emoji: '🤖', title: 'Robots de l\'Électro',
    genres: ['electronic', 'disco'], decades: ['2000s', '2010s'],
    maxDiff: 4, winChance: 0.55,
    quote: 'Around the world!',
    color: '#22d3ee',
  },
  {
    id: 'beyonce', name: 'Beyoncé', emoji: '👑', title: 'Queen B',
    genres: ['rnb', 'pop', 'soul'], decades: ['2000s', '2010s', '2020s'],
    maxDiff: 5, winChance: 0.65,
    quote: 'Who run the world? Not you!',
    color: '#a855f7',
  },
];

const NPC_AT: Record<number, NPC> = {
  5: NPCS[0], 10: NPCS[1], 15: NPCS[2], 20: NPCS[3], 25: NPCS[4],
};

// ──────────────────────────────────────────────────────────────────────────────
// Square visuals
// ──────────────────────────────────────────────────────────────────────────────

const SQ: Record<SquareType, { icon: string; bg: string; border: string; label: string }> = {
  start:  { icon: '🏁', bg: 'rgba(34,197,94,0.18)',   border: '#22c55e', label: 'Départ' },
  finish: { icon: '🏆', bg: 'rgba(251,191,36,0.28)',  border: '#fbbf24', label: 'Arrivée' },
  music:  { icon: '🎵', bg: 'rgba(99,102,241,0.18)',  border: '#6366f1', label: 'Blind test' },
  star:   { icon: '⭐', bg: 'rgba(245,158,11,0.18)',  border: '#f59e0b', label: '+15 pts' },
  skull:  { icon: '💀', bg: 'rgba(239,68,68,0.18)',   border: '#ef4444', label: '-10 pts' },
  npc:    { icon: '🎭', bg: 'rgba(236,72,153,0.18)',  border: '#ec4899', label: 'Duel NPC' },
  random: { icon: '🎲', bg: 'rgba(20,184,166,0.18)',  border: '#14b8a6', label: 'Surprise' },
};

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

export default function BoardGame() {
  const nav = useNavigate();

  /* ── Game state ─────────────────────────────────────────────────────────── */
  const [pos, setPos]           = useState(0);
  const [score, setScore]       = useState(0);
  const [phase, setPhase]       = useState<GamePhase>('board');
  const [diceVal, setDiceVal]   = useState<number | null>(null);
  const [rolling, setRolling]   = useState(false);
  const [info, setInfo]         = useState('Lancez le dé pour commencer !');

  /* ── Question state ─────────────────────────────────────────────────────── */
  const [song, setSong]             = useState<Song | null>(null);
  const [opts, setOpts]             = useState<string[]>([]);
  const [selected, setSelected]     = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [timeLeft, setTimeLeft]     = useState(20);

  /* ── NPC state ──────────────────────────────────────────────────────────── */
  const [npc, setNpc]               = useState<NPC | null>(null);
  const [npcBuzzed, setNpcBuzzed]   = useState(false);

  const audioRef   = useRef<HTMLAudioElement>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const npcTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Cleanup ────────────────────────────────────────────────────────────── */
  function stopAll() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    if (timerRef.current)  clearInterval(timerRef.current);
    if (npcTimer.current)  clearTimeout(npcTimer.current);
    if (moveTimer.current) clearInterval(moveTimer.current);
  }
  useEffect(() => () => stopAll(), []);

  /* ── Audio ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (previewUrl && audioRef.current) {
      audioRef.current.src = previewUrl;
      audioRef.current.volume = 0.85;
      audioRef.current.play().catch(() => {});
    }
  }, [previewUrl]);

  /* ── Fetch Deezer preview ───────────────────────────────────────────────── */
  const fetchPreview = useCallback(async (s: Song) => {
    setLoading(true); setPreviewUrl(null);
    try {
      const r = await fetch(`/api/preview?q=${encodeURIComponent(s.deezerQuery)}`);
      const d = await r.json();
      setPreviewUrl(d.preview || null);
    } catch { setPreviewUrl(null); }
    setLoading(false);
  }, []);

  /* ── Timer ──────────────────────────────────────────────────────────────── */
  function startTimer(secs: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(secs);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          onTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function onTimeout() {
    if (audioRef.current) audioRef.current.pause();
    if (npcTimer.current) clearTimeout(npcTimer.current);
    setInfo('⏱️ Temps écoulé !');
    setTimeout(backToBoard, 2200);
  }

  /* ── Back to board ──────────────────────────────────────────────────────── */
  function backToBoard() {
    stopAll();
    setSong(null); setOpts([]); setSelected(null);
    setNpc(null); setNpcBuzzed(false);
    setPhase('board');
    setInfo('Lancez le dé !');
  }

  /* ── Roll dice ──────────────────────────────────────────────────────────── */
  function rollDice() {
    if (rolling || phase !== 'board') return;
    setRolling(true);
    setPhase('rolling');
    let tick = 0;
    const iv = setInterval(() => {
      setDiceVal(Math.floor(Math.random() * 6) + 1);
      tick++;
      if (tick >= 14) {
        clearInterval(iv);
        const final = Math.floor(Math.random() * 6) + 1;
        setDiceVal(final);
        setRolling(false);
        setTimeout(() => doMove(final), 300);
      }
    }, 75);
  }

  /* ── Move player step by step ───────────────────────────────────────────── */
  function doMove(steps: number) {
    let cur = pos;
    const target = Math.min(pos + steps, 29);
    if (moveTimer.current) clearInterval(moveTimer.current);
    moveTimer.current = setInterval(() => {
      cur = Math.min(cur + 1, target);
      setPos(cur);
      if (cur >= target) {
        clearInterval(moveTimer.current!);
        setTimeout(() => triggerSquare(cur), 350);
      }
    }, 280);
  }

  /* ── Trigger square event ───────────────────────────────────────────────── */
  function triggerSquare(p: number) {
    if (p >= 29) { setPhase('victory'); return; }
    const t = BOARD_TYPES[p];

    switch (t) {
      case 'star':
        setScore(s => s + 15);
        setInfo('⭐ Bonus ! +15 points');
        setPhase('star_event');
        setTimeout(backToBoard, 1800);
        break;

      case 'skull':
        setScore(s => Math.max(0, s - 10));
        setPos(pp => Math.max(0, pp - 2));
        setInfo('💀 Malus ! −10 pts, recule de 2 cases');
        setPhase('skull_event');
        setTimeout(backToBoard, 1800);
        break;

      case 'music':
        launchQuestion([], [], 4, 'music_q');
        break;

      case 'random':
        launchQuestion([], [], 5, 'random_q');
        break;

      case 'npc': {
        const n = NPC_AT[p];
        if (!n) { backToBoard(); return; }
        setNpc(n);
        launchNPCDuel(n);
        break;
      }

      default:
        backToBoard();
    }
  }

  /* ── Launch question ────────────────────────────────────────────────────── */
  function launchQuestion(genres: string[], decades: string[], maxDiff: number, targetPhase: GamePhase) {
    const pool = getSongsByFilters(genres, decades, maxDiff);
    const src  = pool.length >= 4 ? pool : allSongs;
    const s    = shuffle(src)[0];
    const o    = generateOptions(s, allSongs);
    setSong(s); setOpts(o); setSelected(null);
    setPhase(targetPhase);
    fetchPreview(s);
    startTimer(targetPhase === 'npc_duel' ? 15 : 20);
  }

  /* ── Answer question (music / random) ──────────────────────────────────── */
  function handleAnswer(opt: string) {
    if (selected || !song) return;
    stopAll();
    const correct = `${song.title} — ${song.artist}`;
    setSelected(opt);
    if (opt === correct) {
      const bonus = phase === 'random_q' ? 30 : 20;
      setScore(s => s + bonus);
      setInfo(`✅ Correct ! +${bonus} pts`);
    } else {
      setInfo(`❌ C'était : ${correct}`);
    }
    setTimeout(backToBoard, 2500);
  }

  /* ── Launch NPC duel ────────────────────────────────────────────────────── */
  function launchNPCDuel(n: NPC) {
    setNpcBuzzed(false);
    const pool = getSongsByFilters(n.genres, n.decades, n.maxDiff);
    const src  = pool.length >= 4 ? pool : allSongs;
    const s    = shuffle(src)[0];
    const o    = generateOptions(s, allSongs);
    setSong(s); setOpts(o); setSelected(null);
    setPhase('npc_duel');
    fetchPreview(s);
    startTimer(15);

    // NPC buzzes after delay (faster = harder)
    const delay = 14000 - n.winChance * 11000 + (Math.random() - 0.5) * 3000;
    npcTimer.current = setTimeout(() => setNpcBuzzed(true), Math.max(1800, delay));
  }

  /* ── Handle NPC duel answer ─────────────────────────────────────────────── */
  function handleNPCAnswer(opt: string) {
    if (selected || !song) return;
    stopAll();
    const correct = `${song.title} — ${song.artist}`;
    setSelected(opt);
    const isCorrect = opt === correct;

    if (npcBuzzed) {
      if (isCorrect) {
        setScore(s => s + 10);
        setInfo('✅ Rattrapé ! +10 pts (NPC avait bippé)');
      } else {
        setScore(s => Math.max(0, s - 10));
        setInfo(`❌ ${npc?.name} gagne ce duel ! −10 pts`);
      }
    } else {
      clearTimeout(npcTimer.current!);
      if (isCorrect) {
        setScore(s => s + 25);
        setInfo(`🏆 Tu bats ${npc?.name} ! +25 pts`);
      } else {
        setScore(s => Math.max(0, s - 5));
        setInfo('❌ Mauvaise réponse ! −5 pts');
      }
    }
    setTimeout(backToBoard, 2800);
  }

  /* ── Render square ──────────────────────────────────────────────────────── */
  function Square({ idx }: { idx: number }) {
    const type    = BOARD_TYPES[idx];
    const cfg     = SQ[type];
    const isHere  = idx === pos;
    const npcHere = type === 'npc' ? NPC_AT[idx] : null;

    return (
      <div
        className="relative flex flex-col items-center justify-center rounded-xl border-2 select-none"
        style={{
          width: 50, height: 50, flexShrink: 0,
          background: isHere ? 'rgba(255,255,255,0.18)' : cfg.bg,
          borderColor: isHere ? '#fff' : cfg.border,
          boxShadow: isHere ? '0 0 18px rgba(255,255,255,0.55)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        {/* Index */}
        <span className="absolute top-0.5 left-1 text-[8px] text-white/30 font-mono leading-none">{idx}</span>

        {/* Player token */}
        {isHere && (
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-lg z-10 drop-shadow-lg"
                style={{ animation: 'sq-bounce 0.9s ease-in-out infinite' }}>
            🎵
          </span>
        )}

        {/* Content */}
        <span className="text-lg leading-none">
          {npcHere && !isHere ? npcHere.emoji : cfg.icon}
        </span>

        {/* NPC name */}
        {npcHere && !isHere && (
          <span className="text-[7px] text-white/50 leading-none mt-0.5 font-medium truncate w-full text-center px-0.5">
            {npcHere.name}
          </span>
        )}
      </div>
    );
  }

  /* ── Victory screen ─────────────────────────────────────────────────────── */
  if (phase === 'victory') {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center p-6 text-center gap-5">
        <div className="text-8xl" style={{ animation: 'sq-bounce 1s infinite' }}>🏆</div>
        <h1 className="font-display text-6xl gradient-text">VICTOIRE !</h1>
        <p className="text-white/70 text-lg">Score final</p>
        <p className="font-display text-5xl text-yellow-400">{score} pts</p>
        <p className="text-white/50 text-sm">Tu as traversé tout le plateau musical !</p>
        <div className="flex gap-3 mt-2">
          <button
            className="btn-primary px-6 py-3"
            onClick={() => { setPos(0); setScore(0); setDiceVal(null); setPhase('board'); setInfo('Lancez le dé !'); }}
          >
            🎲 Rejouer
          </button>
          <button className="btn px-6 py-3 text-white/70 border border-white/20 rounded-2xl hover:text-white transition-colors"
                  onClick={() => nav('/')}>
            ← Accueil
          </button>
        </div>
      </div>
    );
  }

  /* ── Main render ────────────────────────────────────────────────────────── */
  const inQuestion = phase === 'music_q' || phase === 'random_q' || phase === 'npc_duel';
  const totalSecs  = phase === 'npc_duel' ? 15 : 20;

  return (
    <div className="min-h-screen bg-app flex flex-col items-center p-4 pb-8 overflow-x-hidden">
      <audio ref={audioRef} />

      {/* ── Header ── */}
      <div className="w-full max-w-[310px] flex items-center justify-between mb-4">
        <button onClick={() => nav('/')} className="text-white/50 hover:text-white text-sm transition-colors">
          ← Accueil
        </button>
        <MiniLogo />
        <div className="text-right">
          <div className="text-yellow-400 font-bold text-lg">{score} pts</div>
          <div className="text-white/40 text-xs">Case {pos}/29</div>
        </div>
      </div>

      {/* ── Board ── */}
      <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 p-1.5"
           style={{ background: 'rgba(255,255,255,0.04)' }}>
        {BOARD_VISUAL.map((row, ri) => (
          <div key={ri} className="flex gap-1 mb-1">
            {row.map(idx => <Square key={idx} idx={idx} />)}
          </div>
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mb-3 max-w-[310px]">
        {(Object.entries(SQ) as [SquareType, typeof SQ[SquareType]][]).map(([t, c]) => (
          <span key={t} className="text-[10px] text-white/40 flex items-center gap-0.5">
            {c.icon} {c.label}
          </span>
        ))}
      </div>

      {/* ── Info message ── */}
      <div className="text-white/75 text-sm text-center mb-4 min-h-[1.4rem] px-4">{info}</div>

      {/* ── BOARD phase: dice ── */}
      {phase === 'board' && (
        <div className="flex flex-col items-center gap-4">
          {diceVal && (
            <div className="text-5xl select-none"
                 style={{ filter: 'drop-shadow(0 0 14px rgba(251,191,36,0.75))' }}>
              {DICE_FACES[diceVal - 1]}
            </div>
          )}
          <button
            onClick={rollDice}
            className="btn-primary px-8 py-3 text-lg"
          >
            🎲 Lancer le dé
          </button>
        </div>
      )}

      {/* ── ROLLING animation ── */}
      {phase === 'rolling' && diceVal && (
        <div className="text-5xl select-none" style={{ animation: 'spin 0.15s linear infinite' }}>
          {DICE_FACES[diceVal - 1]}
        </div>
      )}

      {/* ── STAR / SKULL instant events ── */}
      {phase === 'star_event' && (
        <div className="text-5xl" style={{ animation: 'sq-bounce 0.6s infinite' }}>⭐</div>
      )}
      {phase === 'skull_event' && (
        <div className="text-5xl" style={{ animation: 'sq-bounce 0.6s infinite' }}>💀</div>
      )}

      {/* ── QUESTION panel ── */}
      {inQuestion && song && (
        <div className="w-full max-w-[310px] rounded-2xl border border-white/10 p-3"
             style={{ background: 'rgba(255,255,255,0.04)' }}>

          {/* NPC header */}
          {phase === 'npc_duel' && npc && (
            <div className="flex items-start gap-3 mb-3 p-2.5 rounded-xl"
                 style={{ background: `${npc.color}18`, border: `1px solid ${npc.color}40` }}>
              <span className="text-3xl">{npc.emoji}</span>
              <div className="min-w-0">
                <p className="font-bold text-white text-sm">
                  {npc.name} <span className="text-white/45 font-normal text-xs">— {npc.title}</span>
                </p>
                <p className="text-white/55 text-xs italic leading-tight mt-0.5">"{npc.quote}"</p>
                {npcBuzzed && (
                  <p className="text-red-400 text-xs font-bold mt-1">🔔 Le NPC a bippé !</p>
                )}
              </div>
            </div>
          )}

          {/* Phase label */}
          <div className="text-center mb-2">
            <span className="badge badge-purple text-[10px]">
              {phase === 'npc_duel' ? `⚔️ Duel vs ${npc?.name}` : phase === 'random_q' ? '🎲 Genre Surprise' : '🎵 Blind Test'}
            </span>
          </div>

          {/* Timer bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(timeLeft / totalSecs) * 100}%`,
                  background: timeLeft > 5 ? '#22d3ee' : '#ef4444',
                  transition: 'width 1s linear, background 0.3s',
                }}
              />
            </div>
            <span className="text-white/50 text-xs font-mono w-6 text-right">{timeLeft}s</span>
          </div>

          {loading && (
            <p className="text-white/40 text-xs text-center mb-2">🎵 Chargement audio…</p>
          )}

          {/* QCM */}
          <QCMOptions
            options={opts}
            correctOption={`${song.title} — ${song.artist}`}
            selected={selected}
            onSelect={phase === 'npc_duel' ? handleNPCAnswer : handleAnswer}
          />
        </div>
      )}

      <style>{`
        @keyframes sq-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(-7px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
