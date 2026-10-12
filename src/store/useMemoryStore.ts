import { create } from 'zustand';
import { AgentMemory, KnowledgeDocument, MemoryCategory } from '../types';
import { initialMemories, initialKnowledgeDocs } from '../data/initialData';

interface MemoryState {
  memories: AgentMemory[];
  knowledgeDocs: KnowledgeDocument[];

  // Memory Actions
  addMemory: (memory: Partial<AgentMemory>) => AgentMemory;
  updateMemory: (id: string, updates: Partial<AgentMemory>) => void;
  deleteMemory: (id: string) => void;
  togglePinMemory: (id: string) => void;
  getMemoriesByAgent: (agentId?: string) => AgentMemory[];

  // Knowledge Actions
  addKnowledgeDoc: (doc: Partial<KnowledgeDocument>) => KnowledgeDocument;
  deleteKnowledgeDoc: (id: string) => void;
  assignDocToAgent: (docId: string, agentId: string) => void;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: initialMemories,
  knowledgeDocs: initialKnowledgeDocs,

  addMemory: (memory) => {
    const newMemory: AgentMemory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      agentId: memory.agentId,
      scope: memory.scope || (memory.agentId ? 'agent' : 'global'),
      category: memory.category || 'instruction',
      key: memory.key || `key_${Date.now()}`,
      content: memory.content || '',
      source: memory.source || 'admin_entry',
      priority: memory.priority || 5,
      status: memory.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set(state => ({ memories: [newMemory, ...state.memories] }));
    return newMemory;
  },

  updateMemory: (id, updates) => {
    set(state => ({
      memories: state.memories.map(m => 
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      )
    }));
  },

  deleteMemory: (id) => {
    set(state => ({
      memories: state.memories.filter(m => m.id !== id)
    }));
  },

  togglePinMemory: (id) => {
    set(state => ({
      memories: state.memories.map(m => 
        m.id === id ? { ...m, status: m.status === 'pinned' ? 'active' : 'pinned' } : m
      )
    }));
  },

  getMemoriesByAgent: (agentId) => {
    const all = get().memories;
    if (!agentId) return all;
    // Returns agent's private memories + global instructions
    return all.filter(m => m.agentId === agentId || m.scope === 'global');
  },

  addKnowledgeDoc: (doc) => {
    const newDoc: KnowledgeDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title: doc.title || 'Untitled Document',
      fileType: doc.fileType || 'text/plain',
      fileSizeBytes: doc.fileSizeBytes || (doc.rawContent?.length || 0),
      rawContent: doc.rawContent,
      processingStatus: 'processed',
      version: 1,
      createdAt: new Date().toISOString(),
      assignedAgentIds: doc.assignedAgentIds || []
    };

    set(state => ({ knowledgeDocs: [newDoc, ...state.knowledgeDocs] }));
    return newDoc;
  },

  deleteKnowledgeDoc: (id) => {
    set(state => ({
      knowledgeDocs: state.knowledgeDocs.filter(d => d.id !== id)
    }));
  },

  assignDocToAgent: (docId, agentId) => {
    set(state => ({
      knowledgeDocs: state.knowledgeDocs.map(d => {
        if (d.id !== docId) return d;
        const current = d.assignedAgentIds || [];
        return {
          ...d,
          assignedAgentIds: current.includes(agentId) ? current : [...current, agentId]
        };
      })
    }));
  }
}));
