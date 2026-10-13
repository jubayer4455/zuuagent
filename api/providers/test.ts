// ==============================================================================
// Zuu Agent — Serverless API: AI Provider Connectivity & Capability Test
// Route: POST /api/providers/test
// Description: Tests live provider connections server-side, validates capabilities,
//              and masks secret credentials. Never exposes raw keys to the browser.
// ==============================================================================

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { providerSlug, model = 'default', capability = 'text' } = req.body || {};

  if (!providerSlug) {
    return res.status(400).json({ error: 'providerSlug is required.' });
  }

  const startTime = Date.now();

  function maskKey(key?: string): string {
    if (!key) return 'not_configured';
    if (key.length <= 8) return '********';
    return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
  }

  // 1. Google Gemini
  if (providerSlug === 'google-gemini' || providerSlug === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return res.status(200).json({
        provider: 'google-gemini',
        status: 'missing_credentials',
        isLive: false,
        maskedKey: maskKey(),
        message: 'GEMINI_API_KEY is not configured in server environment (.env). Fallback simulation ready.',
        capabilities: {
          text: true,
          vision: true,
          imageGen: true,
          embeddings: true
        }
      });
    }

    // Live test with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const targetModel = model === 'default' ? 'gemini-2.0-flash' : model;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Ping test' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      if (response.status === 429) {
        return res.status(200).json({
          provider: 'google-gemini',
          status: 'quota_error',
          isLive: false,
          maskedKey: maskKey(apiKey),
          latencyMs,
          message: 'Gemini API quota exceeded or rate limit reached.'
        });
      }

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        return res.status(200).json({
          provider: 'google-gemini',
          status: 'connection_failed',
          isLive: false,
          maskedKey: maskKey(apiKey),
          latencyMs,
          message: errorData?.error?.message || `HTTP ${response.status} from Google Gemini API.`
        });
      }

      return res.status(200).json({
        provider: 'google-gemini',
        status: 'verified_live',
        isLive: true,
        maskedKey: maskKey(apiKey),
        latencyMs,
        message: `Successfully connected to Google Gemini (${targetModel}).`,
        capabilities: {
          text: true,
          vision: true,
          imageGen: true,
          embeddings: true
        }
      });
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError';
      return res.status(200).json({
        provider: 'google-gemini',
        status: isTimeout ? 'timeout' : 'network_error',
        isLive: false,
        maskedKey: maskKey(apiKey),
        latencyMs: Date.now() - startTime,
        message: isTimeout ? 'Connection timed out after 10000ms.' : (err.message || 'Network connection failed.')
      });
    }
  }

  // 2. OpenAI / OpenRouter
  if (providerSlug === 'openai' || providerSlug === 'openrouter') {
    const apiKey = providerSlug === 'openai' ? process.env.OPENAI_API_KEY : process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        provider: providerSlug,
        status: 'missing_credentials',
        isLive: false,
        maskedKey: maskKey(),
        message: `${providerSlug.toUpperCase()}_API_KEY is not configured in server environment (.env). Fallback simulation ready.`,
        capabilities: {
          text: true,
          vision: true,
          imageGen: providerSlug === 'openai',
          embeddings: providerSlug === 'openai'
        }
      });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const baseUrl = providerSlug === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';

      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        return res.status(200).json({
          provider: providerSlug,
          status: response.status === 429 ? 'quota_error' : 'connection_failed',
          isLive: false,
          maskedKey: maskKey(apiKey),
          latencyMs,
          message: `API returned status ${response.status}.`
        });
      }

      return res.status(200).json({
        provider: providerSlug,
        status: 'verified_live',
        isLive: true,
        maskedKey: maskKey(apiKey),
        latencyMs,
        message: `Successfully connected to ${providerSlug}.`,
        capabilities: {
          text: true,
          vision: true,
          imageGen: providerSlug === 'openai',
          embeddings: true
        }
      });
    } catch (err: any) {
      return res.status(200).json({
        provider: providerSlug,
        status: err.name === 'AbortError' ? 'timeout' : 'network_error',
        isLive: false,
        maskedKey: maskKey(apiKey),
        latencyMs: Date.now() - startTime,
        message: err.message || 'Connection failed.'
      });
    }
  }

  // 3. Local Ollama
  if (providerSlug === 'ollama') {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    try {
      const response = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({
          provider: 'ollama',
          status: 'verified_live',
          isLive: true,
          baseUrl,
          latencyMs: Date.now() - startTime,
          message: 'Local Ollama daemon is reachable and responding.',
          modelsAvailable: data.models?.map((m: any) => m.name) || []
        });
      }
    } catch (_) {}

    return res.status(200).json({
      provider: 'ollama',
      status: 'offline',
      isLive: false,
      baseUrl,
      latencyMs: Date.now() - startTime,
      message: 'Local Ollama daemon is not running on localhost:11434. Simulation fallback ready.'
    });
  }

  return res.status(200).json({
    provider: providerSlug,
    status: 'simulated_ready',
    isLive: false,
    message: `Provider adapter "${providerSlug}" is configured in simulated/dry-run mode.`
  });
}
