/* TiO2 Photocatalytic Degradation Analyzer — UI (web port of the PySide6 desktop app) */
(function () {
'use strict';
const C = window.Core;
const COLORS = ['#197b70', '#9a7028', '#527fa5', '#ac6255', '#7d709f', '#5f8872'];
const MAXSIDE = 1000;
const STATUS_IDLE = "Все расчёты выполняются на вашем устройстве";
const $ = (s, r) => (r || document).querySelector(s);
const tick = () => new Promise((r) => setTimeout(r, 0));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k];
    if (v === null || v === undefined) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}

/* ============================ dialogs ============================ */
function dialog({ icon, text, input, buttons }) {
  return new Promise((resolve) => {
    const m = $('#modal'), prevFocus = document.activeElement;
    const le = input !== undefined ? h('input', { class: 'le', type: 'text', value: input, spellcheck: 'false' }) : null;
    const finish = (v) => {
      document.removeEventListener('keydown', onKey, true);
      m.classList.remove('on'); m.textContent = '';
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      resolve(v);
    };
    const val = (b) => (le && b.value === 'ok' ? le.value : b.value);
    const btnEls = buttons.map((b, i) => h('button', {
      class: 'q' + (i === buttons.length - 1 ? ' def' : ''), type: 'button', onclick: () => finish(val(b)),
    }, b.label));
    const dlg = h('div', { class: 'dlg', role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'body' },
        icon ? h('div', { class: 'ic' }, icon) : null,
        h('div', { class: 'tx' }, h('div', null, text), le)),
      h('div', { class: 'btns' }, btnEls));
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); finish(buttons[0].value === 'ok' ? null : buttons[0].value); }
      else if (e.key === 'Enter' && document.activeElement !== btnEls[0] ) {
        e.preventDefault(); finish(val(buttons[buttons.length - 1]));
      } else if (e.key === 'Tab') {
        const f = [...dlg.querySelectorAll('input,button')], i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
      e.stopPropagation();
    }
    m.textContent = ''; m.append(dlg); m.classList.add('on');
    document.addEventListener('keydown', onKey, true);
    (le || btnEls[btnEls.length - 1]).focus();
    if (le) le.select();
  });
}
const alertBox = (text) => ($('#modal').classList.contains('on') ? Promise.resolve(true)
  : dialog({ icon: '⚠️', text, buttons: [{ label: 'OK', value: true }] }));
const confirmBox = (text) => dialog({
  icon: '❔', text, buttons: [{ label: 'Отмена', value: false }, { label: 'Удалить', value: true }],
});
const promptBox = (text, init) => dialog({
  text, input: init, buttons: [{ label: 'Отмена', value: null }, { label: 'OK', value: 'ok' }],
});

/* ============================ widgets ============================ */
class Viewer {
  constructor() {
    this.el = h('div', { class: 'viewer' });
    this.cv = h('canvas');
    this.el.append(this.cv);
    this.ctx = this.cv.getContext('2d');
    this.buf = document.createElement('canvas');
    this.bctx = this.buf.getContext('2d');
    this.has = false; this.id = null;
    new ResizeObserver(() => this.paint()).observe(this.el);
  }
  setSize(w, hh) { this.el.style.width = w + 'px'; this.el.style.height = hh + 'px'; }
  setFrame(fr) {
    if (!fr.id) fr.id = new ImageData(fr.rgba, fr.w, fr.h);
    this.id = null;
    this.buf.width = fr.w; this.buf.height = fr.h;
    this.bctx.putImageData(fr.id, 0, 0);
    this.has = true; this.paint();
  }
  data(w, hh) {
    if (!this.id || this.id.width !== w || this.id.height !== hh) {
      this.id = new ImageData(w, hh); this.buf.width = w; this.buf.height = hh;
    }
    return this.id.data;
  }
  commit() { this.bctx.putImageData(this.id, 0, 0); this.has = true; this.paint(); }
  clear() { this.has = false; this.paint(); }
  paint() {
    const W = this.el.clientWidth, H = this.el.clientHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1, pw = Math.round(W * dpr), ph = Math.round(H * dpr);
    if (this.cv.width !== pw || this.cv.height !== ph) { this.cv.width = pw; this.cv.height = ph; }
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, pw, ph);
    if (!this.has) return;
    const s = Math.min(pw / this.buf.width, ph / this.buf.height);
    const dw = Math.round(this.buf.width * s), dh = Math.round(this.buf.height * s);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.buf, (pw - dw) >> 1, (ph - dh) >> 1, dw, dh);
  }
}

