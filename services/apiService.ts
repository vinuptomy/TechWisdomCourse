import { supabase } from './supabaseClient';
import type { UserProfile, Post, Course, Download, UserPlan, Profile, Community, Comment, AuthorProfile, Chapter, Classroom, Module } from '../types';

// --- HELPER FUNCTIONS ---

const formatProfile = (profile: Profile, email: string): UserProfile => {
    return {
        ...profile,
        email,
    };
};

// --- AUTH API ---

// Retry wrapper for Supabase requests
const retryRequest = async <T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> => {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await requestFn();
        } catch (error: any) {
            lastError = error;
            
            // Don't retry on certain errors
            if (error?.code === 'PGRST116' || error?.status === 404) {
                throw error; // Not found - don't retry
            }
            
            // If it's an auth error, try to refresh token
            if (error?.status === 401 || error?.message?.includes('JWT') || error?.message?.includes('token')) {
                console.log('Auth error detected, refreshing token...');
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        const { error: refreshError } = await supabase.auth.refreshSession();
                        if (refreshError) {
                            console.error('Token refresh failed:', refreshError);
                            // If refresh fails, clear session
                            await supabase.auth.signOut();
                            throw new Error('Session expired. Please log in again.');
                        }
                    }
                } catch (refreshError) {
                    console.error('Token refresh error:', refreshError);
                    throw error; // Throw original error
                }
            }
            
            if (i < maxRetries - 1) {
                console.log(`Request failed, retrying... (${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }
    }
    
    throw lastError;
};

export const getSession = async (): Promise<UserProfile | null> => {
    try {
        // Use retry logic for session check
        const { data: { session }, error: sessionError } = await retryRequest(
            () => supabase.auth.getSession()
        );
        
        if (sessionError) {
            console.error('Error getting session:', sessionError.message);
            return null;
        }
        
        if (!session?.user) {
            return null;
        }

        // Check if session is expired
        if (session.expires_at && session.expires_at * 1000 < Date.now()) {
            console.log('Session expired, attempting refresh...');
            try {
                const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
                if (refreshError || !refreshedSession?.user) {
                    console.error('Session refresh failed:', refreshError);
                    await supabase.auth.signOut();
                    return null;
                }
                // Use refreshed session
                const { data: profileData, error: profileError } = await retryRequest(
                    () => supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', refreshedSession.user.id)
                        .maybeSingle<Profile>()
                );
                
                if (profileError) {
                    console.error('Error fetching profile:', profileError.message);
                    return null;
                }
                
                if (!profileData) {
                    return null;
                }
                
                return formatProfile(profileData, refreshedSession.user.email ?? '');
            } catch (refreshErr) {
                console.error('Session refresh error:', refreshErr);
                return null;
            }
        }

        // Retry profile fetch with retry logic
        const { data: profileData, error: profileError } = await retryRequest(
            () => supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle<Profile>()
        );
        
        if (profileError) {
            console.error('Error fetching profile:', profileError.message);
            return null;
        }

        // If profileData is null (no profile found), we must return null.
        if (!profileData) {
            return null;
        }

        return formatProfile(profileData, session.user.email ?? '');
    } catch (error) {
        console.error('Unexpected error in getSession:', error);
        return null;
    }
};

export const onAuthStateChange = (callback: (user: UserProfile | null) => void): (() => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔔 Auth state changed:', event, session ? 'Session exists' : 'No session');
        try {
            if (session?.user) {
                console.log('📋 Fetching profile for user:', session.user.id);
                // First, attempt to fetch the user's profile.
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle<Profile>();

                if (profileError) {
                    console.error('❌ Error fetching profile on auth change:', profileError.message);
                    callback(null);
                    return;
                }

                if (profileData) {
                    // Profile exists, format and return it.
                    console.log('✅ Profile found, updating user state');
                    callback(formatProfile(profileData, session.user.email ?? ''));
                } else {
                    // Profile does not exist, but the user is authenticated.
                    // This can happen if the DB trigger failed. Let's create a profile now.
                    console.warn(`⚠️ Profile not found for user ${session.user.id}. Creating a new one.`);
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
                        console.error('❌ Error creating profile for authenticated user:', insertError.message);
                        callback(null);
                    } else {
                        // Successfully created profile, format and return it.
                        console.log('✅ Profile created, updating user state');
                        callback(formatProfile(newProfile, session.user.email ?? ''));
                    }
                }
            } else {
                // No session, user is logged out.
                console.log('👋 User logged out, clearing user state');
                callback(null);
            }
        } catch (error) {
            console.error("❌ Unhandled error in onAuthStateChange callback:", error);
            callback(null);
        }
    });

    return () => subscription.unsubscribe();
};


export const signIn = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // Sign-in successful - the onAuthStateChange listener in App.tsx will be triggered
    // and will fetch the user profile and update the currentUser state.
    // This will cause the Auth component to be unmounted and the main app to render.
    if (data?.session) {
        console.log('✅ Sign-in successful, session established. Auth state change will update the app.');
    }
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
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Clear all session storage
        if (typeof window !== 'undefined') {
            sessionStorage.clear();
            localStorage.clear(); // Also clear localStorage just in case
        }
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
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

// --- COURSE MGMT API ---
export const getCourses = async (searchTerm: string = ""): Promise<Course[]> => {
    let query = supabase.from('courses').select('id, title, description, thumbnail_url, is_premium, tags');
    
    if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Course[];
};

export const getCourseDetails = async (courseId: string): Promise<Course> => {
    const { data: courseData, error: courseError } = await retryRequest(
        () => supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single()
    );
    if (courseError) throw courseError;

    const { data: modulesData, error: modulesError } = await retryRequest(
        () => supabase
            .from('modules')
            .select('*, chapters(*, downloads:chapter_downloads(download:downloads(*)))')
            .eq('course_id', courseId)
            .order('position', { ascending: true })
    );

    if (modulesError) throw modulesError;
    
    const modules = modulesData.map((module: any) => ({
        ...module,
        chapters: (module.chapters || [])
            .map((chapter: any) => ({
                ...chapter,
                downloads: (chapter.downloads || []).map((d: any) => d.download).filter(Boolean)
            }))
            .sort((a: Chapter, b: Chapter) => (a.position || 0) - (b.position || 0)) // Ensure proper sorting
    }));

    return { ...courseData, modules };
};


export const createCourse = async (
    courseData: { title: string; description: string; syllabus: string; is_premium: boolean; primary_community_id: string | null; },
    thumbnailFile: File
): Promise<Course> => {
    const fileExt = thumbnailFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `course_thumbnails/${fileName}`;

    const { error: uploadError } = await retryRequest(
        () => supabase.storage.from('assets').upload(filePath, thumbnailFile)
    );
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(filePath);

    const { data, error } = await retryRequest(
        () => supabase
            .from('courses')
            .insert({ ...courseData, thumbnail_url: publicUrl })
            .select()
            .single()
    );
        
    if (error) throw error;
    return data;
};

export const createModule = async (moduleData: { course_id: string; title: string; description: string; position: number; }): Promise<Module> => {
    const { data, error } = await retryRequest(
        () => supabase.from('modules').insert(moduleData).select().single()
    );
    if (error) throw error;
    return { ...data, chapters: [] };
};

export const createChapter = async (chapterData: { module_id: string; title: string; description: string; video_url: string; position: number; }): Promise<Chapter> => {
    console.log('Creating chapter with data:', chapterData);
    
    // Validate required fields
    if (!chapterData.module_id || !chapterData.title || !chapterData.video_url) {
        throw new Error('Module ID, title, and video URL are required');
    }
    
    // Verify user is admin before attempting insert (helps with RLS)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('You must be logged in to create chapters');
    }
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (!profile || profile.role !== 'admin') {
        throw new Error('Only admins can create chapters');
    }
    
    console.log('User verified as admin, proceeding with chapter creation');
    
    // Prepare data - convert empty strings to null for optional fields
    const insertData = {
        module_id: chapterData.module_id,
        title: chapterData.title.trim(),
        description: chapterData.description?.trim() || null,
        video_url: chapterData.video_url.trim(),
        position: chapterData.position
    };
    
    console.log('Inserting chapter with prepared data:', insertData);
    
    try {
        console.log('Calling Supabase insert for chapter...');
        
        // Use retry logic manually since Supabase returns {data, error} instead of throwing
        let lastError: any = null;
        let result: any = null;
        const maxRetries = 3;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                console.log(`Chapter insert attempt ${attempt + 1}/${maxRetries}...`);
                
                // Add timeout to prevent hanging
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Chapter insert timeout after 10 seconds')), 10000)
                );
                
                const insertPromise = supabase.from('chapters').insert(insertData).select().single();
                const response = await Promise.race([insertPromise, timeoutPromise]) as any;
                
                console.log('Supabase response received:', {
                    hasData: !!response?.data,
                    hasError: !!response?.error,
                    errorCode: response?.error?.code,
                    errorMessage: response?.error?.message,
                    fullResponse: response
                });
                
                if (response.error) {
                    console.error('Full error object:', JSON.stringify(response.error, null, 2));
                    lastError = response.error;
                    console.error(`Attempt ${attempt + 1} failed:`, response.error);
                    
                    // Don't retry on certain errors
                    if (response.error.code === '23505' || response.error.code === '23503') {
                        throw response.error; // Unique constraint or foreign key - don't retry
                    }
                    
                    // If it's an auth error, try to refresh token
                    if (response.error.status === 401 || response.error.message?.includes('JWT') || response.error.message?.includes('token')) {
                        console.log('Auth error detected, refreshing token...');
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session) {
                            const { error: refreshError } = await supabase.auth.refreshSession();
                            if (refreshError) {
                                console.error('Token refresh failed:', refreshError);
                                await supabase.auth.signOut();
                                throw new Error('Session expired. Please log in again.');
                            }
                        }
                    }
                    
                    // If not last attempt, wait and retry
                    if (attempt < maxRetries - 1) {
                        const delay = 1000 * (attempt + 1);
                        console.log(`Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                } else {
                    result = response;
                    break; // Success, exit retry loop
                }
            } catch (err: any) {
                lastError = err;
                if (err.code === '23505' || err.code === '23503') {
                    throw err; // Don't retry on constraint violations
                }
                if (attempt < maxRetries - 1) {
                    const delay = 1000 * (attempt + 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
        }
        
        // Check final result
        if (result?.error) {
            const error = result.error;
            console.error('Error creating chapter after retries:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            
            // Provide more helpful error messages
            if (error.code === '23505') { // Unique constraint violation
                throw new Error(`A chapter with position ${insertData.position} already exists in this module. Please choose a different position.`);
            }
            if (error.code === '23503') { // Foreign key violation
                throw new Error('Invalid module ID. Please refresh the page and try again.');
            }
            throw new Error(error.message || 'Failed to create chapter');
        }
        
        if (!result?.data) {
            console.error('No data returned from chapter creation. Result:', result);
            throw new Error('Chapter creation returned no data. Please check your admin permissions and try again.');
        }
        
        console.log('Chapter created successfully:', result.data);
        return { ...result.data, downloads: [] };
    } catch (error: any) {
        console.error('Failed to create chapter:', error);
        console.error('Error type:', typeof error);
        console.error('Error details:', {
            message: error?.message,
            code: error?.code,
            status: error?.status,
            name: error?.name
        });
        
        // Re-throw with a user-friendly message if it's not already an Error object
        if (error instanceof Error) {
            // Check for timeout
            if (error.message.includes('timeout')) {
                throw new Error('Chapter creation timed out. Please check your connection and try again.');
            }
            throw error;
        }
        throw new Error(error?.message || 'Failed to create chapter. Please try again.');
    }
};


// --- DOWNLOADS API ---
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

    return formatProfile(updatedProfile, session.user.email ?? '');
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

// --- UPDATE & DELETE OPERATIONS ---

// Connection health check
export const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
        
        if (error) {
            console.error('Supabase connection check failed:', error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Supabase connection check error:', error);
        return false;
    }
};

// Update Community
export const updateCommunity = async (
    communityId: string,
    { name, description, is_premium }: { name?: string; description?: string; is_premium?: boolean },
    imageFile?: File
): Promise<Community> => {
    let imageUrl: string | undefined;
    
    if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `community/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, imageFile, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_premium !== undefined) updateData.is_premium = is_premium;
    if (imageUrl) updateData.image_url = imageUrl;

    const { data, error } = await retryRequest(
        () => supabase
            .from('communities')
            .update(updateData)
            .eq('id', communityId)
            .select()
            .single()
    );

    if (error) throw error;
    return data;
};

// Delete Community
export const deleteCommunity = async (communityId: string): Promise<void> => {
    const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId);
    if (error) throw error;
};

// Update Course
export const updateCourse = async (
    courseId: string,
    courseData: { title?: string; description?: string; syllabus?: string; is_premium?: boolean; primary_community_id?: string | null; tags?: string[] },
    thumbnailFile?: File
): Promise<Course> => {
    let thumbnailUrl: string | undefined;
    
    if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `course_thumbnails/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, thumbnailFile, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath);
        
        thumbnailUrl = publicUrl;
    }

    const updateData: any = {};
    if (courseData.title !== undefined) updateData.title = courseData.title;
    if (courseData.description !== undefined) updateData.description = courseData.description;
    if (courseData.syllabus !== undefined) updateData.syllabus = courseData.syllabus;
    if (courseData.is_premium !== undefined) updateData.is_premium = courseData.is_premium;
    if (courseData.primary_community_id !== undefined) updateData.primary_community_id = courseData.primary_community_id;
    if (courseData.tags !== undefined) updateData.tags = courseData.tags;
    if (thumbnailUrl) updateData.thumbnail_url = thumbnailUrl;

    const { data, error } = await retryRequest(
        () => supabase
            .from('courses')
            .update(updateData)
            .eq('id', courseId)
            .select()
            .single()
    );

    if (error) throw error;
    return data;
};

