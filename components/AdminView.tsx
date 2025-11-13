import React, { useState, useEffect, FC, FormEvent } from 'react';
import type { UserProfile, Community } from '../types';
import { getCommunities, createCommunity } from '../services/apiService';
import { SpinnerIcon } from './icons';

const CreateCommunityForm: FC<{ onCommunityCreated: () => void }> = ({ onCommunityCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name || !description || !imageFile) {
            setError('All fields are required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await createCommunity({ name, description, is_premium: isPremium }, imageFile);
            // Reset form
            setName('');
            setDescription('');
            setIsPremium(false);
            setImageFile(null);
            (e.target as HTMLFormElement).reset(); // Clear file input
            onCommunityCreated(); // Trigger refetch in parent
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface p-6 rounded-xl border border-border">
            <h3 className="text-xl font-bold mb-4">Create New Community</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Community Name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition" />
                <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="w-full bg-background border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition" />
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Community Image</label>
                    <input type="file" accept="image/*" onChange={e => e.target.files && setImageFile(e.target.files[0])} required className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90" />
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isPremium" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <label htmlFor="isPremium" className="text-text-primary">Premium Community</label>
                </div>
                {error && <p className="text-red-400">{error}</p>}
                <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed">
                    {loading ? <SpinnerIcon className="animate-spin mx-auto" /> : 'Create Community'}
                </button>
            </form>
        </div>
    );
};

export const AdminView: FC<{ user: UserProfile }> = ({ user }) => {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCommunities = async () => {
        setLoading(true);
        try {
            const data = await getCommunities();
            setCommunities(data);
        } catch (error) {
            console.error("Failed to fetch communities", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCommunities();
    }, []);

    if (user.role !== 'admin') {
        return <div className="text-center text-red-400">Access Denied. You must be an administrator to view this page.</div>;
    }

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold">Admin Panel</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <CreateCommunityForm onCommunityCreated={fetchCommunities} />
                </div>
                <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-border">
                    <h3 className="text-xl font-bold mb-4">Existing Communities ({communities.length})</h3>
                    {loading ? (
                        <p className="text-text-secondary">Loading...</p>
                    ) : (
                        <ul className="space-y-3">
                            {communities.map(c => (
                                <li key={c.id} className="p-3 bg-background rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-md object-cover" />
                                        <span className="font-semibold">{c.name}</span>
                                    </div>
                                    <span className={`capitalize px-2 py-1 rounded-md text-xs ${c.is_premium ? 'bg-secondary/20 text-secondary' : 'bg-gray-600/20 text-gray-300'}`}>
                                        {c.is_premium ? 'Premium' : 'Free'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};
