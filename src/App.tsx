/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getStoredGeminiKey, setStoredGeminiKey } from './geminiClient';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  SlidersHorizontal,
  Video,
  Move,
  Play,
  Square,
  Waves,
  RefreshCw,
  Key,
  X,
  Compass,
  Layers,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { CleanHeader } from './components/CleanHeader';
import { GeminiBottomChat } from './components/GeminiBottomChat';
import { BlackScreenIntro } from './components/BlackScreenIntro';
import { HelpGuideModal } from './components/HelpGuideModal';
import { PacklistWidget } from './components/PacklistWidget';
import { ALL_CROATIA_POIS, getPoisInRadius } from './croatiaLocations';
import {
  Landmark,
  loadGoogleMapsScript,
  getLandmarkMarkerAltitude,
  getHaversineDistance,
  CROATIA_COASTAL_WELCOME_CAMERA
} from './utils';

// Provisioned Google Maps Demo Key for AI Studio (from GenerateMapsDemoKey)
export const OFFICIAL_DEMO_API_KEY = 'AIzaSyADIBzH9e18kaN3hDy3x0olf2I6vHP_b0w';

function getInitialApiKey(): string {
  if (typeof window !== 'undefined') {
    const custom =
      localStorage.getItem('gmp_custom_api_key') ||
      localStorage.getItem('custom_maps_api_key');
    // If user has a valid custom key (not the old mock key)
    if (custom && custom.trim() !== '' && !custom.includes('DemoKeyPrototyping')) {
      return custom.trim();
    }
    // Clean up any stale mock keys
    localStorage.removeItem('gmp_custom_api_key');
    localStorage.removeItem('custom_maps_api_key');
  }
  const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
  if (envKey && envKey.trim() !== '') return envKey.trim();
  return OFFICIAL_DEMO_API_KEY;
}

