import React, { useState, useEffect, FC } from 'react';
import type { Course, Module, Chapter } from '../types';
import { getCourseDetails } from '../services/apiService';
import { BackIcon, DownloadIcon, ChevronDownIcon } from './icons';

const ModuleAccordion: FC<{ module: Module, onChapterSelect: (chapter: Chapter) => void, selectedChapterId: string | null }> = ({ module, onChapterSelect, selectedChapterId }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-surface hover:bg-background transition-colors"
            >
                <h4 className="font-bold text-lg text-text-primary">{module.title}</h4>
                <ChevronDownIcon className={`w-5 h-5 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                 <div className="p-4 pt-0">
                    <p className="text-sm text-text-secondary mb-3">{module.description}</p>
                    <ul className="space-y-2">
                        {module.chapters.map(chapter => (
                             <li key={chapter.id}>
                                <button
                                    onClick={() => onChapterSelect(chapter)}
                                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors hover:bg-background ${
                                       selectedChapterId === chapter.id ? 'bg-primary/20 text-primary' : ''
                                    }`}
                                >
                                    <span className="font-mono text-sm bg-background px-2 py-1 rounded">{chapter.position + 1}</span>
                                    <span className="flex-grow pr-2">{chapter.title}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export const CourseDetailView: FC<{ courseId: string; onBack: () => void }> = ({ courseId, onBack }) => {
    const [course, setCourse] = useState<Course | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const courseData = await getCourseDetails(courseId);
                setCourse(courseData);
                // Auto-select the first chapter of the first module, if available
                if (courseData.modules && courseData.modules.length > 0 && courseData.modules[0].chapters.length > 0) {
                    setSelectedChapter(courseData.modules[0].chapters[0]);
                }
            } catch (error) {
                console.error("Failed to fetch course details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [courseId]);

    if (loading) {
        return <div className="text-center text-text-secondary">Loading course content...</div>;
    }

    if (!course) {
        return <div className="text-center text-red-400">Could not load course. It might not exist.</div>;
    }
    
    const { modules = [] } = course;

    const renderContent = () => {
        if (!selectedChapter) {
            return (
                <div className="bg-surface p-6 rounded-xl border border-border flex-grow">
                    <h2 className="text-2xl font-bold mb-4">{course.title}</h2>
                    <h3 className="text-xl font-bold mb-4 mt-6">Syllabus</h3>
                    <div className="prose prose-invert max-w-none text-text-secondary" dangerouslySetInnerHTML={{ __html: course.syllabus || "<p>No syllabus provided.</p>" }} />
                </div>
            );
        }

        return (
            <div className="flex-grow">
                <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 border border-border">
                    {selectedChapter.video_url ? (
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${selectedChapter.video_url.split('v=')[1] || selectedChapter.video_url.split('/').pop()}`}
                            title={selectedChapter.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-background">
                            <p className="text-text-secondary">No video for this chapter.</p>
                        </div>
                    )}
                </div>
                <h2 className="text-2xl font-bold text-text-primary">{selectedChapter.title}</h2>
                <p className="text-text-secondary mt-2">{selectedChapter.description}</p>
                {selectedChapter.downloads && selectedChapter.downloads.length > 0 && (
                     <div className="mt-6">
                        <h4 className="font-bold text-lg mb-3">Downloads for this chapter:</h4>
                        <div className="space-y-3">
                        {selectedChapter.downloads.map(download => (
                            <a href={download.file_url} download key={download.id} className="bg-surface p-3 rounded-lg border border-border flex items-center justify-between gap-4 hover:border-primary transition-colors">
                                <div>
                                    <p className="font-semibold text-text-primary">{download.title}</p>
                                    <p className="text-sm text-text-secondary">{download.description}</p>
                                </div>
                                <DownloadIcon className="w-5 h-5 text-primary flex-shrink-0" />
                            </a>
                        ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <button onClick={onBack} className="mb-4 flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                <BackIcon /> Back to Courses
            </button>
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-2/3">
                    {renderContent()}
                </div>
                <div className="w-full lg:w-1/3 lg:flex-shrink-0 h-fit">
                     <div className="space-y-4">
                        <h3 className="text-xl font-bold text-text-primary">{course.title}</h3>
                        {modules.length > 0 ? (
                            modules.map(module => (
                                <ModuleAccordion 
                                    key={module.id} 
                                    module={module} 
                                    onChapterSelect={setSelectedChapter}
                                    selectedChapterId={selectedChapter?.id || null}
                                />
                            ))
                        ) : (
                            <div className="bg-surface p-4 rounded-xl border border-border">
                                <p className="text-text-secondary text-sm">No modules have been added to this course yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};