class Spin {
  constructor(o) {
    this.min = o.min; this.max = o.max; this.dec = o.dec; this.suffix = o.suffix || '';
    this.step = o.step || 1; this.cb = o.onChange || (() => {}); this._v = o.value;
    this.inp = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', 'aria-label': o.label || '' });
    const up = h('button', { type: 'button', tabindex: '-1', 'aria-label': '+' }, '▲');
    const dn = h('button', { type: 'button', tabindex: '-1', 'aria-label': '−' }, '▼');
    this.el = h('div', { class: 'spin' }, this.inp, h('div', { class: 'sb' }, up, dn));
    this.show();
    this.inp.addEventListener('focus', () => setTimeout(() => this.inp.select(), 0));
    this.inp.addEventListener('blur', () => this.commit());
    this.inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { this.commit(); this.inp.select(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.bump(1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); this.bump(-1); }
      e.stopPropagation();
    });
    this.hold(up, 1); this.hold(dn, -1);
  }
  hold(btn, dir) {
    let t1, t2;
    const stop = () => { clearTimeout(t1); clearInterval(t2); };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault(); this.bump(dir); stop();
      t1 = setTimeout(() => { t2 = setInterval(() => this.bump(dir), 60); }, 400);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
  }
  clampv(v) { return +clamp(v, this.min, this.max).toFixed(this.dec); }
  show() { this.inp.value = this._v.toFixed(this.dec) + this.suffix; }
  get value() { return this._v; }
  set(v, emit) {
    const nv = this.clampv(v), ch = nv !== this._v;
    this._v = nv; this.show();
    if (emit && ch) this.cb(nv);
  }
  commit() {
    const t = parseFloat(this.inp.value.replace(',', '.'));
    if (isNaN(t)) { this.show(); return; }
    this.set(t, true); this.show();
  }
  bump(d) { this.commit(); this.set(this._v + d * this.step, true); }
}

/* ============================ image loading ============================ */
async function loadFrame(file) {
  let src, w, hh, close = () => {};
  try {
    const bmp = await createImageBitmap(file);
    src = bmp; w = bmp.width; hh = bmp.height; close = () => bmp.close && bmp.close();
  } catch (e) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      src = img; w = img.naturalWidth; hh = img.naturalHeight;
    } finally { URL.revokeObjectURL(url); }
  }
  const s = Math.min(1, MAXSIDE / Math.max(w, hh));
  const cw = Math.max(1, Math.round(w * s)), ch = Math.max(1, Math.round(hh * s));
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, ch);
  ctx.imageSmoothingQuality = 'high'; ctx.drawImage(src, 0, 0, cw, ch);
  close();
  return C.makeFrame(cw, ch, ctx.getImageData(0, 0, cw, ch).data);
}
function resized(fr, w, hh) {
  if (fr.w === w && fr.h === hh) return fr;
  if (fr._rs && fr._rs.w === w && fr._rs.h === hh) return fr._rs;
  const a = document.createElement('canvas'); a.width = fr.w; a.height = fr.h;
  a.getContext('2d').putImageData(new ImageData(fr.rgba, fr.w, fr.h), 0, 0);
  const b = document.createElement('canvas'); b.width = w; b.height = hh;
  const bc = b.getContext('2d', { willReadFrequently: true });
  bc.imageSmoothingQuality = 'high'; bc.drawImage(a, 0, 0, w, hh);
  fr._rs = C.makeFrame(w, hh, bc.getImageData(0, 0, w, hh).data);
  return fr._rs;
}

/* ============================ experiment ============================ */
const CH_ITEMS = ['Яркость', 'Цветовой канал по λ', 'Насыщенность'];

