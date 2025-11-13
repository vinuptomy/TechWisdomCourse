import React, { useState, useEffect, FC } from 'react';
import type { Download } from '../types';
import { getDownloads } from '../services/apiService';
import { DownloadIcon } from './icons';

export const DownloadsView: FC = () => {
    const [downloads, setDownloads] = useState<Download[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDownloads = async () => {
            setLoading(true);
            const fetchedDownloads = await getDownloads();
            setDownloads(fetchedDownloads);
            setLoading(false);
        };
        fetchDownloads();
    }, []);

    if (loading) {
        return <p className="text-center text-text-secondary">Loading downloads...</p>;
    }
    
    return (
        <div className="space-y-4">
            {downloads.map(download => (
                <div key={download.id} className="bg-surface p-5 rounded-xl border border-border flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">{download.title}</h3>
                        <p className="text-sm text-text-secondary">{download.description}</p>
                    </div>
                    <a href={download.file_url} download className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 flex-shrink-0">
                        <DownloadIcon className="w-5 h-5" /> Download
                    </a>
                </div>
            ))}
        </div>
    );
};