/* TiO2 Photocatalytic Degradation Analyzer — core (port of SpotAnalyzer + demo frames) */
(function (root) {
'use strict';

const BG_THRESHOLD = 15;
const EXPERIMENT_COLORS = ['#5B9BD5', '#70AD47', '#FFC000', '#ED7D31', '#A5A5A5', '#9DC3E6',
  '#C5E0B4', '#F4B183', '#B4C7E7', '#D6B4E8', '#82C4C4', '#D9A6A6'];

/* ---------- wavelength ---------- */
function wavelengthToRgb(wl, gamma) {
  gamma = gamma === undefined ? 0.8 : gamma;
  let r = 0, g = 0, b = 0, att = 1;
  if (wl >= 380 && wl < 440) { r = -(wl - 440) / (440 - 380); b = 1; }
  else if (wl >= 440 && wl < 490) { g = (wl - 440) / (490 - 440); b = 1; }
  else if (wl >= 490 && wl < 510) { g = 1; b = -(wl - 510) / (510 - 490); }
  else if (wl >= 510 && wl < 580) { r = (wl - 510) / (580 - 510); g = 1; }
  else if (wl >= 580 && wl < 645) { r = 1; g = -(wl - 645) / (645 - 580); }
  else if (wl >= 645 && wl <= 750) { r = 1; }
  if (wl >= 380 && wl < 420) att = 0.3 + 0.7 * (wl - 380) / (420 - 380);
  else if (wl > 700 && wl <= 750) att = 0.3 + 0.7 * (750 - wl) / (750 - 700);
  const f = (v) => Math.trunc(255 * Math.pow(v * att, gamma));
  return [f(r), f(g), f(b)];
}
function wavelengthToBgrIndex(wl) {
  const [r, g, b] = wavelengthToRgb(wl);
  if (r >= g && r >= b) return 2;
  if (g >= r && g >= b) return 1;
  return 0;
}

/* ---------- frames ---------- */
function makeFrame(w, h, rgba) {
  const n = w * h;
  const gray = new Uint8Array(n), sat = new Uint8Array(n);
  const B = new Uint8Array(n), G = new Uint8Array(n), R = new Uint8Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const r = rgba[j], g = rgba[j + 1], b = rgba[j + 2];
    R[i] = r; G[i] = g; B[i] = b;
    gray[i] = (r * 4899 + g * 9617 + b * 1868 + 8192) >> 14;
    const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
    const mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
    sat[i] = mx ? Math.round(255 * (mx - mn) / mx) : 0;
  }
  return { w, h, rgba, gray, sat, ch: [B, G, R] };
}

/* ---------- analysis ---------- */
function percentile(hist, count, q) {
  const pos = (count - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  let cum = 0, vlo = -1, vhi = 255;
  for (let v = 0; v < 256; v++) {
    cum += hist[v];
    if (vlo < 0 && cum > lo) vlo = v;
    if (cum > hi) { vhi = v; break; }
  }
  return vlo + (vhi - vlo) * (pos - lo);
}

function computeOd(fr, channel, bgrIndex) {
  const n = fr.w * fr.h, gray = fr.gray, fg = new Uint8Array(n);
  let fc = 0;
  for (let i = 0; i < n; i++) if (gray[i] > BG_THRESHOLD) { fg[i] = 1; fc++; }
  const od = new Float32Array(n);
  if (fc === 0) return { od, fg, fc, I0: 1.0 };
  if (channel === 'saturation') {
    const s = fr.sat; let sum = 0;
    for (let i = 0; i < n; i++) if (fg[i]) { od[i] = s[i] / 255; sum += s[i]; }
    return { od, fg, fc, I0: sum / fc };
  }
  const data = channel === 'bgr' ? fr.ch[bgrIndex] : gray;
  const hist = new Float64Array(256);
  for (let i = 0; i < n; i++) if (fg[i]) hist[data[i]]++;
  const I0 = Math.max(percentile(hist, fc, 0.95), 1.0);
  const lut = new Float32Array(256);
  for (let v = 0; v < 256; v++) lut[v] = Math.max(Math.log10(I0 / Math.min(Math.max(v, 1), 255)), 0);
  for (let i = 0; i < n; i++) if (fg[i]) od[i] = lut[data[i]];
  return { od, fg, fc, I0 };
}

function otsu(hist, total) {
  const scale = 1 / total, eps = 1.1920929e-7;
  let mu = 0;
  for (let i = 0; i < 256; i++) mu += i * hist[i] * scale;
  let q1 = 0, mu1 = 0, maxSigma = 0, maxVal = 0;
  for (let i = 0; i < 256; i++) {
    const p = hist[i] * scale;
    mu1 *= q1; q1 += p;
    const q2 = 1 - q1;
    if (Math.min(q1, q2) < eps || Math.max(q1, q2) > 1 - eps) continue;
    mu1 = (mu1 + i * p) / q1;
    const mu2 = (mu - q1 * mu1) / q2;
    const sigma = q1 * q2 * (mu1 - mu2) * (mu1 - mu2);
    if (sigma > maxSigma) { maxSigma = sigma; maxVal = i; }
  }
  return maxVal;
}

function autoThreshold(od, fg) {
  const n = od.length;
  let mx = 0, cnt = 0;
  for (let i = 0; i < n; i++) if (fg[i]) { cnt++; if (od[i] > mx) mx = od[i]; }
  if (cnt === 0 || mx < 1e-6) return 0.0;
  const hist = new Float64Array(256);
  for (let i = 0; i < n; i++) {
    if (!fg[i]) continue;
    let v = od[i] / mx * 255;
    v = v < 0 ? 0 : (v > 255 ? 255 : v);
    hist[Math.trunc(v)]++;
  }
  return otsu(hist, cnt) / 255 * mx;
}

function analyze(fr, channel, bgrIndex, threshold, auto) {
  const r = computeOd(fr, channel, bgrIndex);
  if (r.fc === 0) return { meanOd: 0, stainPct: 0, od: r.od, fg: r.fg, thr: 0, I0: r.I0, fc: 0 };
  const thr = auto ? autoThreshold(r.od, r.fg) : threshold;
  const od = r.od, fg = r.fg, n = od.length;
  let sum = 0, cnt = 0;
  for (let i = 0; i < n; i++) if (fg[i]) { sum += od[i]; if (od[i] > thr) cnt++; }
  return { meanOd: sum / r.fc, stainPct: cnt / r.fc, od, fg, thr, I0: r.I0, fc: r.fc };
}

/* mean OD over stain pixels, falls back to foreground mean when no stain pixels */
function seriesValue(r) {
  const od = r.od, fg = r.fg, thr = r.thr, n = od.length;
  let sum = 0, cnt = 0;
  for (let i = 0; i < n; i++) if (fg[i] && od[i] > thr) { sum += od[i]; cnt++; }
  return cnt === 0 ? r.meanOd : sum / cnt;
}

function previewInto(fr, r, maskRGBA, resRGBA) {
  const n = fr.w * fr.h, rgba = fr.rgba, od = r.od, fg = r.fg, thr = r.thr;
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    if (fg[i] && od[i] > thr) {
      maskRGBA[j] = maskRGBA[j + 1] = maskRGBA[j + 2] = 255;
      resRGBA[j] = rgba[j]; resRGBA[j + 1] = rgba[j + 1]; resRGBA[j + 2] = rgba[j + 2];
    } else {
      maskRGBA[j] = maskRGBA[j + 1] = maskRGBA[j + 2] = 0;
      resRGBA[j] = resRGBA[j + 1] = resRGBA[j + 2] = 0;
    }
    maskRGBA[j + 3] = 255; resRGBA[j + 3] = 255;
  }
}

function kinetics(meanOds, dt) {
  const none = (times, norm, lnr) => ({ k: null, tHalf: null, times: times || [], norm: norm || [], lnr: lnr || [] });
  if (meanOds.length < 2) return none();
  let first = -1;
  for (let i = 0; i < meanOds.length; i++) if (meanOds[i] > 1e-10) { first = i; break; }
  if (first < 0) return none();
  const A0 = meanOds[first];
  const times = meanOds.map((_, i) => i * dt);
  const norm = meanOds.map((a) => a / A0);
  const vt = [], vl = [];
  meanOds.forEach((a, i) => { if (a > 1e-10) { vt.push(times[i]); vl.push(Math.log(a / A0)); } });
  if (vt.length < 2) return none(times, norm, vl);
  const n = vt.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sx += vt[i]; sy += vl[i]; sxx += vt[i] * vt[i]; sxy += vt[i] * vl[i]; }
  const d = n * sxx - sx * sx;
  if (Math.abs(d) < 1e-30) return none(times, norm, vl);
  const k = -((n * sxy - sx * sy) / d);
  return { k, tHalf: k > 0 ? Math.log(2) / k : null, times, norm, lnr: vl };
}

