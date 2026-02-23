/**
 * Local dev server for /api/chat - alternative to vercel dev.
 * Run with: npm run dev (starts both Vite and this server)
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Load .env BEFORE importing api/chat (which reads process.env at load time)
const envResult = dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env.local') });

const app = express();
const PORT = Number(process.env.API_PORT) || 3002;

app.use(express.json());

// Health check: GET /health
app.get('/health', (_req, res) => {
  const groq = !!process.env.GROQ_API_KEY;
  const gemini = !!process.env.GEMINI_API_KEY;
  const configured = groq || gemini;
  res.json({
    status: 'ok',
    message: 'API server is running',
    configured,
    providers: { groq, gemini },
    hint: !configured ? 'Add GROQ_API_KEY or GEMINI_API_KEY to .env' : undefined,
    envLoaded: !!envResult.parsed,
    envFile: envResult.error ? `Not found: ${envResult.error.message}` : 'Loaded from .env',
  });
});

// Health check: GET /api/health
app.get('/api/health', (_req, res) => {
  const groq = !!process.env.GROQ_API_KEY;
  const gemini = !!process.env.GEMINI_API_KEY;
  const configured = groq || gemini;
  res.json({
    status: 'ok',
    message: 'API server is running',
    configured,
    providers: { groq, gemini },
    hint: !configured ? 'Add GROQ_API_KEY or GEMINI_API_KEY to .env' : undefined,
    envLoaded: !!envResult.parsed,
    envFile: envResult.error ? `Not found: ${envResult.error.message}` : 'Loaded from .env',
  });
});

// GET /api/chat - status (must match api/chat.ts for consistency)
app.get('/api/chat', async (_req, res) => {
  const { default: handler } = await import('../api/chat');
  await handler({ method: 'GET' }, res);
});

// POST /api/chat - import handler after env is loaded
app.post('/api/chat', async (req, res) => {
  const { default: handler } = await import('../api/chat');
  const vercelReq = { method: req.method, body: req.body };
  const vercelRes = {
    setHeader: (name: string, value: string) => res.setHeader(name, value),
    status: (code: number) => ({ json: (body: unknown) => res.status(code).json(body) }),
    json: (body: unknown) => res.json(body),
  };
  await handler(vercelReq, vercelRes);
});

app.listen(PORT, () => {
  const groq = !!process.env.GROQ_API_KEY;
  const gemini = !!process.env.GEMINI_API_KEY;
  const configured = groq || gemini;
  console.log(`[API] Chat server at http://localhost:${PORT}`);
  console.log(`[API] Health: http://localhost:${PORT}/health`);
  console.log(`[API] Groq: ${groq ? 'configured' : 'NOT SET'} | Gemini: ${gemini ? 'configured' : 'NOT SET'}`);
  if (!configured) {
    console.warn('[API] Add GROQ_API_KEY (free) or GEMINI_API_KEY to .env');
  }
});
