-- ==============================================================================
-- Zuu Agent — Universal Multi-Agent Automation Platform
-- Migration: 20261012000003_seed_data.sql
-- Description: Standard seed data including AI Providers, Models, Tool Registry,
--              System Settings, and the ready-to-use Trollogiya Content Agent.
-- ==============================================================================

-- 1. AI Providers
INSERT INTO ai_providers (id, name, slug, adapter_type, base_url, is_enabled, supports_text, supports_vision, supports_image_gen, supports_embeddings, health_status)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Google Gemini', 'google-gemini', 'gemini', 'https://generativelanguage.googleapis.com', true, true, true, true, true, 'healthy'),
    ('11111111-1111-1111-1111-111111111102', 'OpenAI', 'openai', 'openai', 'https://api.openai.com/v1', true, true, true, true, true, 'healthy'),
    ('11111111-1111-1111-1111-111111111103', 'Anthropic Claude', 'anthropic', 'anthropic', 'https://api.anthropic.com/v1', true, true, true, false, false, 'healthy'),
    ('11111111-1111-1111-1111-111111111104', 'Ollama (Local / Self-hosted)', 'ollama', 'ollama', 'http://localhost:11434', true, true, false, false, true, 'offline'),
    ('11111111-1111-1111-1111-111111111105', 'OpenRouter', 'openrouter', 'openrouter', 'https://openrouter.ai/api/v1', true, true, true, true, true, 'healthy')
ON CONFLICT (slug) DO NOTHING;

-- 2. Provider Models
INSERT INTO provider_models (provider_id, model_identifier, display_name, context_window, max_output_tokens, input_cost_per_million_tokens, output_cost_per_million_tokens, supports_tools, is_default)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'gemini-2.0-flash', 'Gemini 2.0 Flash', 1048576, 8192, 0.10, 0.40, true, true),
    ('11111111-1111-1111-1111-111111111101', 'gemini-1.5-pro', 'Gemini 1.5 Pro', 2097152, 8192, 1.25, 5.00, true, false),
    ('11111111-1111-1111-1111-111111111102', 'gpt-4o', 'GPT-4o (Omni)', 128000, 4096, 2.50, 10.00, true, true),
    ('11111111-1111-1111-1111-111111111102', 'gpt-4o-mini', 'GPT-4o Mini', 128000, 16384, 0.15, 0.60, true, false),
    ('11111111-1111-1111-1111-111111111103', 'claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', 200000, 8192, 3.00, 15.00, true, true),
    ('11111111-1111-1111-1111-111111111104', 'llama3:8b', 'Llama 3 (8B)', 8192, 4096, 0.00, 0.00, true, true)
ON CONFLICT (provider_id, model_identifier) DO NOTHING;

-- 3. Core Tool Registry
INSERT INTO tool_registry (id, name, display_name, description, classification, input_schema, output_schema, required_permissions, is_active, requires_approval, handler_identifier)
VALUES
    ('22222222-2222-2222-2222-222222222201', 'meta_facebook_page_publisher', 'Facebook Page Publisher', 'Publishes text and image posts to authorized Facebook Pages using the official Meta Graph API.', 'external_mutation', '{"type": "object", "properties": {"pageId": {"type": "string"}, "message": {"type": "string"}, "imageUrl": {"type": "string"}, "idempotencyKey": {"type": "string"}}, "required": ["message"]}', '{"type": "object", "properties": {"postId": {"type": "string"}, "permalinkUrl": {"type": "string"}}}', ARRAY['facebook.publish'], true, true, 'tools/meta/facebookPublisher'),
    ('22222222-2222-2222-2222-222222222202', 'bengali_content_enhancer', 'Bengali Content Stylizer', 'Enhances Bengali and Banglish texts with witty phrasing, contextual humor, punchlines, and hashtag presets.', 'data_transformation', '{"type": "object", "properties": {"draft": {"type": "string"}, "humorLevel": {"type": "integer"}, "style": {"type": "string"}}, "required": ["draft"]}', '{"type": "object", "properties": {"enhancedContent": {"type": "string"}, "suggestedHashtags": {"type": "array"}}}', ARRAY['content.transform'], true, false, 'tools/content/bengaliEnhancer'),
    ('22222222-2222-2222-2222-222222222203', 'image_asset_generator', 'AI Image Asset Generator', 'Generates high quality visuals matching the generated content tone and theme.', 'external_communication', '{"type": "object", "properties": {"prompt": {"type": "string"}, "aspectRatio": {"type": "string"}}, "required": ["prompt"]}', '{"type": "object", "properties": {"imageUrl": {"type": "string"}}}', ARRAY['ai.image'], true, false, 'tools/ai/imageGenerator'),
    ('22222222-2222-2222-2222-222222222204', 'web_search', 'Web & News Search', 'Searches live web for real-time trending news, facts, and public discussions.', 'read_only', '{"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}', '{"type": "object", "properties": {"results": {"type": "array"}}}', ARRAY['search.read'], true, false, 'tools/search/webSearch'),
    ('22222222-2222-2222-2222-222222222205', 'database_query', 'Database Query Reader', 'Safely executes parameterized read queries on permitted tables.', 'read_only', '{"type": "object", "properties": {"table": {"type": "string"}, "filter": {"type": "object"}}, "required": ["table"]}', '{"type": "object", "properties": {"rows": {"type": "array"}}}', ARRAY['db.read'], true, false, 'tools/db/queryService')
