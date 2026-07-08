// 開発用静的サーバー(依存なし・CWD非依存)。使い方: node tools/dev-server.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const port = Number(process.argv[2] || process.env.PORT || 8932);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webmanifest': 'application/manifest+json',
};

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const fp = path.normalize(path.join(root, p));
  if (!fp.startsWith(path.normalize(root))) { res.writeHead(403); res.end(); return; }
  fs.readFile(fp, (e, d) => {
    if (e) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream' });
    res.end(d);
  });
}).listen(port, () => console.log(`html-editor dev server: http://localhost:${port}`));
