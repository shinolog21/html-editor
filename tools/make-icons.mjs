// PWAアイコン生成(依存なし: 自前PNGエンコーダ + node:zlib) — sozai-labのツールを流用
// 使い方: node tools/make-icons.mjs
import { deflateSync } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'icons');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- PNG書き出し ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function writePng(file, w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log(path.basename(file), w + 'x' + h, png.length, 'bytes');
}

/* ---------- 描画: 白地 + 薄いグリッド + シアンの </> ---------- */
const BG = [251, 253, 254];    // ほぼ白
const GRID = [217, 228, 238];  // 薄いスレート
const CYAN = [11, 114, 133];   // エディタのアクセント #0B7285

// 点と線分の距離(丸キャップの太線ストローク用)
function dist2seg(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay;
  const wx = px - ax, wy = py - ay;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(px - ax, py - ay);
  const c2 = vx * vx + vy * vy;
  if (c1 >= c2) return Math.hypot(px - bx, py - by);
  const t = c1 / c2;
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

const T = 0.030; // ストローク半幅
const STROKES = [
  // <
  [0.315, 0.375, 0.185, 0.500],
  [0.185, 0.500, 0.315, 0.625],
  // >
  [0.685, 0.375, 0.815, 0.500],
  [0.815, 0.500, 0.685, 0.625],
  // /
  [0.565, 0.345, 0.435, 0.655],
];

function sample(u, v, rounded) {
  if (rounded) {
    const r = 0.22;
    const dx = Math.max(r - u, u - (1 - r), 0);
    const dy = Math.max(r - v, v - (1 - r), 0);
    if (dx * dx + dy * dy > r * r) return [0, 0, 0, 0];
  }
  let [R, G, B] = BG;
  // 薄いグリッド(8分割)
  const g = 0.0035;
  for (let i = 1; i < 8; i++) {
    const p = i / 8;
    if (Math.abs(u - p) < g || Math.abs(v - p) < g) { [R, G, B] = GRID; break; }
  }
  // シアンの </>
  for (const [ax, ay, bx, by] of STROKES) {
    if (dist2seg(u, v, ax, ay, bx, by) <= T) { [R, G, B] = CYAN; break; }
  }
  return [R, G, B, 255];
}

function render(size, rounded) {
  const rgba = Buffer.alloc(size * size * 4);
  const SS = 3; // 3x3スーパーサンプリング
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let R = 0, G = 0, B = 0, A = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const [r, g, b, a] = sample((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size, rounded);
          R += r * (a / 255); G += g * (a / 255); B += b * (a / 255); A += a;
        }
      }
      const n = SS * SS;
      A = A / n;
      const p = (y * size + x) * 4;
      rgba[p] = Math.min(255, Math.round(R / n * (A > 0 ? 255 / A : 0)));
      rgba[p + 1] = Math.min(255, Math.round(G / n * (A > 0 ? 255 / A : 0)));
      rgba[p + 2] = Math.min(255, Math.round(B / n * (A > 0 ? 255 / A : 0)));
      rgba[p + 3] = Math.round(A);
    }
  }
  return rgba;
}

writePng(path.join(OUT, 'icon-192.png'), 192, 192, render(192, true));
writePng(path.join(OUT, 'icon-512.png'), 512, 512, render(512, true));
writePng(path.join(OUT, 'icon-512-maskable.png'), 512, 512, render(512, false));
writePng(path.join(OUT, 'apple-touch-icon.png'), 180, 180, render(180, false));
console.log('done');
