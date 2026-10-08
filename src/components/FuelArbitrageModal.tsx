/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Fuel, Sparkles, TrendingDown, ShoppingBag, Pill, Croissant } from 'lucide-react';

interface FuelArbitrageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FuelArbitrageModal: React.FC<FuelArbitrageModalProps> = ({ isOpen, onClose }) => {
  const [tankSize, setTankSize] = useState<number>(50);

  // Aktuelle Vergleichspreise (Super 95)
  const priceDE = 1.78;
  const priceCZ = 1.56;
  const priceHR = 1.48;

  const costDE = (tankSize * priceDE).toFixed(2);
  const costCZ = (tankSize * priceCZ).toFixed(2);
  const costHR = (tankSize * priceHR).toFixed(2);

  const savingsCZ = (tankSize * (priceDE - priceCZ)).toFixed(2);
  const savingsHR = (tankSize * (priceDE - priceHR)).toFixed(2);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Fuel className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  Sprit- & Spar-Rechner
                </h2>
                <p className="text-xs text-amber-300 font-mono">
                  Tschechien 🇨🇿 • Deutschland 🇩🇪 • Kroatien 🇭🇷
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-6 text-sm">
            {/* Tankvolumen Slider */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300">Tankvolumen einstellen:</span>
                <span className="text-amber-400 font-mono font-bold text-sm">{tankSize} Liter</span>
              </div>
              <input
                type="range"
                min="30"
                max="80"
                step="5"
                value={tankSize}
                onChange={(e) => setTankSize(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>30 L (Kleinwagen)</span>
                <span>50 L (Standard)</span>
                <span>80 L (Großer SUV)</span>
              </div>
            </div>

            {/* Preisvergleich Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Deutschland */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 text-center">
                <span className="text-xs text-slate-400 font-medium">Deutschland 🇩🇪</span>
                <p className="text-base font-bold text-slate-200 mt-1">{costDE} €</p>
                <p className="text-[11px] text-slate-500 mt-0.5">~{priceDE.toFixed(2)} € / L</p>
              </div>

              {/* Tschechien */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center relative overflow-hidden">
                <span className="text-xs text-emerald-300 font-medium">Tschechien 🇨🇿</span>
                <p className="text-base font-bold text-emerald-400 mt-1">{costCZ} €</p>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">~{priceCZ.toFixed(2)} € / L</p>
                <div className="mt-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-[10px] text-emerald-300 font-bold">
                  -{savingsCZ} €
                </div>
              </div>

              {/* Kroatien */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 text-center relative overflow-hidden">
                <span className="text-xs text-cyan-300 font-medium">Kroatien 🇭🇷</span>
                <p className="text-base font-bold text-cyan-400 mt-1">{costHR} €</p>
                <p className="text-[11px] text-cyan-300/80 mt-0.5">~{priceHR.toFixed(2)} € / L</p>
                <div className="mt-1.5 px-2 py-0.5 rounded-lg bg-cyan-500/20 text-[10px] text-cyan-300 font-bold">
                  -{savingsHR} €
                </div>
              </div>
            </div>

            {/* Strategische Tank-Empfehlung */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <TrendingDown className="w-4 h-4" />
                <span>Strategische Tank-Empfehlung für die Fahrt:</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>
                  <strong className="text-white">Vor der Grenze nicht volltanken:</strong> In Deutschland nur so viel tanken wie nötig.
                </li>
                <li>
                  <strong className="text-white">Tanken in Tschechien:</strong> An der Autobahn D7 kurz vor dem Flughafen Prag (oder bei GO parking) volltanken spart ca. <strong className="text-emerald-400">{savingsCZ} €</strong>!
                </li>
                <li>
                  <strong className="text-white">In Kroatien:</strong> Staatlich regulierte Preise bei <strong className="text-cyan-300">INA oder Petrol</strong> im Landesinneren nutzen (Autobahnraststätten meiden).
                </li>
              </ul>
            </div>

            {/* Arbitrage & Spar-Vorteile in Kroatien */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                Preiswerte Produkte & Schnäppchen vor Ort
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Croissant className="w-3.5 h-3.5" />
                    <span>Bäckerei Golub (Zadar)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Großer frischer Burek mit Fleisch/Käse für ~2,20 € – bis zu <strong className="text-white">60% günstiger</strong> als in Deutschland.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Pill className="w-3.5 h-3.5" />
                    <span>Reiseapotheke (Ljekarna)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Schmerzmittel (Ibuprofen, Paracetamol) und Elektrolyte oft <strong className="text-white">30–50% günstiger</strong> rezeptfrei erhältlich.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-950/80 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Schließen
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
