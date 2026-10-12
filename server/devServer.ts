// ==============================================================================
// Zuu Agent — Local Full-Stack Node Dev Server
// Runs all server-side endpoints on localhost:3001 using native Node.js HTTP.
// ==============================================================================

import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';

// Load .env file safely
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  console.warn('[Server] Could not parse .env file:', e);
}

// Import serverless function handlers
import handleBootstrap from '../api/auth/bootstrap.ts';
import handleSession from '../api/auth/session.ts';
import handleHealth from '../api/health.ts';
import handleExecutionsRun from '../api/executions/run.ts';
import handleApprovalsDecide from '../api/approvals/decide.ts';
import handleMetaPublish from '../api/integrations/meta-publish.ts';
import handleMetaWebhook from '../api/webhooks/meta-facebook.ts';
import handleCronWorker from '../api/schedules/cron-worker.ts';

const PORT = process.env.API_PORT || 3001;

function createResponseAdapter(res: http.ServerResponse) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  };

  return {
    setHeader(key: string, value: string) {
      headers[key] = value;
      res.setHeader(key, value);
      return this;
    },
    status(statusCode: number) {
      res.statusCode = statusCode;
      return {
        json(data: any) {
          headers['Content-Type'] = 'application/json';
          for (const [k, v] of Object.entries(headers)) {
            res.setHeader(k, v);
          }
          res.writeHead(statusCode);
          res.end(JSON.stringify(data));
        },
        send(data: any) {
          for (const [k, v] of Object.entries(headers)) {
            res.setHeader(k, v);
          }
          res.writeHead(statusCode);
          res.end(typeof data === 'string' ? data : JSON.stringify(data));
        }
      };
    }
  };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '';

  // Enable CORS Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse JSON Body
  let body: any = {};
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const dataStr = Buffer.concat(buffers).toString();
      if (dataStr) {
        body = JSON.parse(dataStr);
      }
    } catch (e) {
      body = {};
    }
  }

  const reqAdapter: any = {
    method: req.method,
    headers: req.headers,
    query: parsedUrl.query,
    body
  };
  const resAdapter = createResponseAdapter(res);

  try {
    if (pathname === '/api/health') {
      return await handleHealth(reqAdapter, resAdapter);
    }
    if (pathname === '/api/auth/bootstrap') {
      return await handleBootstrap(reqAdapter, resAdapter);
    }
    if (pathname === '/api/auth/session') {
      return await handleSession(reqAdapter, resAdapter);
    }
    if (pathname === '/api/executions/run') {
      return await handleExecutionsRun(reqAdapter, resAdapter);
    }
    if (pathname === '/api/approvals/decide') {
      return await handleApprovalsDecide(reqAdapter, resAdapter);
    }
    if (pathname === '/api/integrations/meta-publish') {
      return await handleMetaPublish(reqAdapter, resAdapter);
    }
    if (pathname === '/api/webhooks/meta-facebook') {
      return await handleMetaWebhook(reqAdapter, resAdapter);
    }
    if (pathname === '/api/schedules/cron-worker') {
      return await handleCronWorker(reqAdapter, resAdapter);
    }

    // 404 Fallback
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Route not found: ${pathname}` }));
  } catch (err: any) {
    console.error(`[Server Error] on ${pathname}:`, err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`[Zuu Agent API Server] Listening on http://localhost:${PORT}`);
});
