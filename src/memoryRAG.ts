/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * On-Device Vector- & RAG-Gedächtnis für den Kroatien Reisebegleiter.
 * 
 * Funktionsweise:
 * - 100% lokal & offline (keine externen API-Keys nötig).
 * - Generiert deterministische, normalisierte TF-IDF & Subword-N-Gram-Vektoren (128 Dimensionen).
 * - Berechnet Cosinus-Ähnlichkeit (Cosine Similarity) zwischen Abfrage und Vektor-Gedächtnis.
 * - Injiziert die relevantesten Einträge in den System-Prompt von Gemini (Retrieval Augmented Generation).
 * - Speichert neue Erinnerungen persistent im localStorage.
 */

export type MemoryCategory =
  | 'praeferenz'
  | 'unterkunft'
  | 'aktivitaet'
  | 'reisedaten'
  | 'packliste'
  | 'florian_tipps'
  | 'allgemein';

export interface MemoryRecord {
  id: string;
  text: string;
  category: MemoryCategory;
  timestamp: number;
  embedding: number[];
  isDefault?: boolean;
}

const STORAGE_KEY = 'kroatien_rag_vector_memory_v3';
const VECTOR_DIM = 128;

// =========================================================================
// 1. DETERMINISTISCHE VEKTOR-EMBEDDING-ENGINE (128-DIM TF-IDF / N-GRAM HASH)
// =========================================================================

/**
 * Erzeugt einen normalisierten 128-dimensionalen Embedding-Vektor für einen Text.
 * Verwendet bereinigte Subword-N-Gramme und Wort-Hashes mit Frequenz-Gewichtung.
 */
export function computeEmbedding(text: string): number[] {
  const vec = new Float64Array(VECTOR_DIM);
  if (!text || !text.trim()) {
    return Array.from(vec);
  }

  const clean = text.toLowerCase().replace(/[^a-z0-9äöüß]/gi, ' ');
  const words = clean.split(/\s+/).filter((w) => w.length > 1);

  // 1. Wort-Hashing mit Frequenzgewichtung
  for (const word of words) {
    let h = 2166136261;
    for (let i = 0; i < word.length; i++) {
      h ^= word.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % VECTOR_DIM;
    vec[idx] += 1.8;

    // 2. Character 3-Gramme für robuste morphologische Ähnlichkeit (z.B. "strände" <-> "strand")
    if (word.length >= 3) {
      for (let i = 0; i <= word.length - 3; i++) {
        const trigram = word.substring(i, i + 3);
        let th = 2166136261;
        for (let j = 0; j < trigram.length; j++) {
          th ^= trigram.charCodeAt(j);
          th = Math.imul(th, 16777619);
        }
        const tIdx = Math.abs(th) % VECTOR_DIM;
        vec[tIdx] += 0.6;
      }
    }
  }

  // 3. Euklidische L2-Normalisierung für exakte Cosinus-Ähnlichkeit
  let sumSq = 0;
  for (let i = 0; i < VECTOR_DIM; i++) {
    sumSq += vec[i] * vec[i];
  }

  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIM; i++) {
      vec[i] /= norm;
    }
  }

  return Array.from(vec);
}

