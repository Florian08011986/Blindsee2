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
  ChevronDown,
  Luggage,
  Navigation
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
  isPacklistAction?: boolean;
  isHelpAction?: boolean;
}

export const PREDEFINED_ACTIONS: PredefinedAction[] = [
  {
    id: 'hilf-funktionen',
    label: 'Hilf mir mit deinen Funktionen',
    glyph: 'ℹ️',
    prompt: 'Hilf mir mit deinen Funktionen',
    isHelpAction: true
  },
  {
    id: 'packliste',
    label: 'Kroatien-Packliste öffnen & prüfen',
    glyph: '🎒',
    prompt: 'Lass uns die Packliste für den Kroatien-Urlaub durchgehen (Badeschuhe gegen Seeigel, Mautbox, Unterlagen).',
    isPacklistAction: true
  },
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
    id: 'straende',
    label: 'Schöne Strände & Felsbuchten finden',
    glyph: '🏖️',
    prompt: 'Welche Strände (Kies, Sand oder Felsbuchten) sind im 25 km Umkreis am schönsten?',
    categoryToActivate: 'Strände'
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
    id: 'tankstelle',
    label: 'Tankstelle finden (mit aktuellen Spritpreisen)',
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
    id: 'tour-plan',
    label: '3D-Tour durch historische Altstadt starten',
    glyph: '🗺️',
    prompt: 'Starte eine geführte 3D-Tour für mich durch die Altstadt!'
  }
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  actionExecuted?: string;
}

interface GeminiBottomChatProps {
  currentLocationName: string;
  currentLocationCoords: { lat: number; lng: number };
  activeLandmark: Landmark | null;
  userName: string;
  assistantName: string;
  onClearActiveLandmark: () => void;
  onFlyToLandmark: (landmark: Landmark) => void;
  onFlyToNamedPlace: (placeName: string) => void;
  onAddToTour: (landmark: Landmark) => void;
  onActivateCategory: (categoryName: string) => void;
  onOpenPacklist: () => void;
  onOpenHelp: () => void;
  onSetMapMode: (mode: '3d' | 'satellite') => void;
  onStartTour: () => void;
}

