/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Home } from 'lucide-react';

interface CleanHeaderProps {
  onOpenInfo: () => void;
  onFlyToHomeBase?: () => void;
  isTouring?: boolean;
  assistantName: string;
  isVisible?: boolean;
}

export const CleanHeader: React.FC<CleanHeaderProps> = ({
  onOpenInfo,
  onFlyToHomeBase,
  isTouring,
  assistantName,
  isVisible = true
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="absolute top-3 inset-x-0 z-40 pointer-events-none flex items-center justify-center px-4 select-none"
        >
          <div className="relative max-w-md w-full flex items-center justify-between pointer-events-auto">
            {/* Left: Home Base (Zaton Resort) Button */}
            <button
              onClick={onFlyToHomeBase}
              className="relative px-2.5 h-9 flex items-center gap-1.5 rounded-full bg-slate-950/85 hover:bg-amber-950/40 text-amber-400 backdrop-blur-md border border-amber-500/30 text-[11px] font-bold shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
              title="Zurück zur Home Base: Zaton Holiday Resort (Nin)"
            >
              <Home className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Base</span>
            </button>

            {/* Center: App Title & Powered by Florian Finke */}
            <div className="text-center px-4 py-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-white/10 shadow-xl flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🇭🇷</span>
                <h1 className="text-xs sm:text-sm font-black tracking-tight text-white drop-shadow-md">
                  Kroatien Reisebegleiter
                </h1>
                {assistantName && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30">
                    {assistantName}
                  </span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 font-medium tracking-wider mt-0.5">
                Powered by Florian Finke
              </span>
            </div>

            {/* Right: Discreet Info Icon (ℹ️) */}
            <button
              onClick={onOpenInfo}
              className="relative w-9 h-9 flex items-center justify-center rounded-full bg-slate-950/85 hover:bg-slate-900 text-white backdrop-blur-md border border-white/15 text-xs font-semibold shadow-lg transition-all active:scale-95 cursor-pointer group shrink-0"
              title="Hilfe, Funktionen & Sprachbefehle"
            >
              <Info className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform shrink-0" />
              {isTouring && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </button>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
};
