import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const type = contentTypes[extname(file)];
    if (!file.startsWith(resolve(root) + sep) || !type) throw Error('Not found');
    const data = await readFile(file);
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    response.end(data);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

const port = Number(process.env.GALAXY_PORT ?? 4173);
server.listen(port, '127.0.0.1', () => console.log('GalaxyV2 · http://127.0.0.1:' + port));