/* ---------- number formatting (python-style) ---------- */
function fmtE(x, d) {
  const m = x.toExponential(d).match(/^(-?[\d.]+)e([+-])(\d+)$/);
  return m[1] + 'e' + m[2] + (m[3].length < 2 ? '0' + m[3] : m[3]);
}
function fmtHalf(th) {
  if (th === null || th === undefined) return '—';
  if (th < 60) return th.toFixed(2) + ' с';
  if (th < 3600) return (th / 60).toFixed(2) + ' мин';
  return (th / 3600).toFixed(2) + ' ч';
}

/* ---------- synthetic demo frames (Beer–Lambert per channel) ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function smoothNoise(w, h, cell, rng) {
  const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, g = new Float32Array(gw * gh);
  for (let i = 0; i < g.length; i++) g[i] = rng();
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = y / cell, y0 = fy | 0, ty = fy - y0, sy = ty * ty * (3 - 2 * ty);
    for (let x = 0; x < w; x++) {
      const fx = x / cell, x0 = fx | 0, tx = fx - x0, sx = tx * tx * (3 - 2 * tx);
      const a = g[y0 * gw + x0], b = g[y0 * gw + x0 + 1], c = g[(y0 + 1) * gw + x0], d = g[(y0 + 1) * gw + x0 + 1];
      out[y * w + x] = (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
    }
  }
  return out;
}
function stainMap(w, h, rng) {
  const cx = w * (0.5 + (rng() - 0.5) * 0.10), cy = h * (0.5 + (rng() - 0.5) * 0.10);
  const R = h * 0.26;
  const a1 = rng() * 6.283, a2 = rng() * 6.283, a3 = rng() * 6.283;
  const tex = smoothNoise(w, h, 16, rng), tex2 = smoothNoise(w, h, 5, rng);
  const sats = [0, 1].map(() => {
    const ang = rng() * 6.283, dist = R * (1.45 + rng() * 0.2);
    return { x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist, r: R * (0.12 + rng() * 0.08) };
  });
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy, th = Math.atan2(dy, dx), i = y * w + x;
      const rr = R * (1 + 0.15 * Math.sin(2 * th + a1) + 0.09 * Math.sin(3 * th + a2) + 0.05 * Math.sin(5 * th + a3));
      const d = Math.sqrt(dx * dx + dy * dy);
      const m = d < rr ? 1 : 0;
      const ring = 1 + 0.22 * Math.exp(-Math.pow((d - rr * 0.9) / (R * 0.09), 2));
      let v = m * ring;
      for (const s of sats) {
        const ds = Math.hypot(x - s.x, y - s.y);
        if (ds < s.r) v = Math.max(v, 0.9);
      }
      out[i] = v * (0.9 + 0.2 * tex[i] + 0.06 * (tex2[i] - 0.5));
    }
  }
  return out;
}

const DEMOS = [
  { name: 'Метиленовый синий', eps: [1.0, 0.40, 0.10], c0: 1.30, k: 1.05e-3, dt: 300, ch: 1, wl: 660, seed: 11 },
  { name: 'Родамин B', eps: [0.10, 1.0, 0.30], c0: 1.20, k: 6.5e-4, dt: 480, ch: 0, wl: 540, seed: 23 },
  { name: 'Метилоранж', eps: [0.04, 0.34, 1.0], c0: 1.15, k: 1.9e-3, dt: 120, ch: 1, wl: 450, seed: 37 },
];

function renderDemo(def, n, w, h) {
  n = n || 10; w = w || 420; h = h || 315;
  const rng = mulberry32(def.seed);
  const conc = stainMap(w, h, rng);
  const kvar = smoothNoise(w, h, 40, rng);
  const grain = smoothNoise(w, h, 3, rng);
  const cx = w / 2, cy = h / 2, RD = h * 0.45;
  const base = [216, 214, 207];
  const frames = [];
  for (let f = 0; f < n; f++) {
    const t = f * def.dt, jit = 1 + (rng() - 0.5) * 0.012;
    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x, j = i * 4, dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy);
        if (d > RD) {
          const v = 4 + rng() * 7;
          rgba[j] = v; rgba[j + 1] = v; rgba[j + 2] = v + 1; rgba[j + 3] = 255;
          continue;
        }
        const lamp = (0.95 + 0.05 * (1 - d / RD) - 0.015 * (dx / RD)) * jit * (1 + (grain[i] - 0.5) * 0.05);
        const c = conc[i];
        const od = c > 0.002 ? def.c0 * c * Math.exp(-def.k * t * (0.75 + 0.5 * kvar[i])) : 0;
        for (let k = 0; k < 3; k++) {
          const tr = od > 0 ? Math.pow(10, -od * def.eps[k]) : 1;
          rgba[j + k] = base[k] * lamp * tr + (rng() - 0.5) * 6;
        }
        rgba[j + 3] = 255;
      }
    }
    frames.push(makeFrame(w, h, rgba));
  }
  return frames;
}

const Core = {
  BG_THRESHOLD, EXPERIMENT_COLORS, DEMOS,
  wavelengthToRgb, wavelengthToBgrIndex, makeFrame, computeOd, autoThreshold, analyze, seriesValue,
  previewInto, kinetics, fmtE, fmtHalf, renderDemo,
};
if (typeof module !== 'undefined' && module.exports) module.exports = Core;
else root.Core = Core;
})(typeof window !== 'undefined' ? window : globalThis);
