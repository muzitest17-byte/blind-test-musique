import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import MixingBoard from '../components/MixingBoard';

const CATEGORIES = [
  { id: 'geo',      icon: '🌍', label: 'Géo',        color: '#22c55e', active: false },
  { id: 'musique',  icon: '🎵', label: 'Musique',     color: '#a855f7', active: true  },
  { id: 'histoire', icon: '📜', label: 'Histoire',    color: '#3b82f6', active: false },
  { id: 'mots',     icon: '🔍', label: 'Mots rares',  color: '#ec4899', active: false },
  { id: 'autres',   icon: '💡', label: 'Autres',      color: '#f97316', active: false },
];

const MODES = [
  {
    path: '/free',
    icon: '🎲',
    label: 'Mode Libre',
    sub: 'Solo · Tes propres règles',
    accent: '#22d3ee',
    glow: 'rgba(6,182,212,0.5)',
    border: 'rgba(34,211,238,0.55)',
    bg: 'rgba(6,182,212,0.18)',
  },
  {
    path: '/setup',
    icon: '🎮',
    label: 'Multijoueur',
    sub: "Buzzeurs · QR code · 8 joueurs",
    accent: '#c084fc',
    glow: 'rgba(192,132,252,0.5)',
    border: 'rgba(192,132,252,0.55)',
    bg: 'rgba(139,92,246,0.18)',
  },
  {
    path: '/career',
    icon: '🏆',
    label: 'Carrière',
    sub: 'Solo · 11 campagnes · Étoiles',
    accent: '#fbbf24',
    glow: 'rgba(251,191,36,0.45)',
    border: 'rgba(251,191,36,0.55)',
    bg: 'rgba(245,158,11,0.18)',
  },
  {
    path: '/board',
    icon: '🎲',
    label: 'Plateau',
    sub: 'NPCs musicaux · Style Mario · 30 cases',
    accent: '#ec4899',
    glow: 'rgba(236,72,153,0.45)',
    border: 'rgba(236,72,153,0.55)',
    bg: 'rgba(219,39,119,0.18)',
  },
];

const STATS = [
  { n: '2658', label: 'chansons' },
  { n: '19', label: 'genres' },
  { n: '9', label: 'décennies' },
  { n: '11', label: 'campagnes' },
];

const NOTES = [
  { sym: '♩', top: 8,  left: 5,  size: 48, rot: -15, delay: 0 },
  { sym: '♪', top: 15, left: 88, size: 36, rot: 10,  delay: 0.6 },
  { sym: '♫', top: 35, left: 3,  size: 56, rot: -8,  delay: 1.2 },
  { sym: '♬', top: 55, left: 92, size: 44, rot: 20,  delay: 0.3 },
  { sym: '♩', top: 72, left: 7,  size: 32, rot: 12,  delay: 0.9 },
  { sym: '🎵', top: 20, left: 50, size: 28, rot: -5,  delay: 1.5 },
  { sym: '♪', top: 80, left: 80, size: 52, rot: -18, delay: 0.4 },
  { sym: '♫', top: 60, left: 45, size: 38, rot: 8,   delay: 1.1 },
  { sym: '🎶', top: 42, left: 75, size: 34, rot: -12, delay: 0.7 },
  { sym: '♬', top: 90, left: 30, size: 46, rot: 15,  delay: 1.8 },
  { sym: '♩', top: 5,  left: 65, size: 30, rot: -20, delay: 2.0 },
  { sym: '🎵', top: 70, left: 20, size: 42, rot: 5,   delay: 0.2 },
];

