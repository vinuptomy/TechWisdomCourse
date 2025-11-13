import React, { useState, useEffect, FC } from 'react';
import type { Course } from '../types';
import { getCourses } from '../services/apiService';
import { useDebounce } from '../hooks/useDebounce';
import { SearchIcon } from './icons';

const CourseCard: FC<{ course: Course; onClick: () => void }> = ({ course, onClick }) => (
    <div onClick={onClick} className="bg-surface rounded-xl overflow-hidden border border-border hover:border-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
        {/* FIX: Property 'thumbnailUrl' does not exist on type 'Course'. Changed to 'thumbnail_url'. */}
        <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover" />
        <div className="p-5">
            <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
            <p className="text-sm text-text-secondary line-clamp-2">{course.description}</p>
        </div>
    </div>
);

export const ClassroomView: FC<{ onSelectCourse: (course: Course) => void }> = ({ onSelectCourse }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            const fetchedCourses = await getCourses(debouncedSearchTerm);
            setCourses(fetchedCourses);
            setLoading(false);
        };
        fetchCourses();
    }, [debouncedSearchTerm]);

    return (
        <div>
            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Search for courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg p-3 pl-10 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                    <SearchIcon />
                </div>
            </div>

            {loading ? (
                <p className="text-center text-text-secondary">Loading courses...</p>
            ) : courses.length === 0 ? (
                 <p className="text-center text-text-secondary">No courses found for "{debouncedSearchTerm}".</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <CourseCard key={course.id} course={course} onClick={() => onSelectCourse(course)} />
                    ))}
                </div>
            )}
        </div>
    );
};