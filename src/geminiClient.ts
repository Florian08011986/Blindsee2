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

import { formatRAGContextForPrompt, generateLocalRAGAnswer } from './memoryRAG';

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
  userName?: string;
  assistantName?: string;
  ragContext?: string;
}

export const GEMINI_KEY_STORAGE = 'gemini_api_key';
const GEMINI_MODEL = 'gemini-2.5-flash';
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

/** Baut die System-Anweisung (inkl. Namen, RAG-Kontext und Action-Tag-Steuerung). */
export function buildSystemInstruction(
  location: GeminiLocation,
  category?: string,
  userName?: string,
  assistantName?: string,
  ragContext?: string
): string {
  const user = userName || 'Florian';
  const assistant = assistantName || 'Luka';

  return `Du bist ${assistant}, der persönliche, hochkompetente und herzliche KI-Reisebegleiter für ${user} in Kroatien (Projekt "Kroatien Reisebegleiter", Copyright bei Florian Finke).
Wichtiger Urlaubskontext (12. - 19. Oktober 2026):
- Familie: ${user} reist zusammen mit den Kindern Leon, Mia und Lea. Du übernimmst selbstverständlich auch die Ausflugs-, Tages- und Sicherheitsplanung für die Kinder (schattige Strände, kindgerechte Routen, Twister Indoorspielplatz für Lea bei Regen, Moon Fun Jump Park für Leon).
- Notfall-Schutz: Halte alle Notrufnummern bereit: Feuerwehr 193, Polizei 192, Krankenwagen/Notarzt 194 und Giftnotruf Kroatien (+385 1 2348 342, KBC Zagreb).
- Unterkunft & Hub: Zaton Holiday Resort - Apartments, Dražnikova ul. 78, 23232 Nin, Kroatien (ca. 15 km nördlich von Zadar, Res.-Code: PH30024257).
- Anreise (12.10.26): Losfahren um 04:45 Uhr, GO parking Prag (Adresse: Ke Kopanině 406, Tuchoměřice, Schranken-PIN: 297497, 07:00 Uhr vor Ort sein, Kindersitz mitnehmen!), Flug 09:50 - 11:15 Uhr nach Zadar (Sitzplätze 15 B-F), Mietwagen Avis (Buchungsnr. CN982799134120).
- Fester Termin: Freitag, 16.10.2026 um 08:00 Uhr Bootsausflug.
- Highlights: Zadar Meeresorgel & Gruß an die Sonne zum Sonnenuntergang, Bäckerei Golub nördlich von Zadar, Nationalpark Krka (Aussichtspunkt Vidikovac) & Plitvicer Seen.
- Packliste: Florian hat dir eine vollständige 1:1 Packliste (Badeschuhe, Personalausweis, Powerbanks bis hin zu Lochsäge und Blumen gießen) übergeben.
Deine Aufgaben:
1. Sprich ${user} freundlich und persönlich an. Beantworte alle Fragen zu Kroatien, Regionen, Städten, Sehenswürdigkeiten, Naturwundern, Stränden, Seen, Bergen und Aktivitäten auf Deutsch, sympathisch und präzise.
2. Wenn nach Infrastruktur gefragt wird (z. B. Apotheken, Krankenhäuser, Tankstellen, Polizei, Notfälle), gib konkrete, hilfreiche Detailinformationen wie z. B. typische Öffnungszeiten (z. B. Apotheken meist 7:00-20:00 Uhr, Notdienst 24h), Notrufnummern (112, Polizei 192, Feuerwehr 193, Rettung 194, Giftnotruf +385 1 2348 342, Seenotrettung 195, Pannenhilfe HAK 1987) oder Benzinpreise (in Kroatien aktuell bei INA/Petrol ca. 1,45 € - 1,52 € / Liter für Eurosuper 95, 1,40 € - 1,48 € für Eurodiesel).
3. Wenn nach Freizeitparks, Thermen, Schwimmbädern oder Sehenswürdigkeiten gefragt wird, nenne realistische Öffnungszeiten, Eintrittspreise (in Euro) und praktische Tipps (z. B. Badeschuhe wegen Seeigeln, Maut-ENC-Box).
4. Wenn der Nutzer nach einer Route oder Tour fragt, erstelle eine logische Reiseroute mit Entfernungen und Highlights.
5. Halte Antworten klar strukturiert, einladend und formatiere wichtige Namen und Orte gut lesbar mit Markdown.

AKTIONEN FÜR DIE APP:
Du kannst die 3D-Kartenansicht und Werkzeuge der App direkt steuern, indem du am Ende deiner Nachricht einen dieser Tags setzt:
- [ACTION:OPEN_HELP] wenn ${user} fragt "Hilf mir mit deinen Funktionen", nach Hilfe fragt oder deine Fähigkeiten kennenlernen will.
- [ACTION:OPEN_MEMORY] wenn ${user} fragt "Zeige mein Gedächtnis", wissen will was du dir gemerkt hast oder das Gedächtnis einsehen will.
- [ACTION:REMEMBER:Text] wenn ${user} dich bittet, dir etwas Bestimmtes zu merken oder zu notieren (z.B. Hotelname, Vorlieben).
- [ACTION:OPEN_PACKLIST] wenn ${user} die Tasche packen möchte oder nach der Packliste fragt.
- [ACTION:FLY_TO:Ortname] (z.B. [ACTION:FLY_TO:Dubrovnik], [ACTION:FLY_TO:Split], [ACTION:FLY_TO:Rovinj], [ACTION:FLY_TO:Zadar], [ACTION:FLY_TO:Pula], [ACTION:FLY_TO:Krka])
- [ACTION:START_TOUR] wenn ${user} eine 3D-Tour starten möchte.
- [ACTION:MAP_MODE:satellite] oder [ACTION:MAP_MODE:3d]

Aktueller Standort des Nutzers: ${location.name || 'Kroatien'} (Lat: ${location.lat}, Lng: ${location.lng}).
Aktiver Filter: ${category || 'Alle'}.${ragContext || ''}`;
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
  const ragCtx = req.ragContext ?? formatRAGContextForPrompt(req.prompt);
  const response = await fetch(`${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemInstruction(req.location, req.category, req.userName, req.assistantName, ragCtx) }] },
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
  const ragCtx = req.ragContext ?? formatRAGContextForPrompt(req.prompt);
  const response = await fetch(`${baseUrl}/api/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...req, ragContext: ragCtx })
  });
  const data = await response.json();
  const text = data?.reply || '';
  if (!response.ok || !text) throw new Error(data?.error || `HTTP ${response.status}`);
  return text;
}