class Experiment {
  constructor() {
    this.custom = ''; this.frames = []; this.k = null; this.tHalf = null;
    this.times = []; this.norm = []; this.pidx = 0; this.autoThr = null; this.timer = null; this.demoIdx = 0; this.isDemo = false;
    this.raf = 0;
    this.build();
  }
  build() {
    const E = this;
    E.file = h('input', { type: 'file', multiple: '', accept: 'image/*,.tif,.tiff', hidden: '' });
    E.file.addEventListener('change', () => { const f = [...E.file.files]; E.file.value = ''; E.addFiles(f); });
    E.btnAdd = h('button', { class: 'q accent', type: 'button', onclick: () => E.file.click() }, '＋ Добавить фотографии');
    E.btnDemo = h('button', { class: 'q', type: 'button', title: 'Демо', onclick: () => E.demo() }, 'Демо');

    E.tf = new Viewer(); E.tl = new Viewer();
    E.cnt = h('div', { class: 'cnt' });
    E.bp = h('button', { class: 'q', type: 'button', 'aria-label': 'Предыдущее', onclick: () => E.nav(-1) }, '◀');
    E.bn = h('button', { class: 'q', type: 'button', 'aria-label': 'Следующее', onclick: () => E.nav(1) }, '▶');
    E.bPlay = h('button', { class: 'q', type: 'button', 'aria-label': 'Пуск', onclick: () => E.togglePlay() }, '⏵');
    E.lblNav = h('div', { class: 'lbl' }, 'Фото: —');

    E.spinDt = new Spin({ min: 0.1, max: 1e8, value: 60, dec: 1, suffix: ' с', step: 1, label: 'Δt', onChange: () => E.runIfReady() });
    E.sel = h('select', { class: 'q grow', 'aria-label': 'Канал' }, CH_ITEMS.map((t, i) => h('option', { value: i }, t)));
    E.sel.addEventListener('change', () => E.onCh());
    E.spinWl = new Spin({ min: 300, max: 850, value: 440, dec: 0, suffix: ' нм', step: 1, label: 'λ', onChange: () => E.onWl() });
    E.sw = h('span', { class: 'sw' }, '■');
    E.warn = h('span', { class: 'warn' });
    E.wlRow = h('div', { class: 'row wlrow' }, h('span', null, 'λ (нм):'), E.spinWl.el, E.sw, E.warn);
    E.rng = h('input', { class: 'rng grow', type: 'range', min: 1, max: 500, value: 50, 'aria-label': 'Порог OD' });
    E.rng.addEventListener('input', () => E.onThr());
    E.rng.addEventListener('change', () => E.onThrRelease());
    E.tv = h('span', { class: 'tv' }, '0.050');
    E.chkIn = h('input', { type: 'checkbox', checked: '' });
    E.chkIn.addEventListener('change', () => E.onAuto(E.chkIn.checked));
    E.chk = h('label', { class: 'chk' }, E.chkIn, h('span', { class: 'bx' }), 'Авто');
    E.rng.disabled = true; E.setRng(50);

    E.lblK = h('span', { class: 'result' }, '—');
    E.lblTh = h('span', { class: 'result' }, '—');
    E.info = h('div', { class: 'sci' });
    E.btnDel = h('button', { class: 'q danger', type: 'button', onclick: () => App.del(E) }, 'Удалить эксперимент');

    E.sourceBadge = h('span', { class: 'tag' }, 'Нет фотографий');
    const upload = h('section', { class: 'upload-card' }, E.file,
      h('div', { class: 'upload-heading' }, h('span', { class: 'step' }, '01'), h('span', null, 'Ваша серия фотографий'), E.sourceBadge),
      h('div', { class: 'addrow' }, E.btnAdd, E.btnDemo),
      h('p', { class: 'hint' }, 'Выберите серию кадров в порядке съёмки. Можно перетащить файлы сюда.'));
    const frames = h('section', { class: 'frames-card' },
      h('div', { class: 'thumbs' }, E.tf.el, E.cnt, E.tl.el),
      h('div', { class: 'nav' }, E.bp, E.lblNav, E.bn, E.bPlay));
    const settings = h('details', { class: 'grp settings', open: '' },
      h('summary', null, h('span', { class: 'step' }, '02'), 'Параметры анализа'),
      h('div', { class: 'col' },
        h('div', { class: 'row' }, h('span', null, 'Интервал между фото'), E.spinDt.el),
        h('div', { class: 'row' }, h('span', null, 'Канал анализа'), E.sel), E.wlRow,
        h('div', { class: 'row threshold-row' }, h('span', null, 'Порог пятна'), E.tv, E.chk, E.rng),
        h('p', { class: 'hint' }, 'Автопорог отделяет пятно от фона. Для ручной настройки отключите «Авто».')));
    const science = h('details', { class: 'grp science' }, h('summary', null, 'Как это считается'),
      h('div', { class: 'col' }, ['A = −log₁₀(I/I₀)', 'I₀ — 95-й перцентиль яркости фона и образца',
        'ln(⟨A⟩(t)/⟨A⟩(0)) = −k·t', 't₁/₂ = ln(2)/k'].map(t => h('div', { class: 'formula-l' }, t)),
        h('p', { class: 'hint' }, 'Снимайте при одинаковом освещении и настройках камеры. Цветовой канал по λ выбирает R, G или B; это не спектральное измерение.')));
    const metrics = h('div', { class: 'results', 'aria-label': 'Результаты выбранного эксперимента' },
      h('div', { class: 'metric' }, h('span', { class: 'metric-label' }, 'Константа k, с⁻¹'), E.lblK, h('span', { class: 'metric-note' }, 'Скорость изменения красителя')),
      h('div', { class: 'metric' }, h('span', { class: 'metric-label' }, 'Время t½'), E.lblTh, h('span', { class: 'metric-note' }, 'Время снижения сигнала вдвое')));
    const rename = h('button', { class: 'q text-button', type: 'button', onclick: () => App.rename(App.exps.indexOf(E)) }, 'Переименовать');
    const actions = h('div', { class: 'experiment-actions' }, rename, E.btnDel);
    const left = h('div', { class: 'left' }, upload, metrics, frames, settings, science, actions);

    E.vo = new Viewer(); E.vm = new Viewer(); E.vr = new Viewer();
    E.vo.el.classList.add('active');
    const viewers = [E.vo, E.vm, E.vr];
    const modes = ['Оригинал', 'Маска пятна', 'Детекция'];
    const modeButtons = modes.map((name, i) => h('button', {
      class: 'preview-mode' + (i === 0 ? ' active' : ''), type: 'button', 'aria-pressed': String(i === 0),
      onclick: () => {
        viewers.forEach((v, j) => { v.el.classList.toggle('active', j === i); v.paint(); });
        modeButtons.forEach((btn, j) => { btn.classList.toggle('active', j === i); btn.setAttribute('aria-pressed', String(j === i)); });
      },
    }, name));
    E.previewEmpty = h('div', { class: 'preview-empty' }, h('span', { 'aria-hidden': 'true' }, '◎'), h('strong', null, 'Здесь появится ваш образец'), h('span', null, 'Добавьте фотографии или откройте демо'));
    const prev = h('section', { class: 'prev' },
      h('div', { class: 'preview-heading' }, h('div', null, h('span', { class: 'eyebrow' }, 'ОТ СВЕТА К ДАННЫМ'), h('h2', null, 'Образец под наблюдением')), h('span', { class: 'live-dot', 'aria-hidden': 'true' })),
      h('div', { class: 'preview-modes', 'aria-label': 'Режим просмотра' }, modeButtons),
      h('div', { class: 'preview-stage' }, E.vo.el, E.vm.el, E.vr.el, E.previewEmpty),
      h('div', { class: 'preview-caption' }, h('span', null, 'Исходный кадр → выделение пятна → анализ'), h('span', null, 'TiO₂ / LAB')),
      E.info);
    E.root = h('div', { class: 'exp-root', role: 'tabpanel' }, left, prev);
    E.updWl();
  }

