// ==============================================================================
// Zuu Agent — Memory & Knowledge Base Database Service
// Supports Supabase PostgreSQL persistence with resilient localStorage cache
// and strictly scoped memory partitions for multi-agent isolation.
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { AgentMemory, KnowledgeDocument, MemoryCategory } from '../types';
import { generateUUID } from './agentDatabaseService';

const LOCAL_STORAGE_MEMORIES_KEY = 'zuu_agent_memories_v2';
const LOCAL_STORAGE_KNOWLEDGE_KEY = 'zuu_knowledge_docs_v2';

/**
 * Load all memory records from Supabase or LocalStorage
 */
export async function loadMemoriesFromStorage(seedFallback: AgentMemory[]): Promise<AgentMemory[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('agent_memories')
        .select('*')
        .neq('status', 'deleted')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: AgentMemory[] = data.map(m => ({
          id: m.id,
          agentId: m.agent_id || undefined,
          scope: m.scope as 'agent' | 'shared' | 'global',
          category: m.category as MemoryCategory,
          key: m.key || '',
          content: m.content,
          source: m.source || 'manual',
          priority: m.priority || 5,
          expiresAt: m.expires_at || undefined,
          status: m.status as 'active' | 'pinned' | 'archived',
          provenance: m.provenance || {},
          createdAt: m.created_at,
          updatedAt: m.updated_at
        }));

        try {
          localStorage.setItem(LOCAL_STORAGE_MEMORIES_KEY, JSON.stringify(mapped));
        } catch (_) {}

        return mapped;
      }
    } catch (e) {
      console.warn('[memoryDatabaseService] Supabase loadMemories error:', e);
    }
  }

  // Fallback to local storage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_MEMORIES_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  // Initial seed fallback
  try {
    localStorage.setItem(LOCAL_STORAGE_MEMORIES_KEY, JSON.stringify(seedFallback));
  } catch (_) {}
  return seedFallback;
}

/**
 * Persist memory creation across Supabase and local cache
 */
export async function persistMemoryCreate(memory: AgentMemory): Promise<void> {
  // 1. Write to Local Storage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_MEMORIES_KEY);
    const list: AgentMemory[] = cached ? JSON.parse(cached) : [];
    const updated = [memory, ...list.filter(m => m.id !== memory.id)];
    localStorage.setItem(LOCAL_STORAGE_MEMORIES_KEY, JSON.stringify(updated));
  } catch (_) {}

  // 2. Write to Supabase Cloud
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('agent_memories').upsert({
        id: memory.id,
        agent_id: memory.agentId || null,
        scope: memory.scope,
        category: memory.category,
        key: memory.key,
        content: memory.content,
        source: memory.source,
        priority: memory.priority,
        expires_at: memory.expiresAt || null,
        status: memory.status,
        provenance: memory.provenance || {},
        created_at: memory.createdAt,
        updated_at: memory.updatedAt
      });
    } catch (e) {
      console.warn('[memoryDatabaseService] Cloud sync error on create:', e);
    }
  }
}

/**
 * Persist memory update
 */
export async function persistMemoryUpdate(id: string, updates: Partial<AgentMemory>): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_MEMORIES_KEY);
    if (cached) {
      const list: AgentMemory[] = JSON.parse(cached);
      const updated = list.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m);
      localStorage.setItem(LOCAL_STORAGE_MEMORIES_KEY, JSON.stringify(updated));
    }
  } catch (_) {}

  if (isSupabaseConfigured && supabase) {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.key !== undefined) dbUpdates.key = updates.key;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.category !== undefined) dbUpdates.category = updates.category;

      await supabase.from('agent_memories').update(dbUpdates).eq('id', id);
    } catch (e) {
      console.warn('[memoryDatabaseService] Cloud sync error on update:', e);
    }
  }
}

/**
 * Persist memory deletion
 */
export async function persistMemoryDelete(id: string): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_MEMORIES_KEY);
    if (cached) {
      const list: AgentMemory[] = JSON.parse(cached);
      localStorage.setItem(LOCAL_STORAGE_MEMORIES_KEY, JSON.stringify(list.filter(m => m.id !== id)));
    }
  } catch (_) {}

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('agent_memories').delete().eq('id', id);
    } catch (e) {
      console.warn('[memoryDatabaseService] Cloud sync error on delete:', e);
    }
  }
}

/**
 * Scoped memory retrieval for execution engine:
 * Enforces agent isolation boundary based on configured memory mode.
 */
