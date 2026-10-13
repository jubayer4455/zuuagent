// ==============================================================================
// Zuu Agent — Memory Center & Knowledge Base Store
// Manages scoped memory partitions, knowledge documents, and persistent sync.
// ==============================================================================

import { create } from 'zustand';
import { AgentMemory, KnowledgeDocument, MemoryCategory } from '../types';
import { initialMemories, initialKnowledgeDocs } from '../data/initialData';
import { 
  loadMemoriesFromStorage, 
  persistMemoryCreate, 
  persistMemoryUpdate, 
  persistMemoryDelete,
  loadKnowledgeDocsFromStorage,
  persistKnowledgeDocCreate,
  persistKnowledgeDocDelete,
  getMemoriesForExecution,
  exportMemoriesAsJson
} from '../services/memoryDatabaseService';
import { generateUUID } from '../services/agentDatabaseService';

interface MemoryState {
  memories: AgentMemory[];
  knowledgeDocs: KnowledgeDocument[];
  isLoading: boolean;

  // Lifecycle
  initializeMemoryStore: () => Promise<void>;

  // Memory Actions
  addMemory: (memory: Partial<AgentMemory>) => AgentMemory;
  updateMemory: (id: string, updates: Partial<AgentMemory>) => void;
  deleteMemory: (id: string) => void;
  togglePinMemory: (id: string) => void;
  getMemoriesByAgent: (agentId?: string) => AgentMemory[];
  getExecutionMemories: (agentId: string, memoryMode?: 'none' | 'isolated' | 'shared_explicit' | 'global_read', sharedIds?: string[]) => AgentMemory[];
  exportMemories: () => string;

  // Knowledge Actions
  addKnowledgeDoc: (doc: Partial<KnowledgeDocument>) => KnowledgeDocument;
  updateKnowledgeDocStatus: (id: string, status: KnowledgeDocument['processingStatus']) => void;
  deleteKnowledgeDoc: (id: string) => void;
  assignDocToAgent: (docId: string, agentId: string) => void;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: initialMemories,
  knowledgeDocs: initialKnowledgeDocs,
  isLoading: false,

  initializeMemoryStore: async () => {
    set({ isLoading: true });
    try {
      const loadedMems = await loadMemoriesFromStorage(initialMemories);
      const loadedDocs = await loadKnowledgeDocsFromStorage(initialKnowledgeDocs);
      set({
        memories: loadedMems,
        knowledgeDocs: loadedDocs,
        isLoading: false
      });
    } catch (e) {
      console.warn('[useMemoryStore] Error loading memories:', e);
      set({ isLoading: false });
    }
  },

  addMemory: (memory) => {
    const newId = generateUUID();
    const newMemory: AgentMemory = {
      id: newId,
      agentId: memory.agentId,
      scope: memory.scope || (memory.agentId ? 'agent' : 'global'),
      category: memory.category || 'instruction',
      key: memory.key || `key_${Date.now()}`,
      content: memory.content || '',
      source: memory.source || 'admin_entry',
      priority: memory.priority || 5,
      expiresAt: memory.expiresAt,
      status: memory.status || 'active',
      provenance: memory.provenance || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set(state => ({ memories: [newMemory, ...state.memories] }));
    persistMemoryCreate(newMemory);
    return newMemory;
  },

  updateMemory: (id, updates) => {
    set(state => ({
      memories: state.memories.map(m => 
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      )
    }));
    persistMemoryUpdate(id, updates);
  },

  deleteMemory: (id) => {
    set(state => ({
      memories: state.memories.filter(m => m.id !== id)
    }));
    persistMemoryDelete(id);
  },

  togglePinMemory: (id) => {
    const target = get().memories.find(m => m.id === id);
    if (!target) return;
    const nextStatus = target.status === 'pinned' ? 'active' : 'pinned';
    get().updateMemory(id, { status: nextStatus });
  },

  getMemoriesByAgent: (agentId) => {
    const all = get().memories;
    if (!agentId) return all;
    // Returns agent's private partition + global instructions
    return all.filter(m => m.agentId === agentId || m.scope === 'global');
  },

  getExecutionMemories: (agentId, memoryMode = 'isolated', sharedIds = []) => {
    return getMemoriesForExecution(get().memories, agentId, memoryMode, sharedIds);
  },

  exportMemories: () => {
    return exportMemoriesAsJson(get().memories);
  },

  addKnowledgeDoc: (doc) => {
    const newId = generateUUID();
    const newDoc: KnowledgeDocument = {
      id: newId,
      title: doc.title || 'Untitled Knowledge Document',
      fileType: doc.fileType || 'text/plain',
      fileSizeBytes: doc.fileSizeBytes || (doc.rawContent?.length || 0),
      rawContent: doc.rawContent,
      processingStatus: doc.processingStatus || 'processed',
      version: 1,
      createdAt: new Date().toISOString(),
      assignedAgentIds: doc.assignedAgentIds || []
    };

    set(state => ({ knowledgeDocs: [newDoc, ...state.knowledgeDocs] }));
    persistKnowledgeDocCreate(newDoc);
    return newDoc;
  },

  updateKnowledgeDocStatus: (id, status) => {
    set(state => ({
      knowledgeDocs: state.knowledgeDocs.map(d =>
        d.id === id ? { ...d, processingStatus: status } : d
      )
    }));
  },

  deleteKnowledgeDoc: (id) => {
    set(state => ({
      knowledgeDocs: state.knowledgeDocs.filter(d => d.id !== id)
    }));
    persistKnowledgeDocDelete(id);
  },

  assignDocToAgent: (docId, agentId) => {
    set(state => ({
      knowledgeDocs: state.knowledgeDocs.map(d => {
        if (d.id !== docId) return d;
        const currentAssigned = d.assignedAgentIds || [];
        if (currentAssigned.includes(agentId)) return d;
        const updatedDoc = {
          ...d,
          assignedAgentIds: [...currentAssigned, agentId]
        };
        persistKnowledgeDocCreate(updatedDoc);
        return updatedDoc;
      })
    }));
  }
}));

// Initialize store on startup
if (typeof window !== 'undefined') {
  useMemoryStore.getState().initializeMemoryStore();
}
