import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, AlertTriangle, ArrowRight, Skull, Hammer, Sparkles, ShieldAlert } from 'lucide-react';
import { LevelConfig, Language } from '../types';
import { LEVELS, UI_TEXT } from '../game/constants';
import { soundManager } from '../audio/soundManager';

interface LevelCompleteModalProps {
  isOpen: boolean;
  currentLevel: LevelConfig;
  nextLevel: LevelConfig | null;
  score: number;
  resourcesGathered: number;
  beastsDefeated: number;
  structuresBuilt: number;
  onProceedToNextLevel: () => void;
  language: Language;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  isOpen,
  currentLevel,
  nextLevel,
  score,
  resourcesGathered,
  beastsDefeated,
  structuresBuilt,
  onProceedToNextLevel,
  language,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundManager.playLevelClear();
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Fallback if canvas context is restricted
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const t = UI_TEXT[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-xl bg-stone-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden text-stone-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Banner with Triumphant Header */}
        <div className="bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 p-6 text-center text-stone-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-stone-950/10" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-3 bg-stone-950/20 rounded-full mb-2">
              <Trophy className="w-10 h-10 text-stone-950" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-wider uppercase font-mono">
              {t.completeLevel}
            </h2>
            <p className="text-xs sm:text-sm font-semibold opacity-90 mt-1">
              {language === 'hi' ? currentLevel.nameHi : currentLevel.name}
            </p>
          </div>
        </div>

        {/* Level Stats Summary */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Score */}
            <div className="bg-stone-950/70 border border-stone-800 p-3 rounded-xl text-center">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">
                {t.score}
              </span>
              <span className="font-mono text-lg font-bold text-amber-300">
                {score.toLocaleString()}
              </span>
            </div>

            {/* Resources */}
            <div className="bg-stone-950/70 border border-stone-800 p-3 rounded-xl text-center">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">
                {language === 'hi' ? 'सामान खोजा' : 'Resources'}
              </span>
              <span className="font-mono text-lg font-bold text-emerald-300">
                {resourcesGathered}
              </span>
            </div>

            {/* Beasts Slain */}
            <div className="bg-stone-950/70 border border-stone-800 p-3 rounded-xl text-center">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">
                {language === 'hi' ? 'जानवर मारे' : 'Beasts Defeated'}
              </span>
              <span className="font-mono text-lg font-bold text-rose-400">
                {beastsDefeated}
              </span>
            </div>

            {/* Structures Built */}
            <div className="bg-stone-950/70 border border-stone-800 p-3 rounded-xl text-center">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block">
                {language === 'hi' ? 'आश्रय बनाए' : 'Shelters'}
              </span>
              <span className="font-mono text-lg font-bold text-cyan-300">
                {structuresBuilt}
              </span>
            </div>
          </div>

          {/* DANGER ESCALATION WARNING (Core requirement from prompt) */}
          {nextLevel ? (
            <div className="bg-rose-950/50 border-2 border-rose-600/70 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
                <span>{t.levelEscalationWarning}</span>
              </div>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                {language === 'hi' ? nextLevel.descriptionHi : nextLevel.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-rose-300 font-mono">
                <span>
                  🔥 {language === 'hi' ? 'नया खतरा स्तर' : 'Danger Rating'}:{' '}
                  <strong className="text-rose-400">{nextLevel.dangerRating}</strong>
                </span>
                <span>
                  🐾 {language === 'hi' ? 'अधिक आक्रामक झुंड' : 'More Aggressive Beast Packs'}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-4 text-center">
              <h3 className="font-bold text-amber-300">
                {language === 'hi' ? 'द्वीपाधिपति! आपने सभी स्तर जीत लिए!' : 'Island Master! All Levels Survived!'}
              </h3>
              <p className="text-xs text-stone-300 mt-1">
                {language === 'hi'
                  ? 'अब आप अंतहीन रात (Endless Nightmare) में सर्वाइव करके अपने स्कोर को अनंत ऊंचाइयों तक ले जा सकते हैं!'
                  : 'You have conquered the island. Continue surviving in the infinite endless mode!'}
              </p>
            </div>
          )}

          {/* Proceed Button */}
          <button
            id="btn-next-level"
            onClick={onProceedToNextLevel}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black tracking-wide rounded-xl shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer text-sm sm:text-base"
          >
            <span>{t.nextLevel}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
