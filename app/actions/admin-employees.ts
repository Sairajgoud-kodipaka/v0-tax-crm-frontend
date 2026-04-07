'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

type CreateEmployeeResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

type EmployeeActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

async function requireAdminActor() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: 'Unauthorized' };

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!me || me.role !== 'admin') return { ok: false as const, message: 'Only admins can manage employees.' };

  return { ok: true as const, userId: user.id };
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return {
      ok: false as const,
      message: 'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to server env to enable employee management.',
    };
  }

  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return { ok: true as const, adminClient };
}

export async function createEmployeeAction(
  _prevState: CreateEmployeeResult,
  formData: FormData,
): Promise<CreateEmployeeResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const fullName = String(formData.get('fullName') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();

  if (!email || !password) {
    return { ok: false, message: 'Email and password are required.' };
  }
  if (password.length < 6) {
    return { ok: false, message: 'Password must be at least 6 characters.' };
  }

  const actor = await requireAdminActor();
  if (!actor.ok) return actor;

  const admin = createAdminClient();
  if (!admin.ok) return { ok: false, message: admin.message };
  const { adminClient } = admin;

  const { data: existing } = await adminClient.from('profiles').select('id, role').eq('email', email).maybeSingle();
  if (existing) {
    const updates: { role: 'employee'; full_name?: string } = { role: 'employee' };
    if (fullName) updates.full_name = fullName;
    const { error: promoteError } = await adminClient.from('profiles').update(updates).eq('id', existing.id);
    if (promoteError) return { ok: false, message: promoteError.message };
    revalidatePath('/admin/employees');
    return {
      ok: true,
      message:
        existing.role === 'employee'
          ? 'User already had employee role. Details updated.'
          : 'Existing user promoted to employee.',
    };
  }

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || undefined },
  });
  if (createErr || !created.user) {
    return { ok: false, message: createErr?.message ?? 'Failed to create user.' };
  }

  const { error: roleErr } = await adminClient
    .from('profiles')
    .update({
      role: 'employee',
      ...(fullName ? { full_name: fullName } : {}),
    })
    .eq('id', created.user.id);
  if (roleErr) {
    return { ok: false, message: roleErr.message };
  }

  revalidatePath('/admin/employees');
  return { ok: true, message: 'Employee account created successfully.' };
}

export async function updateEmployeeAction(
  _prevState: EmployeeActionResult,
  formData: FormData,
): Promise<EmployeeActionResult> {
  const userId = String(formData.get('userId') ?? '').trim();
  const fullName = String(formData.get('fullName') ?? '').trim();
  const roleInput = String(formData.get('role') ?? '').trim();
  const role = roleInput === 'admin' || roleInput === 'employee' ? roleInput : null;

  if (!userId || !role) return { ok: false, message: 'Invalid update payload.' };

  const actor = await requireAdminActor();
  if (!actor.ok) return actor;
  if (actor.userId === userId && role !== 'admin') {
    return { ok: false, message: 'You cannot demote your own admin account.' };
  }

  const admin = createAdminClient();
  if (!admin.ok) return { ok: false, message: admin.message };
  const { adminClient } = admin;

  const { error } = await adminClient
    .from('profiles')
    .update({ full_name: fullName || null, role })
    .eq('id', userId)
    .in('role', ['admin', 'employee']);
  if (error) return { ok: false, message: error.message };

  revalidatePath('/admin/employees');
  return { ok: true, message: 'Employee updated.' };
}

export async function deleteEmployeeAction(
  _prevState: EmployeeActionResult,
  formData: FormData,
): Promise<EmployeeActionResult> {
  const userId = String(formData.get('userId') ?? '').trim();
  if (!userId) return { ok: false, message: 'Missing user id.' };

  const actor = await requireAdminActor();
  if (!actor.ok) return actor;
  if (actor.userId === userId) return { ok: false, message: 'You cannot delete your own account.' };

  const admin = createAdminClient();
  if (!admin.ok) return { ok: false, message: admin.message };
  const { adminClient } = admin;

  const { data: target } = await adminClient.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (!target) return { ok: false, message: 'User not found.' };
  if (target.role === 'admin') return { ok: false, message: 'Deleting admin accounts is blocked from this page.' };

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return { ok: false, message: error.message };

  revalidatePath('/admin/employees');
  return { ok: true, message: 'Employee deleted.' };
}

