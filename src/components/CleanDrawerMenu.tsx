/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MapPin,
  SlidersHorizontal,
  Navigation,
  Play,
  Trash2,
  Plus,
  Check,
  Compass,
  Layers,
  Key,
  ChevronRight,
  Info,
  Calendar,
  Clock,
  Sparkles,
  Route
} from 'lucide-react';
import { Landmark, FILTER_CATEGORIES } from '../utils';

interface CleanDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  // Aufenthaltsort & Radius
  currentLocationName: string;
  onSelectHub: (hub: { name: string; lat: number; lng: number }) => void;
  onUseGeolocation: () => void;
  isLocating: boolean;
  radiusKm: number;
  onRadiusChange: (radius: number) => void;
  // Filter Categories
  activeCategories: string[];
  onToggleCategory: (catId: string) => void;
  onSelectAllCategories: () => void;
  onClearCategories: () => void;
  categoryCounts: Record<string, number>;
  // Tourenplaner
  tourStops: Landmark[];
  onAddTourStop: (stop: Landmark) => void;
  onRemoveTourStop: (stopId: string) => void;
  onClearTour: () => void;
  onStartTour3D: () => void;
  allNearbyPois: Landmark[];
  onFlyToPoi: (poi: Landmark) => void;
  // Settings
  mapMode: string;
  onMapModeChange: (mode: '3d' | 'satellite' | 'hybrid' | 'roadmap') => void;
  onOpenApiKeyModal: () => void;
}

const CROATIA_HUBS = [
  { name: 'Split (Dalmatien Zentrum)', lat: 43.5081, lng: 16.4402 },
  { name: 'Dubrovnik (Südadria)', lat: 42.6412, lng: 18.1084 },
  { name: 'Zadar (Norddalmatien)', lat: 44.1160, lng: 15.2280 },
  { name: 'Makarska (Riviera & Biokovo)', lat: 43.2965, lng: 17.0182 },
  { name: 'Šibenik (Kornaten & Krka)', lat: 43.7350, lng: 15.8952 },
  { name: 'Insel Hvar & Brač', lat: 43.1729, lng: 16.4428 },
  { name: 'Rovinj (Istrien West)', lat: 45.0818, lng: 13.6325 },
  { name: 'Pula (Istrien Süd)', lat: 44.8732, lng: 13.8475 },
  { name: 'Plitvicer Seen (Lika)', lat: 44.9022, lng: 15.6083 },
  { name: 'Zagreb (Hauptstadt & Zagorje)', lat: 45.8131, lng: 15.9775 },
];

