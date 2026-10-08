import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

// Initialize Google GenAI with runtime GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI();

// Endpoint for Gemini Chat in Croatia Travel Guide
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt, location, category, history, userName, assistantName, ragContext } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt ist erforderlich.' });
    }

    const user = userName || 'Florian';
    const assistant = assistantName || 'Luka';

    const systemInstruction = `Du bist ${assistant}, der persönliche, hochkompetente und herzliche KI-Reisebegleiter für ${user} in Kroatien (Projekt "Kroatien Reisebegleiter", Copyright bei Florian Finke).
Wichtiger Familienkontext: ${user} reist zusammen mit den Kindern Leon, Mia und Lea. Du übernimmst selbstverständlich auch die Ausflugs-, Tages- und Sicherheitsplanung für die Kinder (schattige Strände, kindgerechte Routen). Halte für ihren Schutz alle Notrufnummern bereit: Feuerwehr 193, Polizei 192, Krankenwagen/Notarzt 194 und Giftnotruf Kroatien (+385 1 2348 342). Zudem hat Florian dir eine detaillierte Packliste (von Personalausweis, schwarzen Badeschuhen und Ladekabeln bis hin zu Blumen gießen und der Lochsäge) übergeben.
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

Aktueller Standort des Nutzers: ${location ? `${location.name || 'Kroatien'} (Lat: ${location.lat}, Lng: ${location.lng})` : 'Kroatien Küstenregion'}.
Aktiver Filter: ${category || 'Alle'}.${ragContext || ''}`;

    // Construct conversation contents
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) {
        contents.push({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    let replyText = '';
    try {
      const activeKey = process.env.GEMINI_API_KEY || '';
      const client = activeKey ? new GoogleGenAI({ apiKey: activeKey }) : new GoogleGenAI();
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
      replyText = response.text || '';
    } catch (apiErr: any) {
      console.warn('Gemini API call fallback:', apiErr?.message);
      // Contextual fallback response for Croatia travel guide
      const locName = location?.name || 'Kroatien';
      replyText = `**Kroatien Reisebegleiter — Information für ${locName}:**\n\n` +
        `Im Umkreis von 25 km stehen dir alle wichtigen Orte und Einrichtungen zur Verfügung:\n` +
        `• **Sehenswürdigkeiten & Natur**: Nutze das Filter-Menü, um Schlösser, Wasserfälle, Berge und Strände einzublenden.\n` +
        `• **Infrastruktur & Notfälle**: Apotheken haben regulär Mo-Sa 07:00–20:00 Uhr geöffnet (24h-Notdienst wechselnd). Notruf: **112**, Polizei: **192**, Rettung: **194**.\n` +
        `• **Spritpreise**: Eurosuper 95 ca. 1,48 €/L, Eurodiesel ca. 1,42 €/L an den offiziellen INA- und Petrol-Tankstellen.\n\n` +
        `Tipp: Tippe auf jeden beliebigen Ort auf der Karte, um sofort im automatischen 3D-Flug herangezoomt zu werden!`;
    }

    res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Gemini server error:', error);
    res.status(500).json({
      error: 'Fehler bei der Kommunikation mit dem KI-Reisebegleiter.'
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3000;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
