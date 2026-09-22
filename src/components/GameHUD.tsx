import React, { useState } from 'react';
import {
  Heart,
  Zap,
  Apple,
  Shield,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Languages,
  Hammer,
  Backpack,
  Pause,
  Play,
  Crosshair,
  Flame,
  CheckCircle2,
  Circle,
  Skull,
  TrendingUp,
} from 'lucide-react';
import {
  PlayerStats,
  Language,
  TimeOfDay,
  LevelConfig,
  InventorySlot,
  PlacedStructure,
} from '../types';
import { UI_TEXT, WEAPONS, RESOURCE_ITEMS, SHELTERS } from '../game/constants';
import { soundManager } from '../audio/soundManager';

interface GameHUDProps {
  player: PlayerStats;
  inventory: Record<string, number>;
  levelConfig: LevelConfig;
  timeOfDay: TimeOfDay;
  timeProgress: number;
  isInSafeZone: boolean;
  activeSanctuary: PlacedStructure | null;
  language: Language;
  onToggleLanguage: () => void;
  onOpenCrafting: (tab?: 'WEAPONS' | 'SHELTERS' | 'SUPPLIES') => void;
  onConsumeItem: (itemId: string) => void;
  onTogglePause: () => void;
  isPaused: boolean;
  isPlacementMode: boolean;
  onCancelPlacement: () => void;
  animalsCount: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  inventory,
  levelConfig,
  timeOfDay,
  timeProgress,
  isInSafeZone,
  activeSanctuary,
  language,
  onToggleLanguage,
  onOpenCrafting,
  onConsumeItem,
  onTogglePause,
  isPaused,
  isPlacementMode,
  onCancelPlacement,
  animalsCount,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  const [showObjectives, setShowObjectives] = useState(true);

  const t = UI_TEXT[language];
  const equippedWeapon = WEAPONS[player.equippedWeaponId] || WEAPONS.fists;

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Objective completions
  const isPointsMet = player.score >= levelConfig.pointsRequired;
  const isResourcesMet = player.resourcesGatheredCount >= levelConfig.resourcesToGather;
  const isSheltersMet = player.structuresBuiltCount >= levelConfig.structuresToBuild;
  const isBeastsMet = player.beastsDefeatedCount >= levelConfig.beastsToDefeat;
  const totalObjectivesCompleted =
    (isPointsMet ? 1 : 0) +
    (isResourcesMet ? 1 : 0) +
    (isSheltersMet ? 1 : 0) +
    (isBeastsMet ? 1 : 0);

  const dangerColors: Record<string, string> = {
    LOW: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
    MEDIUM: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
    HIGH: 'text-orange-400 border-orange-500/40 bg-orange-950/40',
    EXTREME: 'text-rose-400 border-rose-500/40 bg-rose-950/40',
    NIGHTMARE: 'text-purple-400 border-purple-500/40 bg-purple-950/40 animate-pulse',
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 font-sans select-none z-10">
      {/* TOP BAR */}
      <div className="flex flex-wrap items-start justify-between gap-3 pointer-events-auto w-full">
        {/* Left: Player Vital Stats */}
        <div className="flex flex-col gap-1.5 bg-stone-900/85 backdrop-blur-md border border-stone-700/60 rounded-xl p-3 shadow-2xl min-w-[210px] sm:min-w-[270px]">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-stone-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 font-mono">
              {language === 'hi' ? 'जीवित survivor' : 'SURVIVOR'}
            </span>
            {isInSafeZone && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/50 animate-pulse">
                <Shield className="w-3 h-3 text-emerald-400" />
                {language === 'hi' ? 'सुरक्षित आश्रय' : 'Safe Sanctuary'}
              </span>
            )}
          </div>

