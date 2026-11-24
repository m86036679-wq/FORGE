// Netlify Function: Groq-Proxy. Der Schlüssel liegt nur serverseitig (GROQ_API_KEY).
const OK_MODELS = ['llama', 'meta-llama', 'qwen', 'openai/gpt-oss'];
const MAX_BODY = 6 * 1024 * 1024;
const H = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const out = (statusCode, obj) => ({ statusCode, headers: H, body: JSON.stringify(obj) });

exports.handler = async (event) => {
  const method = event.httpMethod;
  if (method === 'GET') return out(200, { ok: true, configured: !!process.env.GROQ_API_KEY });
  if (method !== 'POST') return out(405, { error: 'Nur POST erlaubt' });
  const hd = event.headers || {};
  const origin = hd.origin || hd.Origin;
  const allowed = process.env.ALLOWED_ORIGIN;
  if (allowed && origin !== allowed) return out(403, { error: 'Origin nicht erlaubt' });
  const key = process.env.GROQ_API_KEY;
  if (!key) return out(500, { error: 'GROQ_API_KEY fehlt' });
  let raw = event.body || '';
  if (event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');
  if (Buffer.byteLength(raw) > MAX_BODY) return out(413, { error: 'Anfrage zu groß' });
  let b;
  try { b = JSON.parse(raw); } catch (e) { return out(400, { error: 'Ungültiges JSON' }); }
  if (!b || typeof b.model !== 'string' || !OK_MODELS.some((p) => b.model.startsWith(p))) return out(400, { error: 'Modell nicht erlaubt' });
  if (!Array.isArray(b.messages)) return out(400, { error: 'messages fehlt' });
  const body = { model: b.model, messages: b.messages, max_tokens: Math.min(+b.max_tokens || 2000, 2000) };
  if (b.temperature != null) body.temperature = b.temperature;
  if (b.response_format) body.response_format = b.response_format;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify(body),
    });
    return { statusCode: r.status, headers: H, body: await r.text() };
  } catch (e) {
    return out(502, { error: 'Groq nicht erreichbar' });
  }
};
