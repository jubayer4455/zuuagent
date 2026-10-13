// ==============================================================================
// Zuu Agent — Universal Webhook Ingestion Trigger Endpoint
// Route: POST /api/webhooks/trigger
// Accepts arbitrary JSON payloads from external webhooks (Shopify, Telegram,
// Stripe, GitHub, custom forms) and starts server-side workflow execution.
// ==============================================================================

import handleWorkflowRun from '../workflows/run';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { workflowId, sync = 'true' } = req.query || {};
  const webhookPayload = req.body || {};

  // Extract topic or context from incoming webhook payload
  const inferredTopic = webhookPayload.topic || 
                        webhookPayload.message || 
                        webhookPayload.title || 
                        webhookPayload.prompt ||
                        JSON.stringify(webhookPayload).substring(0, 100);

  // Construct a standard workflow execution specification
  const executionPayload = {
    workflowId: workflowId || 'webhook_dynamic_flow',
    workflowName: `Webhook Triggered Flow [${new Date().toLocaleTimeString()}]`,
    isDryRun: true,
    triggerPayload: {
      source: 'external_webhook',
      topic: inferredTopic,
      rawBody: webhookPayload,
      headers: req.headers
    },
    nodes: [
      {
        id: 'node_trigger',
        type: 'webhook_trigger',
        category: 'trigger',
        title: 'Incoming Webhook Event',
        config: { topic: inferredTopic }
      },
      {
        id: 'node_ai_agent',
        type: 'ai_agent',
        category: 'ai',
        title: 'Autonomous Ingestion Agent',
        config: {
          agentName: 'Webhook Processing Agent',
          systemPrompt: 'You are an autonomous AI agent processing external webhook events into executive summaries or social posts.',
          promptTemplate: 'Analyze and summarize the following incoming webhook event: "{{topic}}". Provide key insights and actions.',
          topic: inferredTopic,
          model: 'gemini-2.0-flash',
          temperature: 0.7
        }
      },
      {
        id: 'node_approval',
        type: 'approval_gate',
        category: 'approval',
        title: 'Automated Integrity Sign-off',
        config: { autoApproveSimulation: true }
      },
      {
        id: 'node_facebook',
        type: 'facebook_publish',
        category: 'action',
        title: 'Meta Facebook Publisher',
        config: { pageId: '109847291834910', dryRun: true }
      }
    ],
    connections: [
      { from: 'node_trigger', to: 'node_ai_agent' },
      { from: 'node_ai_agent', to: 'node_approval' },
      { from: 'node_approval', to: 'node_facebook' }
    ]
  };

  // If synchronous execution requested, run and return full pipeline result
  if (sync === 'true') {
    const internalReq = {
      method: 'POST',
      headers: req.headers,
      query: req.query,
      body: executionPayload
    };
    return await handleWorkflowRun(internalReq, res);
  }

  // Otherwise, return 202 Accepted and trigger asynchronously
  const asyncExecutionId = `exec_async_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Fire in background
  setTimeout(async () => {
    try {
      const mockRes = {
        status: () => ({ json: () => {} }),
        setHeader: () => mockRes
      };
      await handleWorkflowRun({ method: 'POST', headers: {}, query: {}, body: executionPayload }, mockRes);
    } catch (_) {}
  }, 10);

  return res.status(202).json({
    success: true,
    status: 'accepted_for_background_execution',
    executionId: asyncExecutionId,
    receivedAt: new Date().toISOString(),
    inferredTopic
  });
}
