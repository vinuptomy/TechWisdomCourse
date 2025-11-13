import React, { useState, useEffect, FC } from 'react';
import type { Post, UserProfile } from '../types';
import { getPosts, createPost } from '../services/apiService';
import { LikeIcon, CommentIcon } from './icons';

const PostCard: FC<{ post: Post }> = ({ post }) => {
    // FIX: Handle posts with null authors to prevent app crashes.
    // This can happen if an author's profile is deleted but their posts remain.
    const authorName = post.author?.name ?? 'Unknown Author';
    const authorAvatar = post.author?.avatar_url ?? `https://api.dicebear.com/8.x/initials/svg?seed=${authorName}`;

    return (
        <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
                <img src={authorAvatar} alt={authorName} className="w-10 h-10 rounded-full bg-background" />
                <div>
                    <p className="font-semibold text-text-primary">{authorName}</p>
                    <p className="text-xs text-text-secondary">{new Date(post.created_at).toLocaleString()}</p>
                </div>
            </div>
            <p className="text-text-primary mb-4 whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center gap-6 text-text-secondary text-sm">
                <button className="flex items-center gap-2 hover:text-primary transition-colors">
                    <LikeIcon />
                    <span>{post.likes} Likes</span>
                </button>
                <button className="flex items-center gap-2 hover:text-secondary transition-colors">
                    <CommentIcon />
                    <span>{post.comments_count} Comments</span>
                </button>
            </div>
        </div>
    );
};


export const CommunityView: FC<{currentUser: UserProfile}> = ({currentUser}) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        const fetchedPosts = await getPosts();
        setPosts(fetchedPosts);
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePostSubmit = async () => {
        if (!newPostContent.trim()) return;
        setIsPosting(true);
        try {
            await createPost(newPostContent);
            setNewPostContent('');
            await fetchPosts(); // Refresh posts list
        } catch (error: any) {
            console.error("Failed to create post:", error);
            alert(`Could not create post: ${error.message}`);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-surface rounded-xl p-6 border border-border">
                <textarea
                    className="w-full bg-background border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition"
                    rows={3}
                    placeholder="What's on your mind?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                ></textarea>
                <div className="text-right mt-3">
                    <button 
                        onClick={handlePostSubmit}
                        disabled={isPosting}
                        className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-500">
                        {isPosting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>
            {loading ? (
                 <p className="text-center text-text-secondary">Loading posts...</p>
            ) : (
                posts.map(post => <PostCard key={post.id} post={post} />)
            )}
        </div>
    );
};