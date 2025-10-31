import type { SupabaseClient } from '@supabase/supabase-js';
import type { DeveloperDB } from '@/types/developer';

export interface User {
  id: string;
  email: string;
}

/**
 * Get current authenticated user from Supabase (server-verified)
 */
export async function getCurrentUser(supabase: SupabaseClient): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email || '',
  };
}

/**
 * Check if user email is in admin list
 */
export function isAdmin(email: string): boolean {
  const adminEmails = import.meta.env.ADMIN_EMAILS || '';
  const admins = adminEmails.split(',').map((e: string) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

/**
 * Get developer profile by user_id
 */
export async function getDeveloperProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<DeveloperDB | null> {
  const { data, error } = await supabase
    .from('developers')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as DeveloperDB;
}

/**
 * Get developer profile by username
 */
export async function getDeveloperByUsername(
  supabase: SupabaseClient,
  username: string
): Promise<DeveloperDB | null> {
  const { data, error } = await supabase
    .from('developers')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) {
    return null;
  }

  return data as DeveloperDB;
}

/**
 * Get all verified developers
 */
export async function getVerifiedDevelopers(
  supabase: SupabaseClient
): Promise<DeveloperDB[]> {
  const { data, error } = await supabase
    .from('developers')
    .select('*')
    .eq('is_verified', true)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as DeveloperDB[];
}

/**
 * Get all developers pending verification (admin only)
 */
export async function getPendingDevelopers(
  supabase: SupabaseClient
): Promise<DeveloperDB[]> {
  const { data, error } = await supabase
    .from('developers')
    .select('*')
    .eq('is_verified', false)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as DeveloperDB[];
}

