/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckSquare, Square, X, RotateCcw, Luggage } from 'lucide-react';

export type PackCategory =
  | 'Wichtiges & Papiere'
  | 'Anziehsachen & Draußen'
  | 'Badsachen & Pflege'
  | 'Baden & Schlafen'
  | 'Beschäftigung, Sonstiges & Werkzeug'
  | 'To-Do vor der Abreise';

export interface PackItem {
  id: string;
  category: PackCategory;
  label: string;
  hint?: string;
  checked: boolean;
}

export const FLORIAN_PACKLIST: PackItem[] = [
  // 1. Wichtiges & Papiere
  { id: 'ausweis', category: 'Wichtiges & Papiere', label: 'Personalausweis', checked: false },
  { id: 'portmonee', category: 'Wichtiges & Papiere', label: 'Portmonee mit Geld', checked: false },
  { id: 'krankenkasse', category: 'Wichtiges & Papiere', label: 'Krankenkassenkarte', checked: false },
  { id: 'handy', category: 'Wichtiges & Papiere', label: 'Handy', checked: false },
  { id: 'ladekabel', category: 'Wichtiges & Papiere', label: 'Ladekabel', checked: false },
  { id: 'powerbank', category: 'Wichtiges & Papiere', label: 'Externer Akku oder 2?', checked: false },
  { id: 'kopfhoerer', category: 'Wichtiges & Papiere', label: 'Kopfhörer?', checked: false },
  { id: 'raucherzeug', category: 'Wichtiges & Papiere', label: 'Raucher Zeug', checked: false },
  { id: 'bauchtasche', category: 'Wichtiges & Papiere', label: 'Deine kleine Bauchtasche?', checked: false },

  // 2. Anziehsachen & Draußen
  { id: 'unterhosen', category: 'Anziehsachen & Draußen', label: 'Unterhosen', checked: false },
  { id: 'socken', category: 'Anziehsachen & Draußen', label: 'Socken', checked: false },
  { id: 'tshirts', category: 'Anziehsachen & Draußen', label: 'T-Shirts', checked: false },
  { id: 'pullover', category: 'Anziehsachen & Draußen', label: 'Pullover', checked: false },
  { id: 'hosen', category: 'Anziehsachen & Draußen', label: 'Hosen', checked: false },
  { id: 'kurze_hosen', category: 'Anziehsachen & Draußen', label: 'Kurze Hosen', checked: false },
  { id: 'sonnenbrille', category: 'Anziehsachen & Draußen', label: 'Sonnenbrille', checked: false },
  { id: 'duenne_jacke', category: 'Anziehsachen & Draußen', label: 'Dünne Jacke', checked: false },
  { id: 'wechselschuhe', category: 'Anziehsachen & Draußen', label: 'Wechselschuhe?', checked: false },

  // 3. Badsachen & Pflege
  { id: 'zahnbuerste', category: 'Badsachen & Pflege', label: 'Zahnbürste', checked: false },
  { id: 'zahnpasta', category: 'Badsachen & Pflege', label: 'Zahnpasta', checked: false },
  { id: 'duschgel', category: 'Badsachen & Pflege', label: 'Duschgel', checked: false },
  { id: 'shampoo', category: 'Badsachen & Pflege', label: 'Shampoo', checked: false },
  { id: 'deo', category: 'Badsachen & Pflege', label: 'Deo', checked: false },
  {
    id: 'haarspray',
    category: 'Badsachen & Pflege',
    label: 'Haarspray (Flaschen unter 150 ml; 2.-6. gern von uns mitnutzen)',
    checked: false
  },
  { id: 'haar_buerste', category: 'Badsachen & Pflege', label: 'Haarbürste', checked: false },
  { id: 'medizin', category: 'Badsachen & Pflege', label: 'Medizin?', checked: false },
  { id: 'nagelknipser', category: 'Badsachen & Pflege', label: 'Nagelknipser?', checked: false },

  // 4. Baden & Schlafen
  { id: 'badehose', category: 'Baden & Schlafen', label: 'Badehose', checked: false },
  {
    id: 'badeschuhe_schwarz',
    category: 'Baden & Schlafen',
    label: 'Badeschuhe, z. B. die schwarzen, mit denen du ins Wasser gehen kannst',
    checked: false
  },
  { id: 'mini_handtuch', category: 'Baden & Schlafen', label: 'Mini Handtuch?', checked: false },
  { id: 'schlafanzug', category: 'Baden & Schlafen', label: 'Schlafanzug? Kurzer?', checked: false },

  // 5. Beschäftigung, Sonstiges & Werkzeug
  { id: 'buch', category: 'Beschäftigung, Sonstiges & Werkzeug', label: 'Buch?', checked: false },
  { id: 'trinkflasche', category: 'Beschäftigung, Sonstiges & Werkzeug', label: 'Trinkflasche?', checked: false },
  { id: 'lochsage', category: 'Beschäftigung, Sonstiges & Werkzeug', label: 'Lochsäge (Zusätzlich dran denken)', checked: false },

  // 6. To-Do vor der Abreise
  { id: 'blumen', category: 'To-Do vor der Abreise', label: 'Blumen gießen', checked: false },
  { id: 'flaschen', category: 'To-Do vor der Abreise', label: 'Offene Flaschen wegbringen', checked: false },
  { id: 'muell', category: 'To-Do vor der Abreise', label: 'Müll rausbringen', checked: false },
  { id: 'balkon', category: 'To-Do vor der Abreise', label: 'Alles auf Balkon regensicher?', checked: false }
];

const STORAGE_KEY = 'kroatien_packlist_florian_v3';

interface PacklistWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  assistantName: string;
}

export const PacklistWidget: React.FC<PacklistWidgetProps> = ({ isOpen, onClose, assistantName }) => {
  const [items, setItems] = useState<PackItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return FLORIAN_PACKLIST;
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
    setItems(FLORIAN_PACKLIST.map((it) => ({ ...it, checked: false })));
  };

  if (!isOpen) return null;

  const checkedCount = items.filter((it) => it.checked).length;
  const progressPercent = Math.round((checkedCount / items.length) * 100);

  const categories: PackCategory[] = [
    'Wichtiges & Papiere',
    'Anziehsachen & Draußen',
    'Badsachen & Pflege',
    'Baden & Schlafen',
    'Beschäftigung, Sonstiges & Werkzeug',
    'To-Do vor der Abreise'
  ];

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
            if (catItems.length === 0) return null;
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
