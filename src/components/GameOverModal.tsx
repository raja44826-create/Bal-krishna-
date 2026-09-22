import React, { useEffect } from 'react';
import { Skull, RotateCcw, Award } from 'lucide-react';
import { Language } from '../types';
import { UI_TEXT } from '../game/constants';
import { soundManager } from '../audio/soundManager';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  level: number;
  beastsDefeated: number;
  resourcesGathered: number;
  onRestart: () => void;
  language: Language;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  level,
  beastsDefeated,
  resourcesGathered,
  onRestart,
  language,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundManager.playGameOver();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const t = UI_TEXT[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-md bg-stone-900 border-2 border-rose-600/70 rounded-2xl shadow-2xl overflow-hidden text-stone-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Skull banner */}
        <div className="bg-rose-950/80 border-b border-rose-800/60 p-6 text-center flex flex-col items-center">
          <div className="p-3 bg-rose-900/40 rounded-full border border-rose-600/50 mb-2">
            <Skull className="w-10 h-10 text-rose-400" />
          </div>
          <h2 className="text-2xl font-black tracking-wide text-rose-300 uppercase font-mono">
            {t.gameOver}
          </h2>
          <p className="text-xs text-stone-300 mt-1 max-w-xs">{t.gameOverDesc}</p>
        </div>

        {/* Stats */}
        <div className="p-6 space-y-4">
          <div className="space-y-2 bg-stone-950/60 border border-stone-800 p-4 rounded-xl text-xs">
            <div className="flex justify-between items-center">
              <span className="text-stone-400">{t.score}:</span>
              <span className="font-mono font-bold text-amber-300 text-sm">{score.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">{t.level}:</span>
              <span className="font-mono font-bold text-stone-200">{level}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">{language === 'hi' ? 'मारे गए जानवर' : 'Beasts Defeated'}:</span>
              <span className="font-mono font-bold text-rose-400">{beastsDefeated}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400">{language === 'hi' ? 'एकत्रित सामग्री' : 'Resources Gathered'}:</span>
              <span className="font-mono font-bold text-emerald-400">{resourcesGathered}</span>
            </div>
          </div>

          <button
            id="btn-restart-game"
            onClick={onRestart}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-500 text-stone-100 font-bold rounded-xl shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.restart}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
