/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  X,
  Search,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  Tag,
  RotateCcw,
  Check
} from 'lucide-react';
import {
  MemoryRecord,
  MemoryCategory,
  getAllMemories,
  addMemory,
  deleteMemory,
  resetMemoriesToDefault,
  queryRAGMemories
} from '../memoryRAG';

interface MemoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assistantName: string;
  userName: string;
}

const CATEGORY_LABELS: Record<MemoryCategory, { label: string; color: string }> = {
  praeferenz: { label: 'Präferenz', color: 'bg-purple-500/20 text-purple-300 border-purple-400/30' },
  unterkunft: { label: 'Unterkunft', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' },
  aktivitaet: { label: 'Aktivität', color: 'bg-amber-500/20 text-amber-300 border-amber-400/30' },
  reisedaten: { label: 'Reisedaten', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' },
  packliste: { label: 'Packliste', color: 'bg-pink-500/20 text-pink-300 border-pink-400/30' },
  florian_tipps: { label: 'Florians Tipp', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30' },
  allgemein: { label: 'Notiz', color: 'bg-slate-500/20 text-slate-300 border-slate-400/30' }
};

export const MemoryManagerModal: React.FC<MemoryManagerModalProps> = ({
  isOpen,
  onClose,
  assistantName,
  userName
}) => {
  const [memories, setMemories] = useState<MemoryRecord[]>(() => getAllMemories());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newText, setNewText] = useState<string>('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('allgemein');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const created = addMemory(newText, newCategory);
    setMemories(getAllMemories());
    setNewText('');
    setIsAdding(false);
    showToast(`Erinnerung gespeichert!`);
  };

  const handleDelete = (id: string) => {
    deleteMemory(id);
    setMemories(getAllMemories());
    showToast(`Eintrag entfernt.`);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Möchtest du das gemeinsame Gedächtnis auf Florians Standard-Wissen zurücksetzen?')) {
      const reset = resetMemoriesToDefault();
      setMemories(reset);
      showToast('Auf Florians Wissens-Standard zurückgesetzt.');
    }
  };

  // Live RAG-Vektorsuche oder chronologische Liste
  const displayList = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) {
      return memories.map((m) => ({ memory: m, score: null }));
    }
    const ragResults = queryRAGMemories(q, 10, 0.05);
    return ragResults.map((r) => ({ memory: r.memory, score: r.score }));
  }, [memories, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-950 border border-white/20 shadow-2xl text-white overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500 text-white font-black shadow-lg shadow-purple-500/20">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Gemeinsames Gedächtnis (RAG)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Vektor-Speicher
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Wissensabgleich für {userName} • Von {assistantName} für Antworten genutzt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Search Bar */}
        <div className="p-4 border-b border-white/10 bg-slate-900/40 space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Semantisch im Vektor-Gedächtnis suchen (z.B. 'Seeigel', 'Split', 'Sprit')..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-white/20 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Erinnerung hinzufügen</span>
            </button>
          </div>

          {/* Formular für neue Erinnerung */}
          <AnimatePresence>
            {isAdding && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAdd}
                className="space-y-2 pt-2 border-t border-white/10"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Was soll sich der Reisebegleiter merken? (z.B. Hotelname, Vorlieben...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-purple-500/50 text-xs text-white placeholder-slate-400 outline-none focus:border-purple-400"
                    autoFocus
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-white/20 text-xs text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="unterkunft">Unterkunft</option>
                    <option value="praeferenz">Präferenz</option>
                    <option value="aktivitaet">Aktivität</option>
                    <option value="reisedaten">Reisedaten</option>
                    <option value="packliste">Packliste</option>
                    <option value="florian_tipps">Florians Tipp</option>
                    <option value="allgemein">Allgemein</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow"
                  >
                    Speichern &amp; Einbetten
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-purple-500/90 text-white text-xs px-4 py-2 font-medium flex items-center justify-between"
            >
              <span>{toastMessage}</span>
              <Check className="w-3.5 h-3.5" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Memory List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 text-xs">
          {displayList.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Brain className="w-8 h-8 mx-auto text-slate-600" />
              <p>Keine passenden Erinnerungen gefunden.</p>
            </div>
          ) : (
            displayList.map(({ memory, score }) => {
              const meta = CATEGORY_LABELS[memory.category] || CATEGORY_LABELS.allgemein;
              return (
                <div
                  key={memory.id}
                  className="p-3 sm:p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${meta.color}`}>
                        {meta.label}
                      </span>
                      {score !== null && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono">
                          Relevanz: {(score * 100).toFixed(0)}%
                        </span>
                      )}
                      {memory.isDefault && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-cyan-400" />
                          <span>Standard-Vorgabe</span>
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 text-xs sm:text-[13px] leading-relaxed break-words">
                      {memory.text}
                    </p>
                  </div>

                  {!memory.isDefault && (
                    <button
                      onClick={() => handleDelete(memory.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                      title="Erinnerung löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{memories.length} Vektor-Einträge aktiv im RAG-Speicher</span>
          </div>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer"
            title="Auf Florians Standard-Wissen zurücksetzen"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Zurücksetzen</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