// Delete Course
export const deleteCourse = async (courseId: string): Promise<void> => {
    const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
    if (error) throw error;
};

// Update Module
export const updateModule = async (
    moduleId: string,
    moduleData: { title?: string; description?: string; position?: number }
): Promise<Module> => {
    const updateData: any = {};
    if (moduleData.title !== undefined) updateData.title = moduleData.title;
    if (moduleData.description !== undefined) updateData.description = moduleData.description;
    if (moduleData.position !== undefined) updateData.position = moduleData.position;

    const { data, error } = await retryRequest(
        () => supabase
            .from('modules')
            .update(updateData)
            .eq('id', moduleId)
            .select()
            .single()
    );

    if (error) throw error;
    
    // Fetch chapters for the module
    const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('module_id', moduleId)
        .order('position', { ascending: true });
    
    return { ...data, chapters: chaptersData || [] };
};

// Delete Module
export const deleteModule = async (moduleId: string): Promise<void> => {
    const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);
    if (error) throw error;
};

// Update Chapter
export const updateChapter = async (
    chapterId: string,
    chapterData: { title?: string; description?: string; video_url?: string; position?: number }
): Promise<Chapter> => {
    const updateData: any = {};
    if (chapterData.title !== undefined) updateData.title = chapterData.title;
    if (chapterData.description !== undefined) updateData.description = chapterData.description;
    if (chapterData.video_url !== undefined) updateData.video_url = chapterData.video_url;
    if (chapterData.position !== undefined) updateData.position = chapterData.position;

    const { data, error } = await retryRequest(
        () => supabase
            .from('chapters')
            .update(updateData)
            .eq('id', chapterId)
            .select()
            .single()
    );

    if (error) throw error;
    
    // Fetch downloads for the chapter
    const { data: downloadsData } = await supabase
        .from('chapter_downloads')
        .select('download:downloads(*)')
        .eq('chapter_id', chapterId);
    
    const downloads = downloadsData?.map((d: any) => d.download).filter(Boolean) || [];
    
    return { ...data, downloads };
};

