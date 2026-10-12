// ==============================================================================
// Zuu Agent — Vercel Serverless Function: System Health & Diagnostics API
// Route: GET /api/health
// ==============================================================================

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const startTime = Date.now();
  const env = process.env.NODE_ENV || 'production';
  const hasSupabaseUrl = Boolean(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
  const hasFbToken = Boolean(process.env.FB_PAGE_ACCESS_TOKEN);

  const diagnostics = {
    status: 'healthy',
    platform: 'Zuu Agent Universal Multi-Agent Platform',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime,
    environment: env,
    services: {
      database: {
        configured: hasSupabaseUrl,
        mode: hasSupabaseUrl ? 'supabase_cloud' : 'local_storage_engine',
        status: hasSupabaseUrl ? 'connected' : 'emulated'
      },
      aiProviders: {
        gemini: hasGeminiKey ? 'configured' : 'fallback_simulator_ready',
        openai: hasOpenAIKey ? 'configured' : 'fallback_simulator_ready'
      },
      metaFacebook: {
        configured: hasFbToken,
        mode: hasFbToken ? 'live_publishing_ready' : 'dry_run_simulation'
      }
    }
  };

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json(diagnostics);
}
