import { supabase } from './supabaseClient';
import type { UserProfile, Post, Course, Download, UserPlan, Profile, Community, Comment, AuthorProfile, Chapter, Classroom } from '../types';

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
};


export const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

// --- DATABASE API ---

export const getPosts = async (communityId: string): Promise<Post[]> => {
    const { data, error } = await supabase.rpc('get_posts_with_details', {
        community_id_filter: communityId
    });

    if (error) {
        console.error("Error fetching posts with details:", error);
        throw error;
    }
    return data as Post[];
};

export const getPostsForCommunities = async (communityIds: string[]): Promise<Post[]> => {
    if (!communityIds || communityIds.length === 0) {
        return [];
    }

    // Note: This approach makes multiple RPC calls. For large-scale apps,
    // you might create a new RPC function that accepts an array of IDs.
    const postPromises = communityIds.map(id => getPosts(id));
    const results = await Promise.all(postPromises);
    
    // Flatten the array of arrays, and sort by creation date descending
    return results.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};


export const createPost = async (content: string, communityId: string): Promise<Post> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User must be logged in to create a post.");

    const { data: authorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', user.id)
        .single<AuthorProfile>();
    
    if (profileError || !authorProfile) {
        throw new Error(profileError?.message || "User profile not found.");
    }

    const { data: newPostData, error: insertError } = await supabase
        .from('posts')
        .insert({ content, author_id: user.id, community_id: communityId })
        .select('id, created_at, content, author_id, community_id')
        .single();

    if (insertError) throw insertError;

    return {
        ...newPostData,
        author: authorProfile,
        likes_count: 0,
        comments_count: 0,
        user_has_liked: false,
    };
};


export const getCourses = async (searchTerm: string = ""): Promise<Course[]> => {
    let query = supabase.from('courses').select('*');
    
    if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Course[];
};

export const getCourseDetails = async (courseId: string): Promise<{ course: Course; chapters: Chapter[] }> => {
    // Fetch course details
    const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
    if (courseError) throw courseError;

    // Fetch chapters for the course, along with their associated downloads
    const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*, downloads:chapter_downloads(download:downloads(*))')
        .eq('course_id', courseId)
        .order('position');
        
    if (chaptersError) throw chaptersError;

    // The query nests the download object, so we need to flatten it.
    const chapters = chaptersData.map((chapter: any) => ({
        ...chapter,
        downloads: chapter.downloads.map((d: any) => d.download).filter(Boolean)
    }));

    return { course: courseData, chapters };
};


export const getDownloads = async (searchTerm: string = ""): Promise<Download[]> => {
    let query = supabase.from('downloads').select('*');
     if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const createDownload = async (
    { title, description, is_premium }: { title: string; description: string; is_premium: boolean },
    file: File
): Promise<Download> => {
     const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `downloads/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);
    
    const { data, error } = await supabase
        .from('downloads')
        .insert({ title, description, is_premium, file_url: publicUrl })
        .select()
        .single();

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
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== userId) {
        console.error("User is not authenticated or is trying to update another user's plan.");
        return null;
    }

    return formatProfile(updatedProfile, session.user.email!);
};


// --- COMMUNITY API ---

export const getCommunities = async (): Promise<Community[]> => {
    const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    return data;
};

export const createCommunity = async (
    { name, description, is_premium }: { name: string; description: string; is_premium: boolean },
    imageFile: File
): Promise<Community> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User must be logged in.");

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `community/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, imageFile);

    if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

    const { data, error: insertError } = await supabase
        .from('communities')
        .insert({
            name,
            description,
            is_premium,
            image_url: publicUrl
        })
        .select()
        .single();

    if (insertError) {
        console.error("DB insert error:", insertError);
        throw insertError;
    }

    return data;
};

// --- CLASSROOM API ---

export const getClassrooms = async (searchTerm: string = ""): Promise<Classroom[]> => {
    // FIX: Explicitly define the foreign key relationship to resolve ambiguity.
    let query = supabase
        .from('classrooms')
        .select(`
            *,
            course:courses(title),
            community:communities!classrooms_primary_community_id_fkey(name)
        `);

    if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    
    // Flatten the joined data for easier use in the UI
    return data.map((c: any) => ({
        ...c,
        course_title: c.course?.title,
        primary_community_name: c.community?.name,
    }));
};

export const createClassroom = async (
    { name, description, is_premium, course_id, primary_community_id }: Omit<Classroom, 'id'>
): Promise<Classroom> => {
    const { data, error } = await supabase
        .from('classrooms')
        .insert({ name, description, is_premium, course_id, primary_community_id })
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const getClassroomDetails = async (classroomId: string): Promise<{ classroom: Classroom, course: Course, communities: Community[] }> => {
    // FIX: Explicitly define the foreign key relationship to resolve ambiguity.
    const { data: classroomData, error: classroomError } = await supabase
        .from('classrooms')
        .select('*, course:courses(*), community:communities!classrooms_primary_community_id_fkey(*)')
        .eq('id', classroomId)
        .single();
    if (classroomError) throw classroomError;

    // Fetch additional linked communities
    const { data: additionalCommunitiesData, error: additionalCommunitiesError } = await supabase
        .from('classroom_communities')
        .select('community:communities(*)')
        .eq('classroom_id', classroomId);
    if (additionalCommunitiesError) throw additionalCommunitiesError;

    const additionalCommunities = additionalCommunitiesData.map((item: any) => item.community);
    
    // Combine primary and additional communities, ensuring no duplicates
    const allCommunities = [
        classroomData.community,
        ...additionalCommunities.filter(c => c.id !== classroomData.community.id)
    ].filter(Boolean);

    return {
        classroom: {
            id: classroomData.id,
            name: classroomData.name,
            description: classroomData.description,
            is_premium: classroomData.is_premium,
            course_id: classroomData.course_id,
            primary_community_id: classroomData.primary_community_id,
        },
        course: classroomData.course,
        communities: allCommunities
    };
};

// --- COMMENTS & LIKES API ---

export const getCommentsForPost = async (postId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
        .from('comments')
        .select('*, author:profiles(id, name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as any;
};

export const addCommentToPost = async (postId: string, content: string): Promise<Comment> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User must be logged in to comment.");

    const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, content, author_id: user.id })
        .select('*, author:profiles(id, name, avatar_url)')
        .single();

    if (error) throw error;
    return data as any;
};

export const toggleLikeOnPost = async (postId: string, userId: string, hasLiked: boolean) => {
    if (hasLiked) {
        // User has already liked, so remove the like
        const { error } = await supabase
            .from('post_likes')
            .delete()
            .match({ post_id: postId, user_id: userId });
        if (error) throw error;
    } else {
        // User has not liked, so add a like
        const { error } = await supabase
            .from('post_likes')
            .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
    }
};