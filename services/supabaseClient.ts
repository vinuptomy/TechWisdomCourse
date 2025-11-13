import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your Supabase project's URL and anon key.
// It's recommended to use environment variables for this in a real project.
// Using placeholder values to prevent the app from crashing on start.
// You MUST replace these with your actual Supabase credentials for the app to work.
const supabaseUrl = 'https://xyzabc.supabase.co'; // e.g., 'https://your-project-id.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

if (supabaseUrl === 'https://xyzabc.supabase.co') {
    console.error("Supabase URL is a placeholder. Please update it in services/supabaseClient.ts with your real project URL.");
}

if (supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0') {
    console.error("Supabase Anon Key is a placeholder. Please update it in services/supabaseClient.ts with your real anon key.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
