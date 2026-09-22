import React, { useState } from 'react';
import {
  X,
  Hammer,
  Shield,
  Flame,
  Swords,
  Home,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types';
import { WEAPONS, SHELTERS, RESOURCE_ITEMS, UI_TEXT } from '../game/constants';
import { soundManager } from '../audio/soundManager';

interface CraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Record<string, number>;
  equippedWeaponId: string;
  onCraftWeapon: (weaponId: string) => void;
  onSelectStructureToPlace: (structureId: string) => void;
  onCraftFood: (foodType: string) => void;
  language: Language;
  initialTab?: 'WEAPONS' | 'SHELTERS' | 'SUPPLIES';
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  isOpen,
  onClose,
  inventory,
  equippedWeaponId,
  onCraftWeapon,
  onSelectStructureToPlace,
  onCraftFood,
  language,
  initialTab = 'WEAPONS',
}) => {
  const [activeTab, setActiveTab] = useState<'WEAPONS' | 'SHELTERS' | 'SUPPLIES'>(initialTab);

  if (!isOpen) return null;

  const t = UI_TEXT[language];

  const hasMaterials = (cost: { [itemId: string]: number }) => {
    return Object.entries(cost).every(([itemId, needed]) => (inventory[itemId] || 0) >= needed);
  };

  const handleCraftWeapon = (weaponId: string) => {
    soundManager.playCraftSuccess();
    onCraftWeapon(weaponId);
  };

  const handleConstructStructure = (structureId: string) => {
    soundManager.playBuildPlace();
    onSelectStructureToPlace(structureId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <Hammer className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold tracking-wide text-amber-300 font-mono">
              {t.craft}
            </h2>
          </div>
          <button
            id="btn-close-crafting"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-stone-800 bg-stone-950/30">
          <button
            id="tab-weapons"
            onClick={() => setActiveTab('WEAPONS')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'WEAPONS'
                ? 'border-amber-500 text-amber-400 bg-stone-800/40 rounded-t-lg'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>{t.weaponsMenu}</span>
          </button>

          <button
            id="tab-shelters"
            onClick={() => setActiveTab('SHELTERS')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'SHELTERS'
                ? 'border-emerald-500 text-emerald-400 bg-stone-800/40 rounded-t-lg'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>{t.shelterMenu}</span>
          </button>

          <button
            id="tab-supplies"
            onClick={() => setActiveTab('SUPPLIES')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'SUPPLIES'
                ? 'border-purple-500 text-purple-400 bg-stone-800/40 rounded-t-lg'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.supplies}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* WEAPONS TAB */}
          {activeTab === 'WEAPONS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(WEAPONS).map((w) => {
                if (w.id === 'fists') return null; // Fists not craftable
                const isEquipped = equippedWeaponId === w.id;
                const canCraft = hasMaterials(w.cost);

                return (
                  <div
                    key={w.id}
                    className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                      isEquipped
                        ? 'border-amber-500/70 bg-amber-950/20'
                        : 'border-stone-800 bg-stone-950/50 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      {/* Title & Icon */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-2 bg-stone-800 rounded-lg">{w.icon}</span>
                          <div>
                            <h3 className="font-bold text-stone-100 text-sm">
                              {language === 'hi' ? w.nameHi : w.name}
                            </h3>
                            <span className="text-xs text-amber-400 font-mono">
                              ⚔️ {w.damage} Dmg • {w.type}
                            </span>
                          </div>
                        </div>
                        {isEquipped && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-500/40">
                            {language === 'hi' ? 'सक्रिय' : 'EQUIPPED'}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-stone-300 mt-2.5 leading-relaxed">
                        {language === 'hi' ? w.descriptionHi : w.description}
                      </p>

                      {/* Special effect badge */}
                      {w.specialEffect && w.specialEffect !== 'NONE' && (
                        <span className="inline-block mt-2 text-[10px] font-bold text-red-300 bg-red-950/60 border border-red-500/40 px-2 py-0.5 rounded-md">
                          ★ {w.specialEffect}
                        </span>
                      )}

                      {/* Required Resource Costs */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-stone-800/80">
                        {Object.entries(w.cost).map(([matId, count]) => {
                          const matDef = RESOURCE_ITEMS[matId];
                          const available = inventory[matId] || 0;
                          const satisfied = available >= count;

                          return (
                            <span
                              key={matId}
                              className={`text-[11px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                satisfied
                                  ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40'
                                  : 'border-rose-500/40 text-rose-300 bg-rose-950/40'
                              }`}
                            >
                              <span>{matDef?.icon || '📦'}</span>
                              <span>
                                {matDef ? (language === 'hi' ? matDef.nameHi : matDef.name) : matId}:{' '}
                                {available}/{count}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      id={`btn-craft-${w.id}`}
                      disabled={isEquipped || !canCraft}
                      onClick={() => handleCraftWeapon(w.id)}
                      className={`w-full mt-4 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isEquipped
                          ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                          : canCraft
                          ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md active:scale-95'
                          : 'bg-stone-800/80 text-stone-500 cursor-not-allowed border border-stone-700'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'पहले से आपके पास है' : 'Equipped'}</span>
                        </>
                      ) : canCraft ? (
                        <>
                          <Hammer className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'हथियार बनाएं व धारण करें' : 'Forge & Equip'}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'सामान कम है' : 'Need More Materials'}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* SHELTERS & BASES TAB */}
          {activeTab === 'SHELTERS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(SHELTERS).map((s) => {
                const canCraft = hasMaterials(s.cost);

                return (
                  <div
                    key={s.id}
                    className="flex flex-col justify-between p-4 rounded-xl border border-stone-800 bg-stone-950/50 hover:border-stone-700 transition-all"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 bg-stone-800 rounded-lg">{s.icon}</span>
                        <div>
                          <h3 className="font-bold text-stone-100 text-sm">
                            {language === 'hi' ? s.nameHi : s.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono mt-0.5">
                            <span>🛡️ {s.maxHp} HP</span>
                            <span>•</span>
                            <span>+{s.defenseBoost}% Def</span>
                            {s.healRate > 0 && <span>• +{s.healRate} HP/s</span>}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-stone-300 mt-2.5 leading-relaxed">
                        {language === 'hi' ? s.descriptionHi : s.description}
                      </p>

                      {s.frightensBeasts && (
                        <span className="inline-block mt-2 text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-md">
                          🔥 {language === 'hi' ? 'जानवर डरते हैं' : 'Repels Strange Beasts'}
                        </span>
                      )}

                      {/* Cost */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-stone-800/80">
                        {Object.entries(s.cost).map(([matId, count]) => {
                          const matDef = RESOURCE_ITEMS[matId];
                          const available = inventory[matId] || 0;
                          const satisfied = available >= count;

                          return (
                            <span
                              key={matId}
                              className={`text-[11px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                satisfied
                                  ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40'
                                  : 'border-rose-500/40 text-rose-300 bg-rose-950/40'
                              }`}
                            >
                              <span>{matDef?.icon || '📦'}</span>
                              <span>
                                {matDef ? (language === 'hi' ? matDef.nameHi : matDef.name) : matId}:{' '}
                                {available}/{count}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Construct Button */}
                    <button
                      id={`btn-build-${s.id}`}
                      disabled={!canCraft}
                      onClick={() => handleConstructStructure(s.id)}
                      className={`w-full mt-4 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        canCraft
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 shadow-md active:scale-95'
                          : 'bg-stone-800/80 text-stone-500 cursor-not-allowed border border-stone-700'
                      }`}
                    >
                      {canCraft ? (
                        <>
                          <Home className="w-3.5 h-3.5" />
                          <span>
                            {language === 'hi' ? 'आश्रय बनाएं व जमीन पर रखें' : 'Construct & Place on Island'}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'सामान कम है' : 'Need More Materials'}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* SUPPLIES TAB */}
          {activeTab === 'SUPPLIES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Roasted Fruit Salve */}
              <div className="flex flex-col justify-between p-4 rounded-xl border border-stone-800 bg-stone-950/50">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 bg-stone-800 rounded-lg">🥣</span>
                    <div>
                      <h3 className="font-bold text-stone-100 text-sm">
                        {language === 'hi' ? 'जंगली काढ़ा व औषधि' : 'Herbal Healing Salve'}
                      </h3>
                      <span className="text-xs text-rose-400 font-mono">+45 Health (HP)</span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-300 mt-2.5">
                    {language === 'hi'
                      ? 'जंगली बेर और जड़ी-बूटियों से बना लेप। तुरंत सेहत दुरुस्त करता है।'
                      : 'Brewed from wild berries and restorative jungle flora. Restores 45 HP instantly.'}
                  </p>
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-stone-800">
                    <span className="text-xs text-purple-300 font-mono">
                      🫐 {inventory.berries || 0}/3 Berries
                    </span>
                    <span className="text-xs text-green-300 font-mono">
                      🌿 {inventory.fiber || 0}/2 Vines
                    </span>
                  </div>
                </div>
                <button
                  id="btn-craft-salve"
                  disabled={(inventory.berries || 0) < 3 || (inventory.fiber || 0) < 2}
                  onClick={() => onCraftFood('salve')}
                  className="w-full mt-4 py-2 px-3 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 transition-all cursor-pointer"
                >
                  {language === 'hi' ? 'औषधि तैयार करें' : 'Brew Healing Salve'}
                </button>
              </div>

              {/* Energy Elixir */}
              <div className="flex flex-col justify-between p-4 rounded-xl border border-stone-800 bg-stone-950/50">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 bg-stone-800 rounded-lg">⚡</span>
                    <div>
                      <h3 className="font-bold text-stone-100 text-sm">
                        {language === 'hi' ? 'ऊर्जा पेय (नारियल काढ़ा)' : 'Tropical Stamina Tonic'}
                      </h3>
                      <span className="text-xs text-amber-400 font-mono">Max Stamina + Speed Boost</span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-300 mt-2.5">
                    {language === 'hi'
                      ? 'नारियल और क्रिस्टल ऊर्जा से बना विशेष पेय। तेजी से दौड़ने की शक्ति देता है।'
                      : 'Infused coconut drink granting instant stamina refill and a 15-second movement speed boost.'}
                  </p>
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-stone-800">
                    <span className="text-xs text-amber-300 font-mono">
                      🥥 {inventory.coconut || 0}/2 Coconuts
                    </span>
                  </div>
                </div>
                <button
                  id="btn-craft-tonic"
                  disabled={(inventory.coconut || 0) < 2}
                  onClick={() => onCraftFood('tonic')}
                  className="w-full mt-4 py-2 px-3 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 transition-all cursor-pointer"
                >
                  {language === 'hi' ? 'काढ़ा तैयार करें' : 'Prepare Energy Tonic'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
