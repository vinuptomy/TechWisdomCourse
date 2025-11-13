import React, { useState, useEffect, FC } from 'react';
import type { Course, Chapter, Download } from '../types';
import { getCourseDetails } from '../services/apiService';
import { BackIcon, DownloadIcon } from './icons';

export const CourseDetailView: FC<{ courseId: string; onBack: () => void }> = ({ courseId, onBack }) => {
    const [course, setCourse] = useState<Course | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const { course: courseData, chapters: chaptersData } = await getCourseDetails(courseId);
                setCourse(courseData);
                setChapters(chaptersData);
                if (chaptersData.length > 0) {
                    setSelectedChapter(chaptersData[0]);
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

    const renderSyllabus = () => (
        <div className="bg-surface p-6 rounded-xl border border-border">
            <h3 className="text-xl font-bold mb-4">Syllabus</h3>
            <p className="text-text-secondary whitespace-pre-wrap">{course.syllabus || "No syllabus provided."}</p>
        </div>
    );

    const renderChapterContent = () => {
        if (!selectedChapter) {
            return <div className="flex-grow">{renderSyllabus()}</div>;
        }

        return (
            <div className="flex-grow">
                <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 border border-border">
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${selectedChapter.video_url}`}
                        title={selectedChapter.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
                <h2 className="text-2xl font-bold text-text-primary">{selectedChapter.title}</h2>
                <p className="text-text-secondary mt-2">{selectedChapter.description}</p>
                {selectedChapter.downloads.length > 0 && (
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
            <div className="flex flex-col lg:flex-row gap-6">
                {chapters.length > 0 ? renderChapterContent() : renderSyllabus()}
                <div className="w-full lg:w-80 lg:flex-shrink-0 bg-surface rounded-xl p-4 border border-border h-fit">
                    <h3 className="text-xl font-bold mb-4 px-2">{course.title}</h3>
                    {chapters.length > 0 ? (
                        <ul className="space-y-2">
                            {chapters.map((chapter, index) => (
                                <li key={chapter.id}>
                                    <button
                                        onClick={() => setSelectedChapter(chapter)}
                                        className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors hover:bg-background ${
                                           selectedChapter?.id === chapter.id ? 'bg-primary/20 text-primary' : ''
                                        }`}
                                    >
                                        <span className="flex-grow pr-2">{chapter.position + 1}. {chapter.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="px-2 text-text-secondary text-sm">No chapters have been added to this course yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
