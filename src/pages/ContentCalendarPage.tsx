import React, { useState } from 'react';
import { 
  Calendar, 
  Sparkles, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCcw, 
  Image as ImageIcon, 
  Share2, 
  Search, 
  Filter, 
  ExternalLink,
  ShieldCheck,
  Eye,
  Sliders,
  Flame,
  MessageSquare
} from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';
import { useApprovalStore } from '../store/useApprovalStore';
import { useIntegrationStore } from '../store/useIntegrationStore';
import { MetaGraphClient } from '../services/facebook/metaGraphClient';
import { AIProviderService } from '../services/ai/aiProviderAdapters';
import { ImageProviderService } from '../services/ai/imageProviderService';
import { checkContentSimilarity, ExistingPostItem } from '../services/content/duplicateDetector';
import { TrollogiyaCategory } from '../types';

export interface SocialCalendarPost {
  id: string;
  agentId: string;
  category: string;
  topic: string;
  content: string;
  imageUrl?: string;
  imagePrompt?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'rejected';
  scheduledTime?: string;
  publishedAt?: string;
  externalPostId?: string;
  permalinkUrl?: string;
  failureReason?: string;
  idempotencyKey: string;
  similarityScore?: number;
}

export const ContentCalendarPage: React.FC = () => {
  const { agents } = useAgentStore();
  const { addApproval } = useApprovalStore();
  const { integrations } = useIntegrationStore();

  const trollogiyaAgent = agents.find(a => a.slug.includes('trollogiya') || a.category === 'facebook_publishing') || agents[0];
  const fbConn = integrations.find(i => i.provider === 'meta_facebook') || integrations[0];

  // Initial Seed Posts for Calendar & Queue
  const [posts, setPosts] = useState<SocialCalendarPost[]>([
    {
      id: 'post_01',
      agentId: trollogiyaAgent?.id || 'agent_trollogiya',
      category: 'daily_life',
      topic: 'বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম',
      content: `বৃষ্টির দিনে বাঙালি জাতির ৩টি সার্বজনীন ইচ্ছা:\n১. গরম খিচুড়ি আর বেগুন ভাজা 🍛🍆\n২. এক কাপ আদা চা ☕️\n৩. আর কোনো জরুরি মিটিং বা ক্লাস থাকলে সেটা অটোমেটিক ক্যানসেল হয়ে যাওয়া! 🌧️\n\nআপনার আজকের দিনের প্রায়োরিটি কোনটা? কমেন্টে জানিয়ে দিন! 👇 #Trollogiya #DhakaLife`,
      imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80',
      status: 'published',
      publishedAt: '2026-10-12T14:30:00Z',
      externalPostId: '109847291834910_887192039128',
      permalinkUrl: 'https://www.facebook.com/109847291834910/posts/109847291834910_887192039128',
      idempotencyKey: 'pub_seed_01'
    },
    {
      id: 'post_02',
      agentId: trollogiyaAgent?.id || 'agent_trollogiya',
      category: 'funny_troll',
      topic: 'অফিসে বসের আর্জেন্ট রিকোয়ারমেন্ট',
      content: `অফিসে যখন বস বলে— "কাজটা আর্জেন্ট না, তবে লাঞ্চের আগেই শেষ করে দিয়েন!" 🙃\nতখন আমার ভেতরের ফিলিং: ভাই, আর্জেন্ট হলে কী করতেন? অফিসে তাবু টানিয়ে থাকতে বলতেন? ⛺️\n\nআজকে কার কার বসের এমন "নন-আর্জেন্ট কিন্তু এখনই চাই" ডায়লগ শুনছেন? হাজিরা দেন! 😂 #Trollogiya #OfficeHumor`,
      status: 'scheduled',
      scheduledTime: '2026-10-13T15:00:00Z',
      idempotencyKey: 'pub_seed_02'
    },
    {
      id: 'post_03',
      agentId: trollogiyaAgent?.id || 'agent_trollogiya',
      category: 'relationship_humor',
      topic: 'দেরিতে রিপ্লাই দেওয়ার সাইকোলজি',
      content: `আমরা সেই জেনারেশন যারা মেসেজের রিপ্লাই ১ সেকেন্ডে না পেলে ভাবি "ইগনোর করতেছে", কিন্তু নিজেরা রিপ্লাই দেওয়ার সময় মনে মনে বলি— "একটু পরে দিচ্ছি, ভাব ধরে থাকা দরকার!" 🤦‍♂️\n\nসত্যি করে বলেন তো, এই রোগ কার কার আছে? 🙋‍♂️ #Trollogiya #RelatableBangla`,
      status: 'pending_approval',
      idempotencyKey: 'pub_seed_03'
    }
  ]);

  // Content Creator Form States
  const [selectedCategory, setSelectedCategory] = useState('daily_life');
  const [topic, setTopic] = useState('ঢাকার সিএনজি চালকদের মিটার নীতি');
  const [humorLevel, setHumorLevel] = useState(8);
  const [emotionLevel, setEmotionLevel] = useState(5);
  const [editorContent, setEditorContent] = useState('');
  const [imageStyle, setImageStyle] = useState<'cinematic' | 'photorealistic' | 'bangla_cartoon'>('cinematic');
  const [imageMode, setImageMode] = useState<'ai_gen' | 'manual_url' | 'none'>('ai_gen');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isPublishingId, setIsPublishingId] = useState<string | null>(null);

  // Tab & Filter States
  const [viewTab, setViewTab] = useState<'studio' | 'queue' | 'history'>('studio');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories: TrollogiyaCategory[] = [
    { id: 'funny_troll', label: 'Funny & Troll Posts', enabled: true },
    { id: 'daily_life', label: 'Relatable Daily-Life Content', enabled: true },
    { id: 'emotional_stories', label: 'Emotional Short Stories', enabled: true },
    { id: 'relationship_humor', label: 'Relationship Humor', enabled: true },
    { id: 'observational_comedy', label: 'Observational Comedy', enabled: true },
    { id: 'audience_engagement', label: 'Audience Engagement / Polls', enabled: true }
  ];

  // Similarity & Duplicate check against existing posts
  const existingPostHistory: ExistingPostItem[] = posts.map(p => ({
    id: p.id,
    content: p.content,
    publishedAt: p.publishedAt,
    status: p.status
  }));

  const similarityCheck = editorContent 
    ? checkContentSimilarity(editorContent, existingPostHistory, 0.65)
    : { isExactDuplicate: false, maxSimilarityScore: 0 };

  // AI Content Generator
  const handleGeneratePost = async () => {
    setIsGeneratingContent(true);
    setEditorContent('');
    setGeneratedImageUrl('');

    const res = await AIProviderService.complete({
      providerSlug: 'google-gemini',
      model: 'gemini-2.0-flash',
      systemPrompt: trollogiyaAgent?.prompts?.[0]?.content || 'You are Trollogiya Content Agent specializing in viral Bengali social media humor.',
      userPrompt: `Write an engaging Bengali Facebook post for category "${selectedCategory}". Topic: ${topic}. Humor Scale: ${humorLevel}/10. Emotion Scale: ${emotionLevel}/10. Include punchline, emojis, and hashtags: #Trollogiya #DhakaLife`,
      isDryRun: true
    });

    setIsGeneratingContent(false);
    if (res.success) {
      setEditorContent(res.content);

      if (imageMode === 'ai_gen') {
        const imgRes = await ImageProviderService.generateVisualAsset({
          prompt: `${topic}, vivid Bangladeshi street life ambience`,
          style: imageStyle
        });
        if (imgRes.success && imgRes.imageUrl) {
          setGeneratedImageUrl(imgRes.imageUrl);
        }
      }
    }
  };

  // Submit to Central Approval Center
  const handleQueueForApproval = () => {
    if (!editorContent.trim()) {
      alert('Content cannot be empty.');
      return;
    }
    if (similarityCheck.isExactDuplicate) {
      alert('Cannot submit: Exact duplicate content detected!');
      return;
    }

    const newPostId = `post_${Date.now()}`;
    const newPost: SocialCalendarPost = {
      id: newPostId,
      agentId: trollogiyaAgent.id,
      category: selectedCategory,
      topic,
      content: editorContent,
      imageUrl: imageMode === 'manual_url' ? customImageUrl : generatedImageUrl || undefined,
      status: 'pending_approval',
      idempotencyKey: `pub_appr_${newPostId}`,
      similarityScore: similarityCheck.maxSimilarityScore
    };

    setPosts([newPost, ...posts]);

    // Send item to approval center
    addApproval({
      id: `appr_cal_${newPostId}`,
      agentId: trollogiyaAgent.id,
      agentName: trollogiyaAgent.name,
      actionType: 'facebook_page_publish',
      targetDestination: 'Trollogiya Official Facebook Page (109847291834910)',
      riskLevel: 'medium',
      payloadSnapshot: {
        postId: newPostId,
        content: editorContent,
        category: selectedCategory,
        topic,
        imageUrl: newPost.imageUrl
      },
      payloadChecksum: `chk_${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      decisionReason: 'Generated via Social Content Calendar Studio, awaiting reviewer approval.'
    });

    alert('Draft submitted to Central Approval Center!');
    setEditorContent('');
    setViewTab('queue');
  };

  // Publish Directly (Safe Dry-Run or Live via Server API)
  const handlePublishPost = async (post: SocialCalendarPost) => {
    setIsPublishingId(post.id);

    const publishResult = await MetaGraphClient.publishToPage({
      pageId: fbConn.accountIdentifier,
      message: post.content,
      imageUrl: post.imageUrl,
      idempotencyKey: post.idempotencyKey,
      isDryRun: Boolean(fbConn.settings?.dryRunSimulation ?? true),
      agentId: post.agentId,
      agentStatus: trollogiyaAgent.status
    });

    setIsPublishingId(null);

    if (publishResult.success) {
      setPosts(prev => prev.map(p => 
        p.id === post.id 
          ? { 
              ...p, 
              status: 'published', 
              externalPostId: publishResult.postId,
              permalinkUrl: publishResult.permalinkUrl,
              publishedAt: new Date().toISOString()
            } 
          : p
      ));
      alert(`Published successfully! Post ID: ${publishResult.postId} (Safe Dry-Run: ${publishResult.isDryRun})`);
    } else {
      setPosts(prev => prev.map(p => 
        p.id === post.id 
          ? { ...p, status: 'failed', failureReason: publishResult.errorMessage } 
          : p
      ));
      alert(`Publishing failed: ${publishResult.errorMessage}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-slate-100">Social Content Calendar & Facebook Studio</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Trollogiya Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: <strong>Trollogiya Facebook Page ({fbConn.accountIdentifier})</strong> • Mode: <span className="text-emerald-400 font-semibold">{fbConn.settings?.dryRunSimulation ? 'Safe Dry-Run' : 'Live Meta Graph API'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewTab('studio')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${viewTab === 'studio' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Content Studio
            </button>
            <button
              onClick={() => setViewTab('queue')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${viewTab === 'queue' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Publishing Queue ({posts.filter(p => p.status !== 'published').length})
            </button>
            <button
              onClick={() => setViewTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${viewTab === 'history' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Post History ({posts.filter(p => p.status === 'published').length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: CONTENT STUDIO */}
      {viewTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Generation Controls & Post Preview */}
          <div className="lg:col-span-2 space-y-5">
            <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Bengali Viral Content Creator</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Content Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Topic or Situation</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. বৃষ্টির দিনে ঢাকার ট্রাফিক জ্যাম"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Scales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Humor Scale ({humorLevel}/10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={humorLevel}
                    onChange={(e) => setHumorLevel(parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Emotion / Relatability ({emotionLevel}/10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={emotionLevel}
                    onChange={(e) => setEmotionLevel(parseInt(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              {/* Visual Asset Controls */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
                <span className="font-semibold text-slate-300 uppercase text-[10px] flex items-center space-x-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Visual Asset Settings</span>
                </span>

                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="imgMode"
                      checked={imageMode === 'ai_gen'}
                      onChange={() => setImageMode('ai_gen')}
                      className="accent-cyan-400"
                    />
                    <span>AI Image Generator</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="imgMode"
                      checked={imageMode === 'manual_url'}
                      onChange={() => setImageMode('manual_url')}
                      className="accent-cyan-400"
                    />
                    <span>Manual Image URL</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="imgMode"
                      checked={imageMode === 'none'}
                      onChange={() => setImageMode('none')}
                      className="accent-cyan-400"
                    />
                    <span>Text-Only (No Image)</span>
                  </label>
                </div>

                {imageMode === 'manual_url' && (
                  <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGeneratePost}
                  disabled={isGeneratingContent}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow transition flex items-center justify-center space-x-2"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingContent ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingContent ? 'Generating Bengali Post...' : 'Generate Post Draft'}</span>
                </button>
              </div>
            </div>

            {/* Post Content Editor & Preview */}
            <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200 text-xs">Content Editor & Preview</span>
                <span className="text-[11px] text-slate-400">{editorContent.length} characters</span>
              </div>

              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                rows={6}
                placeholder="Generated post content will appear here. You can edit before publishing..."
                className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm leading-relaxed font-sans focus:outline-none focus:border-cyan-500"
              />

              {/* Image Preview */}
              {(generatedImageUrl || customImageUrl) && imageMode !== 'none' && (
                <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-64">
                  <img 
                    src={imageMode === 'manual_url' ? customImageUrl : generatedImageUrl} 
                    alt="Post Visual" 
                    className="w-full object-cover" 
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-slate-300 font-mono">
                    Visual Attached
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  onClick={handleQueueForApproval}
                  disabled={!editorContent.trim() || similarityCheck.isExactDuplicate}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Approval Center</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Col: Duplicate & Safety Inspector */}
          <div className="space-y-5">
            <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 p-5 space-y-4 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Publishing Safety Checks</span>
              </h3>

              {/* Duplicate Detection Status */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-400 uppercase text-[10px]">Duplicate Content Check</span>
                {similarityCheck.isExactDuplicate ? (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 flex items-start space-x-2">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Exact Duplicate Found!</div>
                      <p className="text-[10px] text-rose-400/90 mt-0.5">{similarityCheck.warningMessage}</p>
                    </div>
                  </div>
                ) : similarityCheck.maxSimilarityScore > 0.65 ? (
                  <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">High Vocabulary Overlap</div>
                      <p className="text-[10px] text-amber-400/90 mt-0.5">{similarityCheck.warningMessage}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold">Original Content Verified</div>
                      <div className="text-[10px] text-emerald-400/80">Max similarity score: {Math.round(similarityCheck.maxSimilarityScore * 100)}%</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Page Information */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-slate-300">
                <span className="font-semibold text-slate-400 uppercase text-[10px]">Active Page Target</span>
                <div className="font-bold text-slate-100">{fbConn.displayName}</div>
                <div className="text-[11px] font-mono text-slate-400">ID: {fbConn.accountIdentifier}</div>
                <div className="text-[10px] text-slate-500 pt-1">
                  Meta Graph API v21.0 • Idempotency key generated automatically for network resilience.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 & 3: QUEUE & POST HISTORY */}
      {(viewTab === 'queue' || viewTab === 'history') && (
        <div className="border border-slate-800 rounded-2xl bg-[#0f172a]/95 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold uppercase text-slate-300 tracking-wider">
              {viewTab === 'queue' ? 'Publishing Queue' : 'Published Facebook History'}
            </span>
          </div>

          <div className="divide-y divide-slate-800/70 text-xs">
            {posts
              .filter(p => viewTab === 'queue' ? p.status !== 'published' : p.status === 'published')
              .map((post) => (
                <div key={post.id} className="p-5 hover:bg-slate-800/30 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        post.status === 'published' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                          : post.status === 'pending_approval'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : post.status === 'scheduled'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {post.status.replace('_', ' ')}
                      </span>
                      <span className="font-bold text-slate-200 capitalize">{post.category.replace('_', ' ')}</span>
                      <span className="text-slate-500 text-[11px] font-mono">ID: {post.id}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {post.status !== 'published' && (
                        <button
                          onClick={() => handlePublishPost(post)}
                          disabled={isPublishingId === post.id}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] transition"
                        >
                          <Share2 className={`w-3 h-3 ${isPublishingId === post.id ? 'animate-spin' : ''}`} />
                          <span>Publish Now</span>
                        </button>
                      )}

                      {post.permalinkUrl && (
                        <a
                          href={post.permalinkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-[11px]"
                        >
                          <span>View on Facebook</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-200 whitespace-pre-line leading-relaxed text-sm bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                    {post.content}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                    <span className="font-mono">Idempotency Key: {post.idempotencyKey}</span>
                    {post.publishedAt && (
                      <span>Published: {new Date(post.publishedAt).toLocaleString()}</span>
                    )}
                    {post.scheduledTime && (
                      <span>Scheduled for: {new Date(post.scheduledTime).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
