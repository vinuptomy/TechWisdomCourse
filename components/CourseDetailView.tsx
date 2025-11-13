import React, { useState, FC } from 'react';
import type { Course, Lesson } from '../types';
import { LockIcon, BackIcon } from './icons';

export const CourseDetailView: FC<{ course: Course; userPlan: 'free' | 'premium'; onBack: () => void }> = ({ course, userPlan, onBack }) => {
    const [selectedLesson, setSelectedLesson] = useState(course.lessons[0]);
    // FIX: Property 'isPremium' does not exist on type 'Lesson'. Changed to 'is_premium'.
    const canAccess = (lesson: Lesson) => userPlan === 'premium' || !lesson.is_premium;

    return (
        <div className="flex flex-col lg:flex-row gap-6">
             <div className="flex-grow">
                 <button onClick={onBack} className="mb-4 flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                     <BackIcon /> Back to Classroom
                 </button>
                <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 border border-border">
                    {canAccess(selectedLesson) ? (
                         <iframe
                            className="w-full h-full"
                            // FIX: Property 'videoId' does not exist on type 'Lesson'. Changed to 'video_id'.
                            src={`https://www.youtube.com/embed/${selectedLesson.video_id}`}
                            title={selectedLesson.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-surface text-center p-4">
                            <LockIcon className="w-16 h-16 text-secondary mb-4" />
                            <h3 className="text-xl font-bold">Premium Content</h3>
                            <p className="text-text-secondary">Upgrade your plan to unlock this lesson and all other premium content.</p>
                        </div>
                    )}
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
                                 className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                                    selectedLesson.id === lesson.id ? 'bg-primary/20 text-primary' : ''
                                 } ${
                                    canAccess(lesson) ? 'hover:bg-background' : 'text-text-secondary'
                                 }`}
                             >
                                 <span className="flex-grow pr-2">{index + 1}. {lesson.title}</span>
                                 {!canAccess(lesson) && <LockIcon className="w-5 h-5 text-secondary flex-shrink-0 ml-2" aria-label="Premium lesson"/>}
                             </button>
                         </li>
                     ))}
                 </ul>
             </div>
        </div>
    )
};