/**
 * Berechnet die Cosinus-Ähnlichkeit zwischen zwei normalisierten Vektoren (-1.0 bis 1.0).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

// =========================================================================
// 2. GEMEINSAME BASIS-GEDÄCHTNIS-EINTRÄGE (FEINGLIEDRIGE CHUNKS AUS DEM REISEPLAN)
// =========================================================================

const DEFAULT_MEMORIES_DATA: Array<{ text: string; category: MemoryCategory }> = [
  // --- REISEDATEN, ANREISE & FLUG ---
  {
    text: 'Reisedaten Kroatien: Unser Familienurlaub findet vom 12. bis 19. Oktober 2026 (Montag bis Montag) in Nord-Dalmatien statt.',
    category: 'reisedaten'
  },
  {
    text: 'Abfahrt zu Hause: Am Montag, 12.10.2026 fahren wir gegen 04:45 Uhr morgens mit dem Auto los Richtung Prag.',
    category: 'reisedaten'
  },
  {
    text: 'Parkplatz Prag Ankunftszeit: Am Montag, 12.10.2026 müssen wir um 07:00 Uhr am gebuchten Parkplatz in Prag sein (Fahrzeit beträgt ca. 1:50 Stunden).',
    category: 'reisedaten'
  },
  {
    text: 'Wichtig für die Fahrt: Unbedingt daran denken, den Kindersitz für die Fahrt und für den Mietwagen mitzunehmen!',
    category: 'packliste'
  },
  {
    text: 'Parkplatz Prag Adresse: Gebuchter Parkplatz ist GO parking, s.r.o, Adresse: Ke Kopanině 406, 252 67 Tuchoměřice (direkt am Flughafen Prag Václav Havel).',
    category: 'reisedaten'
  },
  {
    text: 'Parkplatz Prag Schranken-PIN: Der PIN-Code für die Einfahrtschranke bei GO parking lautet PIN 297497. Der Go Parking Voucher liegt digital vor.',
    category: 'reisedaten'
  },
  {
    text: 'Hinflug nach Zadar: Abflug ist am Montag, 12.10.2026 um 09:50 Uhr ab Flughafen Prag nach Zadar (Kroatien).',
    category: 'reisedaten'
  },
  {
    text: 'Flug-Sitzplätze: Unsere gebuchten Sitzplätze im Flugzeug nach Zadar sind 15 B, 15 C, 15 D, 15 E und 15 F. Flugtickets liegen digital vor.',
    category: 'reisedaten'
  },
  {
    text: 'Landung in Zadar: Geplante Ankunfts- und Landezeit am Flughafen Zadar ist am Montag, 12.10.2026 um 11:15 Uhr.',
    category: 'reisedaten'
  },
  {
    text: 'Mietwagen Abholung: Mietwagen direkt nach der Landung am Flughafen Zadar abholen bei Avis / Car Hire Market.',
    category: 'reisedaten'
  },
  {
    text: 'Mietwagen Buchungsnummer: Buchungsnummer für den Avis Mietwagen lautet CN982799134120. Mietwagen-Voucher liegt digital vor.',
    category: 'reisedaten'
  },

  // --- UNTERKUNFT & RESORT ---
  {
    text: 'Unterkunft Name: Zaton Holiday Resort - Apartments. Unsere feste Urlaubsresidenz für die Woche vom 12. bis 19. Oktober 2026.',
    category: 'unterkunft'
  },
  {
    text: 'Unterkunft Adresse: Zaton Holiday Resort, Dražnikova ul. 78, 23232 Nin, Kroatien (ca. 15 km nördlich von Zadar).',
    category: 'unterkunft'
  },
  {
    text: 'Unterkunft Reservierungscode: Reservation Code für Zaton Holiday Resort Apartments lautet PH30024257.',
    category: 'unterkunft'
  },
  {
    text: 'Unterkunft Lage & Umgebung: Das Resort liegt direkt am Meer mit flach abfallendem Sand- und Kiesstrand, ideal und sicher für Kinder (Leon, Mia und Lea).',
    category: 'unterkunft'
  },

  // --- FESTE TERMINE & AKTIVITÄTEN ---
  {
    text: 'Fester Termin Bootsausflug: Freitag, 16.10.2026 um 08:00 Uhr morgens ist unser fester Bootsausflug gebucht. Ticket liegt digital vor.',
    category: 'aktivitaet'
  },
  {
    text: 'Zadar Altstadt & Shopping: Schlendern durch die historische Altstadt von Zadar und ein lokales Kroatien-Trikot für die Kinder kaufen.',
    category: 'aktivitaet'
  },
  {
    text: 'Must-See Zadar zum Sonnenuntergang: Meeresorgel (Morske orgulje) und der Gruß an die Sonne (Pozdrav Suncu) an der Uferpromenade von Zadar pünktlich zum Sonnenuntergang besuchen.',
    category: 'aktivitaet'
  },
  {
    text: 'Bäckerei Geheimtipp Golub: Günstige und köstliche Backwaren und Burek vom letzten Besuch gibt es bei der Bäckerei "Golub - Pekarna Bakery" nördlich von Zadar (Maps: https://maps.app.goo.gl/7PV9BiefGq7DweKq8).',
    category: 'florian_tipps'
  },
  {
    text: 'Tagesausflug Plitvicer Seen: Weltberühmter Nationalpark Plitvicer Seen mit 16 smaragdgrünen Kaskadenseen und Wasserfällen (Maps: https://maps.app.goo.gl/QYrfhnKWRmzYxPhp8).',
    category: 'aktivitaet'
  },
  {
    text: 'Tagesausflug Nationalpark Krka: Spektakuläre Fluss- und Wasserfalllandschaft mit Skradinski Buk (Maps: https://maps.app.goo.gl/Rv8V4wGqxcHqVfCD8).',
    category: 'aktivitaet'
  },
  {
    text: 'Aussichtsplattform Krka: Kurz vor Krka liegt die fantastische Aussichtsplattform "Vidikovac Krka - Istok" bei Lozovac mit Panoramablick auf die Schlucht (Maps: https://maps.app.goo.gl/VVu3SpRCKP39EEK48).',
    category: 'aktivitaet'
  },

  // --- KINDER-HIGHLIGHTS (LEON, MIA & LEA) ---
  {
    text: 'Kinder Schlechtwetter-Plan Lea: Bei Regen oder starker Hitze gibt es für Lea einen kleinen Indoorspielplatz im Einkaufszentrum Supernova Zadar (Twister Fun Park, Maps: https://maps.app.goo.gl/c17hxuW5Uzg6PBJH8).',
    category: 'aktivitaet'
  },
  {
    text: 'Kinder Action-Highlight Leon: Absolutes Highlight für Leon ist der Jump Park / Moon Fun Park (Trampolin- und Actionpark) im Einkaufszentrum in Zadar (Maps: https://maps.app.goo.gl/c17hxuW5Uzg6PBJH8).',
    category: 'aktivitaet'
  },
  {
    text: 'Kinder-Verantwortung: Der KI-Reisebegleiter übernimmt aktiv die Ausflugs-, Sicherheits-, Pausen- und Tagesplanung für Leon, Mia und Lea.',
    category: 'praeferenz'
  },

  // --- SICHERHEIT & NOTRUFNUMMERN ---
  {
    text: 'Notrufnummern Kroatien: Feuerwehr 193 (Vatrogasci), Polizei 192 (Policija), Notarzt/Krankenwagen 194 (Hitna), EU-Notruf 112, Seenotrettung 195, Pannenhilfe HAK 1987.',
    category: 'florian_tipps'
  },
  {
    text: 'Giftnotruf Kroatien: Bei Vergiftungen oder giftigen Bissen/Stichen (z.B. Petermännchen, Seeigel, giftige Pflanzen) sofort den Giftnotruf Kroatien anrufen: +385 1 2348 342 (24h Giftkontrollzentrum KBC Zagreb).',
    category: 'florian_tipps'
  },
  {
    text: 'Florian hat festgelegt: Vor Abflug zwingend Badeschuhe und Neoprenschuhe (z.B. die schwarzen Wasserschuhe) für Kiesel- und Felsstrände einpacken, um vor scharfen Steinen und Seeigeln geschützt zu sein.',
    category: 'packliste'
  },
  {
    text: 'Florian hat festgelegt: Auf kroatischen Autobahnen spart die ENC-Mautbox oder kontaktlose Kartenzahlung an den Mautstationen sehr viel Wartezeit gegenüber Bargeld.',
    category: 'florian_tipps'
  },

  // --- PACKLISTE & TO-DO CHECKLISTE ---
  {
    text: 'Florians Packliste Wichtiges & Dokumente: Personalausweis, Portmonee mit Geld, Krankenkassenkarte, Handy, Ladekabel, 1-2 Powerbanks/externe Akkus, Kopfhörer, Raucherzeug, kleine Bauchtasche.',
    category: 'packliste'
  },
  {
    text: 'Florians Packliste Kleidung: Unterhosen, Socken, T-Shirts, Pullover, lange und kurze Hosen, Sonnenbrille, dünne Jacke, Wechselschuhe.',
    category: 'packliste'
  },
  {
    text: 'Florians Packliste Badsachen & Hygiene: Zahnbürste, Zahnpasta, Duschgel, Shampoo, Deo, Haarspray (unter 150 ml), Haarbürste, persönliche Medizin, Nagelknipser.',
    category: 'packliste'
  },
  {
    text: 'Florians Packliste Baden & Schlafen: Badehose, schwarze Badeschuhe, Mini-Handtuch, kurzer Schlafanzug.',
    category: 'packliste'
  },
  {
    text: 'Florians Packliste Beschäftigung & Werkzeug: Buch, Trinkflasche und Lochsäge.',
    category: 'packliste'
  },
  {
    text: 'Florians To-Do-Checkliste vor der Abreise: Blumen gießen, offene Flaschen wegbringen, Müll rausbringen und prüfen, ob alles auf dem Balkon regensicher ist.',
    category: 'packliste'
  }
];

function buildDefaultRecords(): MemoryRecord[] {
  return DEFAULT_MEMORIES_DATA.map((item, idx) => ({
    id: `seed-memory-${idx + 1}`,
    text: item.text,
    category: item.category,
    timestamp: Date.now() - (1000 * 60 * 60 * 24 * (8 - idx)),
    embedding: computeEmbedding(item.text),
    isDefault: true
  }));
}

// =========================================================================
// 3. PERSISTENZ & CRUD-OPERATIONEN
// =========================================================================

/**
 * Lädt alle Gedächtniseinträge aus dem Speicher (inkl. initialer Seed-Daten).
 */
