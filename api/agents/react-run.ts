// ==============================================================================
// Zuu Agent — API: ReAct Agent Autonomous Run Endpoint
// Route: POST /api/agents/react-run
// Runs autonomous multi-turn reasoning and tool-calling execution loops on server.
// ==============================================================================

import { ReActAgentEngine } from '../../src/services/ai/reactAgentEngine.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const {
    goal = 'বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম আর গরম খিচুড়ির টান',
    systemDirective = 'You are Trollogiya, an elite Bengali social media humorist and satirist.',
    maxTurns = 3
  } = req.body || {};

  try {
    const result = await ReActAgentEngine.execute(goal, systemDirective, maxTurns);

    return res.status(200).json({
      success: true,
      goal,
      result
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'ReAct Agent execution failed'
    });
  }
}
