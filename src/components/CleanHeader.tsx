/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Info, Sparkles } from 'lucide-react';

interface CleanHeaderProps {
  onOpenInfo: () => void;
  currentLocationName: string;
  isTouring?: boolean;
  assistantName: string;
  onOpenLocationSelect?: () => void;
}

export const CleanHeader: React.FC<CleanHeaderProps> = ({
  onOpenInfo,
  currentLocationName,
  isTouring,
  assistantName,
  onOpenLocationSelect
}) => {
  return (
    <header className="absolute top-3 inset-x-0 z-40 pointer-events-none flex flex-col items-center justify-start px-3 select-none">
      {/* Centered App Header */}
      <div className="relative max-w-xl w-full flex items-center justify-between">
        {/* Left: Location Pill (tipping triggers GPS / Location info) */}
        <div className="pointer-events-auto">
          <button
            onClick={onOpenLocationSelect || onOpenInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 hover:bg-slate-900 text-white backdrop-blur-md border border-white/15 text-xs font-medium shadow-lg transition-all active:scale-95 cursor-pointer group"
            title="Aktueller Aufenthaltsort"
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

        {/* Center: App Title */}
        <div className="pointer-events-auto text-center px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-xl mx-auto flex items-center gap-1.5">
          <span className="text-sm">🇭🇷</span>
          <h1 className="text-xs sm:text-sm font-black tracking-tight text-white drop-shadow-md">
            Kroatien Reisebegleiter
          </h1>
          {assistantName && (
            <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/80 font-bold border border-white/15">
              {assistantName}
            </span>
          )}
        </div>

        {/* Right: Discreet Info Icon (ℹ️) as requested by Florian */}
        <div className="pointer-events-auto">
          <button
            onClick={onOpenInfo}
            className="relative flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-full bg-slate-950/85 hover:bg-slate-900 text-white backdrop-blur-md border border-white/15 text-xs font-semibold shadow-lg transition-all active:scale-95 cursor-pointer group"
            title="Hilfe, Funktionen & Sprachbefehle"
          >
            <Info className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform shrink-0" />
            <span className="hidden sm:inline ml-1 font-bold">Hilfe</span>
            {isTouring && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
