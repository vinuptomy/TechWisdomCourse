import React, { useState, FC } from 'react';
import type { Course, Lesson } from '../types';
import { BackIcon } from './icons';

export const CourseDetailView: FC<{ course: Course; onBack: () => void }> = ({ course, onBack }) => {
    // FIX: Safely initialize the selected lesson, defaulting to null if no lessons exist to prevent crash.
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(course.lessons?.[0] || null);

    // FIX: Handle the case where a course has no lessons and provide a user-friendly message.
    if (!selectedLesson) {
        return (
             <div>
                 <button onClick={onBack} className="mb-4 flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                     <BackIcon /> Back to Classroom
                 </button>
                <div className="bg-surface p-8 rounded-xl border border-border text-center">
                    <h2 className="text-xl font-bold mb-2">{course.title}</h2>
                    <p className="text-text-secondary">This course doesn't have any lessons yet. Please check back later!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6">
             <div className="flex-grow">
                 <button onClick={onBack} className="mb-4 flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                     <BackIcon /> Back to Classroom
                 </button>
                <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 border border-border">
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${selectedLesson.video_id}`}
                        title={selectedLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
                 <h2 className="text-2xl font-bold text-text-primary">{selectedLesson.title}</h2>
             </div>
             <div className="w-full lg:w-80 lg:flex-shrink-0 bg-surface rounded-xl p-4 border border-border h-fit">
                 <h3 className="text-xl font-bold mb-4 px-2">Course Lessons</h3>
                 <ul className="space-y-2">
                     {course.lessons.map((lesson, index) => (
                         <li key={lesson.id}>
                             <button
                                 onClick={() => setSelectedLesson(lesson)}
                                 className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors hover:bg-background ${
                                    selectedLesson.id === lesson.id ? 'bg-primary/20 text-primary' : ''
                                 }`}
                             >
                                 <span className="flex-grow pr-2">{index + 1}. {lesson.title}</span>
                             </button>
                         </li>
                     ))}
                 </ul>
             </div>
        </div>
    )
};