  /* ---- helpers ---- */
  get chIdx() { return +this.sel.value; }
  get auto() { return this.chkIn.checked; }
  setRng(v) { this.rng.value = v; this.rng.style.setProperty('--p', ((v - 1) / 499 * 100) + '%'); }
  wlOut() { const wl = this.spinWl.value; return wl < 380 || wl > 750; }
  chParams() {
    const i = this.chIdx;
    if (i === 0) return ['gray', 0];
    if (i === 1) return this.wlOut() ? null : ['bgr', C.wavelengthToBgrIndex(this.spinWl.value)];
    return ['saturation', 0];
  }
  applyParams(p) {
    this.spinDt.set(p.dt, false); this.sel.value = String(p.ch); this.spinWl.set(p.wl, false);
    this.chkIn.checked = true; this.rng.disabled = true; this.setRng(50); this.tv.textContent = '0.050';
    this.wlRow.classList.toggle('on', p.ch === 1); this.updWl();
  }

  /* ---- events ---- */
  async addFiles(files) {
    files = files.filter((f) => /^image\//.test(f.type) || /\.(png|jpe?g|bmp|tiff?|webp)$/i.test(f.name));
    if (!files.length) return;
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    App.status('Загрузка фотографий…');
    const frames = [];
    for (const f of files) { try { frames.push(await loadFrame(f)); } catch (e) { /* skip unreadable */ } }
    App.status(STATUS_IDLE);
    if (!frames.length) { alertBox('Не удалось открыть изображения'); return; }
    this.isDemo = false; this.setFrames(frames);
  }
  async demo() {
    const def = C.DEMOS[this.demoIdx++ % C.DEMOS.length];
    App.status('Генерация демо…'); this.btnDemo.disabled = true;
    await tick();
    const frames = C.renderDemo(def);
    this.btnDemo.disabled = false; App.status(STATUS_IDLE);
    if (!this.custom) this.custom = def.name;
    this.applyParams({ dt: def.dt, ch: def.ch, wl: def.wl });
    this.isDemo = true; this.setFrames(frames);
    App.renderTabs();
  }
  setFrames(frames) {
    this.stop(); this.frames = frames; this.pidx = 0; this.autoThr = null;
    this.sourceBadge.textContent = this.isDemo ? 'Демо · синтетические данные' : `${frames.length} фото`;
    this.sourceBadge.classList.toggle('demo-badge', this.isDemo);
    this.previewEmpty.hidden = !!frames.length;
    this.updThumbs(); this.run();
  }
  updThumbs() {
    if (!this.frames.length) return;
    const a = this.frames[0], b = this.frames[this.frames.length - 1], hh = 90;
    const w = Math.max(110, Math.trunc(hh * Math.max(a.w / a.h, b.w / b.h)) + 12);
    this.tf.setSize(w, hh); this.tl.setSize(w, hh);
    this.tf.setFrame(a); this.tl.setFrame(b);
    const n = this.frames.length;
    this.cnt.textContent = `← ${Math.max(0, n - 2)} →\n${n} фото`;
  }
  nav(d) {
    if (!this.frames.length) return;
    this.pidx = clamp(this.pidx + d, 0, this.frames.length - 1);
    this.updPrev(); App.plot.draw();
  }
  togglePlay() {
    if (this.timer) { this.stop(); return; }
    if (this.frames.length < 2) return;
    this.bPlay.textContent = '⏸'; this.bPlay.setAttribute('aria-label', 'Пауза');
    if (this.pidx >= this.frames.length - 1) this.pidx = -1;
    const step = () => {
      this.pidx = (this.pidx + 1) % this.frames.length;
      this.updPrev(); App.plot.draw();
    };
    step();
    this.timer = setInterval(step, 520);
  }
  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.bPlay.textContent = '⏵'; this.bPlay.setAttribute('aria-label', 'Пуск');
  }
  onCh() {
    const i = this.chIdx;
    this.wlRow.classList.toggle('on', i === 1);
    if (this.frames.length) {
      if (i === 1 && this.wlOut()) { alertBox(`λ=${this.spinWl.value.toFixed(0)} нм вне спектра!`); return; }
      if (this.auto) this.setAutoThreshold();
      this.updPrev(); this.runIfReady();
    }
  }
  onWl() {
    this.updWl();
    if (this.frames.length) {
      if (this.chIdx === 1 && this.wlOut()) { alertBox(`λ=${this.spinWl.value.toFixed(0)} нм вне спектра!`); return; }
      if (this.auto) this.setAutoThreshold();
      this.updPrev(); this.runIfReady();
    }
  }
  updWl() {
    const wl = this.spinWl.value;
    if (wl < 380 || wl > 750) {
      this.warn.textContent = '⚠ Вне спектра!'; this.sw.style.color = '#808080';
    } else {
      this.warn.textContent = '';
      const [r, g, b] = C.wavelengthToRgb(wl);
      this.sw.style.color = `rgb(${r},${g},${b})`;
    }
  }
  onThr() {
    const v = +this.rng.value;
    this.tv.textContent = (v / 1000).toFixed(3);
    this.setRng(v);
    if (!this.auto && this.frames.length && !this.raf) {
      this.raf = requestAnimationFrame(() => { this.raf = 0; this.updPrev(); });
    }
  }
  onThrRelease() { if (!this.auto) this.runIfReady(); }
  onAuto(checked) {
    this.rng.disabled = checked;
    if (this.frames.length) {
      if (checked) this.setAutoThreshold(); else this.autoThr = null;
      this.updPrev(); this.runIfReady();
    }
  }
  runIfReady() { if (this.frames.length > 1) this.run(); }

