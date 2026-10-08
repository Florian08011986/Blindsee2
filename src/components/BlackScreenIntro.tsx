/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Check, ChevronRight } from 'lucide-react';

interface BlackScreenIntroProps {
  isOpen: boolean;
  onComplete: (userName: string, assistantName: string) => void;
  initialUserName?: string;
  initialAssistantName?: string;
}

export const BlackScreenIntro: React.FC<BlackScreenIntroProps> = ({
  isOpen,
  onComplete,
  initialUserName = '',
  initialAssistantName = "Florian's KI-Assistent"
}) => {
  const [beat, setBeat] = useState<number>(0);
  const [userName, setUserName] = useState<string>(initialUserName || 'Florian');
  const [assistantName, setAssistantName] = useState<string>(
    initialAssistantName && initialAssistantName !== "Florian's KI-Assistent"
      ? initialAssistantName
      : 'Luka'
  );

  const [userInputVal, setUserInputVal] = useState<string>(initialUserName || '');
  const [assistInputVal, setAssistInputVal] = useState<string>(
    initialAssistantName && initialAssistantName !== "Florian's KI-Assistent"
      ? initialAssistantName
      : 'Luka'
  );

  if (!isOpen) return null;

  const totalBeats = 16;

  // Handles screen tap: advances to next beat if not on an input beat
  const handleContainerClick = () => {
    // Beat 5 and Beat 6 are inputs, Beat 15 is final
    if (beat !== 5 && beat !== 6 && beat < totalBeats - 1) {
      setBeat((prev) => prev + 1);
    }
  };

  const handleConfirmUserName = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const clean = userInputVal.trim() || 'Florian';
    setUserName(clean);
    setBeat(6);
  };

  const handleConfirmAssistantName = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const clean = assistInputVal.trim() || 'Luka';
    setAssistantName(clean);
    setBeat(7);
  };

  const handleFinish = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onComplete(userName || 'Freund', assistantName || 'Luka');
  };

  return (
    <div
      onClick={handleContainerClick}
      className="fixed inset-0 z-[100] bg-black text-white flex flex-col justify-between items-center px-6 py-8 sm:py-12 select-none overflow-hidden cursor-pointer"
    >
      {/* Absolute pure pitch-black background */}
      <div className="absolute inset-0 bg-black pointer-events-none" />

      {/* Top Sleek Storyline Progress Bar (segmented bars like modern storyboards) */}
      <div className="relative z-10 w-full max-w-md mx-auto flex items-center gap-1 shrink-0 pt-2 opacity-80">
        {Array.from({ length: totalBeats }).map((_, idx) => (
          <div
            key={idx}
            className="flex-1 h-1 rounded-full overflow-hidden bg-white/20 transition-all duration-300"
          >
            <div
              className={`h-full bg-white transition-all duration-300 ${
                idx <= beat ? 'w-full' : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Center Cinematic Story Content */}
      <div
        className="relative z-10 max-w-lg w-full mx-auto my-auto flex flex-col items-center justify-center text-center px-2 py-4"
        onClick={(e) => {
          // If we are on input beats, prevent propagating tap to root
          if (beat === 5 || beat === 6) {
            e.stopPropagation();
          }
        }}
      >
        <AnimatePresence mode="wait">
          {/* ================= TEIL 1: EINFÜHRUNG IN KURZEN STÜCKEN ================= */}

          {beat === 0 && (
            <motion.div
              key="beat-0"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="w-16 h-16 rounded-full border border-white/25 flex items-center justify-center bg-white/5 mx-auto shadow-[0_0_30px_rgba(255,255,255,0.25)]">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                Hey, ich bin Florian's KI-Assistent.
              </h1>
            </motion.div>
          )}

          {beat === 1 && (
            <motion.div
              key="beat-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <span className="text-4xl block">🇭🇷✨</span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                ...und in dieser App ab heute dein ganz persönlicher Reisebegleiter für Kroatien.
              </h1>
            </motion.div>
          )}

          {beat === 2 && (
            <motion.div
              key="beat-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <p className="text-sm uppercase tracking-widest text-white/60 font-semibold">
                Ob an der sonnigen Adria oder im Landesinneren:
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-relaxed drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                Ich bin dafür verantwortlich, euch in jeder Lebenslage und während des gesamten Urlaubs zur Seite zu stehen.
              </h2>
            </motion.div>
          )}

          {beat === 3 && (
            <motion.div
              key="beat-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <span className="text-3xl block">🌊☀️</span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-relaxed drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                Damit es euch an absolut nichts fehlt und ihr jeden Augenblick in vollen Zügen genießen könnt.
              </h2>
            </motion.div>
          )}

          {beat === 4 && (
            <motion.div
              key="beat-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                Bevor wir unsere gemeinsame Reise beginnen:
              </h2>
              <p className="text-lg font-light text-white/90">
                Lass uns kurz kennenlernen.
              </p>
            </motion.div>
          )}

          {/* ================= TEIL 2: INTERAKTIVE NAMENSVERGABE ================= */}

          {beat === 5 && (
            <motion.div
              key="beat-5"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 w-full max-w-sm mx-auto"
            >
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">
                  Kennenlernen • 1 von 2
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-snug drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                  Damit wir uns wie gute Freunde unterhalten können:
                </h3>
                <p className="text-base text-white/80">
                  Wie darf ich dich eigentlich nennen?
                </p>
              </div>

              <form onSubmit={handleConfirmUserName} className="space-y-4 pt-2">
                <input
                  type="text"
                  autoFocus
                  value={userInputVal}
                  onChange={(e) => setUserInputVal(e.target.value)}
                  placeholder="Dein Name (z. B. Florian)"
                  className="w-full px-5 py-3.5 text-center text-lg font-semibold text-white bg-black border-2 border-white/60 focus:border-white rounded-full outline-none transition-all placeholder:text-white/30 shadow-[0_0_20px_rgba(255,255,255,0.2)] focus:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                />

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-white text-black font-extrabold text-sm tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:bg-black hover:text-white border-2 border-white transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Weiter</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {beat === 6 && (
            <motion.div
              key="beat-6"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 w-full max-w-sm mx-auto"
            >
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">
                  Kennenlernen • 2 von 2
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-snug drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                  Okay, ab jetzt nenne ich dich {userName}!
                </h3>
                <p className="text-base text-white/80">
                  Hallo {userName}, wie möchtest du mich nennen?
                </p>
              </div>

              <form onSubmit={handleConfirmAssistantName} className="space-y-4 pt-2">
                <input
                  type="text"
                  autoFocus
                  value={assistInputVal}
                  onChange={(e) => setAssistInputVal(e.target.value)}
                  placeholder="Mein Name (z. B. Luka)"
                  className="w-full px-5 py-3.5 text-center text-lg font-semibold text-white bg-black border-2 border-white/60 focus:border-white rounded-full outline-none transition-all placeholder:text-white/30 shadow-[0_0_20px_rgba(255,255,255,0.2)] focus:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                />

                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {['Luka', 'Adriano', 'Mateo', 'Reisebegleiter'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAssistInputVal(opt)}
                      className={`text-xs px-3 py-1 rounded-full border transition-all cursor-pointer ${
                        assistInputVal === opt
                          ? 'border-white bg-white text-black font-bold'
                          : 'border-white/30 text-white/70 hover:border-white hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-white text-black font-extrabold text-sm tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:bg-black hover:text-white border-2 border-white transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Name bestätigen</span>
                  <Check className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {beat === 7 && (
            <motion.div
              key="beat-7"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                Abgemacht! Ab sofort bin ich {assistantName}.
              </h2>
              <p className="text-lg font-light text-white/90">
                Lass mich dir kurz zeigen, was ich alles für dich tun kann.
              </p>
            </motion.div>
          )}

          {/* ================= TEIL 3: VOLLSTÄNDIGES ONBOARDING ALLER FUNKTIONEN ================= */}

          {/* Feature 1: 3D-Kameraflüge */}
          {beat === 8 && (
            <motion.div
              key="beat-8"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <span className="text-4xl block">🦅</span>
              <span className="text-xs uppercase tracking-widest text-white/60 font-semibold block">
                Funktion 1 • 3D-Kameraflüge
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                „Sag mir einfach: ‚Flieg nach Dubrovnik‘ oder ‚Zeig mir Split von oben‘.“
              </h2>
              <p className="text-sm sm:text-base font-light text-white/80 leading-relaxed max-w-md mx-auto">
                Ich nehme dich mit auf atemberaubende, photorealistische 3D-Flüge über historische Paläste, Inseln und Küstenstädte.
              </p>
            </motion.div>
          )}

          {/* Feature 2: 25 km Umkreis, Buchten & Strände */}
          {beat === 9 && (
            <motion.div
              key="beat-9"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <span className="text-4xl block">🏖️</span>
              <span className="text-xs uppercase tracking-widest text-white/60 font-semibold block">
                Funktion 2 • 25 km Umkreis
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                „Frag mich: ‚Wo gibt es im 25 km Umkreis ruhige Felsbuchten?‘“
              </h2>
              <p className="text-sm sm:text-base font-light text-white/80 leading-relaxed max-w-md mx-auto">
                Ich finde für dich versteckte Badebuchten, Wasserfälle, Aussichtsgipfel und UNESCO-Stätten rund um deinen aktuellen Standort.
              </p>
            </motion.div>
          )}

          {/* Feature 3: Touren & Routen */}
          {beat === 10 && (
            <motion.div
              key="beat-10"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <span className="text-4xl block">🚗</span>
              <span className="text-xs uppercase tracking-widest text-white/60 font-semibold block">
                Funktion 3 • Touren &amp; Routen
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                Geführte 3D-Altstadt-Touren.
              </h2>
              <p className="text-sm sm:text-base font-light text-white/80 leading-relaxed max-w-md mx-auto">
                Ich führe dich auf kuratierten Routen durch mittelalterliche Festungen und Küstenorte – komplett virtuell im 3D-Flug vorgeflogen.
              </p>
            </motion.div>
          )}

          {/* Feature 4: Proaktive Packliste */}
          {beat === 11 && (
            <motion.div
              key="beat-11"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <span className="text-4xl block">🎒</span>
              <span className="text-xs uppercase tracking-widest text-white/60 font-semibold block">
                Funktion 4 • Proaktive Packliste
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                Badeschuhe, Mautboxen &amp; Countdown.
              </h2>
              <p className="text-sm sm:text-base font-light text-white/80 leading-relaxed max-w-md mx-auto">
                Florian hat mir eine interaktive Checkliste hinterlegt. Ich erinnere dich an Badeschuhe für Seeigel, Maut (ENC) und wichtige Dokumente.
              </p>
            </motion.div>
          )}

          {/* Feature 5: Infrastruktur & Notruf */}
          {beat === 12 && (
            <motion.div
              key="beat-12"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <span className="text-4xl block">⛽ 🏥</span>
              <span className="text-xs uppercase tracking-widest text-white/60 font-semibold block">
                Funktion 5 • Schutz &amp; Infrastruktur
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                Spritpreise, 24h-Apotheken &amp; Notruf.
              </h2>
              <p className="text-sm sm:text-base font-light text-white/80 leading-relaxed max-w-md mx-auto">
                Immer sicher unterwegs: Von aktuellen Benzinpreisen bis hin zu Notrufnummern (112, Pannenhilfe 1987, Seenotrettung 195) hast du alles sofort parat.
              </p>
            </motion.div>
          )}

          {/* Feature 6: Zero-Menu-Doktrin & Chat */}
          {beat === 13 && (
            <motion.div
              key="beat-13"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <span className="text-4xl block">💬</span>
              <span className="text-xs uppercase tracking-widest text-white/60 font-semibold block">
                Funktion 6 • Zero-Menu-Doktrin
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                Keine verschachtelten Menüs mehr!
              </h2>
              <p className="text-sm sm:text-base font-light text-white/80 leading-relaxed max-w-md mx-auto">
                Du musst keine Knöpfe oder Regler mehr suchen. Sprich oder schreibe einfach unten im Chat mit mir – ich steuere die gesamte App für dich.
              </p>
            </motion.div>
          )}

          {/* Feature 7: Info-Icon & 3D Gesten */}
          {beat === 14 && (
            <motion.div
              key="beat-14"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <span className="text-4xl block">ℹ️ 🌐</span>
              <span className="text-xs uppercase tracking-widest text-white/60 font-semibold block">
                Funktion 7 • Gesten &amp; Info-Symbol
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                Volle Freiheit in 3D.
              </h2>
              <p className="text-sm sm:text-base font-light text-white/80 leading-relaxed max-w-md mx-auto">
                Mit 1 oder 2 Fingern kannst du die Karte neigen, drehen und zoomen. Oben rechts findest du das Info-Symbol mit dem gesamten Befehlskatalog.
              </p>
            </motion.div>
          )}

          {/* Beat 15: Finale & Start in die Reise */}
          {beat === 15 && (
            <motion.div
              key="beat-15"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 w-full max-w-sm mx-auto"
            >
              <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center bg-white/10 mx-auto shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                <span className="text-2xl">🇭🇷</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                  Bereit für Kroatien, {userName}?
                </h2>
                <p className="text-base text-white/85 font-light">
                  Ich bin an deiner Seite. Lass uns deinen Urlaub unvergesslich machen!
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleFinish}
                  className="w-full py-4 rounded-full bg-white text-black font-black text-base tracking-wide shadow-[0_0_30px_rgba(255,255,255,0.6)] hover:bg-black hover:text-white border-2 border-white transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Auf nach Kroatien! 🇭🇷</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Subtle Navigation Indicator (No text, just clean dots / step counter) */}
      <div className="relative z-10 w-full flex items-center justify-center shrink-0 pb-2 opacity-40">
        <span className="text-[10px] tracking-widest uppercase font-mono text-white">
          {beat + 1} / {totalBeats}
        </span>
      </div>
    </div>
  );
};
