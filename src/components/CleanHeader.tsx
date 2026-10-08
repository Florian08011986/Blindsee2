/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SlidersHorizontal, MapPin, Compass } from 'lucide-react';

interface CleanHeaderProps {
  onOpenMenu: () => void;
  activeCategoriesCount: number;
  currentLocationName: string;
  isTouring?: boolean;
}

export const CleanHeader: React.FC<CleanHeaderProps> = ({
  onOpenMenu,
  activeCategoriesCount,
  currentLocationName,
  isTouring
}) => {
  return (
    <header className="absolute top-3 inset-x-0 z-40 pointer-events-none flex flex-col items-center justify-start px-3 select-none">
      {/* Centered App Header */}
      <div className="relative max-w-xl w-full flex items-center justify-between">
        {/* Left: Discreet Location / 25km pill */}
        <div className="pointer-events-auto">
          <button
            onClick={onOpenMenu}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white backdrop-blur-md border border-white/15 text-xs font-medium shadow-lg transition-all active:scale-95 cursor-pointer group"
            title="Aufenthaltsort & 25 km Filter anpassen"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-bounce shrink-0" />
            <span className="truncate max-w-[110px] sm:max-w-[150px] font-semibold text-slate-100">
              {currentLocationName}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-400/30 shrink-0">
              ±25 km
            </span>
          </button>
        </div>

        {/* Center: Title */}
        <div className="pointer-events-auto text-center px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 shadow-xl mx-auto">
          <h1 className="text-xs sm:text-sm md:text-base font-black tracking-tight text-white drop-shadow-md flex items-center justify-center gap-1.5">
            <span>🇭🇷</span>
            <span>Kroatien Reisebegleiter</span>
          </h1>
        </div>

        {/* Right: Sleek Menu Button */}
        <div className="pointer-events-auto">
          <button
            onClick={onOpenMenu}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white backdrop-blur-md border border-white/15 text-xs font-semibold shadow-lg transition-all active:scale-95 cursor-pointer"
            title="Menü & Filter öffnen"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">Menü</span>
            {activeCategoriesCount > 0 && (
              <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950">
                {activeCategoriesCount}
              </span>
            )}
            {isTouring && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
