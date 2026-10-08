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

const STORAGE_KEY = 'kroatien_rag_vector_memory';
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
// 2. GEMEINSAME BASIS-GEDÄCHTNIS-EINTRÄGE (FLORIANS KROATIEN-DOKTRIN & TIPPS)
// =========================================================================

const DEFAULT_MEMORIES_DATA: Array<{ text: string; category: MemoryCategory }> = [
  {
    text: 'Florian hat festgelegt: Vor Abflug zwingend Badeschuhe und Neoprenschuhe für Kiesel- und Felsstrände einpacken, um vor scharfen Steinen und Seeigeln geschützt zu sein.',
    category: 'packliste'
  },
  {
    text: 'Florian hat festgelegt: Auf kroatischen Autobahnen spart die ENC-Mautbox oder kontaktlose Kreditkartenzahlung an den Mautstationen sehr viel Wartezeit gegenüber Bargeld.',
    category: 'florian_tipps'
  },
  {
    text: 'Florian hat festgelegt: Notrufnummern in Kroatien sind gebührenfrei erreichbar: Allgemein 112, Polizei 192, Notarzt 194, Seenotrettung 195, Pannenhilfe HAK 1987.',
    category: 'florian_tipps'
  },
  {
    text: 'Florians Geheimtipp Split: Die Riva-Promenade und den Diokletianspalast am Abend im goldenen Licht besuchen; für spektakulären Sonnenuntergang auf den Marjan-Aussichtspunkt gehen.',
    category: 'florian_tipps'
  },
  {
    text: 'Florians Ausflugs-Tipp: Tickets für die Krka-Wasserfälle und Nationalpark Plitvicer Seen unbedingt vorab online buchen, um lange Warteschlangen am Eingang zu umgehen.',
    category: 'aktivitaet'
  },
  {
    text: 'Florians Tankstellen-Tipp: Spritpreise bei INA oder Petrol im Landesinneren sind staatlich reguliert (Super 95 ca. 1,48 €/L, Diesel ca. 1,42 €/L) und oft günstiger als direkt auf der Autobahnraststätte.',
    category: 'florian_tipps'
  },
  {
    text: 'Florians Währungs-Tipp: In Kroatien wird mit Euro (€) bezahlt. Kartenzahlung ist nahezu überall möglich, für kleine Strandbars, Kioske und Parkautomaten empfiehlt sich 20–50 € Bargeld.',
    category: 'florian_tipps'
  },
  {
    text: 'Reisepräferenz: Wir lieben idyllische, ruhige Badebuchten, glasklares türkisfarbenes Wasser und authentische dalmatinische Konobas mit frischem Fisch und Peka.',
    category: 'praeferenz'
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
  topK: number = 4,
  minScore: number = 0.12
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
export function formatRAGContextForPrompt(query: string, topK: number = 4): string {
  const results = queryRAGMemories(query, topK, 0.14);
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