// Delete Chapter
export const deleteChapter = async (chapterId: string): Promise<void> => {
    const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);
    if (error) throw error;
};

// Update Download
export const updateDownload = async (
    downloadId: string,
    { title, description, is_premium }: { title?: string; description?: string; is_premium?: boolean },
    file?: File
): Promise<Download> => {
    let fileUrl: string | undefined;
    
    if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `downloads/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath);
        
        fileUrl = publicUrl;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (is_premium !== undefined) updateData.is_premium = is_premium;
    if (fileUrl) updateData.file_url = fileUrl;

    const { data, error } = await retryRequest(
        () => supabase
            .from('downloads')
            .update(updateData)
            .eq('id', downloadId)
            .select()
            .single()
    );

    if (error) throw error;
    return data;
};

// Delete Download
export const deleteDownload = async (downloadId: string): Promise<void> => {
    const { error } = await supabase
        .from('downloads')
        .delete()
        .eq('id', downloadId);
    if (error) throw error;
};

// --- CHAPTER DOWNLOADS JUNCTION TABLE OPERATIONS ---

// Link download to chapter
export const linkDownloadToChapter = async (chapterId: string, downloadId: string): Promise<void> => {
    const { error } = await retryRequest(
        () => supabase
            .from('chapter_downloads')
            .insert({ chapter_id: chapterId, download_id: downloadId })
    );
    if (error) throw error;
};

// Unlink download from chapter
export const unlinkDownloadFromChapter = async (chapterId: string, downloadId: string): Promise<void> => {
    const { error } = await retryRequest(
        () => supabase
            .from('chapter_downloads')
            .delete()
            .match({ chapter_id: chapterId, download_id: downloadId })
    );
    if (error) throw error;
};

// Get all downloads for a chapter
export const getChapterDownloads = async (chapterId: string): Promise<Download[]> => {
    const { data, error } = await retryRequest(
        () => supabase
            .from('chapter_downloads')
            .select('download:downloads(*)')
            .eq('chapter_id', chapterId)
    );
    
    if (error) throw error;
    return data?.map((d: any) => d.download).filter(Boolean) || [];
};

// Get all available downloads (for linking to chapters)
export const getAllDownloads = async (): Promise<Download[]> => {
    const { data, error } = await retryRequest(
        () => supabase
            .from('downloads')
            .select('*')
            .order('created_at', { ascending: false })
    );
    if (error) throw error;
    return data;
};