import React, { useState, useEffect, FC } from 'react';
import type { Download, UserProfile } from '../types';
import { getDownloads } from '../services/apiService';
import { DownloadIcon, SearchIcon } from './icons';
import { useDebounce } from '../hooks/useDebounce';


const FilterButton: FC<{
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
            active 
                ? 'bg-primary text-white' 
                : 'text-text-secondary hover:bg-background hover:text-text-primary'
        }`}
    >
        {children}
    </button>
);


export const DownloadsView: FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
    const [downloads, setDownloads] = useState<Download[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [filter, setFilter] = useState<'all' | 'free' | 'premium'>(
         currentUser.plan === 'premium' ? 'all' : 'free'
    );

    useEffect(() => {
        const fetchDownloads = async () => {
            setLoading(true);
            try {
                const fetchedDownloads = await getDownloads(debouncedSearchTerm);
                setDownloads(fetchedDownloads);
            } catch (error) {
                console.error("Failed to fetch downloads:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDownloads();
    }, [debouncedSearchTerm]);

    const filteredDownloads = downloads.filter(download => {
        if (filter === 'free') return !download.is_premium;
        if (filter === 'premium') return download.is_premium;
        return true; // 'all'
    });
    
    const canAccessDownload = (download: Download) => {
        return !download.is_premium || currentUser.plan === 'premium';
    }

    return (
        <div>
             <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
                 <div className="relative flex-grow w-full">
                    <input
                        type="text"
                        placeholder="Search for downloads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg p-3 pl-10 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                        <SearchIcon />
                    </div>
                </div>
                 <div className="flex-shrink-0 flex items-center gap-2 bg-surface border border-border p-1 rounded-lg">
                    <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                        All
                    </FilterButton>
                    <FilterButton active={filter === 'free'} onClick={() => setFilter('free')}>
                        Free
                    </FilterButton>
                    <FilterButton active={filter === 'premium'} onClick={() => setFilter('premium')}>
                        Premium
                    </FilterButton>
                </div>
            </div>
        
            {loading ? (
                 <p className="text-center text-text-secondary">Loading downloads...</p>
            ) : filteredDownloads.length === 0 ? (
                 <p className="text-center text-text-secondary">No{filter !== 'all' ? ` ${filter}` : ''} downloads found{debouncedSearchTerm ? ` matching "${debouncedSearchTerm}"` : ''}.</p>
            ): (
                <div className="space-y-4">
                    {filteredDownloads.map(download => (
                        <div key={download.id} className={`bg-surface p-5 rounded-xl border border-border flex items-center justify-between gap-4 ${!canAccessDownload(download) ? 'opacity-50' : ''}`}>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary">{download.title}</h3>
                                <p className="text-sm text-text-secondary">{download.description}</p>
                            </div>
                            <a 
                                href={canAccessDownload(download) ? download.file_url : undefined} 
                                download={canAccessDownload(download)}
                                onClick={(e) => !canAccessDownload(download) && e.preventDefault()}
                                className={`px-5 py-2.5 text-white font-semibold rounded-lg flex items-center gap-2 flex-shrink-0 transition-colors ${canAccessDownload(download) ? 'bg-primary hover:bg-primary/90' : 'bg-gray-600 cursor-not-allowed'}`}
                            >
                                <DownloadIcon className="w-5 h-5" /> Download
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};