  /* ---- analysis ---- */
  setAutoThreshold() {
    if (!this.frames.length) return;
    const cp = this.chParams(); if (!cp) return;
    const r = C.analyze(this.frames[this.pidx], cp[0], cp[1], 0, true);
    this.autoThr = r.thr;
    this.setRng(clamp(Math.trunc(this.autoThr * 1000), 1, 500));
    this.tv.textContent = this.autoThr.toFixed(3);
  }
  analysisThreshold() {
    if (this.auto) {
      if (this.autoThr === null) this.setAutoThreshold();
      return this.autoThr !== null ? this.autoThr : this.rng.value / 1000;
    }
    return this.rng.value / 1000;
  }
  updPrev() {
    if (!this.frames.length) return;
    const fr = this.frames[this.pidx];
    this.lblNav.textContent = `Кадр ${this.pidx + 1} из ${this.frames.length}`;
    const cp = this.chParams(); if (!cp) return;
    const thr = this.analysisThreshold();
    const r = C.analyze(fr, cp[0], cp[1], thr, false);
    this.vo.setFrame(fr);
    C.previewInto(fr, r, this.vm.data(fr.w, fr.h), this.vr.data(fr.w, fr.h));
    this.vm.commit(); this.vr.commit();
    this.tv.textContent = thr.toFixed(3);
    this.info.textContent = `I₀=${r.I0.toFixed(1)} | <A>=${r.meanOd.toFixed(4)} | Пятно: ${(r.stainPct * 100).toFixed(1)}% | Порог: ${r.thr.toFixed(4)}`;
  }
  run() {
    if (this.frames.length < 2) {
      this.lblK.textContent = 'Нужно ≥2 фото'; this.lblTh.textContent = '—';
      this.k = null; this.tHalf = null; this.times = []; this.norm = [];
      if (this.frames.length) this.updPrev();
      App.updRes(); return;
    }
    const cp = this.chParams(); if (!cp) return;
    const thr = this.analysisThreshold();
    const w0 = this.frames[0].w, h0 = this.frames[0].h, mods = [], modsFg = [];
    for (const fr of this.frames) {
      const r = C.analyze(resized(fr, w0, h0), cp[0], cp[1], thr, false);
      mods.push(C.seriesValue(r)); modsFg.push(r.meanOd);
    }
    const dt = this.spinDt.value;
    let kin = C.kinetics(mods, dt);
    if (kin.k === null || kin.k <= 0) kin = C.kinetics(modsFg, dt);
    this.k = kin.k; this.tHalf = kin.tHalf; this.times = kin.times; this.norm = kin.norm;
    this.lblK.textContent = kin.k !== null ? C.fmtE(kin.k, 3) : 'Нет тренда';
    this.lblTh.textContent = C.fmtHalf(kin.tHalf);
    this.updPrev(); App.updRes();
  }
  destroy() { this.stop(); this.root.remove(); }
}

