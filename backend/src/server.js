import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import worker from './index.js';

// Load .env file manually if present for local Node environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valParts] = trimmed.split('=');
      process.env[key.trim()] = valParts.join('=').trim();
    }
  });
}

const PORT = process.env.PORT || 3000;

// Node.js HTTP Server Adapter wrapping the Cloudflare Worker fetch handler
const server = http.createServer(async (req, res) => {
  const url = `http://${req.headers.host || 'localhost'}${req.url}`;
  
  let bodyChunks = [];
  req.on('data', chunk => bodyChunks.push(chunk));
  
  req.on('end', async () => {
    const bodyBuffer = Buffer.concat(bodyChunks);
    const options = {
      method: req.method,
      headers: req.headers
    };
    if (req.method !== 'GET' && req.method !== 'HEAD' && bodyBuffer.length > 0) {
      options.body = bodyBuffer;
    }

    const webReq = new Request(url, options);

    try {
      const webRes = await worker.fetch(webReq, process.env);
      
      res.statusCode = webRes.status;
      webRes.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });
      
      const responseBuffer = Buffer.from(await webRes.arrayBuffer());
      res.end(responseBuffer);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

if (process.env.NODE_ENV !== 'test' && process.env.AUTO_START !== 'false') {
  server.listen(PORT, () => {
    console.log(`🚀 NIMO Backend Adapter listening on port ${PORT}`);
    console.log(`- Health Check: http://localhost:${PORT}/api/health`);
    console.log(`- NIMO Endpoint: http://localhost:${PORT}/api/nimo/chat`);
  });
}

export default server;
