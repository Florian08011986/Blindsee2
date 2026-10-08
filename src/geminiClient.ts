/**
 * Zweck:     Gemini-Chat für den Kroatien Reisebegleiter ohne eigenen Server.
 *            Reihenfolge: 1) lokal gespeicherter Gemini-Schlüssel (direkter REST-Aufruf),
 *            2) optionales Backend (VITE_API_BASE_URL + /api/gemini), 3) Offline-Fallback-Text.
 * Parameter: askGemini(request: GeminiRequest) -> Promise<string>
 * Revision:  v1.0 (2026-10-07)
 *
 * Datenschutz: Der Schlüssel liegt ausschließlich im localStorage des Geräts und wird nur
 *              per Header an generativelanguage.googleapis.com gesendet.
 */

export interface GeminiLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface GeminiHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface GeminiRequest {
  prompt: string;
  location: GeminiLocation;
  category?: string;
  history: GeminiHistoryItem[];
}

export const GEMINI_KEY_STORAGE = 'gemini_api_key';
const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Liest den lokal gespeicherten Gemini-Schlüssel (leer, wenn keiner vorhanden ist). */
export function getStoredGeminiKey(): string {
  try {
    return (localStorage.getItem(GEMINI_KEY_STORAGE) || '').trim();
  } catch {
    return '';
  }
}

/** Speichert den Gemini-Schlüssel lokal; ein leerer Wert löscht ihn. */
export function setStoredGeminiKey(key: string): void {
  try {
    const clean = key.trim();
    if (clean) {
      localStorage.setItem(GEMINI_KEY_STORAGE, clean);
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
    }
  } catch {
    /* localStorage nicht verfügbar: ignorieren */
  }
}

/** Baut die System-Anweisung (inhaltlich identisch zu server.ts). */
export function buildSystemInstruction(location: GeminiLocation, category?: string): string {
  return `Du bist der offizielle, hochkompetente KI-Reisebegleiter für Kroatien im Projekt "Kroatien Reisebegleiter" (Copyright bei Florian Finke).
Deine Aufgaben:
1. Beantworte alle Fragen zu Kroatien, Regionen, Städten, Sehenswürdigkeiten, Naturwundern, Stränden, Seen, Bergen und Aktivitäten auf Deutsch, sympathisch und präzise.
2. Wenn nach Infrastruktur gefragt wird (z. B. Apotheken, Krankenhäuser, Tankstellen, Polizei), gib konkrete, hilfreiche Detailinformationen wie z. B. typische Öffnungszeiten (z. B. Apotheken meist 7:00-20:00 Uhr, Notdienst 24h), Notrufnummern (112, Polizei 192, Rettung 194) oder Benzinpreise (in Kroatien aktuell bei INA/Petrol ca. 1,45 € - 1,52 € / Liter für Eurosuper 95, 1,40 € - 1,48 € für Eurodiesel).
3. Wenn nach Freizeitparks, Thermen, Schwimmbädern oder Sehenswürdigkeiten gefragt wird, nenne realistische Öffnungszeiten, Eintrittspreise (in Euro) und praktische Tipps.
4. Wenn der Nutzer nach einer Route oder Tour fragt, erstelle eine logische Reiseroute mit Entfernungen und Highlights.
5. Halte Antworten klar strukturiert, einladend und formatiere wichtige Namen und Orte gut lesbar mit Markdown.
Aktueller Standort des Nutzers: ${location.name || 'Kroatien'} (Lat: ${location.lat}, Lng: ${location.lng}).
Aktiver Filter: ${category || 'Alle'}.`;
}

/** Baut die Gesprächsliste (letzte 6 Verlaufseinträge + aktuelle Frage). */
export function buildContents(history: GeminiHistoryItem[], prompt: string) {
  const past = history.slice(-6).map((item) => ({
    role: item.role === 'user' ? 'user' : 'model',
    parts: [{ text: item.text }]
  }));
  return [...past, { role: 'user', parts: [{ text: prompt }] }];
}

/** Extrahiert den Antworttext aus einer generateContent-Antwort. */
export function extractReplyText(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p: any) => (typeof p?.text === 'string' ? p.text : '')).join('').trim();
}

/** Direkter Aufruf der Gemini-REST-API mit dem lokalen Schlüssel. */
export async function callGeminiDirect(key: string, req: GeminiRequest): Promise<string> {
  const response = await fetch(`${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemInstruction(req.location, req.category) }] },
      contents: buildContents(req.history, req.prompt),
      generationConfig: { temperature: 0.7 }
    })
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.error?.message ? String(data.error.message).slice(0, 160) : `HTTP ${response.status}`;
    throw new Error(detail);
  }
  const text = extractReplyText(data);
  if (!text) throw new Error('Leere Antwort von Gemini');
  return text;
}

/** Aufruf des optionalen Backends (server.ts bzw. gehostete Variante). */
export async function callBackend(baseUrl: string, req: GeminiRequest): Promise<string> {
  const response = await fetch(`${baseUrl}/api/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  const data = await response.json();
  const text = data?.reply || '';
  if (!response.ok || !text) throw new Error(data?.error || `HTTP ${response.status}`);
  return text;
}

/** Statischer Offline-Text (Inhalt wie der Fallback in server.ts), klar als solcher gekennzeichnet. */
export function buildOfflineFallback(locationName: string, reason: string): string {
  const loc = locationName || 'Kroatien';
  return (
    `**Offline-Info für ${loc}** _(KI nicht verbunden: ${reason})_\n\n` +
    `• **Notrufe**: Allgemein **112**, Polizei **192**, Rettung **194**.\n` +
    `• **Apotheken**: meist Mo–Sa 07:00–20:00 Uhr, mit wechselndem 24h-Notdienst.\n` +
    `• **Karte**: Nutze das Filter-Menü für Sehenswürdigkeiten, Strände, Tankstellen, Krankenhäuser und mehr.\n\n` +
    `Für KI-Antworten: Menü → Einstellungen → API-Schlüssel anpassen → eigenen Gemini-Schlüssel eintragen.`
  );
}

/** Orchestrierung: Server-Backend (/api/gemini) → lokaler Schlüssel → Offline-Fallback. */
export async function askGemini(req: GeminiRequest): Promise<string> {
  const baseUrl = ((import.meta as any).env?.VITE_API_BASE_URL ?? '').toString().trim();
  try {
    return await callBackend(baseUrl, req);
  } catch (backendErr: any) {
    const key = getStoredGeminiKey();
    if (key) {
      try {
        return await callGeminiDirect(key, req);
      } catch (err: any) {
        return buildOfflineFallback(req.location.name, `Gemini-Fehler: ${err?.message || 'unbekannt'}`);
      }
    }
    return buildOfflineFallback(req.location.name, `Backend nicht erreichbar: ${backendErr?.message || 'unbekannt'}`);
  }
}
