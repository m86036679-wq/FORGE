// Vercel Function: Groq-Proxy. Der Schlüssel liegt nur serverseitig (GROQ_API_KEY).
const OK_MODELS = ['llama', 'meta-llama', 'qwen', 'openai/gpt-oss'];
const MAX_BODY = 6 * 1024 * 1024;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ ok: true, configured: !!process.env.GROQ_API_KEY });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Nur POST erlaubt' });
  const allowed = process.env.ALLOWED_ORIGIN;
  if (allowed && req.headers.origin !== allowed) return res.status(403).json({ error: 'Origin nicht erlaubt' });
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(500).json({ error: 'GROQ_API_KEY fehlt' });
  const b = req.body && typeof req.body === 'object' ? req.body : (() => { try { return JSON.parse(req.body || ''); } catch (e) { return null; } })();
  if (!b) return res.status(400).json({ error: 'Ungültiges JSON' });
  if (Buffer.byteLength(JSON.stringify(b)) > MAX_BODY) return res.status(413).json({ error: 'Anfrage zu groß' });
  if (typeof b.model !== 'string' || !OK_MODELS.some((p) => b.model.startsWith(p))) return res.status(400).json({ error: 'Modell nicht erlaubt' });
  if (!Array.isArray(b.messages)) return res.status(400).json({ error: 'messages fehlt' });
  const body = { model: b.model, messages: b.messages, max_tokens: Math.min(+b.max_tokens || 2000, 2000) };
  if (b.temperature != null) body.temperature = b.temperature;
  if (b.response_format) body.response_format = b.response_format;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify(body),
    });
    res.status(r.status).setHeader('Content-Type', 'application/json').send(await r.text());
  } catch (e) {
    res.status(502).json({ error: 'Groq nicht erreichbar' });
  }
};

module.exports.config = { api: { bodyParser: { sizeLimit: '6mb' } } };