/** Statischer Offline-Text, klar als solcher gekennzeichnet. */
export function buildOfflineFallback(
  locationName: string,
  reason: string,
  userName: string = 'Florian',
  assistantName: string = 'Luka'
): string {
  const loc = locationName || 'Kroatien';
  return (
    `**Offline-Info für ${loc}**\n\n` +
    `• **Wichtigste Notrufe**: Allgemein **112**, Polizei **192**, Rettung **194**, Giftnotruf **+385 1 2348 342**.\n` +
    `• **Apotheken**: meist Mo–Sa 07:00–20:00 Uhr, mit 24h-Notdienst.\n` +
    `• **Home Base**: Zaton Holiday Resort - Apartments (Nin bei Zadar).\n\n` +
    `💡 _Hinweis: Für freie KI-Recherchen kannst du oben rechts über ℹ️ oder durch Eingabe von „API-Schlüssel“ deinen eigenen Gemini-Schlüssel eintragen._ [ACTION:OPEN_KEY_MODAL]`
  );
}

/** Orchestrierung: Server-Backend (/api/gemini) → lokaler Schlüssel → On-Device RAG → Offline-Fallback. */
export async function askGemini(req: GeminiRequest): Promise<string> {
  const baseUrl = ((import.meta as any).env?.VITE_API_BASE_URL ?? '').toString().trim();
  const ragCtx = req.ragContext ?? formatRAGContextForPrompt(req.prompt);
  const enrichedReq: GeminiRequest = { ...req, ragContext: ragCtx };

  // 1. Zuerst optionales Backend versuchen
  try {
    return await callBackend(baseUrl, enrichedReq);
  } catch (backendErr: any) {
    // 2. Direktaufruf mit lokalem Gemini-Key versuchen
    const key = getStoredGeminiKey();
    if (key) {
      try {
        return await callGeminiDirect(key, enrichedReq);
      } catch (err: any) {
        console.warn('Gemini Direktaufruf fehlgeschlagen:', err);
      }
    }

    // 3. On-Device RAG-Vektorgedächtnis prüfen (Antwortet sofort offline auf alle Urlaubs-Fragen!)
    const localAnswer = generateLocalRAGAnswer(req.prompt, req.userName, req.assistantName);
    if (localAnswer) {
      return localAnswer;
    }

    // 4. Freundlicher Fallback ohne Menü-Verweis
    return buildOfflineFallback(req.location.name, `Offline-Modus aktiv`, req.userName, req.assistantName);
  }
}
