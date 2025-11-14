
import React, { useState, FC, FormEvent, useEffect } from 'react';
import type { Post, UserProfile, Comment } from '../types';
import { getCommentsForPost, addCommentToPost, toggleLikeOnPost } from '../services/apiService';
import { LikeIcon, CommentIcon, SendIcon, SpinnerIcon } from './icons';

// This file contains shared components for displaying posts and comments.

// --- Comment Section Component ---

export const CommentSection: FC<{ postId: string; currentUser: UserProfile; onCommentPosted: () => void }> = ({ postId, currentUser, onCommentPosted }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        const fetchComments = async () => {
            setLoading(true);
            try {
                const data = await getCommentsForPost(postId);
                setComments(data);
            } catch (error) {
                console.error("Failed to fetch comments:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchComments();
    }, [postId]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsPosting(true);
        try {
            const addedComment = await addCommentToPost(postId, newComment);
            setComments(prev => [...prev, addedComment]);
            setNewComment('');
            onCommentPosted();
        } catch (error) {
            console.error("Failed to post comment", error);
        } finally {
            setIsPosting(false);
        }
    };
    
    return (
        <div className="pt-4 mt-4 border-t border-border">
            {loading && <p className="text-text-secondary text-sm">Loading comments...</p>}
            <div className="space-y-3 mb-4">
                {comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-3">
                        <img src={comment.author.avatar_url} alt={comment.author.name} className="w-8 h-8 rounded-full bg-background mt-1" />
                        <div className="bg-background p-3 rounded-lg flex-grow">
                            <p className="font-semibold text-text-primary text-sm">{comment.author.name}</p>
                            <p className="text-text-primary text-sm">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>
             <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <img src={currentUser.avatar_url} alt={currentUser.name} className="w-8 h-8 rounded-full" />
                <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full bg-background border border-border rounded-lg p-2 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition"
                />
                <button type="submit" disabled={isPosting} className="p-2 bg-primary text-white rounded-lg disabled:bg-gray-500 flex-shrink-0">
                    {isPosting ? <SpinnerIcon className="animate-spin" /> : <SendIcon />}
                </button>
            </form>
        </div>
    );
};

// --- Post Card Component ---

export const PostCard: FC<{ 
    post: Post; 
    currentUser: UserProfile;
    isExpanded: boolean;
    onToggleComments: () => void;
    onPostUpdated: (updatedPost: Partial<Post>) => void;
}> = ({ post, currentUser, isExpanded, onToggleComments, onPostUpdated }) => {
    
    const [isLiking, setIsLiking] = useState(false);
    
    const handleLikeClick = async () => {
        if (isLiking) return;
        setIsLiking(true);

        const newLikedStatus = !post.user_has_liked;
        const newLikesCount = newLikedStatus ? post.likes_count + 1 : post.likes_count - 1;

        // Optimistic UI update
        onPostUpdated({ user_has_liked: newLikedStatus, likes_count: newLikesCount });

        try {
            await toggleLikeOnPost(post.id, currentUser.id, post.user_has_liked);
        } catch (error) {
            console.error("Failed to toggle like", error);
            // Revert on error
            onPostUpdated({ user_has_liked: post.user_has_liked, likes_count: post.likes_count });
        } finally {
            setIsLiking(false);
        }
    };

    const handleCommentPosted = () => {
        onPostUpdated({ comments_count: post.comments_count + 1 });
    };

    return (
        <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
                <img src={post.author.avatar_url} alt={post.author.name} className="w-10 h-10 rounded-full bg-background" />
                <div>
                    <p className="font-semibold text-text-primary">{post.author.name}</p>
                    <p className="text-xs text-text-secondary">{new Date(post.created_at).toLocaleString()}</p>
                </div>
            </div>
            <p className="text-text-primary mb-4 whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center gap-6 text-text-secondary text-sm">
                <button onClick={handleLikeClick} disabled={isLiking} className={`flex items-center gap-2 hover:text-primary transition-colors ${post.user_has_liked ? 'text-primary' : ''}`}>
                    <LikeIcon className={post.user_has_liked ? 'fill-current' : ''} />
                    <span>{post.likes_count} Likes</span>
                </button>
                <button onClick={onToggleComments} className="flex items-center gap-2 hover:text-secondary transition-colors">
                    <CommentIcon />
                    <span>{post.comments_count} Comments</span>
                </button>
            </div>
            {isExpanded && <CommentSection postId={post.id} currentUser={currentUser} onCommentPosted={handleCommentPosted} />}
        </div>
    );
};
