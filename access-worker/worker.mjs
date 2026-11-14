// Stateless Telegram membership check. BOT_TOKEN is a Cloudflare secret only.
const encoder = new TextEncoder();
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});
export async function hmac(key, value) {
  const imported = await crypto.subtle.importKey('raw', typeof key === 'string' ? encoder.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', imported, encoder.encode(value)));
}
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
export async function validateInitData(raw, token, now = Math.floor(Date.now() / 1000)) {
  if (typeof raw !== 'string' || raw.length > 16384 || !raw) return null;
  const params = new URLSearchParams(raw);
  if (new Set(params.keys()).size !== [...params.keys()].length) return null;
  const hash = params.get('hash');
  if (!/^[a-f0-9]{64}$/.test(hash || '')) return null;
  params.delete('hash');
  const check = [...params.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, value]) => `${key}=${value}`).join('\n');
  const expected = hex(await hmac(await hmac('WebAppData', token), check));
  let diff = 0;
  for (let i = 0; i < 64; i++) diff |= hash.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff) return null;
  const date = Number(params.get('auth_date'));
  if (!Number.isSafeInteger(date) || date <= 0 || now - date > 86400 || date - now > 60) return null;
  try {
    const user = JSON.parse(params.get('user'));
    return Number.isSafeInteger(user?.id) && user.id > 0 && !user.is_bot ? { id: user.id } : null;
  } catch { return null; }
}
export function isMember(member) {
  return ['creator', 'administrator', 'member'].includes(member?.status) ||
    (member?.status === 'restricted' && member.is_member === true);
}
function channelUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 't.me' ? url.href : null; }
  catch { return null; }
}
async function telegram(env, userId, fetcher) {
  const response = await fetcher(`https://api.telegram.org/bot${env.BOT_TOKEN}/getChatMember`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.CHANNEL_ID, user_id: userId }),
    signal: AbortSignal.timeout(8000)
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error('telegram_unavailable');
  return data.result;
}
export async function handle(request, env, fetcher = fetch) {
  const origin = request.headers.get('Origin');
  const origins = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const cors = response => {
    if (origin && origins.includes(origin)) response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
    return response;
  };
  if (origin && !origins.includes(origin)) return json({ error: 'origin_denied' }, 403);
  const path = new URL(request.url).pathname;
  if (request.method === 'OPTIONS' && path === '/access') {
    const res = json({});
    res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    res.headers.set('Access-Control-Max-Age', '600');
    return cors(res);
  }
  if (request.method === 'GET' && path === '/health') return cors(json({ service: 'padla-tour-access', version: 1 }));
  if (path !== '/access') return cors(json({ error: 'not_found' }, 404));
  if (request.method !== 'POST') return cors(json({ error: 'method_not_allowed' }, 405));
  const url = channelUrl(env.CHANNEL_URL);
  if (!env.BOT_TOKEN || !/^-100\d+$/.test(env.CHANNEL_ID || '') || !url)
    return cors(json({ error: 'not_configured' }, 503));
  if (!request.headers.get('Content-Type')?.startsWith('application/json'))
    return cors(json({ error: 'json_required' }, 415));
  // Bound the body even if the client omits Content-Length.
  let raw = '', size = 0;
  try {
    const reader = request.body?.getReader();
    if (!reader) return cors(json({ error: 'invalid_request' }, 400));
    const parts = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 20000) { await reader.cancel(); return cors(json({ error: 'too_large' }, 413)); }
      parts.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.length; }
    raw = new TextDecoder().decode(bytes);
    const body = JSON.parse(raw);
    const user = await validateInitData(body.initData, env.BOT_TOKEN);
    if (!user) return cors(json({ error: 'open_in_telegram' }, 401));
    const botId = Number(env.BOT_TOKEN.split(':')[0]);
    const [bot, member] = await Promise.all([
      telegram(env, botId, fetcher), telegram(env, user.id, fetcher)
    ]);
    if (!['creator', 'administrator'].includes(bot.status))
      return cors(json({ error: 'bot_not_admin' }, 503));
    return cors(json({ allowed: isMember(member), channelUrl: url }));
  } catch (error) {
    // Never log request data or Telegram errors: they may contain the bot token.
    return cors(json({ error: error instanceof SyntaxError ? 'invalid_request' : 'temporarily_unavailable' },
      error instanceof SyntaxError ? 400 : 503));
  }
}
export default { fetch(request, env) { return handle(request, env); } };
