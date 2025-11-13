import React, { useState, useEffect, FC } from 'react';
import type { Course, UserProfile } from '../types';
import { getCourses } from '../services/apiService';
import { useDebounce } from '../hooks/useDebounce';
import { SearchIcon, SpinnerIcon } from './icons';

const CourseCard: FC<{ course: Course; onClick: () => void }> = ({ course, onClick }) => (
    <div onClick={onClick} className="bg-surface rounded-xl overflow-hidden border border-border hover:border-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
        <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover" />
        <div className="p-5">
            <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
            <p className="text-sm text-text-secondary line-clamp-2">{course.description}</p>
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


export const CoursesView: FC<{ currentUser: UserProfile; onSelectCourse: (course: Course) => void }> = ({ currentUser, onSelectCourse }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [filter, setFilter] = useState<'all' | 'free' | 'premium'>(
        currentUser.plan === 'premium' ? 'all' : 'free'
    );

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            const fetchedCourses = await getCourses(debouncedSearchTerm);
            setCourses(fetchedCourses);
            setLoading(false);
        };
        fetchCourses();
    }, [debouncedSearchTerm]);

    const filteredCourses = courses.filter(course => {
        if (filter === 'free') return !course.is_premium;
        if (filter === 'premium') return course.is_premium;
        return true; // for 'all'
    });


    return (
        <div>
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
                 <div className="relative flex-grow w-full">
                    <input
                        type="text"
                        placeholder="Search for courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg p-3 pl-10 pr-10 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                        <SearchIcon />
                    </div>
                     {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
                            <SpinnerIcon className="animate-spin" />
                        </div>
                    )}
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

            {/* Initial loading state */}
            {loading && courses.length === 0 && (
                <p className="text-center text-text-secondary">Loading courses...</p>
            )}

            {/* No results state */}
            {!loading && filteredCourses.length === 0 && (
                 <p className="text-center text-text-secondary">No{filter !== 'all' ? ` ${filter}` : ''} courses found{debouncedSearchTerm ? ` matching "${debouncedSearchTerm}"` : ''}.</p>
            )}
            
            {/* Grid view with smooth loading transition */}
            {filteredCourses.length > 0 && (
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    {filteredCourses.map(course => (
                        <CourseCard key={course.id} course={course} onClick={() => onSelectCourse(course)} />
                    ))}
                </div>
            )}
        </div>
    );
};