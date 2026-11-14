const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/wallpaper.js'), 'utf8');

// Small DOM harness: exercise the real controller's queue and failure paths.
function create({ wallpapers = ['a.webp', 'b.webp', 'c.webp'], denied = false,
  failed = [], pathname = '/', initialStorage, config = {} } = {}) {
  const nodes = new Map(), requested = [], observers = [], events = {};
  const saved = new Map(initialStorage ? [['kk-openlist-wallpaper-queue-v2', initialStorage]] : []);
  class Element {
    constructor() {
      this.children = []; this.listeners = {}; this.dataset = {}; this.hidden = false;
      this.attributes = {}; this.classes = new Set(); this.complete = false;
      this.classList = { add: c => this.classes.add(c), remove: c => this.classes.delete(c) };
    }
    set id(id) { this._id = id; nodes.set(id, this); }
    get id() { return this._id; }
    setAttribute(k, v) { this.attributes[k] = v; }
    removeAttribute(k) { if (k === 'src') this._src = ''; delete this.attributes[k]; }
    append(child) { this.children.push(child); }
    prepend(child) { this.children.unshift(child); }
    set innerHTML(value) { this.markup = value; this.button = new Element(); this.status = new Element(); }
    querySelector(selector) { return selector === 'button' ? this.button : this.status; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    set src(url) {
      this._src = url; requested.push(url);
      queueMicrotask(() => {
        if (failed.some(name => url.endsWith(name))) this.onerror?.();
        else { this.complete = true; this.naturalWidth = 1920; this.onload?.(); }
      });
    }
    get src() { return this._src; }
    async decode() {}
  }
  const root = new Element(); root.id = 'root';
  const body = new Element();
  const location = { href: 'https://openlist.example/', pathname };
  const window = { KK_OPENLIST_THEME: { wallpapers, ...config }, addEventListener: (k, fn) => events[k] = fn };
  const storage = {
    getItem(k) { if (denied) throw new Error('Storage denied'); return saved.get(k) || null; },
    setItem(k, v) { if (denied) throw new Error('Storage denied'); saved.set(k, v); }
  };
  const context = vm.createContext({ window, location, document: {
    readyState: 'complete', body, getElementById: k => nodes.get(k), createElement: () => new Element()
  }, Image: Element, MutationObserver: class {
    constructor(fn) { observers.push(fn); } observe() {}
  }, localStorage: storage, navigator: {}, URL, setTimeout, clearTimeout, console });
  vm.runInContext(source, context);
  return { nodes, requested, saved, location, observers, context, source,
    async settle() { for (let i = 0; i < 30; i++) await new Promise(resolve => setImmediate(resolve)); },
    async next() { await nodes.get('kk-wallpaper-tools').button.listeners.click(); },
    selected() { return nodes.get('kk-wallpaper').dataset.wallpaper; }
  };
}

test('empty list keeps fallback and hides controls without image requests', async () => {
  const app = create({ wallpapers: [] }); await app.settle();
  assert.equal(app.nodes.get('kk-wallpaper-tools').hidden, true);
  assert.equal(app.requested.length, 0);
});

test('each cycle uses all images and avoids repeating at cycle boundary', async () => {
  const app = create(); await app.settle();
  const chosen = [app.selected()];
  for (let i = 0; i < 8; i++) { await app.next(); chosen.push(app.selected()); }
  for (let i = 0; i < chosen.length; i += 3) assert.equal(new Set(chosen.slice(i, i + 3)).size, 3);
  for (let i = 1; i < chosen.length; i++) assert.notEqual(chosen[i], chosen[i - 1]);
});

test('refresh resumes remaining images from saved queue', async () => {
  const first = create(); await first.settle();
  const second = create({ initialStorage: first.saved.get('kk-openlist-wallpaper-queue-v2') });
  await second.settle(); assert.notEqual(second.selected(), first.selected());
});

test('storage denial and malformed stored data both recover', async () => {
  for (const options of [{ denied: true }, { initialStorage: '{invalid' },
    { initialStorage: JSON.stringify({ pool: 'old', remaining: null }) }]) {
    const app = create(options); await app.settle(); const previous = app.selected();
    await app.next(); assert.ok(app.selected()); assert.notEqual(app.selected(), previous);
  }
});

test('failed images fall through to a healthy entry', async () => {
  const app = create({ failed: ['a.webp', 'b.webp'] }); await app.settle();
  assert.ok(app.selected().endsWith('c.webp'));
  assert.equal(app.nodes.get('kk-wallpaper-tools').button.disabled, false);
});

test('all failed images terminate and restore controls', async () => {
  const app = create({ failed: ['a.webp', 'b.webp', 'c.webp'] }); await app.settle();
  assert.equal(app.selected(), undefined);
  assert.equal(app.requested.length, 3);
  assert.equal(app.nodes.get('kk-wallpaper-tools').button.disabled, false);
  assert.match(app.nodes.get('kk-wallpaper-tools').status.textContent, /加载失败/);
});

test('single image is reusable', async () => {
  const app = create({ wallpapers: ['one.webp'] }); await app.settle();
  await app.next(); await app.next(); assert.ok(app.selected().endsWith('one.webp'));
});

test('duplicate and non-HTTP URLs are ignored; filenames are encoded', async () => {
  const app = create({ wallpapers: ['中文 空格.webp', '中文 空格.webp',
    { url: 'javascript:alert(1)' }, { url: 'data:image/png,abc' }, null] });
  await app.settle(); assert.equal(app.requested.length, 1);
  assert.ok(app.selected().includes(encodeURIComponent('中文 空格.webp')));
});

test('initial management page does not request images; client route enables them', async () => {
  const app = create({ pathname: '/@manage/settings' }); await app.settle();
  assert.equal(app.requested.length, 0); assert.equal(app.nodes.get('kk-wallpaper').hidden, true);
  app.location.pathname = '/'; app.observers.forEach(fn => fn()); await app.settle();
  assert.ok(app.selected());
  app.location.pathname = '/@manage'; app.observers.forEach(fn => fn());
  assert.equal(app.nodes.get('kk-wallpaper-tools').hidden, true);
});

test('duplicate installation is ignored', async () => {
  const app = create(); await app.settle(); const count = app.requested.length;
  vm.runInContext(source, app.context); await app.settle(); assert.equal(app.requested.length, count);
});

test('showButton=false still loads initial wallpaper', async () => {
  const app = create({ config: { showButton: false } }); await app.settle();
  assert.ok(app.selected()); assert.equal(app.nodes.get('kk-wallpaper-tools').hidden, true);
});
