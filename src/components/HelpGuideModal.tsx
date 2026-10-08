/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  X,
  HelpCircle,
  Sparkles,
  Compass,
  Phone,
  Key,
  RotateCcw,
  BookOpen,
  MapPin,
  Luggage,
  Navigation,
  Brain
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  assistantName: string;
  onRestartIntro: () => void;
  onOpenApiKeyModal: () => void;
  onOpenPacklist: () => void;
  onOpenMemory: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  userName,
  assistantName,
  onRestartIntro,
  onOpenApiKeyModal,
  onOpenPacklist,
  onOpenMemory
}) => {
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
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500 text-slate-950 font-black shadow-md">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Hilfe &amp; KI-Befehlskatalog</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  {assistantName} 🇭🇷
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Gesteuert für {userName || 'dich'} • 100 % Konversationell
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Schließen"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-200">
          {/* 1. App-Konzept */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Das neue Konzept: Keine verschachtelten Menüs mehr!</span>
            </h4>
            <p className="leading-relaxed text-slate-300 text-xs">
              Diese App verzichtet bewusst auf starre Menüleisten und Schieberegler. Dein persönlicher Assistent{' '}
              <strong className="text-white">{assistantName}</strong> übernimmt alle Funktionen
              vollständig über natürliche Sprache. Sag ihm einfach im Chat unten, was du sehen, wissen
              oder erleben möchtest!
            </p>
          </div>

          {/* 2. Befehlskatalog (Cheat-Sheet) */}
          <div className="space-y-3">
            <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-xs flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Befehls-Katalog (Beispiel-Prompts für den Chat)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-white block">🦅 3D-Kameraflüge</span>
                <p className="text-[11px] text-slate-300 italic">„Flieg nach Dubrovnik“</p>
                <p className="text-[11px] text-slate-300 italic">„Zeig mir Rovinj von oben“</p>
                <p className="text-[11px] text-slate-300 italic">„Kameraflug zu den Krka-Wasserfällen“</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-white block">🏖️ Strände &amp; Buchten</span>
                <p className="text-[11px] text-slate-300 italic">„Zeig mir Strände im 20 km Umkreis“</p>
                <p className="text-[11px] text-slate-300 italic">„Wo gibt es ruhige Felsbuchten?“</p>
                <p className="text-[11px] text-slate-300 italic">„Gibt es hier Sandstrände?“</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-white block">🎒 Packliste &amp; Vorbereitung</span>
                <p className="text-[11px] text-slate-300 italic">„Packliste öffnen“</p>
                <p className="text-[11px] text-slate-300 italic">„Was brauche ich für Kroatien?“</p>
                <p className="text-[11px] text-slate-300 italic">„Erinnere mich an Badeschuhe &amp; Maut“</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-white block">⛽ Infrastruktur &amp; Notfall</span>
                <p className="text-[11px] text-slate-300 italic">„Nächste Tankstelle mit Spritpreisen“</p>
                <p className="text-[11px] text-slate-300 italic">„Wo ist das nächste Krankenhaus?“</p>
                <p className="text-[11px] text-slate-300 italic">„Apotheke mit 24h Notdienst“</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-white block">🚗 Geführte Touren</span>
                <p className="text-[11px] text-slate-300 italic">„Starte die Altstadt-Tour“</p>
                <p className="text-[11px] text-slate-300 italic">„Plane eine Tagesroute für Istrien“</p>
                <p className="text-[11px] text-slate-300 italic">„Nächster Tour-Stopp“</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-1">
                <span className="text-xs font-bold text-purple-300 block">🧠 Gemeinsames Gedächtnis (RAG)</span>
                <p className="text-[11px] text-slate-300 italic">„Merke dir: Wir wohnen im Hotel Park Split“</p>
                <p className="text-[11px] text-slate-300 italic">„Zeige mein Gedächtnis“</p>
                <p className="text-[11px] text-slate-300 italic">„Welche Tipps hat Florian für mich?“</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-white block">🗺️ Kartenansicht wechseln</span>
                <p className="text-[11px] text-slate-300 italic">„Schalte auf Satellitenkarte um“</p>
                <p className="text-[11px] text-slate-300 italic">„Zurück zur 3D-Kartenansicht“</p>
                <p className="text-[11px] text-slate-300 italic">„Setze Suchradius auf 30 km“</p>
              </div>
            </div>
          </div>

          {/* 3. 3D Gestensteuerung */}
          <div className="space-y-2">
            <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-xs flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              <span>Gestensteuerung für die photorealistische 3D-Karte</span>
            </h4>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2 text-xs">
              <p>• <strong>Verschieben / Pan:</strong> Mit 1 Finger über die Karte wischen.</p>
              <p>• <strong>Zoom:</strong> Mit 2 Fingern zusammenziehen oder auseinanderziehen.</p>
              <p>• <strong>Neigen / Tilt:</strong> Mit 2 Fingern parallel nach oben oder unten wischen.</p>
              <p>• <strong>Drehen / Heading:</strong> Mit 2 Fingern kreisförmig rotieren.</p>
            </div>
          </div>

          {/* 4. Notrufnummern Kroatien */}
          <div className="space-y-2">
            <h4 className="font-bold text-rose-400 uppercase tracking-wider text-xs flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>Wichtige Notrufnummern in Kroatien (Gebührenfrei)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/30">
                <strong className="block text-white">Allgemeiner Notruf</strong>
                <span className="text-rose-400 font-bold text-sm">112</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/30">
                <strong className="block text-white">Polizei (Policija)</strong>
                <span className="text-rose-400 font-bold text-sm">192</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/30">
                <strong className="block text-white">Rettungsdienst (Hitna)</strong>
                <span className="text-rose-400 font-bold text-sm">194</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/30">
                <strong className="block text-white">Feuerwehr (Vatrogasci)</strong>
                <span className="text-rose-400 font-bold text-sm">193</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30">
                <strong className="block text-white">Seenotrettung</strong>
                <span className="text-cyan-400 font-bold text-sm">195</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30">
                <strong className="block text-white">Pannenhilfe (HAK)</strong>
                <span className="text-amber-400 font-bold text-sm">1987</span>
              </div>
            </div>
          </div>

          {/* 5. Aktionen & Schnelleinstellungen */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                onClose();
                onOpenMemory();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              <Brain className="w-4 h-4" />
              <span>Gedächtnis (RAG) öffnen</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenPacklist();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              <Luggage className="w-4 h-4" />
              <span>Packliste öffnen</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onRestartIntro();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Namen &amp; Begrüßung neu starten</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenApiKeyModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>API-Schlüssel</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
