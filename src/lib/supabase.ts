
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vpcrxmkbhcvpjbnfczgi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwY3J4bWtiaGN2cGpibmZjemdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNzk3ODEsImV4cCI6MjA2Njg1NTc4MX0.0FBKRTCLFLPP9KHHjooAr-DN1U12Bl50N3xlM_lHbd8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