export function getMemoriesForExecution(
  allMemories: AgentMemory[],
  agentId: string,
  memoryMode: 'none' | 'isolated' | 'shared_explicit' | 'global_read' = 'isolated',
  sharedAgentIds: string[] = []
): AgentMemory[] {
  if (memoryMode === 'none') {
    return [];
  }

  const now = new Date().toISOString();

  // Filter out expired or deleted memories
  const validMemories = allMemories.filter(m => {
    if (m.status === 'archived' || (m.status as any) === 'deleted') return false;
    if (m.expiresAt && m.expiresAt < now) return false;
    return true;
  });

  if (memoryMode === 'isolated') {
    // Isolated: ONLY this agent's private memories + global instructions
    return validMemories.filter(m => m.agentId === agentId || m.scope === 'global');
  }

  if (memoryMode === 'shared_explicit') {
    // Explicit cross-agent sharing: this agent + explicitly authorized agents + global
    return validMemories.filter(m => 
      m.agentId === agentId || 
      (m.agentId && sharedAgentIds.includes(m.agentId)) || 
      m.scope === 'global'
    );
  }

  if (memoryMode === 'global_read') {
    // Global read: reads all memories marked non-isolated or global
    return validMemories.filter(m => m.agentId === agentId || m.scope === 'global' || m.scope === 'shared');
  }

  return validMemories.filter(m => m.agentId === agentId || m.scope === 'global');
}

/**
 * Load Knowledge Documents from Supabase or LocalStorage
 */
export async function loadKnowledgeDocsFromStorage(seedFallback: KnowledgeDocument[]): Promise<KnowledgeDocument[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Fetch knowledge access bindings
        const { data: accessRows } = await supabase
          .from('knowledge_access')
          .select('document_id, agent_id');

        const mapped: KnowledgeDocument[] = data.map(d => {
          const assigned = accessRows?.filter(a => a.document_id === d.id).map(a => a.agent_id) || [];
          return {
            id: d.id,
            title: d.title,
            fileType: d.file_type || 'text/plain',
            fileSizeBytes: d.file_size_bytes || 0,
            storagePath: d.storage_path,
            rawContent: d.raw_content,
            processingStatus: d.processing_status as any,
            version: d.version || 1,
            assignedAgentIds: assigned,
            createdAt: d.created_at
          };
        });

        try {
          localStorage.setItem(LOCAL_STORAGE_KNOWLEDGE_KEY, JSON.stringify(mapped));
        } catch (_) {}

        return mapped;
      }
    } catch (e) {
      console.warn('[memoryDatabaseService] Supabase loadKnowledgeDocs error:', e);
    }
  }

  // Fallback to local storage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KNOWLEDGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  try {
    localStorage.setItem(LOCAL_STORAGE_KNOWLEDGE_KEY, JSON.stringify(seedFallback));
  } catch (_) {}
  return seedFallback;
}

/**
 * Persist Knowledge Document creation
 */
export async function persistKnowledgeDocCreate(doc: KnowledgeDocument): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KNOWLEDGE_KEY);
    const list: KnowledgeDocument[] = cached ? JSON.parse(cached) : [];
    const updated = [doc, ...list.filter(d => d.id !== doc.id)];
    localStorage.setItem(LOCAL_STORAGE_KNOWLEDGE_KEY, JSON.stringify(updated));
  } catch (_) {}

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('knowledge_documents').upsert({
        id: doc.id,
        title: doc.title,
        file_type: doc.fileType,
        file_size_bytes: doc.fileSizeBytes,
        raw_content: doc.rawContent,
        processing_status: doc.processingStatus,
        version: doc.version,
        created_at: doc.createdAt
      });

      // Insert bindings
      if (doc.assignedAgentIds && doc.assignedAgentIds.length > 0) {
        const rows = doc.assignedAgentIds.map(agentId => ({
          id: generateUUID(),
          document_id: doc.id,
          agent_id: agentId
        }));
        await supabase.from('knowledge_access').upsert(rows);
      }
    } catch (e) {
      console.warn('[memoryDatabaseService] Cloud sync error on doc create:', e);
    }
  }
}

/**
 * Persist Knowledge Document deletion
 */
export async function persistKnowledgeDocDelete(id: string): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KNOWLEDGE_KEY);
    if (cached) {
      const list: KnowledgeDocument[] = JSON.parse(cached);
      localStorage.setItem(LOCAL_STORAGE_KNOWLEDGE_KEY, JSON.stringify(list.filter(d => d.id !== id)));
    }
  } catch (_) {}

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('knowledge_documents').delete().eq('id', id);
    } catch (e) {
      console.warn('[memoryDatabaseService] Cloud sync error on doc delete:', e);
    }
  }
}

/**
 * Export memories array to formatted JSON
 */
export function exportMemoriesAsJson(memories: AgentMemory[]): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    platform: 'Zuu Agent Universal Multi-Agent Automation Platform',
    totalRecords: memories.length,
    memories
  }, null, 2);
}
