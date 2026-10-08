/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Send,
  Sparkles,
  X,
  Compass,
  MapPin,
  Clock,
  Euro,
  Fuel,
  Phone,
  Play,
  RotateCcw,
  BookOpen,
  Route,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Landmark } from '../utils';
import { askGemini } from '../geminiClient';
import { renderChatMarkdown } from '../chatMarkdown';

interface PredefinedAction {
  id: string;
  label: string;
  glyph: string;
  prompt: string;
  categoryToActivate?: string;
}

export const PREDEFINED_ACTIONS: PredefinedAction[] = [
  {
    id: 'sehenswuerdigkeiten',
    label: 'Sehenswürdigkeiten im 25 km Umkreis anzeigen',
    glyph: '🏛️',
    prompt: 'Zeige mir die wichtigsten historischen Sehenswürdigkeiten und UNESCO-Stätten im Umkreis von 25 km mit spannenden Details.',
    categoryToActivate: 'Sehenswürdigkeiten'
  },
  {
    id: 'attraktionen',
    label: 'Attraktionen & Aussichtspunkte anzeigen',
    glyph: '🎡',
    prompt: 'Welche Attraktionen, Panoramablicke und Highlights gibt es im Umkreis von 25 km?',
    categoryToActivate: 'Attraktionen'
  },
  {
    id: 'seen',
    label: 'Seen, Wasserfälle & Gewässer anzeigen',
    glyph: '💧',
    prompt: 'Welche Seen, Wasserfälle oder Naturseen befinden sich in unserer Region (25 km Umkreis)?',
    categoryToActivate: 'Seen & Gewässer'
  },
  {
    id: 'berge',
    label: 'Berge & Aussichtsgipfel anzeigen',
    glyph: '⛰️',
    prompt: 'Welche Berggipfel, Wanderberge und Panoramagrate kann ich hier in der Region erkunden?',
    categoryToActivate: 'Berge'
  },
  {
    id: 'straende',
    label: 'Schöne Strände in der Nähe finden',
    glyph: '🏖️',
    prompt: 'Welche Strände (Kies, Sand oder Felsbuchten) sind im 25 km Umkreis am schönsten?',
    categoryToActivate: 'Strände'
  },
  {
    id: 'tankstelle',
    label: 'Tankstelle finden (mit aktuellen Benzinpreisen)',
    glyph: '⛽',
    prompt: 'Finde die nächste Tankstelle mit aktuellen Benzinpreisen (Super 95, Diesel) und 24h-Service.',
    categoryToActivate: 'Tankstellen'
  },
  {
    id: 'krankenhaus',
    label: 'Krankenhaus / 24h-Notaufnahme finden',
    glyph: '🏥',
    prompt: 'Wo ist das nächste Krankenhaus oder die Notaufnahme mit 24/7 Notdienst und Notrufnummern?',
    categoryToActivate: 'Krankenhäuser'
  },
  {
    id: 'apotheke',
    label: 'Apotheke finden (mit Öffnungszeiten & Notdienst)',
    glyph: '💊',
    prompt: 'Finde die nächste Apotheke mit aktuellen Öffnungszeiten und Nachtnotdienst.',
    categoryToActivate: 'Apotheken'
  },
  {
    id: 'polizei',
    label: 'Polizeirevier in der Nähe finden',
    glyph: '👮',
    prompt: 'Wo befindet sich die zuständige Polizeidienststelle mit Notruf 192?',
    categoryToActivate: 'Polizeireviere'
  },
  {
    id: 'thermen',
    label: 'Thermen & Schwimmbäder (mit Preisen & Öffnungszeiten)',
    glyph: '🏊',
    prompt: 'Welche Hallenbäder, Thermalbäder oder Schwimmbäder gibt es in der Region inklusive Eintrittspreisen und Öffnungszeiten?',
    categoryToActivate: 'Schwimmbäder & Thermen'
  },
  {
    id: 'freizeitparks',
    label: 'Freizeitparks & Attraktionen für Kinder (Preise & Zeiten)',
    glyph: '🎢',
    prompt: 'Welche Freizeitparks, Aquaparks oder Erlebnisse für Kinder gibt es hier mit Eintrittspreisen und Öffnungszeiten?',
    categoryToActivate: 'Freizeitparks'
  },
  {
    id: 'erzaehlung',
    label: 'Spannende Geschichten & Details zu diesem Ort erzählen',
    glyph: '📖',
    prompt: 'Erzähle mir eine spannende, historische Geschichte und Insidertipps zu unserem aktuellen Aufenthaltsort in Kroatien.'
  },
  {
    id: 'tour-plan',
    label: 'Plane eine abwechslungsreiche Tagestour für mich',
    glyph: '🗺️',
    prompt: 'Plane mir eine logische Tagestour mit 3 bis 4 Stationen (Kultur, Natur, Baden und Gastronomie) in dieser Region.'
  }
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

interface GeminiBottomChatProps {
  currentLocationName: string;
  currentLocationCoords: { lat: number; lng: number };
  activeLandmark: Landmark | null;
  onClearActiveLandmark: () => void;
  onFlyToLandmark: (landmark: Landmark) => void;
  onAddToTour: (landmark: Landmark) => void;
  onActivateCategory: (categoryName: string) => void;
}

export const GeminiBottomChat: React.FC<GeminiBottomChatProps> = ({
  currentLocationName,
  currentLocationCoords,
  activeLandmark,
  onClearActiveLandmark,
  onFlyToLandmark,
  onAddToTour,
  onActivateCategory
}) => {
  const [inputText, setInputText] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatOverlayOpen, setIsChatOverlayOpen] = useState(false);
  const [isDetailCardFolded, setIsDetailCardFolded] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat when history updates
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isChatOverlayOpen]);

  // Send prompt to Gemini backend
  const handleSendPrompt = async (promptToSend: string) => {
    const trimmed = promptToSend.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setInputText('');
    setIsPlusMenuOpen(false);
    setIsChatOverlayOpen(true);
    setIsLoading(true);

    try {
      const replyText =
        (await askGemini({
          prompt: trimmed,
          location: {
            name: currentLocationName,
            lat: currentLocationCoords.lat,
            lng: currentLocationCoords.lng
          },
          history: chatHistory.slice(-4).map((m) => ({
            role: m.sender === 'user' ? ('user' as const) : ('model' as const),
            text: m.text
          }))
        })) || 'Antwort konnte nicht geladen werden.';

      const geminiMessage: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: 'gemini',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory((prev) => [...prev, geminiMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'gemini',
        text: 'Entschuldigung, Verbindung zum KI-Reisebegleiter fehlgeschlagen. Bitte prüfe die Internetverbindung.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPredefined = (action: PredefinedAction) => {
    if (action.categoryToActivate) {
      onActivateCategory(action.categoryToActivate);
    }

    let finalPrompt = action.prompt;
    if (action.id === 'erzaehlung' && activeLandmark) {
      finalPrompt = `Erzähle mir eine fesselnde historische Geschichte, Anekdoten und praktische Tipps zu "${activeLandmark.name}" in Kroatien.`;
    }

    handleSendPrompt(finalPrompt);
  };

  return (
    <div className="absolute bottom-3 inset-x-0 z-40 pointer-events-none flex flex-col items-center justify-end px-3 select-none">
      <div className="w-full max-w-xl flex flex-col items-stretch space-y-2">
        {/* ACTIVE POI DETAIL CARD (Docks directly above bottom input) */}
        <AnimatePresence>
          {activeLandmark && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto rounded-2xl bg-slate-900/95 text-white backdrop-blur-xl border border-white/15 shadow-2xl p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">{activeLandmark.glyph || '📍'}</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                      {activeLandmark.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 font-medium">
                      <span>{activeLandmark.category}</span>
                      {activeLandmark.distanceKm !== undefined && (
                        <span>• ca. {activeLandmark.distanceKm} km entfernt</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setIsDetailCardFolded(!isDetailCardFolded)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                    title={isDetailCardFolded ? 'Details ausklappen' : 'Details einklappen'}
                  >
                    {isDetailCardFolded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={onClearActiveLandmark}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                    title="Schließen"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Expandable Details (Prices, Opening hours, Petrol, Highlights) */}
              {!isDetailCardFolded && (
                <div className="space-y-2 text-xs pt-1 border-t border-white/10">
                  <p className="text-[11px] text-slate-300 leading-relaxed max-h-[60px] overflow-y-auto scrollbar-thin">
                    {activeLandmark.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                    {activeLandmark.openingHours && (
                      <div className="flex items-start gap-1.5 p-1.5 rounded-lg bg-white/5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-white">Öffnungszeiten:</span>
                          <span>{activeLandmark.openingHours}</span>
                        </div>
                      </div>
                    )}

                    {activeLandmark.prices && (
                      <div className="flex items-start gap-1.5 p-1.5 rounded-lg bg-white/5 text-slate-300">
                        <Euro className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-white">Preise & Eintritt:</span>
                          <span>{activeLandmark.prices}</span>
                        </div>
                      </div>
                    )}

                    {activeLandmark.fuelPrices && (
                      <div className="flex items-start gap-1.5 p-1.5 rounded-lg bg-white/5 text-slate-300 sm:col-span-2">
                        <Fuel className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="w-full">
                          <span className="font-semibold block text-white">Aktuelle Spritpreise:</span>
                          <div className="flex items-center gap-3 mt-0.5 font-mono text-[10px]">
                            <span className="text-emerald-300">Super 95: {activeLandmark.fuelPrices.super95}</span>
                            <span className="text-blue-300">Diesel: {activeLandmark.fuelPrices.diesel}</span>
                            {activeLandmark.fuelPrices.lpg && (
                              <span className="text-amber-300">LPG: {activeLandmark.fuelPrices.lpg}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeLandmark.contact && (
                      <div className="flex items-start gap-1.5 p-1.5 rounded-lg bg-white/5 text-slate-300 sm:col-span-2">
                        <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-white">Kontakt / Notruf:</span>
                          <span>{activeLandmark.contact}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions for this Landmark */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => onFlyToLandmark(activeLandmark)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Im 3D-Flug ranzoomen</span>
                    </button>

                    <button
                      onClick={() => onAddToTour(activeLandmark)}
                      className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Zur Tour</span>
                    </button>

                    <button
                      onClick={() => {
                        handleSendPrompt(
                          `Erzähle mir spannende Geschichten, Hintergrundwissen und Insidertipps zu ${activeLandmark.name}.`
                        );
                      }}
                      className="py-1.5 px-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>KI-Erzähler</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CHAT MESSAGES MODAL / OVERLAY */}
        <AnimatePresence>
          {isChatOverlayOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="pointer-events-auto rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl p-3 flex flex-col max-h-[300px] sm:max-h-[360px]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-xs text-white">Gemini Kroatien-Reisebegleiter</span>
                </div>
                <button
                  onClick={() => setIsChatOverlayOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div ref={chatScrollRef} className="flex-1 overflow-y-auto py-2 space-y-2.5 scrollbar-thin">
                {chatHistory.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-4">
                    Stelle eine Frage oder wähle eine Aktion über das Plus (+) links unten!
                  </p>
                ) : (
                  chatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[88%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-cyan-600 text-white rounded-br-xs'
                            : 'bg-white/10 text-slate-100 rounded-bl-xs border border-white/10'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.sender === 'gemini' ? renderChatMarkdown(msg.text) : msg.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 px-1 mt-0.5">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-cyan-300 py-1">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Gemini recherchiert für dich...</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PLUS POPUP MENU WITH PREDEFINED FUNCTIONS */}
        <AnimatePresence>
          {isPlusMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              className="pointer-events-auto rounded-2xl bg-slate-900/98 backdrop-blur-xl border border-white/15 shadow-2xl p-2 max-h-[320px] overflow-y-auto scrollbar-thin space-y-1"
            >
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400 border-b border-white/10 mb-1 flex items-center justify-between">
                <span>Vordefinierte Reisefunktionen</span>
                <span className="text-slate-400 font-normal">Als Prompt maskiert</span>
              </div>

              {PREDEFINED_ACTIONS.map((act) => (
                <button
                  key={act.id}
                  onClick={() => handleSelectPredefined(act)}
                  className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-left text-xs transition-colors flex items-center gap-2.5 cursor-pointer text-slate-200 hover:text-white"
                >
                  <span className="text-base shrink-0">{act.glyph}</span>
                  <span className="truncate font-medium">{act.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* THE MAIN BOTTOM CHAT INPUT BAR */}
        <div className="pointer-events-auto w-full p-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center gap-1.5 transition-all">
          {/* Plus Button */}
          <button
            onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md ${
              isPlusMenuOpen
                ? 'bg-cyan-500 text-slate-950 rotate-45'
                : 'bg-white/10 hover:bg-white/20 text-cyan-400 hover:text-cyan-300'
            }`}
            title="Vordefinierte Funktionen & Prompts öffnen"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendPrompt(inputText);
              }
            }}
            placeholder="Frag deinen Kroatien-Reisebegleiter oder nutze das Plus (+)..."
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder-slate-400 px-2 min-w-0"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendPrompt(inputText)}
            disabled={!inputText.trim() || isLoading}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              inputText.trim() && !isLoading
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md active:scale-95'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
            }`}
            title="Nachricht an Gemini senden"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