export default function Home() {
  const nav = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  function handleCategoryClick(cat: typeof CATEGORIES[number]) {
    if (cat.active) {
      document.getElementById('modes')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setToast(`🚧 ${cat.label} arrive bientôt !`);
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-5 relative overflow-hidden">

      {/* ── Table de mixage animée ── */}
      <MixingBoard />

      {/* ── Ambient lights ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 65%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.28) 0%, transparent 65%)' }} />
        <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 65%)' }} />
        {/* Notes musicales flottantes */}
        {NOTES.map((n, i) => (
          <span key={i} className="absolute select-none"
                style={{
                  top: `${n.top}%`, left: `${n.left}%`,
                  fontSize: n.size,
                  opacity: 0.07,
                  transform: `rotate(${n.rot}deg)`,
                  animation: `note-float 4s ease-in-out infinite`,
                  animationDelay: `${n.delay}s`,
                  color: ['#c084fc','#22d3ee','#f472b6','#a78bfa'][i % 4],
                }}>
            {n.sym}
          </span>
        ))}
      </div>

      {/* ── Hero ── */}
      <div className="relative z-10 text-center mb-10 fade-in">
        {/* Logo */}
        <div className="mb-5 mt-2">
          <Logo />
        </div>

        {/* Title */}
        <h1 className="font-display leading-none mb-2" style={{ fontSize: 'clamp(4.5rem, 15vw, 10rem)' }}>
          <span style={{
            background: 'linear-gradient(90deg, #fde68a, #fbbf24, #fff7ed, #fbbf24, #fde68a)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            animation: 'goldShimmer 3.5s ease-in-out infinite',
            textShadow: '0 0 30px rgba(251,191,36,0.25)',
          }}>BLIND</span>
          <span style={{ background: 'linear-gradient(135deg, #f5f5f5, #d4d4d8, #fafafa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> MIX</span>
        </h1>
        <p className="text-sm tracking-[0.35em] uppercase font-medium"
           style={{ background: 'linear-gradient(90deg, #fbbf24, #fde68a, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎵 Musical · 2658 chansons · 9 décennies
        </p>
      </div>

      {/* ── Category pills ── */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-2.5 mb-8 fade-in" style={{ animationDelay: '0.15s' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => handleCategoryClick(c)}
            className="group relative flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: `${c.color}1a`,
              borderColor: c.active ? `${c.color}90` : `${c.color}35`,
              color: c.active ? '#fff' : 'rgba(255,255,255,0.55)',
              boxShadow: c.active ? `0 0 18px ${c.color}45` : 'none',
            }}
          >
            <span className="text-base">{c.icon}</span>
            <span>{c.label}</span>
            {!c.active && <span className="text-[10px] opacity-50">🔒</span>}
          </button>
        ))}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-semibold text-sm text-white scale-in"
             style={{ background: 'rgba(20,20,35,0.96)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}

      {/* ── Mode cards ── */}
      <div id="modes" className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl stagger">
        {MODES.map(m => (
          <button
            key={m.path}
            onClick={() => nav(m.path)}
            className="group relative p-6 rounded-3xl text-left overflow-hidden transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1"
            style={{
              background: m.bg,
              border: `1px solid ${m.border}`,
              boxShadow: `0 0 0 transparent`,
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 12px 40px ${m.glow}, 0 0 0 1px ${m.border}`)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 transparent')}
          >
            {/* Inner shine */}
            <div className="absolute top-0 left-0 right-0 h-px opacity-50"
                 style={{ background: `linear-gradient(90deg, transparent, ${m.accent}, transparent)` }} />

            <span className="text-3xl block mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
              {m.icon}
            </span>
            <p className="font-bold text-white text-base mb-0.5">{m.label}</p>
            <p className="text-white/65 text-xs leading-relaxed">{m.sub}</p>

            {/* Arrow */}
            <span className="absolute bottom-4 right-4 text-white/40 transition-all duration-200 group-hover:text-white/80 group-hover:translate-x-1">
              →
            </span>
          </button>
        ))}
      </div>

      {/* ── Join + QR ── */}
      <div className="relative z-10 mt-5 flex items-center gap-4 fade-in" style={{ animationDelay: '0.5s' }}>
        <button
          onClick={() => nav('/join')}
          className="text-white/55 hover:text-white/90 text-sm transition-all duration-200 tracking-wide flex items-center gap-2"
        >
          <span className="w-4 h-px bg-white/40" />
          Rejoindre avec un code
          <span className="w-4 h-px bg-white/40" />
        </button>
        <button
          onClick={() => nav('/qr')}
          className="badge badge-purple hover:bg-purple-500/25 transition-colors cursor-pointer"
          title="QR Code d'accès"
        >
          📱 QR Code
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="relative z-10 mt-10 fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-center gap-6 sm:gap-10">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="font-display text-2xl sm:text-3xl gradient-text">{s.n}</p>
              <p className="text-white/55 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Genre ticker ── */}
      <div className="fixed bottom-0 left-0 right-0 z-10 overflow-hidden pointer-events-none" style={{ height: 36 }}>
        <div className="flex items-center h-full" style={{ animation: 'ticker 30s linear infinite', width: 'max-content' }}>
          {[...Array(3)].flatMap(() => [
            '🎻 Classique','🎸 Blues','🙏 Gospel','🪕 Folk','🎭 Opéra','🎷 Jazz','🎸 Rock','🎤 Pop','🌿 Reggae',
            '🎛️ Électronique','🎧 Hip-Hop','🎵 Soul','🪩 Disco','🤘 Métal','🥐 Chanson française','🕺 Funk',
          ]).map((g, i) => (
            <span key={i} className="text-white/40 text-xs font-medium mx-6 whitespace-nowrap">{g}</span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }
        @keyframes note-float { 0%,100% { transform: translateY(0) rotate(var(--r,0deg)); } 50% { transform: translateY(-18px) rotate(var(--r,0deg)); } }
      `}</style>
    </div>
  );
}
