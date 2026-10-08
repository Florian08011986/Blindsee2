/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Square, X, Sparkles, Check, RotateCcw, Luggage } from 'lucide-react';

interface PackItem {
  id: string;
  category: 'Papiere & Maut' | 'Kroatien-Specials' | 'Strand & Baden' | 'Kleidung & Alltag' | 'Gesundheit & Technik';
  label: string;
  hint?: string;
  checked: boolean;
}

const DEFAULT_PACKLIST: PackItem[] = [
  // Papiere & Maut
  { id: 'pass', category: 'Papiere & Maut', label: 'Reisepass / Personalausweis (mind. 3 Monate gültig)', checked: false },
  { id: 'krankenkasse', category: 'Papiere & Maut', label: 'Europäische Krankenversicherungskarte (EHIC)', checked: false },
  { id: 'vignette', category: 'Papiere & Maut', label: 'Vignetten (Österreich / Slowenien digital vorbuchen)', checked: false },
  { id: 'maut_enc', category: 'Papiere & Maut', label: 'Kroatische Autobahnmaut (Kreditkarte oder ENC-Mautbox)', checked: false },
  { id: 'fuehrerschein', category: 'Papiere & Maut', label: 'Führerschein & Grüne Versicherungskarte', checked: false },

  // Kroatien-Specials
  { id: 'badeschuhe', category: 'Kroatien-Specials', label: 'Badeschuhe / Neoprenschuhe (wichtig wegen Seeigeln & Felsen)', checked: false },
  { id: 'schnorchel', category: 'Kroatien-Specials', label: 'Schnorchelset & Taucherbrille (kristallklares Adria-Wasser)', checked: false },
  { id: 'strandmatte', category: 'Kroatien-Specials', label: 'Gepolsterte Liegematte (für Kiesel- & Felsstrände)', checked: false },
  { id: 'euro_bargeld', category: 'Kroatien-Specials', label: 'Etwas Euro-Bargeld (für kleine Stände, Parkplätze & Eis)', checked: false },

  // Gesundheit & Technik
  { id: 'sonnencreme', category: 'Gesundheit & Technik', label: 'Sonnencreme LSF 30-50 & After-Sun-Lotion', checked: false },
  { id: 'mueckenschutz', category: 'Gesundheit & Technik', label: 'Mückenspray & Fenistil-Gel', checked: false },
  { id: 'powerbank', category: 'Gesundheit & Technik', label: 'Powerbank für Kamera- & Maps-Nutzung unterwegs', checked: false },
  { id: 'reiseapotheke', category: 'Gesundheit & Technik', label: 'Reiseapotheke (Ibuprofen, Elektrolyte, Pflaster)', checked: false },

  // Strand & Baden
  { id: 'strandtuch', category: 'Strand & Baden', label: 'Große Strandtücher & Mikrofaser-Handtücher', checked: false },
  { id: 'sonnenbrille', category: 'Strand & Baden', label: 'Polarisierte Sonnenbrille & Sonnenhut/Cap', checked: false },
  { id: 'drybag', category: 'Strand & Baden', label: 'Wasserdichter Dry-Bag (für Bootstouren & SUP)', checked: false },
];

const STORAGE_KEY = 'kroatien_packlist_state';

interface PacklistWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  assistantName: string;
}

export const PacklistWidget: React.FC<PacklistWidgetProps> = ({ isOpen, onClose, assistantName }) => {
  const [items, setItems] = useState<PackItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PACKLIST;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const resetAll = () => {
    setItems(DEFAULT_PACKLIST.map((it) => ({ ...it, checked: false })));
  };

  if (!isOpen) return null;

  const checkedCount = items.filter((it) => it.checked).length;
  const progressPercent = Math.round((checkedCount / items.length) * 100);

  const categories = Array.from(new Set(items.map((it) => it.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-950 border border-white/20 shadow-2xl text-white overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white text-black font-bold shadow-md">
              <Luggage className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Florians Kroatien-Packliste</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  {assistantName}
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                {checkedCount} von {items.length} erledigt ({progressPercent} %)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={resetAll}
              title="Alle Markierungen zurücksetzen"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Schließen"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 h-1.5 shrink-0">
          <div
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* List Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {categories.map((cat) => {
            const catItems = items.filter((it) => it.category === cat);
            return (
              <div key={cat} className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span>{cat}</span>
                </h4>
                <div className="space-y-1.5">
                  {catItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        item.checked
                          ? 'bg-white/5 border-white/10 text-slate-400 line-through'
                          : 'bg-slate-900/80 hover:bg-slate-900 border-white/15 text-white hover:border-white/30'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 text-cyan-400">
                        {item.checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-medium leading-relaxed">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/40 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Tipp: Sag dem Assistenten einfach <em>„Packliste anzeigen“</em>.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Fertig
          </button>
        </div>
      </motion.div>
    </div>
  );
};
