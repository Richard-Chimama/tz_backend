import { PrismaClient } from '@prisma/client';
import { User } from '@supabase/supabase-js';

// Extend Supabase User or create a Union type if strictly needed
// For now, Supabase User is compatible enough for our basic usage
export interface Context {
  prisma: PrismaClient;
  token?: string;
  user?: User | any | null; // Allow our custom API Key user object
}
