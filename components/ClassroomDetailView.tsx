import React, { useState, useEffect, FC } from 'react';
import type { Post, UserProfile, Community, Classroom, Course } from '../types';
import { getPostsForCommunities, createPost, getClassroomDetails } from '../services/apiService';
import { BackIcon } from './icons';
import { PostCard } from './ClassroomView';

// --- Classroom Detail View ---

export const ClassroomDetailView: FC<{ classroomId: string; currentUser: UserProfile; onBack: () => void; }> = ({ classroomId, currentUser, onBack }) => {
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [course, setCourse] = useState<Course | null>(null);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { classroom: classroomData, course: courseData, communities: communitiesData } = await getClassroomDetails(classroomId);
            setClassroom(classroomData);
            setCourse(courseData);
            setCommunities(communitiesData);
            
            const communityIds = communitiesData.map(c => c.id);
            const fetchedPosts = await getPostsForCommunities(communityIds);
            setPosts(fetchedPosts);
        } catch (error) {
            console.error("Failed to fetch classroom details and posts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [classroomId]);

    const handlePostSubmit = async () => {
        if (!newPostContent.trim() || !classroom) return;
        setIsPosting(true);
        try {
            // Post to the primary community of the classroom
            const newPost = await createPost(newPostContent, classroom.primary_community_id);
            setNewPostContent('');
            setPosts(currentPosts => [newPost, ...currentPosts]);
        } catch (error: any) {
            console.error("Failed to create post:", error);
            alert(`Could not create post: ${error.message}`);
        } finally {
            setIsPosting(false);
        }
    };
    
    const handleToggleComments = (postId: string) => {
        setExpandedPostId(currentId => (currentId === postId ? null : postId));
    };
    
    const handlePostUpdate = (postId: string, updatedFields: Partial<Post>) => {
        setPosts(currentPosts => 
            currentPosts.map(p => p.id === postId ? { ...p, ...updatedFields } : p)
        );
    };

    if (loading) {
        return <div className="text-center text-text-secondary">Loading classroom...</div>;
    }

    if (!classroom || !course) {
        return <div className="text-center text-red-400">Could not load classroom. It might not exist.</div>;
    }

    return (
        <div>
            <button onClick={onBack} className="mb-4 flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                <BackIcon /> All Classrooms
            </button>
            <div className="mb-6 bg-surface p-6 rounded-xl border-border">
                <h2 className="text-3xl font-bold">{classroom.name}</h2>
                <p className="text-text-secondary mt-1">Associated Course: <span className="font-semibold text-text-primary">{course.title}</span></p>
            </div>
            <div className="space-y-6">
                <div className="bg-surface rounded-xl p-6 border border-border">
                    <textarea
                        className="w-full bg-background border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition"
                        rows={3}
                        placeholder={`Share something in the classroom...`}
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                    ></textarea>
                    <div className="text-right mt-3">
                        <button onClick={handlePostSubmit} disabled={isPosting} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-500">
                            {isPosting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>
                {posts.length === 0 ? (
                    <p className="text-center text-text-secondary">No posts in this classroom yet. Be the first to post!</p>
                ) : (
                    posts.map(post => 
                        <PostCard 
                            key={post.id} 
                            post={post}
                            currentUser={currentUser}
                            isExpanded={expandedPostId === post.id}
                            onToggleComments={() => handleToggleComments(post.id)}
                            onPostUpdated={(updates) => handlePostUpdate(post.id, updates)}
                        />)
                )}
            </div>
        </div>
    );
};
