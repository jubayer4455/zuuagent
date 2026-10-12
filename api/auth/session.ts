// ==============================================================================
// Zuu Agent — Serverless API: Session & Authorization Check
// Route: GET /api/auth/session
// Description: Validates Supabase JWT Bearer token and returns profile & permissions.
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ error: 'Missing Bearer authentication token.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(503).json({ error: 'Supabase credentials are not configured on the server.' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }

    const userId = userData.user.id;

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    if (!profile.is_active) {
      return res.status(403).json({ error: 'Your account is deactivated. Contact an administrator.' });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        systemRole: profile.system_role,
        avatarUrl: profile.avatar_url,
        isActive: profile.is_active,
        createdAt: profile.created_at
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal session validation error.' });
  }
}