export const CleanDrawerMenu: React.FC<CleanDrawerMenuProps> = ({
  isOpen,
  onClose,
  currentLocationName,
  onSelectHub,
  onUseGeolocation,
  isLocating,
  radiusKm,
  onRadiusChange,
  activeCategories,
  onToggleCategory,
  onSelectAllCategories,
  onClearCategories,
  categoryCounts,
  tourStops,
  onAddTourStop,
  onRemoveTourStop,
  onClearTour,
  onStartTour3D,
  allNearbyPois,
  onFlyToPoi,
  mapMode,
  onMapModeChange,
  onOpenApiKeyModal
}) => {
  const [activeTab, setActiveTab] = useState<'filter' | 'tour' | 'location' | 'settings'>('filter');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 pointer-events-auto"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] max-w-full bg-slate-900/95 text-slate-100 z-50 shadow-2xl border-l border-white/10 flex flex-col pointer-events-auto backdrop-blur-xl select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-sm text-white truncate">
                    Kroatien Reisebegleiter Menü
                  </h2>
                  <p className="text-[11px] text-slate-400 truncate">
                    Standort: {currentLocationName} (±{radiusKm} km)
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Menü schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-white/10 bg-slate-950/40 px-2 py-1.5 gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('filter')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'filter'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter</span>
                {activeCategories.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
                    {activeCategories.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('tour')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'tour'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Route className="w-3.5 h-3.5" />
                <span>Touren planen</span>
                {tourStops.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
                    {tourStops.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('location')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'location'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Aufenthaltsort</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="Einstellungen"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {/* TAB 1: FILTERKRITERIEN */}
              {activeTab === 'filter' && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs">
                    <div className="flex items-center justify-between font-semibold text-cyan-300 mb-1">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Region um {currentLocationName} (±{radiusKm} km)
                      </span>
                      <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-400/30">
                        Städte immer aktiv
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Nadeln werden erst eingeblendet, wenn du die gewünschten Filterkriterien aktivierst (z. B. 1, 3, 5 oder alle).
                    </p>
                  </div>

                  {/* Actions: Alle wählen / Zurücksetzen */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Kategorien zusammenstellen
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={onSelectAllCategories}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-cyan-300 transition-colors cursor-pointer font-medium"
                      >
                        Alle an
                      </button>
                      <button
                        onClick={onClearCategories}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors cursor-pointer"
                      >
                        Zurücksetzen
                      </button>
                    </div>
                  </div>

                  {/* Categories Grid */}
                  <div className="grid grid-cols-1 gap-2">
                    {FILTER_CATEGORIES.map((cat) => {
                      const isActive = activeCategories.includes(cat.id);
                      const count = categoryCounts[cat.id] || 0;

                      return (
                        <button
                          key={cat.id}
                          onClick={() => onToggleCategory(cat.id)}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isActive
                              ? 'bg-cyan-950/60 border-cyan-400/50 text-white shadow-xs'
                              : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg shrink-0">{cat.glyph}</span>
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                                <span>{cat.label}</span>
                                {count > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-mono">
                                    {count} im Umkreis
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                {cat.description}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                              isActive
                                ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                                : 'border-white/20 bg-black/20'
                            }`}
                          >
                            {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: TOUREN PLANEN */}
              {activeTab === 'tour' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-950/70 to-indigo-950/70 border border-cyan-500/30 text-xs">
                    <h3 className="font-bold text-white text-xs flex items-center gap-1.5 mb-1">
                      <Route className="w-4 h-4 text-cyan-400" />
                      Maßgeschneiderte 3D-Tour zusammenstellen
                    </h3>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Tippe einfach auf Städte, Sehenswürdigkeiten, Strände oder Freizeitaktivitäten, um sie als Stopps zu deiner Route hinzuzufügen. Danach kannst du die gesamte Route als 3D-Flug genießen!
                    </p>
                  </div>

                  {/* Active Tour Route */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        Deine Tour-Route ({tourStops.length} Stopps)
                      </span>
                      {tourStops.length > 0 && (
                        <button
                          onClick={onClearTour}
                          className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Leeren
                        </button>
                      )}
                    </div>

                    {tourStops.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-dashed border-white/15 text-center text-slate-400 text-xs space-y-2">
                        <Route className="w-6 h-6 mx-auto text-slate-500" />
                        <p>Noch keine Stopps ausgewählt.</p>
                        <p className="text-[11px] text-slate-500">
                          Wähle unten Vorschläge aus oder tippe auf Nadeln auf der Karte!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {tourStops.map((stop, index) => (
                          <div
                            key={stop.id}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-cyan-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <span className="font-semibold text-white truncate block">
                                  {stop.name}
                                </span>
                                <span className="text-[10px] text-cyan-300">
                                  {stop.category}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => onFlyToPoi(stop)}
                                className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-cyan-300 cursor-pointer"
                                title="Im 3D-Flug anfliegen"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onRemoveTourStop(stop.id)}
                                className="p-1 rounded-md bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                                title="Entfernen"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Button 3D-Tour starten */}
                        <button
                          onClick={() => {
                            onStartTour3D();
                            onClose();
                          }}
                          className="w-full mt-3 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Diese Route jetzt als 3D-Tour abfliegen</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Add suggestions */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-xs font-bold text-slate-300">
                      Orte & Freizeitaktivitäten in der Nähe hinzufügen
                    </span>
                    <div className="max-h-[200px] overflow-y-auto space-y-1.5 scrollbar-thin">
                      {allNearbyPois
                        .filter((p) => !tourStops.some((s) => s.id === p.id))
                        .map((poi) => (
                          <button
                            key={poi.id}
                            onClick={() => onAddTourStop(poi)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between text-xs text-left transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm shrink-0">{poi.glyph || '📍'}</span>
                              <span className="truncate text-slate-200">{poi.name}</span>
                            </div>
                            <span className="p-1 rounded-md bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-white shrink-0">
                              <Plus className="w-3 h-3" />
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AUFENTHALTSORT */}
              {activeTab === 'location' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Aufenthaltsort festlegen</span>
                      <button
                        onClick={onUseGeolocation}
                        disabled={isLocating}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-600/80 hover:bg-cyan-600 text-white text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                        <span>{isLocating ? 'Ermittle...' : 'GPS-Standort'}</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>Aktiver Umkreis-Filter:</span>
                        <span className="font-bold text-cyan-400">{radiusKm} km</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="60"
                        step="5"
                        value={radiusKm}
                        onChange={(e) => onRadiusChange(Number(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>10 km</span>
                        <span>25 km (Standard)</span>
                        <span>60 km</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Pick Croatian Hubs */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-300">
                      Beliebte kroatische Regionen wählen
                    </span>
                    <div className="grid grid-cols-1 gap-1.5 max-h-[280px] overflow-y-auto scrollbar-thin">
                      {CROATIA_HUBS.map((hub) => {
                        const isCurrent = currentLocationName.includes(hub.name.split(' ')[0]);
                        return (
                          <button
                            key={hub.name}
                            onClick={() => {
                              onSelectHub(hub);
                              onClose();
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer border ${
                              isCurrent
                                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 font-bold'
                                : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            <span className="truncate">{hub.name}</span>
                            {isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  {/* Map Mode */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300">Kartenansicht</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => onMapModeChange('3d')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                          mapMode === '3d'
                            ? 'bg-cyan-600 border-cyan-400 text-white'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        3D Fotorealistisch
                      </button>
                      <button
                        onClick={() => onMapModeChange('satellite')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                          mapMode === 'satellite'
                            ? 'bg-cyan-600 border-cyan-400 text-white'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        Satellit
                      </button>
                      <button
                        onClick={() => onMapModeChange('hybrid')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                          mapMode === 'hybrid'
                            ? 'bg-cyan-600 border-cyan-400 text-white'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        Hybrid
                      </button>
                    </div>
                  </div>

                  {/* API Key configuration */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-blue-400" />
                        Google Maps API-Schlüssel
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Standardmäßig wird der öffentliche Maps Demo-Key für fotorealistisches 3D genutzt. Du kannst hier deinen eigenen Schlüssel hinterlegen.
                    </p>
                    <button
                      onClick={onOpenApiKeyModal}
                      className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      API-Schlüssel anpassen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