          {/* Health Bar */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-400" />
                {t.health}
              </span>
              <span className="font-mono text-xs text-rose-200">
                {Math.round(player.hp)} / {player.maxHp}
              </span>
            </div>
            <div className="h-2.5 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-150 rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%` }}
              />
            </div>
          </div>

          {/* Stamina Bar */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-400" />
                {t.stamina}
              </span>
              <span className="font-mono text-xs text-amber-200">
                {Math.round(player.stamina)} / {player.maxStamina}
              </span>
            </div>
            <div className="h-1.5 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800">
              <div
                className="h-full bg-amber-500 transition-all duration-100 rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, (player.stamina / player.maxStamina) * 100))}%` }}
              />
            </div>
          </div>

          {/* Score Points Counter */}
          <div className="flex items-center justify-between pt-1 border-t border-stone-800 text-xs">
            <span className="flex items-center gap-1 text-amber-300 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              {t.points}:
            </span>
            <span className="font-mono font-bold text-sm text-yellow-300 drop-shadow">
              {player.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Center: Level & Time Tracker */}
        <div className="flex flex-col items-center bg-stone-900/85 backdrop-blur-md border border-stone-700/60 rounded-xl px-4 py-2.5 shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-stone-100 tracking-wide">
              {language === 'hi' ? levelConfig.nameHi : levelConfig.name}
            </span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                dangerColors[levelConfig.dangerRating]
              }`}
            >
              {levelConfig.dangerRating}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-1 text-xs text-stone-300">
            {/* Time of Day */}
            <div className="flex items-center gap-1.5">
              {timeOfDay === 'DAY' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : timeOfDay === 'DUSK' ? (
                <Sun className="w-4 h-4 text-orange-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
              <span className="font-medium">
                {timeOfDay === 'DAY'
                  ? t.day
                  : timeOfDay === 'DUSK'
                  ? t.dusk
                  : timeOfDay === 'BLOOD_MOON'
                  ? t.bloodMoon
                  : t.night}
              </span>
            </div>

            {/* Beasts nearby count */}
            <div className="flex items-center gap-1 text-rose-300">
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {animalsCount} {language === 'hi' ? 'जानवर द्वीप पर' : 'beasts'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Objective Goals & Controls */}
        <div className="flex flex-col items-end gap-2">
          {/* Quick Config Buttons */}
          <div className="flex items-center gap-1.5 bg-stone-900/85 backdrop-blur-md border border-stone-700/60 rounded-xl p-1.5 shadow-xl">
            {/* Language Switch */}
            <button
              id="btn-lang-toggle"
              onClick={onToggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors cursor-pointer"
              title="Toggle Language (हिन्दी / English)"
            >
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
            </button>

            {/* Mute/Sound */}
            <button
              id="btn-sound-toggle"
              onClick={toggleSound}
              className="p-1.5 text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Pause */}
            <button
              id="btn-pause-toggle"
              onClick={onTogglePause}
              className="p-1.5 text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>

          {/* Level Objectives Card */}
          <div className="bg-stone-900/90 backdrop-blur-md border border-stone-700/60 rounded-xl p-2.5 sm:p-3 shadow-xl max-w-xs text-xs">
            <div
              className="flex items-center justify-between gap-3 cursor-pointer"
              onClick={() => setShowObjectives(!showObjectives)}
            >
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                {t.objectives} ({totalObjectivesCompleted}/4)
              </span>
              <span className="text-[10px] text-stone-400">{showObjectives ? '▲' : '▼'}</span>
            </div>

            {showObjectives && (
              <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-stone-800">
                {/* 1. Gather Resources */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-stone-300">
                    {isResourcesMet ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    )}
                    <span>{t.gatherGoal}</span>
                  </div>
                  <span className={`font-mono ${isResourcesMet ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                    {player.resourcesGatheredCount} / {levelConfig.resourcesToGather}
                  </span>
                </div>

                {/* 2. Build Shelters */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-stone-300">
                    {isSheltersMet ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    )}
                    <span>{t.buildGoal}</span>
                  </div>
                  <span className={`font-mono ${isSheltersMet ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                    {player.structuresBuiltCount} / {levelConfig.structuresToBuild}
                  </span>
                </div>

                {/* 3. Defeat Strange Beasts */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-stone-300">
                    {isBeastsMet ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    )}
                    <span>{t.defeatGoal}</span>
                  </div>
                  <span className={`font-mono ${isBeastsMet ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                    {player.beastsDefeatedCount} / {levelConfig.beastsToDefeat}
                  </span>
                </div>

                {/* 4. Score Points */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-stone-300">
                    {isPointsMet ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    )}
                    <span>{t.pointsGoal}</span>
                  </div>
                  <span className={`font-mono ${isPointsMet ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                    {player.score} / {levelConfig.pointsRequired}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PLACEMENT MODE BANNER IF ACTIVE */}
      {isPlacementMode && (
        <div className="self-center pointer-events-auto flex items-center gap-3 bg-emerald-950/90 border border-emerald-500/70 text-emerald-200 px-4 py-2 rounded-xl shadow-2xl animate-bounce">
          <span className="text-sm font-semibold">{t.placeStructure}</span>
          <button
            id="btn-cancel-placement"
            onClick={onCancelPlacement}
            className="px-2.5 py-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg border border-stone-600 cursor-pointer"
          >
            {t.cancelPlacement}
          </button>
        </div>
      )}

      {/* BOTTOM ACTION & QUICK BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto">
        {/* Scavenged Inventory Snapshot */}
        <div className="flex items-center gap-2 bg-stone-900/85 backdrop-blur-md border border-stone-700/60 rounded-xl px-3 py-2 shadow-2xl overflow-x-auto max-w-full">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 pr-1 border-r border-stone-800">
            <Backpack className="w-3.5 h-3.5 text-amber-400" />
            {t.inventory}:
          </span>

          {Object.entries(inventory).map(([itemId, count]) => {
            const item = RESOURCE_ITEMS[itemId];
            if (!item || count <= 0) return null;
            return (
              <div
                key={itemId}
                className="flex items-center gap-1 bg-stone-950/70 border border-stone-800 px-2 py-1 rounded-lg text-xs"
                title={`${language === 'hi' ? item.nameHi : item.name} (+${item.points} pts)`}
              >
                <span>{item.icon}</span>
                <span className="font-mono font-bold text-amber-200">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Action Controls & Crafting Launchers */}
        <div className="flex items-center gap-2">
          {/* Quick Rations Consumption (Berries / Coconut) */}
          {(inventory.berries || 0) > 0 && (
            <button
              id="btn-eat-berries"
              onClick={() => onConsumeItem('berries')}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-950/80 hover:bg-purple-900/90 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold shadow-lg transition-transform active:scale-95 cursor-pointer"
              title={t.eatBerries}
            >
              <span>🫐</span>
              <span>{inventory.berries}</span>
            </button>
          )}

          {(inventory.coconut || 0) > 0 && (
            <button
              id="btn-drink-coconut"
              onClick={() => onConsumeItem('coconut')}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-950/80 hover:bg-amber-900/90 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-semibold shadow-lg transition-transform active:scale-95 cursor-pointer"
              title={t.drinkCoconut}
            >
              <span>🥥</span>
              <span>{inventory.coconut}</span>
            </button>
          )}

          {/* Current Equipped Weapon Badge */}
          <div
            onClick={() => onOpenCrafting('WEAPONS')}
            className="flex items-center gap-2 bg-stone-900/90 border border-amber-600/40 px-3 py-2 rounded-xl text-xs shadow-xl cursor-pointer hover:border-amber-500 transition-colors"
            title="Click to Forge Weapons"
          >
            <span className="text-base">{equippedWeapon.icon}</span>
            <div className="flex flex-col">
              <span className="font-bold text-amber-300">
                {language === 'hi' ? equippedWeapon.nameHi : equippedWeapon.name}
              </span>
              <span className="text-[10px] text-stone-400">
                {equippedWeapon.damage} Dmg • {equippedWeapon.type}
              </span>
            </div>
          </div>

          {/* Primary Crafting & Base Building Button */}
          <button
            id="btn-open-crafting"
            onClick={() => onOpenCrafting()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold rounded-xl text-xs sm:text-sm shadow-xl transition-transform active:scale-95 cursor-pointer border border-amber-400/40"
          >
            <Hammer className="w-4 h-4" />
            <span>{t.craft}</span>
            <span className="text-[10px] bg-stone-900/50 text-amber-200 px-1.5 py-0.5 rounded ml-1 font-mono">
              [C]
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
