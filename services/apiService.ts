import { supabase } from './supabaseClient';
import type { UserProfile, Post, Course, Download, UserPlan, Lesson } from '../types';
import { Session } from '@supabase/supabase-js';

// --- HELPER FUNCTIONS ---

const formatProfile = (data: any): UserProfile | null => {
    if (!data) return null;
    return {
        id: data.id,
        name: data.name,
        email: data.email, // This will be populated from auth.user
        avatar_url: data.avatar_url,
        plan: data.plan,
        stripe_customer_id: data.stripe_customer_id,
    };
};

// --- AUTH API ---

export const getSession = async (): Promise<UserProfile | null> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Error getting session:', sessionError);
        return null;
    }
    if (!session?.user) {
        return null;
    }

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
    
    if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
    }

    return formatProfile({ ...profileData, email: session.user.email });
};

export const onAuthStateChange = (callback: (user: UserProfile | null) => void): (() => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            if (error) {
                console.error('Error fetching profile on auth change:', error);
                callback(null);
            } else {
                 callback(formatProfile({ ...profileData, email: session.user.email }));
            }
        } else {
            callback(null);
        }
    });

    return () => subscription.unsubscribe();
};


export const signIn = async (email: string, password: string): Promise<UserProfile> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Sign in failed, no user returned.");
    
    const user = await getSession();
    if (!user) throw new Error("Could not retrieve user profile after sign in.");
    return user;
};

export const signUp = async (email: string, password: string, name: string): Promise<UserProfile> => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
                avatar_url: `https://picsum.photos/seed/${email}/100/100`,
            }
        }
    });

    if (error) throw error;
    if (!data.user) throw new Error("Sign up failed, no user returned.");

    // The onAuthStateChange listener will handle fetching the profile
    const user = await getSession();
    if (!user) throw new Error("Could not retrieve user profile after sign up.");
    return user;
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

export const createPost = async (content: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User must be logged in to create a post.");

    const { error } = await supabase
        .from('posts')
        .insert({ content, author_id: user.id });

    if (error) throw error;
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
     const { data, error } = await supabase
        .from('profiles')
        .update({ plan: plan })
        .eq('id', userId)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating user plan:", error);
        throw error;
    }
    
    // We need the user's email, which is not in the profiles table.
    const sessionUser = await getSession();
    if (!sessionUser) return null;

    return formatProfile({ ...data, email: sessionUser.email });
};
