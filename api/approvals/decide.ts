// ==============================================================================
// Zuu Agent — Vercel Serverless Function: Approval Decision Gate Endpoint
// Route: POST /api/approvals/decide
// ==============================================================================

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { approvalId, decision, decisionReason, payloadChecksum } = req.body || {};

  if (!approvalId || !['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Valid approvalId and decision (approved|rejected) are required.' });
  }

  return res.status(200).json({
    success: true,
    approvalId,
    decision,
    decisionReason: decisionReason || 'Reviewed and confirmed via server-side API',
    decidedAt: new Date().toISOString()
  });
}