export function getAllMemories(): MemoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: MemoryRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sicherstellen, dass Embeddings vorhanden sind
        return parsed.map((m) => {
          if (!m.embedding || m.embedding.length !== VECTOR_DIM) {
            return { ...m, embedding: computeEmbedding(m.text) };
          }
          return m;
        });
      }
    }
  } catch (err) {
    console.warn('Fehler beim Laden des RAG-Gedächtnisses:', err);
  }

  const defaults = buildDefaultRecords();
  saveAllMemories(defaults);
  return defaults;
}

/**
 * Speichert alle Gedächtniseinträge im localStorage.
 */
export function saveAllMemories(records: MemoryRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Fehler beim Speichern des RAG-Gedächtnisses:', err);
  }
}

/**
 * Fügt einen neuen Gedächtniseintrag hinzu (berechnet sofort Vektor-Embedding).
 */
export function addMemory(text: string, category: MemoryCategory = 'allgemein'): MemoryRecord {
  const clean = text.trim();
  const current = getAllMemories();
  const newRecord: MemoryRecord = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    text: clean,
    category,
    timestamp: Date.now(),
    embedding: computeEmbedding(clean),
    isDefault: false
  };

  const updated = [newRecord, ...current];
  saveAllMemories(updated);
  return newRecord;
}

