import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your Supabase project's URL and anon key.
// It's recommended to use environment variables for this in a real project.
// You MUST replace these with your actual Supabase credentials for the app to work.
// You will also need to set up a public Storage bucket named 'assets' for image uploads.
const supabaseUrl = 'https://jregthzzrmwrtrnskcle.supabase.co'; // e.g., 'https://your-project-id.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZWd0aHp6cm13cnRybnNrY2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjU4MDAsImV4cCI6MjA3ODYwMTgwMH0.z3OOTYEKSDD7eZIbL-K7bwa669UjzsZigtJaYRuKZB4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
