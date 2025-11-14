import React, { useState, useEffect, FC } from 'react';
import type { Post, UserProfile, Community } from '../types';
import { getPosts, createPost, getCommunities } from '../services/apiService';
import { BackIcon, LockIcon } from './icons';
import { PostCard } from './ClassroomView';


// --- Community Feed View ---

const CommunityFeed: FC<{ community: Community; currentUser: UserProfile; onBack: () => void; }> = ({ community, currentUser, onBack }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const fetchedPosts = await getPosts(community.id);
            setPosts(fetchedPosts);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [community.id]);

    const handlePostSubmit = async () => {
        if (!newPostContent.trim()) return;
        setIsPosting(true);
        try {
            const newPost = await createPost(newPostContent, community.id);
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

    return (
        <div>
            <button onClick={onBack} className="mb-4 flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                <BackIcon /> All Communities
            </button>
            <div className="space-y-6">
                <div className="bg-surface rounded-xl p-6 border border-border">
                    <textarea
                        className="w-full bg-background border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition"
                        rows={3}
                        placeholder={`Share something in ${community.name}...`}
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                    ></textarea>
                    <div className="text-right mt-3">
                        <button onClick={handlePostSubmit} disabled={isPosting} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-500">
                            {isPosting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>
                {loading ? (
                    <p className="text-center text-text-secondary">Loading posts...</p>
                ) : posts.length === 0 ? (
                    <p className="text-center text-text-secondary">No posts in this community yet. Be the first to post!</p>
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

// --- Community List View ---

const CommunityCard: FC<{ community: Community; onClick: () => void; locked: boolean; }> = ({ community, onClick, locked }) => (
     <div onClick={!locked ? onClick : undefined} className={`bg-surface rounded-xl overflow-hidden border border-border transition-all duration-300 ${locked ? 'opacity-60' : 'hover:border-primary transform hover:-translate-y-1 cursor-pointer group'}`}>
        <div className="relative">
            <img src={community.image_url} alt={community.name} className="w-full h-40 object-cover" />
            {locked && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <LockIcon className="w-8 h-8 text-white" />
                </div>
            )}
        </div>
        <div className="p-5">
            <div className="flex justify-between items-start">
                <h3 className={`text-lg font-bold text-text-primary mb-2 ${!locked && 'group-hover:text-primary transition-colors'}`}>{community.name}</h3>
                <span className={`capitalize text-xs font-semibold px-2 py-1 rounded-md ${community.is_premium ? 'bg-secondary/20 text-secondary' : 'bg-gray-600/20 text-gray-300'}`}>
                    {community.is_premium ? 'Premium' : 'Free'}
                </span>
            </div>
            <p className="text-sm text-text-secondary line-clamp-2">{community.description}</p>
        </div>
    </div>
);


export const CommunityView: FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCommunities = async () => {
            setLoading(true);
            try {
                const data = await getCommunities();
                setCommunities(data);
            } catch (error) {
                console.error("Failed to fetch communities:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCommunities();
    }, []);

    if (selectedCommunity) {
        return <CommunityFeed community={selectedCommunity} currentUser={currentUser} onBack={() => setSelectedCommunity(null)} />
    }
    
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Communities</h2>
            {loading ? (
                <p className="text-center text-text-secondary">Loading communities...</p>
            ) : communities.length === 0 ? (
                 <p className="text-center text-text-secondary">No communities have been created yet. An admin needs to add one.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {communities.map(community => {
                        const isLocked = community.is_premium && currentUser.plan !== 'premium';
                        return (
                           <CommunityCard 
                                key={community.id} 
                                community={community} 
                                onClick={() => setSelectedCommunity(community)}
                                locked={isLocked}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    );
};