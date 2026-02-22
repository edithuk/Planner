interface VercelRequest {
  method?: string;
  body?: unknown;
}
interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): { json(body: unknown): void };
  json(body: unknown): void;
}

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type AIProvider = 'groq' | 'gemini';

function getAIProvider(): AIProvider | null {
  const configured = process.env.AI_PROVIDER?.toLowerCase();
  if (configured === 'groq' && GROQ_API_KEY) return 'groq';
  if (configured === 'gemini' && GEMINI_API_KEY) return 'gemini';
  if (GROQ_API_KEY) return 'groq';
  if (GEMINI_API_KEY) return 'gemini';
  return null;
}

async function generateWithGroq(
  message: string,
  placeContext: string,
  history: Array<{ role: string; content: string }>
): Promise<string> {
  const systemPrompt = `You are a helpful trip planning assistant. You help users learn about places and get suggestions for their trips.
Answer concisely and helpfully. When you have place data from the API, use it to give accurate, specific answers.
If you don't have data, you can use general knowledge but say so. Keep responses under 300 words unless the user asks for more.`;

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user', content: `${message}${placeContext}` },
  ];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message || `Groq API error: ${res.status}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('No response from Groq');
  return text;
}

async function generateWithGemini(
  message: string,
  placeContext: string,
  history: Array<{ role: string; content: string }>
): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const model = genAI.getGenerativeModel({ model: modelName });

  const chat = model.startChat({
    history: history.slice(-10).map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    })),
  });

  const result = await chat.sendMessage(`${message}${placeContext}`);
  return result.response.text();
}

async function findPlaceId(query: string): Promise<string | null> {
  if (!GOOGLE_PLACES_API_KEY) return null;
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${GOOGLE_PLACES_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const candidates = data?.candidates;
  if (candidates && candidates.length > 0) {
    return candidates[0].place_id;
  }
  return null;
}

async function getPlaceDetails(placeId: string): Promise<Record<string, unknown> | null> {
  if (!GOOGLE_PLACES_API_KEY) return null;
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,user_ratings_total,reviews,formatted_phone_number,website,opening_hours&key=${GOOGLE_PLACES_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data?.result) return data.result as Record<string, unknown>;
  return null;
}

async function textSearchPlaces(query: string): Promise<unknown[] | null> {
  if (!GOOGLE_PLACES_API_KEY) return null;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const results = data?.results;
  if (Array.isArray(results)) return results.slice(0, 8);
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const provider = getAIProvider();
    return res.status(200).json({
      status: 'ok',
      provider: provider || 'none',
      message: 'Chat API is running. Use POST to send messages.',
      configured: !!provider,
      providers: { groq: !!GROQ_API_KEY, gemini: !!GEMINI_API_KEY },
      hint: !provider ? 'Add GROQ_API_KEY or GEMINI_API_KEY to .env' : undefined,
    });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const provider = getAIProvider();
  if (!provider) {
    return res.status(503).json({
      error: 'No AI provider configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env',
      text: 'Add GROQ_API_KEY (free at console.groq.com) or GEMINI_API_KEY to .env',
    });
  }

  try {
    const body = req.body as { message?: string; conversationHistory?: Array<{ role: string; content: string }> };
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!message) {
      return res.status(400).json({ error: 'Message is required', text: 'Please enter a message.' });
    }

    const lowerMessage = message.toLowerCase();
    const isPlaceDetail =
      /\b(how is|tell me about|what about|info on|information about|describe)\b/.test(lowerMessage) ||
      /\b(is .+ good|worth visiting)\b/.test(lowerMessage);
    const isSuggestion =
      /\b(suggest|recommend|best|top|good)\b.*\b(in|near|at|for)\b/.test(lowerMessage) ||
      /\b(places?|restaurants?|cafes?|beaches?|hotels?)\b.*\b(in|near)\b/.test(lowerMessage);

    let placeContext = '';

    if (isPlaceDetail) {
      const placeId = await findPlaceId(message);
      if (placeId) {
        const details = await getPlaceDetails(placeId);
        if (details) {
          placeContext = `\n\n[Place data from Google Places API]:\n${JSON.stringify(details, null, 2)}\n\nUse this data to answer the user's question. Summarize reviews and key info naturally.`;
        } else {
          placeContext = '\n\n[Place was found but details could not be fetched. Answer based on the place name if you have general knowledge.]';
        }
      } else {
        placeContext = '\n\n[No place was found for this query. Politely say you could not find that place and suggest they try a more specific name or check spelling.]';
      }
    } else if (isSuggestion) {
      const places = await textSearchPlaces(message);
      if (places && places.length > 0) {
        const simplified = places.map((p) => {
          const r = p as Record<string, unknown>;
          return {
            name: r.name,
            formatted_address: r.formatted_address,
            rating: r.rating,
            user_ratings_total: r.user_ratings_total,
          };
        });
        placeContext = `\n\n[Places from Google Places API]:\n${JSON.stringify(simplified, null, 2)}\n\nFormat these as a friendly list with brief descriptions. Include ratings if available.`;
      } else {
        placeContext = '\n\n[No places found for this query. Suggest the user try a different location or search term.]';
      }
    }

    const history = Array.isArray(body?.conversationHistory) ? body.conversationHistory : [];
    const text =
      provider === 'groq'
        ? await generateWithGroq(message, placeContext, history)
        : await generateWithGemini(message, placeContext, history);

    return res.status(200).json({ text });
  } catch (err) {
    console.error('Chat API error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({
      error: msg,
      text: `Sorry, something went wrong: ${msg}`,
    });
  }
}