/**
 * Löscht einen Gedächtniseintrag anhand der ID.
 */
export function deleteMemory(id: string): void {
  const current = getAllMemories();
  const updated = current.filter((m) => m.id !== id);
  saveAllMemories(updated);
}

/**
 * Setzt das Gedächtnis auf die Standard-Einträge von Florian zurück.
 */
export function resetMemoriesToDefault(): MemoryRecord[] {
  const defaults = buildDefaultRecords();
  saveAllMemories(defaults);
  return defaults;
}

// =========================================================================
// 4. SEMANTISCHE RAG-SUCHE (RETRIEVAL AUGMENTED GENERATION)
// =========================================================================

export interface RAGSearchResult {
  memory: MemoryRecord;
  score: number;
}

/**
 * Sucht semantisch die relevantesten Gedächtniseinträge für eine gegebene Anfrage.
 */
export function queryRAGMemories(
  query: string,
  topK: number = 8,
  minScore: number = 0.10
): RAGSearchResult[] {
  if (!query || !query.trim()) return [];

  const queryEmbedding = computeEmbedding(query);
  const all = getAllMemories();

  const scored: RAGSearchResult[] = all.map((m) => {
    const score = cosineSimilarity(queryEmbedding, m.embedding);
    return { memory: m, score };
  });

  // Nach Relevanz absteigend sortieren
  scored.sort((a, b) => b.score - a.score);

  // Filtern nach Mindest-Ähnlichkeit und Top-K limitieren
  return scored.filter((item) => item.score >= minScore).slice(0, topK);
}

