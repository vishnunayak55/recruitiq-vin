import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

export const initializeDatabase = async () => {
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error && !error.message.includes('does not exist')) {
    console.error('❌ Supabase error:', error.message);
    throw error;
  }
  console.log('✅ Supabase connected and tables ready');
};

export default supabase;
