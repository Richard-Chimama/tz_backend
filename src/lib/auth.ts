import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import prisma from './prisma';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getUserFromToken = async (token: string) => {
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  // Fetch role from database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  return {
    ...user,
    role: dbUser?.role || 'USER', // Fallback to USER if not found in DB
  };
};

export const getUserFromApiKey = async (apiKey: string) => {
  if (!apiKey) return null;

  const keyRecord = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { user: true },
  });

  if (!keyRecord) return null;

  // Check if key is active and not expired
  if (!keyRecord.isActive || keyRecord.expiresAt < new Date()) {
    return null;
  }

  // Map database user to Supabase User-like structure or just return the DB user
  // For consistency in context, we'll return a structure that mimics the auth user
  // but with a flag indicating it's an API Key user
  return {
    id: keyRecord.user.id,
    email: keyRecord.user.email,
    role: 'API_CONSUMER',
    app_metadata: { provider: 'api_key' },
    user_metadata: {},
    aud: 'authenticated',
    created_at: keyRecord.user.createdAt.toISOString(),
  };
};

