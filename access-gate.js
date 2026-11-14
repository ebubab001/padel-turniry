(function () {
  'use strict';
  let pending = null;
  const config = () => window.PADLA_ACCESS_CONFIG || {};
  const enabled = () => config().enabled === true;
  const safeTelegram = value => {
    try { const u = new URL(value); return u.protocol === 'https:' && u.hostname === 't.me' ? u.href : null; }
    catch { return null; }
  };
  function openTelegram(url) {
    const safe = safeTelegram(url);
    if (!safe) return;
    const tg = window.Telegram?.WebApp;
    if (tg?.openTelegramLink) tg.openTelegramLink(safe);
    else window.open(safe, '_blank', 'noopener,noreferrer');
  }
  function show() {
    return new Promise(resolve => {
      const tg = window.Telegram?.WebApp;
      const panel = document.createElement('dialog');
      panel.className = 'padla-access';
      panel.setAttribute('aria-labelledby', 'padla-access-title');
      panel.innerHTML = '<div class="padla-access-inner"><span class="padla-access-eyebrow">PADLA TOUR</span>' +
        '<h2 id="padla-access-title">Турниры для подписчиков</h2>' +
        '<p>Подпишись на канал «Миша Радин | Все про падел», затем вернись сюда и проверь подписку.</p>' +
        '<p class="padla-access-note">В канале разбираю технику и тактику, делюсь видео с корта.</p>' +
        '<button type="button" class="cta" data-access="channel">Открыть канал</button>' +
        '<button type="button" class="cta padla-access-check" data-access="check">Проверить подписку</button>' +
        '<p role="status" aria-live="polite" class="padla-access-status"></p>' +
        '<button type="button" class="padla-access-back" data-access="back">Вернуться</button></div>';
      document.body.append(panel);
      const status = panel.querySelector('[role="status"]');
      const check = panel.querySelector('[data-access="check"]');
      const channel = panel.querySelector('[data-access="channel"]');
      let url = safeTelegram(config().channelUrl);
      const close = allowed => { panel.close(); panel.remove(); resolve(allowed); };
      panel.addEventListener('cancel', e => { e.preventDefault(); close(false); });
      panel.querySelector('[data-access="back"]').onclick = () => close(false);
      channel.onclick = () => openTelegram(url);
      channel.disabled = !url;
      check.onclick = async () => {
        if (check.disabled) return;
        if (!tg?.initData) { status.textContent = 'Открой Padla Tour в Telegram, чтобы проверить подписку.'; return; }
        let endpoint;
        try { endpoint = new URL(config().endpoint); if (endpoint.protocol !== 'https:') throw 0; }
        catch { status.textContent = 'Проверка пока недоступна. Попробуй позже.'; return; }
        check.disabled = true; check.textContent = 'Проверяю…'; status.textContent = '';
        try {
          const response = await fetch(endpoint.href, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: tg.initData }), signal: AbortSignal.timeout(12000),
            credentials: 'omit', cache: 'no-store', redirect: 'error'
          });
          const data = await response.json();
          if (response.status === 401) {
            status.textContent = 'Закрой и заново открой приложение в Telegram, затем проверь подписку.';
          } else if (!response.ok || typeof data.allowed !== 'boolean') {
            status.textContent = 'Не получилось проверить подписку. Попробуй ещё раз чуть позже.';
          } else if (data.allowed) { close(true); return; }
          else {
            url = safeTelegram(data.channelUrl) || url; channel.disabled = !url;
            status.textContent = 'Пока не вижу подписку. Подпишись на канал и нажми ещё раз.';
          }
        } catch { status.textContent = 'Нет связи с проверкой подписки. Попробуй ещё раз.'; }
        finally { check.disabled = false; check.textContent = 'Проверить подписку'; }
      };
      if (!tg?.initData) {
        status.textContent = 'Для создания турнира открой Padla Tour в Telegram.';
        check.textContent = 'Открыть Padla Tour';
        check.onclick = () => openTelegram(config().botUrl);
      }
      panel.showModal();
      if (tg?.initData) check.click();
    });
  }
  window.PadlaAccess = Object.freeze({
    enabled,
    async require() {
      if (!enabled()) return true;
      if (pending) return false;
      pending = show();
      try { return await pending; } finally { pending = null; }
    }
  });
  const style = document.createElement('style');
  style.textContent = '.padla-access{box-sizing:border-box;width:min(460px,calc(100% - 24px));max-height:calc(100dvh - 32px);padding:0;border:0;border-radius:24px;background:#fff;color:#0A1240;overflow:auto;font-family:Manrope,system-ui,sans-serif}.padla-access::backdrop{background:#0A1240bb}.padla-access-inner{padding:28px 24px}.padla-access-eyebrow{font-size:12px;letter-spacing:.12em;font-weight:800;color:#1638E8}.padla-access h2{font-family:Unbounded,system-ui,sans-serif;font-size:23px;line-height:1.35;margin:16px 0}.padla-access p{font-size:15px;line-height:1.6}.padla-access .padla-access-note{color:#6A72A6;font-size:13px;margin-bottom:24px}.padla-access .cta{display:block;width:100%;border:0;cursor:pointer;margin-top:12px}.padla-access .padla-access-check{background:#DFFF2F;color:#0A1240}.padla-access button:disabled{opacity:.55;cursor:wait}.padla-access-status{min-height:24px;font-size:13px!important;color:#6A72A6}.padla-access-back{display:block;margin:8px auto 0;border:0;background:none;color:#6A72A6;font:inherit;font-size:14px;cursor:pointer;padding:8px}';
  document.head.append(style);
})();
