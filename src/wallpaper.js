/* SPDX-License-Identifier: MIT
 * Extracted from the KK OpenList wallpaper controller; made configurable.
 */
(() => {
  'use strict';
  function init() {
    if (document.getElementById('kk-wallpaper')) return;
    const config = window.KK_OPENLIST_THEME || {};
    const queueKey = config.storageKey || 'kk-openlist-wallpaper-queue-v2';
    const timeoutMs = Math.max(1000, Number(config.loadTimeout) || 8000);
    const base = new URL(config.basePath || '/d/_kk_wallpapers/', location.href);
    if (!base.pathname.endsWith('/')) base.pathname += '/';
    const seen = new Set();
    const wallpapers = (Array.isArray(config.wallpapers) ? config.wallpapers : [])
      .map(entry => {
        const item = typeof entry === 'string' ? { file: entry } : entry;
        if (!item || !(item.url || item.file)) return null;
        try {
          const url = item.url ? new URL(item.url, location.href)
            : new URL(String(item.file).split('/').map(encodeURIComponent).join('/'), base);
          if (!['https:', 'http:'].includes(url.protocol) || seen.has(url.href)) return null;
          seen.add(url.href);
          return { id: url.href, url: url.href, title: String(item.title || item.file || '壁纸') };
        } catch { return null; }
      }).filter(Boolean);
    const ids = wallpapers.map(item => item.id);
    const poolVersion = JSON.stringify(ids);
    const host = document.createElement('div');
    host.id = 'kk-wallpaper';
    host.setAttribute('aria-hidden', 'true');
    const layers = [new Image(), new Image()];
    layers.forEach(image => {
      image.alt = '';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      host.append(image);
    });
    document.body.prepend(host);
    const tools = document.createElement('div');
    tools.id = 'kk-wallpaper-tools';
    tools.setAttribute('role', 'group');
    tools.setAttribute('aria-label', '壁纸工具');
    tools.innerHTML = '<button type="button" aria-label="切换下一张随机壁纸"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h3c5 0 7 12 12 12h3M18 15l3 3-3 3M3 18h3c2 0 4-3 6-6s4-6 6-6h3M18 3l3 3-3 3"/></svg><span>换张壁纸</span></button><span id="kk-wallpaper-status" role="status" aria-live="polite"></span>';
    document.body.append(tools);
    const button = tools.querySelector('button');
    const status = tools.querySelector('[role="status"]');
    let memory = null, active = 0, busy = false, started = false;
    function shuffle(values) {
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
      }
      return values;
    }
    function readQueue() {
      let state = memory;
      try { state = JSON.parse(localStorage.getItem(queueKey)) || state; } catch {}
      if (!state || state.pool !== poolVersion || !Array.isArray(state.remaining)) {
        state = { pool: poolVersion, last: '', remaining: shuffle([...ids]) };
      }
      state.last = ids.includes(state.last) ? state.last : '';
      state.remaining = [...new Set(state.remaining)].filter(id => ids.includes(id) && id !== state.last);
      return state;
    }
    function saveQueue(state) {
      memory = state;
      try { localStorage.setItem(queueKey, JSON.stringify(state)); } catch {}
    }
    function load(url, image) {
      return new Promise((resolve, reject) => {
        if (image.src === url && image.complete && image.naturalWidth > 0) { resolve(); return; }
        const finish = (error) => {
          clearTimeout(timer);
          image.onload = image.onerror = null;
          if (error) { image.removeAttribute('src'); reject(error); } else resolve();
        };
        const timer = setTimeout(() => finish(new Error('Wallpaper load timed out')), timeoutMs);
        image.onload = () => finish();
        image.onerror = () => finish(new Error('Wallpaper unavailable'));
        image.src = url;
      });
    }
    async function selectNext() {
      const state = readQueue(), tried = new Set();
      while (tried.size < wallpapers.length) {
        if (!state.remaining.length) {
          state.remaining = shuffle(ids.filter(id => !tried.has(id)));
          if (state.remaining[0] === state.last && state.remaining.length > 1) {
            [state.remaining[0], state.remaining[1]] = [state.remaining[1], state.remaining[0]];
          }
        }
        const id = state.remaining.shift();
        if (!id) break;
        if (tried.has(id)) continue;
        tried.add(id);
        const item = wallpapers.find(entry => entry.id === id);
        // Reserve the next entry before loading, for cooperating browser tabs.
        state.last = id;
        saveQueue(state);
        const next = 1 - active;
        try { await load(item.url, layers[next]); } catch { continue; }
        try { if (layers[next].decode) await layers[next].decode(); } catch {}
        layers[next].classList.add('is-current');
        layers[active].classList.remove('is-current');
        active = next;
        host.dataset.wallpaper = item.id;
        status.textContent = '已切换：' + item.title;
        return;
      }
      status.textContent = '壁纸加载失败，请检查图片地址和访问权限。';
    }
    async function change() {
      if (busy || host.hidden || !wallpapers.length) return;
      busy = true;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      try {
        if (navigator.locks?.request) await navigator.locks.request(queueKey, selectNext);
        else await selectNext();
      } finally {
        busy = false;
        button.disabled = false;
        button.setAttribute('aria-busy', 'false');
      }
    }
    button.addEventListener('click', change);
    let previousPath;
    function syncRoute() {
      if (previousPath === location.pathname) return;
      previousPath = location.pathname;
      const manage = /^\/@manage(?:\/|$)/.test(previousPath);
      host.hidden = manage;
      tools.hidden = manage || !wallpapers.length || config.showButton === false;
      if (!manage && !started) { started = true; change(); }
    }
    // OpenList uses client-side navigation; react when its page DOM changes.
    const root = document.getElementById('root');
    if (root) new MutationObserver(syncRoute).observe(root, { childList: true, subtree: true });
    window.addEventListener('popstate', syncRoute);
    syncRoute();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
