import { supabase } from './supabaseClient';
import type { UserProfile, Post, Course, Download, UserPlan, Profile } from '../types';

// --- HELPER FUNCTIONS ---

const formatProfile = (profile: Profile, email: string): UserProfile => {
    return {
        ...profile,
        email,
    };
};

// --- AUTH API ---

export const getSession = async (): Promise<UserProfile | null> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Error getting session:', sessionError.message);
        return null;
    }
    if (!session?.user) {
        return null;
    }

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle<Profile>();
    
    if (profileError) {
        console.error('Error fetching profile:', profileError.message);
        return null;
    }

    // If profileData is null (no profile found), we must return null.
    if (!profileData) {
        return null;
    }

    return formatProfile(profileData, session.user.email!);
};

export const onAuthStateChange = (callback: (user: UserProfile | null) => void): (() => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
            // First, attempt to fetch the user's profile.
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle<Profile>();

            if (profileError) {
                console.error('Error fetching profile on auth change:', profileError.message);
                callback(null);
                return;
            }

            if (profileData) {
                // Profile exists, format and return it.
                callback(formatProfile(profileData, session.user.email!));
            } else {
                // Profile does not exist, but the user is authenticated.
                // This can happen if the DB trigger failed. Let's create a profile now.
                console.warn(`Profile not found for user ${session.user.id}. Creating a new one.`);
                const userName = session.user.user_metadata?.name || 'New User';
                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: session.user.id,
                        name: userName,
                        avatar_url: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(userName)}`,
                    })
                    .select()
                    .single<Profile>();
                
                if (insertError) {
                    console.error('Error creating profile for authenticated user:', insertError.message);
                    callback(null);
                } else {
                    // Successfully created profile, format and return it.
                    callback(formatProfile(newProfile, session.user.email!));
                }
            }
        } else {
            // No session, user is logged out.
            callback(null);
        }
    });

    return () => subscription.unsubscribe();
};


export const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // The onAuthStateChange listener in App.tsx handles fetching the profile and updating app state.
    // Attempting to fetch the profile here can cause a race condition.
};

export const signUp = async (email: string, password: string, name: string): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
                avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`,
            }
        }
    });

    if (error) throw error;
    // The onAuthStateChange listener handles fetching the profile and updating the app state.
    // We don't need to return the user from here, as the session might not be immediately active.
};


export const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

// --- DATABASE API ---

export const getPosts = async (): Promise<Post[]> => {
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            author:profiles (id, name, avatar_url)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any;
};

export const createPost = async (content: string): Promise<Post> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User must be logged in to create a post.");

    const { data, error } = await supabase
        .from('posts')
        .insert({ content, author_id: user.id })
        .select(`
            *,
            author:profiles (id, name, avatar_url)
        `)
        .single();

    if (error) throw error;
    return data as any;
};

export const getCourses = async (searchTerm: string = ""): Promise<Course[]> => {
    let query = supabase.from('courses').select('*, lessons(*)');
    
    if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Course[];
};

export const getDownloads = async (): Promise<Download[]> => {
    const { data, error } = await supabase.from('downloads').select('*');
    if (error) throw error;
    return data;
};

export const updateUserPlan = async (userId: string, plan: UserPlan): Promise<UserProfile | null> => {
     const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ plan: plan })
        .eq('id', userId)
        .select()
        .single<Profile>();
    
    if (error) {
        console.error("Error updating user plan:", error);
        throw error;
    }
    
    // We need the user's email, which is not in the profiles table.
    // Fetch the session directly to get the email without a redundant profile fetch.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== userId) {
        console.error("User is not authenticated or is trying to update another user's plan.");
        return null;
    }

    return formatProfile(updatedProfile, session.user.email!);
};