export default function App() {
  // =========================================================================
  // 1. STANDORT & 25 KM RADIUS FILTER STATE
  // =========================================================================
  const [currentLocation, setCurrentLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
  }>(() => {
    // Default to Split / Dalmatien (Zentraler Ausgangspunkt der Adriaküste)
    return { name: 'Split (Dalmatien)', lat: 43.5081, lng: 16.4402 };
  });

  const [radiusKm, setRadiusKm] = useState<number>(25);

  // Filter criteria: By default, NO category pins clutter the map!
  // User adds/toggles categories variably (1, 3, 5 or all)
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // User Profile & Assistant Customization
  const [userName, setUserName] = useState<string>(() => {
    try {
      return localStorage.getItem('kroatien_user_name') || 'Florian';
    } catch {
      return 'Florian';
    }
  });

  const [assistantName, setAssistantName] = useState<string>(() => {
    try {
      return localStorage.getItem('kroatien_assistant_name') || 'Luka';
    } catch {
      return 'Luka';
    }
  });

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kroatien_intro_completed') !== 'true';
    } catch {
      return true;
    }
  });

  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showPacklist, setShowPacklist] = useState<boolean>(false);

  // =========================================================================
  // 2. POIs IM 25 KM RADIUS BERECHNEN
  // =========================================================================
  const { cities, filteredPois, allInRadius } = getPoisInRadius(
    currentLocation.lat,
    currentLocation.lng,
    radiusKm,
    activeCategories
  );

  // Calculate counts per category in the 25km radius
  const categoryCounts: Record<string, number> = {};
  allInRadius.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  // =========================================================================
  // 3. TOURENPLANER STATE ("Touren planen")
  // =========================================================================
  const [tourStops, setTourStops] = useState<Landmark[]>(() => {
    // Initial suggested tour stops around Split
    const defaultStops = ALL_CROATIA_POIS.filter(
      (p) =>
        p.id === 'city-split' ||
        p.id === 'kultur-diokletianpalast-peristyl' ||
        p.id === 'strand-bacvice-split'
    );
    return defaultStops.length > 0 ? defaultStops : [ALL_CROATIA_POIS[0]];
  });

  const [isTouring, setIsTouring] = useState<boolean>(false);
  const [currentTourIndex, setCurrentTourIndex] = useState<number>(0);
  const tourTimerRef = useRef<NodeJS.Timeout | null>(null);

  // =========================================================================
  // 4. MAP & 3D CAMERA ENGINE
  // =========================================================================
  const [apiKey, setApiKey] = useState<string>(getInitialApiKey);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [keyInputValue, setKeyInputValue] = useState<string>('');
  const [geminiKeyInput, setGeminiKeyInput] = useState<string>('');
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(() => Boolean(getStoredGeminiKey()));
  const [mapsLoaded, setMapsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mapMode, setMapMode] = useState<'3d' | 'satellite' | 'hybrid' | 'roadmap'>('3d');
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [flightStatus, setFlightStatus] = useState<string>('Bereit für Kroatien');
  const [activeLandmark, setActiveLandmark] = useState<Landmark | null>(null);

  const mapElementRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Subtle Welcome Coastal Flight Animation on first visit
  const [isWelcomeFlightActive, setIsWelcomeFlightActive] = useState<boolean>(false);
  const welcomeHasRunRef = useRef<boolean>(false);

  // Clear any legacy localStorage items from previous sessions
  useEffect(() => {
    try {
      localStorage.removeItem('selected_landmark_id');
      localStorage.removeItem('custom_places_history');
    } catch (e) {}
  }, []);

  // Initialize Google Maps 3D
  useEffect(() => {
    setFlightStatus('Google 3D Maps wird initialisiert...');
    loadGoogleMapsScript(apiKey)
      .then(() => {
        setMapsLoaded(true);
        setFlightStatus('3D-Engine bereit');
      })
      .catch((err) => {
        console.error('Failed to load Google Maps 3D:', err);
        setLoadError('Google Maps 3D konnte nicht geladen werden.');
      });
  }, [apiKey]);

  // =========================================================================
  // 5. 3D FLIGHT HELPER: AUTOMATISCH IM 3D-FLUG HINFLIEGEN & RANZOOMEN
  // "und zwar wenn ich mir eine Sehenswürdigkeit anzeigen lasse oder ein Ort oder
  // ähnliches dass es natürlich immer automatisch im 3 d Flug Dahin fliegt und dann unten in 3 d ran zoomt"
  // =========================================================================
  const flyToPoi3D = useCallback((poi: Landmark, zoomRange?: number) => {
    setActiveLandmark(poi);
    setFlightStatus(`3D-Flug zu ${poi.name}...`);

    if (mapElementRef.current && typeof mapElementRef.current.flyCameraTo === 'function') {
      setIsFlying(true);
      try {
        const targetRange = zoomRange || poi.camRange || 450; // Zooms in close in 3D!
        const targetTilt = poi.camTilt || 58;
        const targetHeading = poi.camHeading ?? poi.heading ?? 0;

        mapElementRef.current.flyCameraTo({
          endCamera: {
            center: {
              lat: Number(poi.lat),
              lng: Number(poi.lng),
              altitude: Number(poi.altitude || 15)
            },
            range: targetRange,
            tilt: targetTilt,
            heading: targetHeading
          },
          durationMillis: 2200
        });

        setTimeout(() => {
          setIsFlying(false);
          setFlightStatus(`3D-Ansicht: ${poi.name}`);
        }, 2200);
      } catch (e) {
        console.warn('flyCameraTo failed:', e);
        setIsFlying(false);
      }
    }
  }, []);

  const handleFlyToNamedPlace = useCallback(
    (placeName: string) => {
      const q = placeName.toLowerCase().trim();
      if (!q) return;

      const found = ALL_CROATIA_POIS.find(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );

      if (found) {
        flyToPoi3D(found);
        return;
      }

      // Famous fallback hubs across Croatia
      const hubList = [
        { key: 'dubrovnik', name: 'Dubrovnik (Altstadt)', lat: 42.6412, lng: 18.1084, range: 450, tilt: 55, heading: 140 },
        { key: 'split', name: 'Split (Diokletianpalast)', lat: 43.5081, lng: 16.4402, range: 450, tilt: 55, heading: 120 },
        { key: 'rovinj', name: 'Rovinj (Istrien)', lat: 45.0812, lng: 13.6387, range: 450, tilt: 55, heading: 90 },
        { key: 'zadar', name: 'Zadar (Meeresorgel)', lat: 44.1174, lng: 15.2201, range: 450, tilt: 55, heading: 150 },
        { key: 'pula', name: 'Pula (Amphitheater)', lat: 44.8732, lng: 13.8502, range: 450, tilt: 55, heading: 110 },
        { key: 'krka', name: 'Krka-Wasserfälle', lat: 43.8049, lng: 15.9644, range: 500, tilt: 60, heading: 45 },
        { key: 'zagreb', name: 'Zagreb (Hauptstadt)', lat: 45.815, lng: 15.9819, range: 550, tilt: 50, heading: 0 },
        { key: 'hvar', name: 'Insel Hvar', lat: 43.1725, lng: 16.4428, range: 500, tilt: 55, heading: 110 },
        { key: 'korcula', name: 'Insel Korčula', lat: 42.9602, lng: 17.1356, range: 480, tilt: 55, heading: 130 }
      ];

      const matchedHub = hubList.find((h) => q.includes(h.key));
      if (matchedHub) {
        flyToPoi3D({
          id: `fly-${matchedHub.key}`,
          name: matchedHub.name,
          lat: matchedHub.lat,
          lng: matchedHub.lng,
          category: 'Städte',
          description: `3D-Flugziel in Kroatien: ${matchedHub.name}`,
          camRange: matchedHub.range,
          camTilt: matchedHub.tilt,
          camHeading: matchedHub.heading
        });
      }
    },
    [flyToPoi3D]
  );

  // Subtle Welcome Coastline Flight across Croatia
  const runWelcomeCoastalFlight = useCallback(() => {
    if (!mapElementRef.current || typeof mapElementRef.current.flyCameraTo !== 'function') return;

    setIsWelcomeFlightActive(true);
    setIsFlying(true);
    setFlightStatus('Willkommen in Kroatien — Küstenpanorama...');

    try {
      mapElementRef.current.flyCameraTo({
        endCamera: {
          center: CROATIA_COASTAL_WELCOME_CAMERA.center,
          range: CROATIA_COASTAL_WELCOME_CAMERA.range,
          tilt: CROATIA_COASTAL_WELCOME_CAMERA.tilt,
          heading: CROATIA_COASTAL_WELCOME_CAMERA.heading
        },
        durationMillis: 4000
      });

      setTimeout(() => {
        setIsFlying(false);
        setIsWelcomeFlightActive(false);
        setFlightStatus(`Standort: ${currentLocation.name}`);
        // After welcome flight, smoothly settle down towards current location
        if (mapElementRef.current) {
          mapElementRef.current.flyCameraTo({
            endCamera: {
              center: { lat: currentLocation.lat, lng: currentLocation.lng, altitude: 20 },
              range: 5200,
              tilt: 50,
              heading: 45
            },
            durationMillis: 2600
          });
        }
      }, 4200);
    } catch (e) {
      setIsFlying(false);
      setIsWelcomeFlightActive(false);
    }
  }, [currentLocation]);

  // First load welcome flight
  useEffect(() => {
    if (mapsLoaded && !welcomeHasRunRef.current && mapElementRef.current) {
      welcomeHasRunRef.current = true;
      const t = setTimeout(() => {
        runWelcomeCoastalFlight();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [mapsLoaded, runWelcomeCoastalFlight]);

  // =========================================================================
  // 6. 3D MARKER MOUNTING (STÄDTE IMMER + GEFILTERTE POIS)
  // =========================================================================
  const mount3DMarkers = useCallback(() => {
    if (!mapElementRef.current || !mapsLoaded) return;
    const map = mapElementRef.current;
    const google = (window as any).google;
    if (!google?.maps?.maps3d) return;

    // Remove existing markers
    markersRef.current.forEach((m) => {
      try {
        if (m.parentNode) m.parentNode.removeChild(m);
      } catch (e) {}
    });
    markersRef.current = [];

    const MarkerClass =
      google.maps.maps3d.Marker3DInteractiveElement ||
      google.maps.maps3d.Marker3DElement;
    if (!MarkerClass) return;

    // Combine cities (ALWAYS shown) and user-selected categories' POIs
    const markersToRender = [...cities, ...filteredPois];

    markersToRender.forEach((poi) => {
      try {
        const markerAltitude = getLandmarkMarkerAltitude(poi);
        const marker = new MarkerClass({
          position: { lat: Number(poi.lat), lng: Number(poi.lng), altitude: markerAltitude },
          altitudeMode: 'RELATIVE_TO_MESH',
          extruded: false,
          collisionBehavior: 'REQUIRED_AND_HIDES_OPTIONAL',
          drawsWhenOccluded: true
        });

        // Attach custom SVG pin template with category emoji glyph
        const pinColor = poi.pinColor || (poi.category === 'Städte' ? '#0284c7' : '#06b6d4');
        const glyph = poi.glyph || '📍';

        const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38" fill="none">
  <path d="M15 2C8.37 2 3 7.37 3 14c0 9 12 22 12 22s12-13 12-22c0-6.63-5.37-12-12-12z" fill="${pinColor}" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="15" cy="14" r="9" fill="#FFFFFF"/>
  <text x="15" y="18" font-size="11" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif">${glyph}</text>
</svg>
`.trim();

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
        const template = document.createElement('template');
        template.content.append(svgDoc.documentElement);
        marker.append(template);

        // Click on marker triggers automatic 3D flight and zoom!
        marker.addEventListener('gmp-click', (e: any) => {
          if (e?.stop) e.stop();
          flyToPoi3D(poi);
        });

        map.appendChild(marker);
        markersRef.current.push(marker);
      } catch (err) {
        console.warn(`Could not mount 3D marker for ${poi.name}:`, err);
      }
    });
  }, [cities, filteredPois, mapsLoaded, flyToPoi3D]);

  // Remount markers whenever cities, filtered POIs, or map changes
  useEffect(() => {
    mount3DMarkers();
  }, [mount3DMarkers]);

  // =========================================================================
  // 7. TOURENPLANER CONTROLLER (3D-FLUGROUTE DURCH ALLE STOPPS)
  // =========================================================================
  const startTour3D = useCallback(() => {
    if (tourStops.length === 0) return;

    setIsTouring(true);
    setCurrentTourIndex(0);
    setFlightStatus(`3D-Tour gestartet: Stopp 1 von ${tourStops.length}`);

    // Fly to first stop immediately
    const firstStop = tourStops[0];
    flyToPoi3D(firstStop);

    // Sequential loop
    let nextIdx = 1;
    const playNext = () => {
      if (nextIdx >= tourStops.length) {
        setIsTouring(false);
        setFlightStatus('3D-Tour erfolgreich abgeschlossen!');
        return;
      }

      setCurrentTourIndex(nextIdx);
      const stop = tourStops[nextIdx];
      setFlightStatus(`3D-Tour: Flug zu ${stop.name} (${nextIdx + 1}/${tourStops.length})`);
      flyToPoi3D(stop);

      nextIdx++;
      // Dwell 5.5 seconds at each stop before flying to next
      tourTimerRef.current = setTimeout(playNext, 5500);
    };

    tourTimerRef.current = setTimeout(playNext, 5500);
  }, [tourStops, flyToPoi3D]);

  const stopTour3D = useCallback(() => {
    setIsTouring(false);
    if (tourTimerRef.current) {
      clearTimeout(tourTimerRef.current);
      tourTimerRef.current = null;
    }
    setFlightStatus('3D-Tour beendet');
  }, []);

  // =========================================================================
  // 8. GEOLOCATION STANDORT-ERMITTLUNG
  // =========================================================================
  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      setFlightStatus('Standortermittlung wird von diesem Browser nicht unterstützt.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setCurrentLocation({
          name: 'Mein Aufenthaltsort',
          lat: latitude,
          lng: longitude
        });

        // Fly camera smoothly to user's location
        if (mapElementRef.current && typeof mapElementRef.current.flyCameraTo === 'function') {
          mapElementRef.current.flyCameraTo({
            endCamera: {
              center: { lat: latitude, lng: longitude, altitude: 25 },
              range: 4800,
              tilt: 50,
              heading: 0
            },
            durationMillis: 2400
          });
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        // Fallback to Split
        setFlightStatus('Standort nicht ermittelt — Dalmatien/Split aktiv');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Select a preset Croatian hub
  const handleSelectHub = (hub: { name: string; lat: number; lng: number }) => {
    setCurrentLocation(hub);
    setActiveLandmark(null);

    if (mapElementRef.current && typeof mapElementRef.current.flyCameraTo === 'function') {
      setIsFlying(true);
      setFlightStatus(`Flug nach ${hub.name}...`);
      mapElementRef.current.flyCameraTo({
        endCamera: {
          center: { lat: hub.lat, lng: hub.lng, altitude: 25 },
          range: 4500,
          tilt: 52,
          heading: 45
        },
        durationMillis: 2200
      });
      setTimeout(() => {
        setIsFlying(false);
        setFlightStatus(`Aufenthaltsort: ${hub.name}`);
      }, 2200);
    }
  };

  // Toggle filter categories
  const handleToggleCategory = (catId: string) => {
    setActiveCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleSelectAllCategories = () => {
    setActiveCategories([
      'Sehenswürdigkeiten',
      'Attraktionen',
      'Denkmäler & Kultur',
      'Seen & Gewässer',
      'Berge',
      'Strände',
      'Freizeitparks',
      'Schwimmbäder & Thermen',
      'Tankstellen',
      'Krankenhäuser',
      'Apotheken',
      'Polizeireviere'
    ]);
  };

  const handleClearCategories = () => {
    setActiveCategories([]);
  };

  const handleAddToTour = (landmark: Landmark) => {
    if (!tourStops.some((s) => s.id === landmark.id)) {
      setTourStops((prev) => [...prev, landmark]);
    }
  };

  const handleRemoveTourStop = (stopId: string) => {
    setTourStops((prev) => prev.filter((s) => s.id !== stopId));
  };

  const handleClearTour = () => {
    setTourStops([]);
    if (isTouring) stopTour3D();
  };

  // gmp-map-3d erwartet center als Objekt (LatLngAltitudeLiteral); memoisiert, damit Re-Renders die Kamera nicht zurücksetzen
  const mapCenter = useMemo(
    () => ({ lat: currentLocation.lat, lng: currentLocation.lng, altitude: 25 }),
    [currentLocation.lat, currentLocation.lng]
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. MAP ENGINE 3D CONTAINER */}
      <main className="absolute inset-0 z-0">
        <div id="map-3d-root" className="relative w-full h-full">
          {mapsLoaded && !loadError ? (
            <gmp-map-3d
              ref={(el: any) => {
                mapElementRef.current = el;
              }}
              mode={(mapMode === '3d' ? 'hybrid' : mapMode).toUpperCase()}
              heading={45}
              tilt={52}
              range={4800}
              center={mapCenter}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-300">
              {loadError ? (
                <div className="p-6 rounded-2xl bg-slate-900 border border-white/10 text-center max-w-sm space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-sm font-semibold">{loadError}</p>
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                  >
                    API-Schlüssel prüfen
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-9 h-9 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
                  <p className="font-mono text-xs text-cyan-300">
                    Kroatien 3D-Welt wird initialisiert...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Flying indicator icon */}
          {isFlying && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 shadow-xl text-cyan-400 text-xs font-semibold">
                <Video className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-slate-200">{flightStatus}</span>
              </div>
            </div>
          )}

          {/* Tour Active Stop Bar */}
          {isTouring && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-cyan-400/40 shadow-2xl text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="font-bold text-white">
                  3D-Tour: Stopp {currentTourIndex + 1} von {tourStops.length}
                </span>
                <button
                  onClick={stopTour3D}
                  className="ml-1 p-1 rounded-md bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors cursor-pointer"
                  title="Tour beenden"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 2. CENTERED APP HEADER WITH DISCREET INFO (ℹ️) BUTTON */}
      <CleanHeader
        onOpenInfo={() => setShowHelpModal(true)}
        currentLocationName={currentLocation.name}
        isTouring={isTouring}
        assistantName={assistantName}
      />

      {/* 3. GEMINI CONVERSATIONAL TRAVEL COMPANION (100% Conversational Agency) */}
      <GeminiBottomChat
        currentLocationName={currentLocation.name}
        currentLocationCoords={{ lat: currentLocation.lat, lng: currentLocation.lng }}
        activeLandmark={activeLandmark}
        userName={userName}
        assistantName={assistantName}
        onClearActiveLandmark={() => setActiveLandmark(null)}
        onFlyToLandmark={(landmark) => flyToPoi3D(landmark)}
        onFlyToNamedPlace={handleFlyToNamedPlace}
        onAddToTour={(landmark) => handleAddToTour(landmark)}
        onActivateCategory={(catName) => {
          if (!activeCategories.includes(catName)) {
            setActiveCategories((prev) => [...prev, catName]);
          }
        }}
        onOpenPacklist={() => setShowPacklist(true)}
        onSetMapMode={(mode) => setMapMode(mode)}
        onStartTour={startTour3D}
      />

      {/* 4. BLACK SCREEN INTRO / CINEMATIC ONBOARDING (Strahlend weiß auf Tiefschwarz) */}
      <BlackScreenIntro
        isOpen={showIntro}
        onComplete={(newUserName, newAssistantName) => {
          setUserName(newUserName);
          setAssistantName(newAssistantName);
          setShowIntro(false);
          try {
            localStorage.setItem('kroatien_user_name', newUserName);
            localStorage.setItem('kroatien_assistant_name', newAssistantName);
            localStorage.setItem('kroatien_intro_completed', 'true');
          } catch {}
        }}
        initialUserName={userName}
        initialAssistantName={assistantName}
      />

      {/* 5. HELP & COMMAND GUIDE MODAL (Diskretes ℹ️ Info-Icon) */}
      <HelpGuideModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        userName={userName}
        assistantName={assistantName}
        onRestartIntro={() => {
          setShowHelpModal(false);
          setShowIntro(true);
        }}
        onOpenApiKeyModal={() => {
          setShowHelpModal(false);
          setShowApiKeyModal(true);
        }}
        onOpenPacklist={() => {
          setShowHelpModal(false);
          setShowPacklist(true);
        }}
      />

      {/* 6. INTERAKTIVES PACKLISTEN-WIDGET FÜR KROATIEN */}
      <PacklistWidget
        isOpen={showPacklist}
        onClose={() => setShowPacklist(false)}
        assistantName={assistantName}
      />

      {/* 5. API KEY MODAL */}
      <AnimatePresence>
        {showApiKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/15 p-5 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-sm">API-Schlüssel (Karte &amp; KI-Chat)</h3>
                </div>
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Derzeit wird der öffentliche Maps Demo-Key für fotorealistische 3D-Karten verwendet.
                Du kannst hier deinen eigenen Google Maps JavaScript API-Schlüssel hinterlegen.
              </p>

              <input
                type="text"
                value={keyInputValue}
                onChange={(e) => setKeyInputValue(e.target.value)}
                placeholder="Eigenen API-Schlüssel eingeben..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/20 text-xs text-white outline-none focus:border-cyan-400 font-mono"
              />

              <div className="pt-2 space-y-2 border-t border-white/10">
                <h4 className="font-bold text-xs">Gemini API-Schlüssel (KI-Chat)</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {hasGeminiKey
                    ? 'Ein Gemini-Schlüssel ist auf diesem Gerät gespeichert.'
                    : 'Für KI-Antworten im Chat: eigenen Gemini-Schlüssel eintragen. Er bleibt nur auf diesem Gerät.'}
                </p>
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="Gemini-Schlüssel eingeben..."
                  autoComplete="off"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/20 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                />
                {hasGeminiKey && (
                  <button
                    onClick={() => {
                      setStoredGeminiKey('');
                      setHasGeminiKey(false);
                      setGeminiKeyInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Gemini-Schlüssel entfernen
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    localStorage.removeItem('gmp_custom_api_key');
                    localStorage.removeItem('custom_maps_api_key');
                    setApiKey(OFFICIAL_DEMO_API_KEY);
                    setShowApiKeyModal(false);
                    window.location.reload();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Demo-Key nutzen
                </button>
                <button
                  onClick={() => {
                    if (keyInputValue.trim()) {
                      localStorage.setItem('gmp_custom_api_key', keyInputValue.trim());
                      setApiKey(keyInputValue.trim());
                    }
                    if (geminiKeyInput.trim()) {
                      setStoredGeminiKey(geminiKeyInput);
                      setHasGeminiKey(true);
                    }
                    setShowApiKeyModal(false);
                    window.location.reload();
                  }}
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                >
                  Speichern
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
