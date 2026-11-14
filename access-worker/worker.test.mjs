import test from 'node:test';
import assert from 'node:assert/strict';
import { hmac, validateInitData, isMember, handle } from './worker.mjs';
const token = '123456789:test-token-only';
const env = { BOT_TOKEN: token, CHANNEL_ID: '-1004335010847', CHANNEL_URL: 'https://t.me/test_channel',
  ALLOWED_ORIGINS: 'https://ebubab001.github.io' };
async function signed(overrides = {}) {
  const data = new URLSearchParams({ auth_date: String(Math.floor(Date.now() / 1000)),
    user: JSON.stringify({ id: 987654321, first_name: 'Test' }), ...overrides });
  const check = [...data.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\n');
  data.set('hash', Buffer.from(await hmac(await hmac('WebAppData', token), check)).toString('hex'));
  return data.toString();
}
const request = initData => new Request('https://example.workers.dev/access', {
  method: 'POST', headers: { Origin: env.ALLOWED_ORIGINS, 'Content-Type': 'application/json' },
  body: JSON.stringify({ initData })
});
const upstream = (status, admin = true) => async (_url, init) => {
  const id = JSON.parse(init.body).user_id;
  return Response.json({ ok: true, result: { status: id === 123456789 ? (admin ? 'administrator' : 'member') : status } });
};
test('valid Telegram HMAC identifies only the signed user', async () => {
  assert.deepEqual(await validateInitData(await signed(), token), { id: 987654321 });
});
test('forged, tampered, duplicate and expired identities are denied', async () => {
  const raw = await signed();
  for (const data of [raw.replace('987654321','987654322'), raw + '&user=%7B%22id%22%3A1%7D',
    await signed({ auth_date: '1' }), await signed({ auth_date: String(Math.floor(Date.now()/1000)+300) }),
    await signed({ user: '{"id":-1}' }), '', 'hash=abc'])
    assert.equal(await validateInitData(data, token), null);
  assert.equal(await validateInitData(raw, 'another-token'), null);
});
test('Telegram membership status handles departures and restricted members', () => {
  for (const status of ['creator','administrator','member']) assert.equal(isMember({status}), true);
  for (const status of ['left','kicked','unknown']) assert.equal(isMember({status}), false);
  assert.equal(isMember({status:'restricted',is_member:true}),true);
  assert.equal(isMember({status:'restricted',is_member:false}),false);
});
test('real membership grants access with exact CORS and no caching', async () => {
  const res = await handle(request(await signed()), env, upstream('member'));
  assert.equal(res.status,200); assert.equal((await res.json()).allowed,true);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'),env.ALLOWED_ORIGINS);
  assert.equal(res.headers.get('Cache-Control'),'no-store');
});
test('unsubscribed users are denied and receive a channel link', async () => {
  const res = await handle(request(await signed()),env,upstream('left'));
  assert.deepEqual(await res.json(),{allowed:false,channelUrl:env.CHANNEL_URL});
});
test('API error and missing bot administrator rights never grant access', async () => {
  for (const mock of [upstream('member',false),async()=>Response.json({ok:false}, {status:429}),
    async()=>{throw new Error('network failure')}]) {
    const res = await handle(request(await signed()),env,mock);
    assert.equal(res.status,503); assert.equal((await res.json()).allowed,undefined);
  }
});
test('untrusted requests never reach Telegram', async () => {
  let calls=0; const mock=async()=>{calls++;throw Error('must not call')};
  assert.equal((await handle(request('fake'),env,mock)).status,401);
  const foreign=request(await signed()); foreign.headers.set('Origin','https://evil.test');
  assert.equal((await handle(foreign,env,mock)).status,403);
  assert.equal((await handle(request(await signed()),{...env,BOT_TOKEN:''},mock)).status,503);
  assert.equal((await handle(request(await signed()),{...env,CHANNEL_URL:'javascript:alert(1)'},mock)).status,503);
  assert.equal(calls,0);
});
test('bounded request bodies, malformed JSON and unsupported methods are rejected', async () => {
  assert.equal((await handle(new Request('https://example.workers.dev/access',{method:'GET'}),env)).status,405);
  const req = body => new Request('https://example.workers.dev/access', {
    method:'POST', headers:{'Content-Type':'application/json'},body});
  assert.equal((await handle(req('x'.repeat(21000)),env)).status,413);
  assert.equal((await handle(req('{'),env)).status,400);
});
test('preflight permits only the configured origin', async () => {
  const res=await handle(new Request('https://example.workers.dev/access',{
    method:'OPTIONS',headers:{Origin:env.ALLOWED_ORIGINS}}),env);
  assert.equal(res.status,200);
  assert.equal(res.headers.get('Access-Control-Allow-Methods'),'POST, OPTIONS');
});