ON CONFLICT (name) DO NOTHING;

-- 4. Initial System Settings
INSERT INTO system_settings (key, value, description, is_secret)
VALUES
    ('platform_name', '"Zuu Agent"'::jsonb, 'Brand name for this instance', false),
    ('default_timezone', '"Asia/Dhaka"'::jsonb, 'Default scheduler timezone (GMT+6)', false),
    ('max_daily_executions_global', '500'::jsonb, 'Global execution throttle limit', false),
    ('approval_policy_mode', '"strict"'::jsonb, 'Enforces approval for external mutations', false),
    ('dry_run_mode_enabled', 'false'::jsonb, 'Dry-run simulation mode switch', false)
ON CONFLICT (key) DO NOTHING;

-- 5. Trollogiya Content Agent Template Instance
INSERT INTO agents (
    id, name, slug, description, icon, category, tags, status, primary_provider_id, primary_model, version, is_template
) VALUES (
    '33333333-3333-3333-3333-333333333301',
    'Trollogiya Content Agent',
    'trollogiya-content-agent',
    'Bangladeshi Bengali & Banglish viral content creator specializing in witty humor, relatable daily-life scenarios, emotional storytelling, and Facebook Page automated publishing.',
    'sparkles',
    'social_media',
    ARRAY['bengali', 'facebook', 'humor', 'storytelling', 'automation'],
    'active',
    '11111111-1111-1111-1111-111111111101',
    'gemini-2.0-flash',
    1,
    false
) ON CONFLICT (slug) DO NOTHING;

-- Trollogiya Config
INSERT INTO agent_configs (
    agent_id, version, temperature, max_tokens, memory_mode, requires_human_approval, max_daily_executions, metadata
) VALUES (
    '33333333-3333-3333-3333-333333333301',
    1,
    0.85,
    3000,
    'isolated',
    true,
    50,
    '{
        "language": "bn-BD",
        "allowBanglish": true,
        "dailyPostsCount": 3,
        "postDistribution": {"short": 2, "long": 1},
        "humorScale": 8,
        "emotionalScale": 6,
        "categories": [
            {"id": "funny_troll", "label": "Funny & Troll Posts", "enabled": true},
            {"id": "daily_life", "label": "Relatable Daily-Life Content", "enabled": true},
            {"id": "emotional_stories", "label": "Emotional Short Stories", "enabled": true},
            {"id": "relationship_humor", "label": "Relationship Humor", "enabled": true},
            {"id": "observational_comedy", "label": "Observational Comedy", "enabled": true},
            {"id": "audience_engagement", "label": "Audience Engagement / Polls", "enabled": true},
            {"id": "longer_storytelling", "label": "Longer Storytelling", "enabled": true}
        ]
    }'::jsonb
) ON CONFLICT (agent_id, version) DO NOTHING;

-- Trollogiya System Prompt
INSERT INTO agent_prompts (
    agent_id, prompt_type, current_version, content
) VALUES (
    '33333333-3333-3333-3333-333333333301',
    'system',
    1,
    'You are "Trollogiya Content Agent", the premier viral Bangladeshi social media storyteller and entertainer for Facebook. 
Your goal is to write captivating, authentic Bengali (and natural Banglish when fitting) posts that deeply resonate with Bangladeshi audiences.

Content Guidelines:
1. Tone: Witty, warm, perceptive, culturally attuned, humorously self-deprecating, or genuinely touching.
2. Formats:
   - Short Punchy Posts (2-4 lines): Sharp punchlines, relatable observational memes, everyday traffic/exam/office/adda situations.
   - Narrative & Storytelling (150-350 words): Vivid depictions of Dhaka rains, village nostalgias, friendship, family quirks, and youthful struggles.
3. Language: Clean, modern conversational Bangladeshi Bengali. Avoid textbook/archaic sadhu bhasha.
4. Audience Engagement: Naturally invite thoughts or reactions without cheap clickbait.
5. Safety: Keep it respectful, humorous, and universally enjoyable. Never publish vulgarity, hate speech, or harassment.'
) ON CONFLICT (agent_id, prompt_type) DO NOTHING;

-- Bind tools to Trollogiya
INSERT INTO agent_tools (agent_id, tool_id, is_enabled)
VALUES
    ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', true),
    ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222202', true),
    ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222203', true)
ON CONFLICT (agent_id, tool_id) DO NOTHING;
