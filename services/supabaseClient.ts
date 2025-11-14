import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your Supabase project's URL and anon key.
// It's recommended to use environment variables for this in a real project.
// You MUST replace these with your actual Supabase credentials for the app to work.
// You will also need to set up a public Storage bucket named 'assets' for image uploads.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; // e.g., 'https://your-project-id.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
