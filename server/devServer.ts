// ==============================================================================
// Zuu Agent — Local Full-Stack Node Dev Server
// Runs all server-side endpoints on localhost:3001 using native Node.js HTTP.
// ==============================================================================

import http from 'http';
import url from 'url';
import crypto from 'crypto';

const PORT = process.env.API_PORT || 3001;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '';

  // Enable CORS for Vite frontend (http://localhost:3000)
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
  if (req.method === 'POST') {
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

  // Route: /api/health
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      platform: 'Zuu Agent Universal Multi-Agent Platform',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || 'development'
    }));
    return;
  }

  // Route: /api/executions/run
  if (pathname === '/api/executions/run' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      executionId: `exec_${Date.now()}`,
      correlationId: `corr_${Date.now()}`,
      status: 'completed',
      output: {
        content: `Executed task: "${body.taskPrompt || 'default'}"`,
        tokensUsed: 1240
      }
    }));
    return;
  }

  // Route: /api/integrations/meta-publish
  if (pathname === '/api/integrations/meta-publish' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      postId: `109847291834910_${Date.now()}`,
      permalinkUrl: `https://www.facebook.com/109847291834910/posts/${Date.now()}`,
      isDryRun: true
    }));
    return;
  }

  // Route: /api/webhooks/meta-facebook
  if (pathname === '/api/webhooks/meta-facebook' && req.method === 'GET') {
    const challenge = parsedUrl.query['hub.challenge'];
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(challenge || 'OK');
    return;
  }

  // 404 Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `Route not found: ${pathname}` }));
});

server.listen(PORT, () => {
  console.log(`[Zuu Agent API Server] Listening on http://localhost:${PORT}`);
});
