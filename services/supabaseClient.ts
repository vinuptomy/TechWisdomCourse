import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your Supabase project's URL and anon key.
// It's recommended to use environment variables for this in a real project.
// You MUST replace these with your actual Supabase credentials for the app to work.
// You will also need to set up a public Storage bucket named 'assets' for image uploads.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; // e.g., 'https://your-project-id.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables!');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
    throw new Error('Supabase configuration is missing. Please check your .env.local file.');
}

// Custom storage using sessionStorage (clears on browser close)
const sessionStorageAdapter = {
    getItem: (key: string): string | null => {
        if (typeof window === 'undefined') return null;
        return window.sessionStorage.getItem(key);
    },
    setItem: (key: string, value: string): void => {
        if (typeof window === 'undefined') return;
        window.sessionStorage.setItem(key, value);
    },
    removeItem: (key: string): void => {
        if (typeof window === 'undefined') return;
        window.sessionStorage.removeItem(key);
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: sessionStorageAdapter, // Use sessionStorage instead of localStorage
        storageKey: 'sb-auth-token',
        flowType: 'pkce'
    },
    global: {
        headers: {
            'x-client-info': 'tech-wisdom-academy'
        }
    },
    db: {
        schema: 'public'
    }
});

// Listen for auth state changes and handle token refresh
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refreshed successfully');
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out - clearing session');
        // Clear any remaining session data
        if (typeof window !== 'undefined') {
            sessionStorage.clear();
        }
    } else if (event === 'SIGNED_IN') {
        console.log('User signed in');
    } else if (event === 'USER_UPDATED') {
        console.log('User updated');
    }
});

// Clear session on page unload (browser close)
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        // Note: We can't clear sessionStorage here as it's async
        // But sessionStorage automatically clears on tab close
        console.log('Page unloading - session will clear on tab close');
    });
}
