import React, { useState, useRef, useEffect } from 'react';
import { Swords, Hand, Hammer } from 'lucide-react';
import { Language } from '../types';
import { UI_TEXT } from '../game/constants';

interface MobileControlsProps {
  onMoveVector: (vx: number, vy: number) => void;
  onAttack: () => void;
  onInteract: () => void;
  onOpenCrafting: () => void;
  language: Language;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveVector,
  onAttack,
  onInteract,
  onOpenCrafting,
  language,
}) => {
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [stickOffset, setStickOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  const t = UI_TEXT[language];

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;

    if (joystickRef.current) {
      const rect = joystickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      updateJoystick(touch.clientX, touch.clientY, centerX, centerY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current && joystickRef.current) {
        const rect = joystickRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        updateJoystick(touch.clientX, touch.clientY, centerX, centerY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setStickOffset({ x: 0, y: 0 });
        onMoveVector(0, 0);
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number, centerX: number, centerY: number) => {
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 48; // Max radius

    let clampedX = dx;
    let clampedY = dy;
    if (dist > maxDist) {
      clampedX = (dx / dist) * maxDist;
      clampedY = (dy / dist) * maxDist;
    }

    setStickOffset({ x: clampedX, y: clampedY });
    onMoveVector(clampedX / maxDist, clampedY / maxDist);
  };

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none flex justify-between items-end p-4 pb-16 sm:pb-6 z-20 sm:hidden">
      {/* Virtual Joystick for Left Hand */}
      <div
        ref={joystickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="w-28 h-28 rounded-full bg-stone-900/60 border-2 border-stone-700/80 backdrop-blur-sm pointer-events-auto relative flex items-center justify-center touch-none select-none shadow-2xl"
      >
        {/* Center thumb stick */}
        <div
          className="w-12 h-12 rounded-full bg-amber-500/80 border-2 border-amber-300 shadow-md transform transition-transform"
          style={{
            transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)`,
          }}
        />
      </div>

      {/* Action Buttons for Right Hand */}
      <div className="flex flex-col items-end gap-3 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Interact / Gather */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onInteract();
            }}
            onClick={onInteract}
            className="w-12 h-12 rounded-full bg-emerald-700/90 active:bg-emerald-600 border border-emerald-400 text-stone-100 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            title={t.mobileInteract}
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Craft */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onOpenCrafting();
            }}
            onClick={onOpenCrafting}
            className="w-12 h-12 rounded-full bg-stone-800/90 active:bg-stone-700 border border-amber-500/50 text-amber-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            title={t.mobileCraft}
          >
            <Hammer className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Attack Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onAttack();
          }}
          onClick={onAttack}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-700 to-rose-500 active:from-rose-600 active:to-rose-400 border-2 border-rose-300 text-stone-100 flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
          title={t.mobileAttack}
        >
          <Swords className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