export const GeminiBottomChat: React.FC<GeminiBottomChatProps> = ({
  currentLocationName,
  currentLocationCoords,
  activeLandmark,
  userName,
  assistantName,
  onClearActiveLandmark,
  onFlyToLandmark,
  onFlyToNamedPlace,
  onAddToTour,
  onActivateCategory,
  onOpenPacklist,
  onOpenHelp,
  onSetMapMode,
  onStartTour
}) => {
  const [inputText, setInputText] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showProactiveBanner, setShowProactiveBanner] = useState(true);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-intro-msg',
      sender: 'gemini',
      text: `Hey ${userName || 'Florian'}! Ich bin ${assistantName || 'Luka'}, dein persönlicher Reisebegleiter für Kroatien. 🇭🇷✨\n\nFrag mich jederzeit nach 3D-Flügen, Stränden, Restaurants oder Notfall-Infrastruktur – oder sag einfach: „Hilf mir mit deinen Funktionen“!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

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

  // Execute Action-Tags embedded in Gemini replies
  const processActionTags = (rawText: string): { cleanText: string; executedAction?: string } => {
    let cleanText = rawText;
    let executedAction: string | undefined;

    // 1. Hilfsdatei & Funktionen öffnen
    if (/\[ACTION:OPEN_HELP\]/i.test(cleanText)) {
      cleanText = cleanText.replace(/\[ACTION:OPEN_HELP\]/gi, '').trim();
      onOpenHelp();
      executedAction = 'ℹ️ Hilfsdatei & Funktionen geöffnet';
    }

    // 2. Packliste öffnen
    if (/\[ACTION:OPEN_PACKLIST\]/i.test(cleanText)) {
      cleanText = cleanText.replace(/\[ACTION:OPEN_PACKLIST\]/gi, '').trim();
      onOpenPacklist();
      executedAction = '🎒 Packliste geöffnet';
    }

    // 3. 3D-Kameraflug zu Ort
    const flyMatch = cleanText.match(/\[ACTION:FLY_TO:(.*?)\]/i);
    if (flyMatch) {
      const place = flyMatch[1].trim();
      cleanText = cleanText.replace(/\[ACTION:FLY_TO:(.*?)\]/gi, '').trim();
      onFlyToNamedPlace(place);
      executedAction = `🦅 3D-Flug zu ${place}`;
    }

    // 4. Tour starten
    if (/\[ACTION:START_TOUR\]/i.test(cleanText)) {
      cleanText = cleanText.replace(/\[ACTION:START_TOUR\]/gi, '').trim();
      onStartTour();
      executedAction = '🚗 3D-Tour gestartet';
    }

    // 5. Map-Mode umschalten
    const modeMatch = cleanText.match(/\[ACTION:MAP_MODE:(.*?)\]/i);
    if (modeMatch) {
      const mode = modeMatch[1].trim().toLowerCase();
      cleanText = cleanText.replace(/\[ACTION:MAP_MODE:(.*?)\]/gi, '').trim();
      if (mode.includes('sat')) {
        onSetMapMode('satellite');
        executedAction = '🛰️ Auf Satellitenmodus umgeschaltet';
      } else {
        onSetMapMode('3d');
        executedAction = '🌐 Auf 3D-Modus umgeschaltet';
      }
    }

    return { cleanText, executedAction };
  };

  // Send prompt to Gemini backend
  const handleSendPrompt = async (promptToSend: string) => {
    const trimmed = promptToSend.trim();
    if (!trimmed || isLoading) return;

    // Fast-path client intercept for help and function catalog
    const norm = trimmed.toLowerCase();
    if (
      norm.includes('hilf mir mit deinen funktionen') ||
      norm.includes('hilf mir') ||
      norm.includes('was kannst du') ||
      norm.includes('welche funktionen') ||
      norm.includes('funktionen anzeigen') ||
      norm.includes('hilfe anzeigen') ||
      norm === 'hilfe' ||
      norm === 'help'
    ) {
      onOpenHelp();
    }

    // Fast-path client intercept for packing list
    if (norm.includes('packliste') && (norm.includes('öffnen') || norm.includes('anzeigen') || norm === 'packliste')) {
      onOpenPacklist();
    }

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
      const replyRaw =
        (await askGemini({
          prompt: trimmed,
          location: {
            name: currentLocationName,
            lat: currentLocationCoords.lat,
            lng: currentLocationCoords.lng
          },
          userName,
          assistantName,
          history: chatHistory.slice(-4).map((m) => ({
            role: m.sender === 'user' ? ('user' as const) : ('model' as const),
            text: m.text
          }))
        })) || 'Antwort konnte nicht geladen werden.';

      const { cleanText, executedAction } = processActionTags(replyRaw);

      const geminiMessage: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: 'gemini',
        text: cleanText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted: executedAction
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
    if (action.isHelpAction) {
      onOpenHelp();
    }
    if (action.isPacklistAction) {
      onOpenPacklist();
    }
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
        {/* PROAKTIVER URLAUBS-COUNTDOWN & PACKLISTEN-ANSTOSS */}
        <AnimatePresence>
          {showProactiveBanner && !isChatOverlayOpen && !activeLandmark && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="pointer-events-auto p-3 rounded-2xl bg-slate-950/92 backdrop-blur-xl border border-cyan-400/40 shadow-2xl flex items-center justify-between gap-3 text-left"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0 mt-0.5">
                  <Luggage className="w-4 h-4 animate-bounce" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Noch exakt 48 Stunden bis zum Abflug! 🇭🇷</span>
                  </p>
                  <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                    Florian hat mir deine Kroatien-Packliste übergeben. Wollen wir deine Tasche zusammen packen?
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    onOpenPacklist();
                    setShowProactiveBanner(false);
                  }}
                  className="px-3 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 cursor-pointer"
                >
                  Ja, packen!
                </button>
                <button
                  onClick={() => setShowProactiveBanner(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  title="Später"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

              {/* Expandable Details */}
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
                          <span className="font-semibold block text-white">Preise &amp; Eintritt:</span>
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

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onFlyToLandmark(activeLandmark)}
                      className="flex-1 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>3D-Flug starten</span>
                    </button>
                    <button
                      onClick={() => onAddToTour(activeLandmark)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Route className="w-3.5 h-3.5" />
                      <span>Zur Tour</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* EXPANDABLE CHAT OVERLAY WINDOW */}
        <AnimatePresence>
          {isChatOverlayOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto rounded-3xl bg-slate-950/96 text-white backdrop-blur-2xl border border-white/20 shadow-2xl flex flex-col max-h-[58vh] sm:max-h-[64vh] overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-slate-900/60 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-md">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                      <span>{assistantName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/30">
                        Dein Begleiter
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Standort: {currentLocationName} (±25 km)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenPacklist()}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 text-xs flex items-center gap-1 cursor-pointer mr-1"
                    title="Packliste öffnen"
                  >
                    <Luggage className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">Packliste</span>
                  </button>
                  <button
                    onClick={() => setIsChatOverlayOpen(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Chat minimieren"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages Log */}
              <div
                ref={chatScrollRef}
                className="flex-1 p-3.5 overflow-y-auto space-y-3 scrollbar-thin select-text text-left"
              >
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-cyan-600 text-white rounded-br-xs'
                          : 'bg-white/10 text-slate-100 rounded-bl-xs border border-white/10'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">
                        {msg.sender === 'gemini' ? renderChatMarkdown(msg.text) : msg.text}
                      </p>

                      {msg.actionExecuted && (
                        <div className="mt-2 pt-2 border-t border-white/15 flex items-center gap-1.5 text-[11px] text-cyan-300 font-semibold">
                          <Sparkles className="w-3 h-3 text-cyan-300" />
                          <span>{msg.actionExecuted}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 px-1 mt-0.5">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-cyan-300 py-1">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>{assistantName} recherchiert für dich...</span>
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
              className="pointer-events-auto rounded-3xl bg-slate-900/98 backdrop-blur-xl border border-white/15 shadow-2xl p-2 max-h-[320px] overflow-y-auto scrollbar-thin space-y-1"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 border-b border-white/10 mb-1 flex items-center justify-between">
                <span>Vordefinierte Reisefunktionen</span>
                <span className="text-slate-400 font-normal">Per Klick ausführen</span>
              </div>

              {PREDEFINED_ACTIONS.map((act) => (
                <button
                  key={act.id}
                  onClick={() => handleSelectPredefined(act)}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left text-xs transition-colors flex items-center gap-2.5 cursor-pointer text-slate-200 hover:text-white"
                >
                  <span className="text-base shrink-0">{act.glyph}</span>
                  <span className="truncate font-medium">{act.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* THE MAIN BOTTOM CHAT INPUT BAR */}
        <div className="pointer-events-auto w-full p-1.5 rounded-full bg-slate-950/90 hover:bg-slate-950/95 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-1.5 transition-all">
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

          {/* Text Input with dynamic placeholder */}
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
            placeholder={`Frag ${assistantName}... (z. B. „Flieg nach Split“)`}
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
            title={`Nachricht an ${assistantName} senden`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
