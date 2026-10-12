// ==============================================================================
// Zuu Agent — Serverless API: First Admin Bootstrap
// Route: POST /api/auth/bootstrap
// Description: Securely bootstraps the initial Master Administrator account
//              using the server-side Supabase Service Role Key.
//              Locks permanently once the first master admin is registered.
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // Only POST or GET status checks allowed
  if (req.method === 'GET') {
    // Status inquiry: check whether first admin is needed
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(200).json({ 
          needsBootstrap: false, 
          configured: false,
          mode: 'local_storage_engine' 
        });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id, system_role')
        .eq('system_role', 'master_admin')
        .limit(1);

      if (error) {
        // Fallback: check auth.users directly
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const hasUsers = (usersData?.users?.length || 0) > 0;
        return res.status(200).json({ needsBootstrap: !hasUsers, configured: true });
      }

      const needsBootstrap = !profiles || profiles.length === 0;
      return res.status(200).json({ needsBootstrap, configured: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Internal server error checking bootstrap status.' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  const { email, password, fullName } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(503).json({ 
      error: 'Supabase credentials are not configured on the server.',
      mode: 'local_storage_engine'
    });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if any master admin profile already exists
    const { data: existingAdmins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('system_role', 'master_admin')
      .limit(1);

    if (existingAdmins && existingAdmins.length > 0) {
      return res.status(403).json({ 
        error: 'First-admin bootstrap is locked. A Master Administrator account already exists.' 
      });
    }

    // Also check if any users exist in auth.users
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    if (listData?.users && listData.users.length > 0) {
      return res.status(403).json({
        error: 'Platform already has registered users. Bootstrap is locked.'
      });
    }

    // Create the master admin user
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || 'Master Administrator',
        system_role: 'master_admin'
      }
    });

    if (createError) {
      return res.status(400).json({ error: createError.message });
    }

    const userId = newUserData.user.id;

    // Ensure the profile is explicitly inserted as master_admin
    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      email,
      full_name: fullName || 'Master Administrator',
      system_role: 'master_admin',
      is_active: true,
      updated_at: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'Master Administrator account successfully bootstrapped! You can now sign in.',
      userId
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to bootstrap master administrator.' });
  }
}