/**
 * Erzeugt einen formatierten Markdown-Kontextblock für den System-Prompt von Gemini.
 */
export function formatRAGContextForPrompt(query: string, topK: number = 8): string {
  const results = queryRAGMemories(query, topK, 0.10);
  if (results.length === 0) return '';

  const bulletPoints = results
    .map((r) => `• [Relevanz ${(r.score * 100).toFixed(0)}% | Kategorie: ${r.memory.category}]: ${r.memory.text}`)
    .join('\n');

  return `\n\n# GEMEINSAMES GEDÄCHTNIS (RAG-VEKTORSPEICHER):\nFolgende relevante Fakten stammen aus dem gemeinsamen Vektor-Gedächtnis mit Florian für diese Anfrage:\n${bulletPoints}\nNutze dieses Wissen aktiv und persönlich in deiner Antwort!`;
}

// =========================================================================
// 5. INTENT-ERKENNUNG FÜR PROMPTS ("Merke dir...", "Ich wohne in...", etc.)
// =========================================================================

/**
 * Erkennt, ob der Nutzer den Assistenten bittet, sich etwas zu merken oder zu notieren.
 * Gibt den extrahierten Merk-Inhalt zurück oder null.
 */
export function detectRememberIntent(prompt: string): { textToRemember: string; category: MemoryCategory } | null {
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  const patterns: Array<{ regex: RegExp; category: MemoryCategory }> = [
    { regex: /(?:merke dir|merk dir|bitte merke dir)\s*[:,]?\s*(.+)/i, category: 'allgemein' },
    { regex: /(?:erinnere dich daran|erinnere dich daran dass|erinnere dich|vergiss nicht)\s*[:,]?\s*(.+)/i, category: 'allgemein' },
    { regex: /(?:notiere|notier dir|schreib dir auf|speichere)\s*[:,]?\s*(.+)/i, category: 'allgemein' },
    { regex: /(?:wir wohnen in|ich wohne in|unser hotel ist|meine unterkunft ist|wir schlafen in)\s*(.+)/i, category: 'unterkunft' },
    { regex: /(?:ich mag|wir mögen|unsere vorliebe ist|ich esse gerne|wir lieben)\s*(.+)/i, category: 'praeferenz' },
    { regex: /(?:wir fliegen am|unser rückflug ist|unser hinflug ist|unser urlaub geht bis)\s*(.+)/i, category: 'reisedaten' }
  ];

  for (const p of patterns) {
    const match = trimmed.match(p.regex);
    if (match && match[1] && match[1].trim().length > 3) {
      let content = match[1].trim();
      // Wenn es z.B. "ich wohne in Hotel Park" war, säubern
      if (p.category === 'unterkunft' && !content.toLowerCase().startsWith('unterkunft')) {
        content = `Unterkunft: ${content}`;
      } else if (p.category === 'praeferenz' && !content.toLowerCase().startsWith('präferenz')) {
        content = `Präferenz: ${content}`;
      } else if (p.category === 'reisedaten' && !content.toLowerCase().startsWith('reisedaten')) {
        content = `Reisedaten: ${content}`;
      }
      return { textToRemember: content, category: p.category };
    }
  }

  // Direkte Kurzerkennung
  if (lower.startsWith('merke:') || lower.startsWith('notiz:')) {
    const text = trimmed.substring(trimmed.indexOf(':') + 1).trim();
    if (text.length > 2) {
      return { textToRemember: text, category: 'allgemein' };
    }
  }

  return null;
}
