import React, { useState, useEffect, FC } from 'react';
import type { Classroom, UserProfile } from '../types';
import { getClassrooms } from '../services/apiService';
import { useDebounce } from '../hooks/useDebounce';
import { SearchIcon } from './icons';

const ClassroomCard: FC<{ classroom: Classroom; onClick: () => void }> = ({ classroom, onClick }) => (
    <div onClick={onClick} className="bg-surface rounded-xl p-6 border border-border hover:border-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">{classroom.name}</h3>
            <span className={`capitalize text-xs font-semibold px-2 py-1 rounded-md ${classroom.is_premium ? 'bg-secondary/20 text-secondary' : 'bg-gray-600/20 text-gray-300'}`}>
                {classroom.is_premium ? 'Premium' : 'Free'}
            </span>
        </div>
        <p className="text-sm text-text-secondary line-clamp-2 mb-4">{classroom.description}</p>
        <div className="text-xs text-text-secondary border-t border-border pt-3">
            <p>Course: <span className="font-semibold text-text-primary">{classroom.course_title}</span></p>
        </div>
    </div>
);

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


export const ClassroomsView: FC<{ currentUser: UserProfile; onSelectClassroom: (classroom: Classroom) => void }> = ({ currentUser, onSelectClassroom }) => {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [filter, setFilter] = useState<'all' | 'free' | 'premium'>(
        currentUser.plan === 'premium' ? 'all' : 'free'
    );

    useEffect(() => {
        const fetchClassrooms = async () => {
            setLoading(true);
            try {
                const fetchedClassrooms = await getClassrooms(debouncedSearchTerm);
                setClassrooms(fetchedClassrooms);
            } catch (error) {
                console.error("Failed to fetch classrooms:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClassrooms();
    }, [debouncedSearchTerm]);

    const filteredClassrooms = classrooms.filter(classroom => {
        if (filter === 'free') return !classroom.is_premium;
        if (filter === 'premium') return classroom.is_premium;
        return true; // for 'all'
    });


    return (
        <div>
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
                 <div className="relative flex-grow w-full">
                    <input
                        type="text"
                        placeholder="Search for classrooms..."
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
                <p className="text-center text-text-secondary">Loading classrooms...</p>
            ) : filteredClassrooms.length === 0 ? (
                 <p className="text-center text-text-secondary">No{filter !== 'all' ? ` ${filter}` : ''} classrooms found{debouncedSearchTerm ? ` matching "${debouncedSearchTerm}"` : ''}.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClassrooms.map(classroom => (
                        <ClassroomCard key={classroom.id} classroom={classroom} onClick={() => onSelectClassroom(classroom)} />
                    ))}
                </div>
            )}
        </div>
    );
};