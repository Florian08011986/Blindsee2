/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Check, Compass, ChevronRight } from 'lucide-react';

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
  const [step, setStep] = useState<number>(0);
  const [userName, setUserName] = useState<string>(initialUserName);
  const [assistantName, setAssistantName] = useState<string>(
    initialAssistantName && initialAssistantName !== "Florian's KI-Assistent"
      ? initialAssistantName
      : 'Luka'
  );
  const [userInputVal, setUserInputVal] = useState<string>(initialUserName);
  const [assistInputVal, setAssistInputVal] = useState<string>(
    initialAssistantName && initialAssistantName !== "Florian's KI-Assistent"
      ? initialAssistantName
      : 'Luka'
  );

  if (!isOpen) return null;

  const handleConfirmUserName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = userInputVal.trim() || 'Florian';
    setUserName(clean);
    setStep(2);
  };

  const handleConfirmAssistantName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = assistInputVal.trim() || 'Luka';
    setAssistantName(clean);
    setStep(3);
  };

  const handleFinish = () => {
    onComplete(userName || 'Freund', assistantName || 'Luka');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col justify-center items-center px-6 py-10 select-none overflow-y-auto">
      {/* Subtle background ambient pulse to maintain absolute deep black */}
      <div className="absolute inset-0 bg-black pointer-events-none" />

      <div className="relative max-w-lg w-full mx-auto my-auto flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          {/* ================= STEP 0: DIE VORSTELLUNG DES KI-ASSISTENTEN ================= */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="space-y-8 flex flex-col items-center"
            >
              {/* Leuchtender weißer Begrüßungs-Icon */}
              <div className="w-14 h-14 rounded-full border border-white/30 flex items-center justify-center bg-white/5 shadow-[0_0_25px_rgba(255,255,255,0.25)]">
                <Sparkles className="w-7 h-7 text-white animate-pulse" />
              </div>

              {/* Wortgetreuer Begrüßungstext in strahlendem Weiß auf Tiefschwarz */}
              <div className="space-y-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] leading-snug">
                  „Hey, ich bin Florian's KI-Assistent, und bin hier in dieser App euer Reisebegleiter.“
                </h1>

                <p className="text-base sm:text-lg font-light text-white/90 leading-relaxed max-w-md mx-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                  „Ich bin dafür verantwortlich, euch in jeder Lebenslage beziehungsweise in eurem Urlaub zur Seite zu stehen, damit es euch an nichts fehlt.“
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-3.5 rounded-full border-2 border-white bg-white text-black font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:bg-black hover:text-white transition-all transform active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>Lass uns kennenlernen</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 1: FRAGE NACH DEM NAMEN DES NUTZERS ================= */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-8 w-full flex flex-col items-center"
            >
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">
                  Schritt 1 von 2
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.35)] leading-snug">
                  Damit wir uns im Urlaub wie gute Freunde unterhalten können:
                </h2>
                <p className="text-lg font-light text-white/90">
                  Wie darf ich dich eigentlich nennen?
                </p>
              </div>

              <form onSubmit={handleConfirmUserName} className="w-full max-w-xs space-y-4">
                <input
                  type="text"
                  autoFocus
                  value={userInputVal}
                  onChange={(e) => setUserInputVal(e.target.value)}
                  placeholder="Dein Name (z. B. Florian)"
                  className="w-full px-5 py-3.5 text-center text-lg font-medium text-white bg-black border-2 border-white/50 focus:border-white rounded-full outline-none transition-all placeholder:text-white/30 shadow-[0_0_15px_rgba(255,255,255,0.15)] focus:shadow-[0_0_25px_rgba(255,255,255,0.35)]"
                />

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-white text-black font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:bg-black hover:text-white border-2 border-white transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Weiter</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {/* ================= STEP 2: BESTÄTIGUNG & ASSISTENTEN-TAUFE ================= */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-8 w-full flex flex-col items-center"
            >
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">
                  Schritt 2 von 2
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.35)] leading-snug">
                  Okay, ab jetzt nenne ich dich {userName}!
                </h2>
                <p className="text-lg font-light text-white/90">
                  Hallo {userName}, wie möchtest du mich nennen?
                </p>
              </div>

              <form onSubmit={handleConfirmAssistantName} className="w-full max-w-xs space-y-4">
                <input
                  type="text"
                  autoFocus
                  value={assistInputVal}
                  onChange={(e) => setAssistInputVal(e.target.value)}
                  placeholder="Mein Name (z. B. Luka)"
                  className="w-full px-5 py-3.5 text-center text-lg font-medium text-white bg-black border-2 border-white/50 focus:border-white rounded-full outline-none transition-all placeholder:text-white/30 shadow-[0_0_15px_rgba(255,255,255,0.15)] focus:shadow-[0_0_25px_rgba(255,255,255,0.35)]"
                />

                {/* Beliebte kroatische Namensvorschläge */}
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  {['Luka', 'Adriano', 'Mateo', 'Kroatien-Guide'].map((nameOption) => (
                    <button
                      key={nameOption}
                      type="button"
                      onClick={() => setAssistInputVal(nameOption)}
                      className={`text-xs px-3 py-1 rounded-full border transition-all cursor-pointer ${
                        assistInputVal === nameOption
                          ? 'border-white bg-white text-black font-bold'
                          : 'border-white/30 text-white/70 hover:border-white hover:text-white'
                      }`}
                    >
                      {nameOption}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-white text-black font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:bg-black hover:text-white border-2 border-white transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Name bestätigen</span>
                  <Check className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {/* ================= STEP 3: ERKLÄRUNGSTEXT & ONBOARDING DER FUNKTIONEN ================= */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 w-full flex flex-col items-center text-left"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center bg-white/5 mx-auto mb-2">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]">
                  Abgemacht! Ab sofort bin ich {assistantName}.
                </h2>
                <p className="text-sm text-white/80">
                  Dein persönlicher Reisebegleiter für deinen Traumurlaub in Kroatien 🇭🇷
                </p>
              </div>

              {/* Kurzes, prägnantes Feature-Onboarding */}
              <div className="w-full bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm text-white/90">
                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">🦅</span>
                  <div>
                    <strong className="text-white block font-semibold">Fotorealistische 3D-Kameraflüge:</strong>
                    <span>Sag mir einfach: <em>„Flieg nach Dubrovnik“</em> oder <em>„Zeig mir Split von oben“</em>.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">🏖️</span>
                  <div>
                    <strong className="text-white block font-semibold">Buchten &amp; Strände im Umkreis:</strong>
                    <span>Frag mich: <em>„Wo gibt es im Umkreis von 20 km schöne Kieselstrände?“</em></span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">🚗</span>
                  <div>
                    <strong className="text-white block font-semibold">Touren &amp; Routen:</strong>
                    <span>Ich führe dich auf geführten 3D-Routen durch historische Altstädte.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">🎒</span>
                  <div>
                    <strong className="text-white block font-semibold">Proaktive Packliste &amp; Tipps:</strong>
                    <span>Ich erinnere dich an Badeschuhe für Seeigel, Mautboxen (ENC) und Notfallnummern.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">💬</span>
                  <div>
                    <strong className="text-white block font-semibold">100% per Chat &amp; Sprache steuerbar:</strong>
                    <span>Du brauchst kein unübersichtliches Menü mehr – sprich oder schreibe einfach mit mir!</span>
                  </div>
                </div>
              </div>

              <div className="w-full pt-2">
                <button
                  onClick={handleFinish}
                  className="w-full py-4 rounded-full bg-white text-black font-extrabold text-base tracking-wide shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:bg-black hover:text-white border-2 border-white transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Auf nach Kroatien! 🇭🇷</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