/* ============================ plot ============================ */
class Plot {
  constructor(cv) {
    this.cv = cv; this.ctx = cv.getContext('2d'); this.ds = []; this.hover = null;
    new ResizeObserver(() => this.draw()).observe(cv.parentElement);
    cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); this.hover = { x: e.clientX - r.left, y: e.clientY - r.top }; this.draw(); });
    cv.addEventListener('pointerleave', () => { this.hover = null; this.draw(); });
  }
  set(ds) { this.ds = ds; this.draw(); }
  draw() {
    const par = this.cv.parentElement, W = par.clientWidth, H = par.clientHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1;
    if (this.cv.width !== Math.round(W * dpr) || this.cv.height !== Math.round(H * dpr)) {
      this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
    }
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    const ml = W < 400 ? 48 : 58, mr = 18, mt = 18, mb = 50, pw = W - ml - mr, ph = H - mt - mb;
    if (pw < 50 || ph < 50) return;
    let mxT = 1.0, mxA = 1.05;
    for (const d of this.ds) {
      for (const t of d.times) if (t > mxT) mxT = t;
      for (const a of d.areas) if (a > mxA) mxA = a;
    }
    const mono = 'Consolas, "SF Mono", Menlo, monospace', sans = '-apple-system, "Segoe UI", Arial, sans-serif';
    ctx.lineWidth = 1; ctx.strokeStyle = '#a3b4b0'; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ml, mt + ph + .5); ctx.lineTo(ml + pw, mt + ph + .5); ctx.moveTo(ml + .5, mt); ctx.lineTo(ml + .5, mt + ph); ctx.stroke();
    ctx.font = `10px ${mono}`; ctx.fillStyle = '#667d76'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 6; i++) {
      const val = mxA * i / 5, y = mt + ph - Math.trunc(ph * i / 5);
      ctx.strokeStyle = '#e4ede9'; ctx.setLineDash([1, 2]); ctx.beginPath(); ctx.moveTo(ml, y + .5); ctx.lineTo(ml + pw, y + .5); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = 'right'; ctx.fillText(val.toFixed(2), ml - 6, y);
    }
    const nxt = mxT > 0 ? Math.min(6, Math.max(2, Math.trunc(mxT / 100) + 1)) : 2;
    for (let i = 0; i <= nxt; i++) {
      const val = mxT * i / nxt, x = ml + Math.trunc(pw * i / nxt);
      ctx.strokeStyle = '#e4ede9'; ctx.setLineDash([1, 2]); ctx.beginPath(); ctx.moveTo(x + .5, mt); ctx.lineTo(x + .5, mt + ph); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = 'center'; ctx.fillText(val.toFixed(0), x, mt + ph + 13);
    }
    ctx.fillStyle = '#667d76'; ctx.font = `12px ${sans}`; ctx.textAlign = 'center';
    ctx.fillText('Время, с', ml + pw / 2, mt + ph + 38);
    ctx.save(); ctx.translate(14, mt + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('<A>(t)/<A>(0)', 0, 0); ctx.restore();


    const cur = App.exps[App.cur];
    const pts = [];
    for (const d of this.ds) {
      if (d.times.length < 2 || d.areas.length < 2) continue;
      const p = [];
      for (let i = 0; i < Math.min(d.times.length, d.areas.length); i++) {
        p.push([ml + Math.trunc(pw * d.times[i] / mxT), mt + ph - Math.trunc(ph * d.areas[i] / mxA)]);
      }
      ctx.strokeStyle = d.color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath(); p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.fillStyle = d.color;
      for (const [x, y] of p) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); }
      if (d.exp === cur && d.exp.frames.length) {
        const q = p[clamp(d.exp.pidx, 0, p.length - 1)];
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#163c33'; ctx.beginPath(); ctx.arc(q[0], q[1], 6, 0, 7); ctx.stroke();
      }
      p.forEach((q, i) => pts.push({ x: q[0], y: q[1], d, i }));
    }
    if (this.hover) {
      let best = null, bd = 14;
      for (const q of pts) { const dd = Math.hypot(q.x - this.hover.x, q.y - this.hover.y); if (dd < bd) { bd = dd; best = q; } }
      if (best) {
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#163c33'; ctx.beginPath(); ctx.arc(best.x, best.y, 6, 0, 7); ctx.stroke();
        const lines = [best.d.name, `t = ${best.d.times[best.i].toFixed(0)} с`, `<A>/<A>₀ = ${best.d.areas[best.i].toFixed(3)}`];
        ctx.font = `11px ${sans}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 14, bh = lines.length * 15 + 8;
        let bx = best.x + 12, by = best.y - bh - 8;
        if (bx + bw > W - 4) bx = Math.max(4, best.x - bw - 12);
        if (by < 4) by = best.y + 12;
        ctx.fillStyle = '#163c33'; ctx.strokeStyle = '#163c33'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(bx + .5, by + .5, bw, bh, 4); ctx.fill(); ctx.stroke();
        lines.forEach((l, i) => { ctx.fillStyle = i ? '#e8e8e8' : best.d.color; ctx.fillText(l, bx + 7, by + 5 + i * 15); });
      }
    }
  }
}

/* ============================ app ============================ */
const App = {
  exps: [], cur: -1, plot: null,
  status(t) { $('#status').textContent = t; },
  label(e, i) {
    const base = `Эксперимент ${String(i + 1).padStart(2, '0')}`;
    return e.custom ? `${base} — ${e.custom}` : base;
  },
  parseCustom(name) {
    const prefix = 'Эксперимент №';
    if (name.startsWith(prefix)) { const p = name.split(' — '); return p.length >= 2 ? p.slice(1).join(' — ').trim() : ''; }
    return name.trim();
  },
  renderTabs() {
    const bar = $('#tabbar'); bar.textContent = '';
    this.exps.forEach((e, i) => {
      const t = e.custom || this.label(e, i);
      const el = h('button', {
        class: 'tab' + (i === this.cur ? ' sel' : ''), type: 'button', role: 'tab', 'data-t': t,
        'aria-selected': String(i === this.cur), id: `tab-${i}`, 'aria-controls': `experiment-${i}`, title: 'Двойной клик — переименовать',
        tabindex: i === this.cur ? '0' : '-1',
        onkeydown: ev => {
          let target = i;
          if (ev.key === 'ArrowRight') target = (i + 1) % this.exps.length;
          else if (ev.key === 'ArrowLeft') target = (i + this.exps.length - 1) % this.exps.length;
          else if (ev.key === 'Home') target = 0;
          else if (ev.key === 'End') target = this.exps.length - 1;
          else return;
          ev.preventDefault(); ev.stopPropagation(); this.activate(target); $('#tabbar .sel').focus();
        },
        onclick: () => this.activate(i), ondblclick: () => this.rename(i),
      }, t);
      e.root.id = `experiment-${i}`; e.root.setAttribute('aria-labelledby', `tab-${i}`);
      bar.append(el);
    });
    bar.append(h('button', { class: 'tab plus', type: 'button', 'data-t': '+', 'aria-label': 'Новый эксперимент', onclick: () => this.add() }, '+ Новый'));
    const sel = bar.querySelector('.sel');
    if (sel) { const l = sel.offsetLeft, r = l + sel.offsetWidth; if (l < bar.scrollLeft) bar.scrollLeft = l - 6; else if (r > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = r - bar.clientWidth + 6; }
  },
  activate(i) {
    this.cur = i;
    this.exps.forEach((e, j) => { e.root.classList.toggle('on', j === i); if (j !== i) e.stop(); });
    this.renderTabs(); this.updRes();
  },
  add() {
    const e = new Experiment();
    this.exps.push(e); $('#pane').append(e.root);
    this.activate(this.exps.length - 1);
    return e;
  },
  async del(e) {
    const i = this.exps.indexOf(e);
    if (i < 0) return;
    if (await confirmBox(`Удалить «${this.label(e, i)}»?`)) {
      e.destroy(); this.exps.splice(i, 1);
      this.activate(this.exps.length ? Math.min(i, this.exps.length - 1) : -1);
    }
  },
  async rename(i) {
    const e = this.exps[i]; if (!e) return;
    const text = await promptBox('Название эксперимента:', e.custom || this.label(e, i));
    if (text !== null && text.trim()) { e.custom = this.parseCustom(text.trim()); this.renderTabs(); this.updRes(); }
  },
  updRes() {
    const rows = $('#rows'); rows.textContent = '';
    const ds = [];
    this.exps.forEach((e, i) => {
      const color = COLORS[i % COLORS.length], name = this.label(e, i);
      const ms = ['Яркость', `λ = ${e.spinWl.value.toFixed(0)} нм`, 'Насыщенность'][e.chIdx];
      const td = (t, label) => h('td', { 'data-label': label }, t);
      rows.append(h('tr', { class: i === this.cur ? 'sel' : '', tabindex: '0', 'aria-label': `Открыть ${name}`, onclick: () => this.activate(i), onkeydown: ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); this.activate(i); } } },
        td(String(i + 1).padStart(2, '0'), '№'),
        td(h('span', { class: 'table-name' }, h('i', { style: `background:${color}` }), h('span', null, h('strong', null, e.custom || name), h('small', null, `${e.frames.length} фото · ${ms}`))), 'Эксперимент'),
        td(e.k !== null ? C.fmtE(e.k, 4) : '—', 'k, с⁻¹'), td(C.fmtHalf(e.tHalf), 't₁/₂')));
      if (e.times.length && e.norm.length) ds.push({ name, color, times: e.times, areas: e.norm, exp: e });
    });
    $('#experiment-count').textContent = this.exps.length;
    const legend = $('#legend'); legend.textContent = '';
    ds.forEach(d => legend.append(h('span', { class: 'legend-item' }, h('i', { style: `background:${d.color}` }), d.exp.custom || d.name)));
    if (!this.exps.length) rows.append(h('tr', { class: 'empty-row' }, h('td', { colspan: 4 }, 'Добавьте эксперимент — здесь появятся результаты.')));
    this.plot.set(ds);
  },
};

/* ============================ boot ============================ */
function initChrome() {
  /* drag & drop photos */
  let depth = 0;
  const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  window.addEventListener('dragenter', (e) => { if (hasFiles(e)) { depth++; document.body.classList.add('drag'); } });
  window.addEventListener('dragleave', (e) => { if (hasFiles(e) && --depth <= 0) { depth = 0; document.body.classList.remove('drag'); } });
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault(); depth = 0; document.body.classList.remove('drag');
    const exp = App.exps[App.cur] || App.add();
    exp.addFiles([...e.dataTransfer.files]);
  });

  /* keyboard */
  window.addEventListener('keydown', (e) => {
    if ($('#modal').classList.contains('on') || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'SUMMARY' || t.tagName === 'INPUT' && t.type !== 'range' && t.type !== 'checkbox' || t.tagName === 'SELECT')) return;
    const exp = App.exps[App.cur]; if (!exp) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); exp.nav(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); exp.nav(1); }
    else if (e.key === ' ' && !(t && (t.tagName === 'BUTTON' || t.tagName === 'LABEL'))) { e.preventDefault(); exp.togglePlay(); }
  });
}

async function boot() {
  App.plot = new Plot($('#plot'));
  initChrome();
  App.renderTabs(); App.updRes();
  App.status('Загрузка демо…');
  for (let i = 0; i < C.DEMOS.length; i++) {
    const e = App.add();
    e.demoIdx = i;
    await tick();
    await e.demo();
    e.demoIdx = i + 1;
  }
  App.activate(0);
  App.status(STATUS_IDLE);
}
window.__app = App;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
