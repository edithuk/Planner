/** Health check for Vercel deployment - GET /api/health */
export default function handler(_req: { method?: string }, res: { status: (n: number) => { json: (o: object) => void }; json: (o: object) => void }) {
  if (_req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const configured = !!process.env.GROQ_API_KEY;
  return res.status(200).json({
    status: 'ok',
    message: 'API is running',
    configured,
  });
}
