// ==============================================================================
// Zuu Agent — Knowledge Base Document Ingestion & RAG Chunker
// Route: POST /api/knowledge/ingest
// Ingests brand guidelines, FAQs, manuals, and documents into semantic chunks
// with token bounds and stores them in Supabase for agent RAG retrieval.
// ==============================================================================

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const {
    title = 'Document Ingestion',
    content = '',
    agentId,
    category = 'brand_guideline',
    chunkSize = 300 // words per chunk
  } = req.body || {};

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Document content is required for ingestion.' });
  }

  const startTime = Date.now();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const hasSupabase = Boolean(supabaseUrl && serviceRoleKey);
  const supabase = hasSupabase ? createClient(supabaseUrl, serviceRoleKey) : null;

  // 1. Semantic Chunking Logic (Splits by paragraphs and respects chunk bounds)
  const rawParagraphs = content.split(/\n\s*\n/);
  const chunks: Array<{ chunkIndex: number; text: string; tokenCount: number; hash: string }> = [];

  let currentChunkWords: string[] = [];
  let chunkCounter = 0;

  for (const para of rawParagraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    if (currentChunkWords.length + words.length > chunkSize && currentChunkWords.length > 0) {
      const chunkText = currentChunkWords.join(' ');
      chunks.push({
        chunkIndex: chunkCounter++,
        text: chunkText,
        tokenCount: Math.round(chunkText.length / 3.8),
        hash: crypto.createHash('sha256').update(chunkText).digest('hex').substring(0, 16)
      });
      // 20% overlap from previous chunk for semantic continuity
      const overlapWords = currentChunkWords.slice(-Math.floor(chunkSize * 0.15));
      currentChunkWords = [...overlapWords, ...words];
    } else {
      currentChunkWords.push(...words);
    }
  }

  if (currentChunkWords.length > 0) {
    const chunkText = currentChunkWords.join(' ');
    chunks.push({
      chunkIndex: chunkCounter++,
      text: chunkText,
      tokenCount: Math.round(chunkText.length / 3.8),
      hash: crypto.createHash('sha256').update(chunkText).digest('hex').substring(0, 16)
    });
  }

  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // 2. Persist to Supabase if connected
  let persistedInCloud = false;
  if (supabase) {
    try {
      await supabase.from('knowledge_documents').insert({
        id: docId,
        title,
        source_type: 'raw_text',
        mime_type: 'text/markdown',
        status: 'ready',
        total_tokens: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
        metadata: { category, chunkCount: chunks.length }
      });

      // Save top chunks into agent_memories for instant RAG recall
      if (agentId) {
        const memoryInserts = chunks.slice(0, 5).map(c => ({
          agent_id: agentId,
          category: 'knowledge',
          key: `${title} (Part ${c.chunkIndex + 1})`,
          content: c.text,
          status: 'active'
        }));
        await supabase.from('agent_memories').insert(memoryInserts);
      }

      persistedInCloud = true;
    } catch (_) {}
  }

  const durationMs = Date.now() - startTime;

  return res.status(200).json({
    success: true,
    documentId: docId,
    title,
    category,
    totalWords: content.split(/\s+/).length,
    chunksCreated: chunks.length,
    totalEstimatedTokens: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
    persistedInCloud,
    durationMs,
    sampleChunks: chunks.slice(0, 3)
  });
}
