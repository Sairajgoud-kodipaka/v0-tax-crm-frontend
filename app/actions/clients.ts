'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { parseAssignedEmployeeId } from '@/lib/constants';
import { createClient } from '@/utils/supabase/server';

async function requireStaffSupabase() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin' && profile?.role !== 'employee') {
    throw new Error('Forbidden');
  }
  return supabase;
}

export async function updateClientAssignmentAction(formData: FormData) {
  const profileId = String(formData.get('profileId') ?? '').trim();
  const employeeIdRaw = String(formData.get('employeeId') ?? '').trim();
  if (!profileId) throw new Error('Invalid client');

  const employeeId = parseAssignedEmployeeId(employeeIdRaw);

  const supabase = await requireStaffSupabase();

  if (employeeId) {
    const { data: target } = await supabase.from('profiles').select('role').eq('id', employeeId).maybeSingle();
    if (target?.role !== 'employee') throw new Error('Invalid preparer');
  }

  const { error } = await supabase
    .from('clients')
    .update({ assigned_employee_id: employeeId })
    .eq('profile_id', profileId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/clients');
  revalidatePath('/employee/clients');
  revalidatePath('/admin');
  revalidatePath('/employee');
}

export async function updateClientNotesAction(formData: FormData) {
  const profileId = String(formData.get('profileId') ?? '').trim();
  const notes = String(formData.get('notes') ?? '');
  if (!profileId) throw new Error('Invalid client');

  const supabase = await requireStaffSupabase();

  const { error } = await supabase.from('clients').update({ notes: notes.trim() || null }).eq('profile_id', profileId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/clients');
  revalidatePath('/employee/clients');
}

export async function updateClientStatusAction(formData: FormData) {
  const profileId = String(formData.get('profileId') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();
  if (!profileId) throw new Error('Invalid client');
  if (status !== 'active' && status !== 'archived') throw new Error('Invalid status');

  const supabase = await requireStaffSupabase();

  const { error } = await supabase.from('clients').update({ status }).eq('profile_id', profileId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/clients');
  revalidatePath('/employee/clients');
}

export async function updateClientRowAction(formData: FormData) {
  const profileId = String(formData.get('profileId') ?? '').trim();
  const employeeIdRaw = String(formData.get('employeeId') ?? '').trim();
  const notes = String(formData.get('notes') ?? '');
  const status = String(formData.get('status') ?? '').trim();

  if (!profileId) throw new Error('Invalid client');
  if (status !== 'active' && status !== 'archived') throw new Error('Invalid status');

  const employeeId = parseAssignedEmployeeId(employeeIdRaw);
  const supabase = await requireStaffSupabase();

  if (employeeId) {
    const { data: target } = await supabase.from('profiles').select('role').eq('id', employeeId).maybeSingle();
    if (target?.role !== 'employee') throw new Error('Invalid preparer');
  }

  const { error } = await supabase
    .from('clients')
    .update({
      assigned_employee_id: employeeId,
      notes: notes.trim() || null,
      status,
    })
    .eq('profile_id', profileId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/clients');
  revalidatePath('/employee/clients');
  revalidatePath('/admin');
  revalidatePath('/employee');
}
