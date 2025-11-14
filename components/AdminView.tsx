import React, { useState, useEffect, FC, FormEvent } from 'react';
import type { UserProfile, Community, Download, Course, Classroom, Module, Chapter } from '../types';
import { 
    getCommunities, createCommunity, updateCommunity, deleteCommunity,
    createDownload, updateDownload, deleteDownload, getDownloads, getAllDownloads,
    getCourses, createCourse, updateCourse, deleteCourse, getCourseDetails, 
    createModule, updateModule, deleteModule, createChapter, updateChapter, deleteChapter,
    createClassroom, getClassrooms,
    linkDownloadToChapter, unlinkDownloadFromChapter, getChapterDownloads
} from '../services/apiService';
import { useDebounce } from '../hooks/useDebounce';
import { SearchIcon } from './icons';
import { SpinnerIcon, CommunityIcon, UsersIcon, SubscriptionIcon, BackIcon, DownloadIcon, ClassroomFilledIcon, ChevronDownIcon, ClassroomIcon } from './icons';
import { supabase } from '../services/supabaseClient';

type AdminSubView = 'dashboard' | 'community' | 'course' | 'classroom' | 'user' | 'subscription' | 'downloads';

// --- Reusable Modal Component ---
const Modal: FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title: string }> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border">
                    <h3 className="font-bold text-lg">{title}</h3>
                </header>
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
};

// --- Course Management View ---
const CourseAdminView: FC<{ onBack: () => void }> = ({ onBack }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const data = await getCourses(debouncedSearchTerm);
            setCourses(data);
        } catch (error) { console.error("Failed to fetch courses", error); }
        setLoading(false);
    };

    useEffect(() => { fetchCourses(); }, [debouncedSearchTerm]);
    
    const handleCourseCreated = (newCourse: Course) => {
        setCourses(prev => [newCourse, ...prev]);
        setCreateModalOpen(false);
        setSelectedCourse(newCourse); // Automatically open the new course for editing
    };

    const handleDelete = async (courseId: string) => {
        if (!confirm('Are you sure? This will delete the course and all its modules and chapters.')) return;
        try {
            await deleteCourse(courseId);
            fetchCourses();
        } catch (error: any) {
            alert(`Failed to delete: ${error.message}`);
        }
    };

    if (selectedCourse) {
        return <CourseEditor courseId={selectedCourse.id} onBack={() => { setSelectedCourse(null); fetchCourses(); }} />;
    }

    return (
        <div>
            <button onClick={onBack} className="mb-6 flex items-center gap-2 text-text-secondary hover:text-primary"><BackIcon /> Back to Admin Dashboard</button>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Course Management</h2>
                <button onClick={() => setCreateModalOpen(true)} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg">Create New Course</button>
            </div>
            <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Course">
                <CreateCourseForm onCourseCreated={handleCourseCreated} />
            </Modal>
            <div className="mb-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg p-3 pl-10 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                        <SearchIcon />
                    </div>
                </div>
            </div>
            <div className="bg-surface p-6 rounded-xl border border-border">
                {loading ? <p>Loading courses...</p> : courses.length === 0 ? (
                    <p className="text-center text-text-secondary">No courses found{debouncedSearchTerm ? ` matching "${debouncedSearchTerm}"` : ''}</p>
                ) : (
                    courses.map(course => (
                        <div key={course.id} className="p-3 bg-background rounded-lg flex items-center justify-between mb-2">
                            <div className="flex-1">
                                <span className="font-semibold">{course.title}</span>
                                {course.description && <p className="text-xs text-text-secondary line-clamp-1">{course.description}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`capitalize px-2 py-1 rounded-md text-xs ${course.is_premium ? 'bg-secondary/20 text-secondary' : 'bg-gray-600/20 text-gray-300'}`}>{course.is_premium ? 'Premium' : 'Free'}</span>
                                <button onClick={() => setSelectedCourse(course)} className="text-sm px-3 py-1 bg-primary text-white rounded hover:bg-primary/90">Edit</button>
                                <button onClick={() => handleDelete(course.id)} className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const CreateCourseForm: FC<{ onCourseCreated: (course: Course) => void }> = ({ onCourseCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [syllabus, setSyllabus] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [communityId, setCommunityId] = useState<string | null>(null);
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [communities, setCommunities] = useState<Community[]>([]);
    
    useEffect(() => {
        getCommunities()
            .then(setCommunities)
            .catch(err => {
                console.error("Failed to fetch communities for course form:", err);
                setError("Could not load communities. Please try again later.");
            });
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!title || !description || !thumbnail) { setError('Title, description and thumbnail are required.'); return; }
        setLoading(true); setError('');
        try {
            const newCourse = await createCourse({ title, description, syllabus, is_premium: isPremium, primary_community_id: communityId }, thumbnail);
            onCourseCreated(newCourse);
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Course Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3" />
            <textarea placeholder="Short Description" value={description} onChange={e => setDescription(e.target.value)} required rows={3} className="w-full bg-background border border-border rounded-lg p-3" />
            <textarea placeholder="Syllabus (Markdown or HTML supported)" value={syllabus} onChange={e => setSyllabus(e.target.value)} rows={6} className="w-full bg-background border border-border rounded-lg p-3" />
            <select value={communityId || ''} onChange={e => setCommunityId(e.target.value || null)} className="w-full bg-background border border-border rounded-lg p-3">
                <option value="">Link a Primary Community (Optional)</option>
                {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="file" accept="image/*" onChange={e => e.target.files && setThumbnail(e.target.files[0])} required className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90" />
            <div className="flex items-center gap-2">
                <input type="checkbox" id="isPremiumCourse" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} />
                <label htmlFor="isPremiumCourse">Premium Course</label>
            </div>
            {error && <p className="text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-semibold rounded-lg disabled:bg-gray-500">{loading ? 'Creating...' : 'Create Course'}</button>
        </form>
    );
};

const CourseEditor: FC<{ courseId: string; onBack: () => void }> = ({ courseId, onBack }) => {
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModuleModalOpen, setModuleModalOpen] = useState(false);
    const [isChapterModalOpen, setChapterModalOpen] = useState(false);
    const [isEditCourseModalOpen, setEditCourseModalOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [selectedChapterForDownloads, setSelectedChapterForDownloads] = useState<string | null>(null);

    const fetchCourse = async () => {
        setLoading(true);
        try {
            const data = await getCourseDetails(courseId);
            setCourse(data);
        } catch (error) { console.error("Failed to fetch course details", error); }
        setLoading(false);
    };

    useEffect(() => { fetchCourse(); }, [courseId]);
    
    const handleModuleCreated = (newModule: Module) => {
        setCourse(prev => prev ? ({ ...prev, modules: [...(prev.modules || []), newModule] }) : null);
        setModuleModalOpen(false);
        fetchCourse();
    };

    const handleModuleUpdated = () => {
        setEditingModule(null);
        fetchCourse();
    };

    const handleModuleDeleted = async (moduleId: string) => {
        if (!confirm('Are you sure? This will delete all chapters in this module.')) return;
        try {
            await deleteModule(moduleId);
            fetchCourse();
        } catch (error: any) {
            alert(`Failed to delete: ${error.message}`);
        }
    };
    
    const handleChapterCreated = (newChapter: Chapter) => {
        console.log('handleChapterCreated called with chapter:', newChapter);
        if (!newChapter || !newChapter.id) {
            console.error('Invalid chapter data received:', newChapter);
            alert('Chapter was created but there was an error. Please refresh the page.');
            return;
        }
        // Close chapter creation modal first
        setChapterModalOpen(false);
        setSelectedModuleId(null);
        setEditingChapter(null);
        // Refresh course data to get latest from server
        fetchCourse();
        // Automatically open downloads modal for new chapter so user can link downloads immediately
        setTimeout(() => {
            console.log('Opening downloads modal for chapter:', newChapter.id);
            setSelectedChapterForDownloads(newChapter.id);
        }, 500); // Increased delay to ensure course data is refreshed
    };

    const handleChapterUpdated = () => {
        setEditingChapter(null);
        fetchCourse();
    };

    const handleChapterDeleted = async (chapterId: string) => {
        if (!confirm('Are you sure you want to delete this chapter?')) return;
        try {
            await deleteChapter(chapterId);
            fetchCourse();
        } catch (error: any) {
            alert(`Failed to delete: ${error.message}`);
        }
    };

    const handleCourseUpdated = () => {
        setEditCourseModalOpen(false);
        fetchCourse();
    };

    if (loading) return <p>Loading course editor...</p>;
    if (!course) return <p>Course not found.</p>;

    return (
        <div>
            <button onClick={onBack} className="mb-6 flex items-center gap-2 text-text-secondary hover:text-primary"><BackIcon /> Back to Courses List</button>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{course.title}</h2>
                <button onClick={() => setEditCourseModalOpen(true)} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg">Edit Course</button>
            </div>
            <div className="bg-surface p-6 rounded-xl border border-border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Modules & Chapters</h3>
                    <button onClick={() => { setEditingModule(null); setModuleModalOpen(true); }} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg">Add Module</button>
                </div>
                <div className="space-y-4">
                    {(course.modules || [])
                        .sort((a, b) => (a.position || 0) - (b.position || 0))
                        .map((module, moduleIndex) => (
                        <div key={module.id} className="p-4 bg-background rounded-lg border border-border">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-text-secondary font-mono bg-surface px-2 py-0.5 rounded border border-border">
                                            Module #{moduleIndex + 1} (Pos: {module.position || 0})
                                        </span>
                                        <p className="font-bold text-text-primary">{module.title}</p>
                                    </div>
                                    {module.description && <p className="text-sm text-text-secondary mt-1">{module.description}</p>}
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button 
                                        onClick={() => { setEditingModule(module); setModuleModalOpen(true); }} 
                                        className="text-sm px-3 py-1.5 bg-primary text-white rounded hover:bg-primary/90 font-medium transition-colors"
                                        title="Edit module details"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button 
                                        onClick={() => { 
                                            setEditingChapter(null);
                                            setSelectedModuleId(module.id); 
                                            setChapterModalOpen(true);
                                        }} 
                                        className="text-sm px-3 py-1.5 bg-secondary text-white rounded hover:bg-secondary/90 font-medium transition-colors"
                                        title="Add a new chapter to this module"
                                    >
                                        ➕ Add Chapter
                                    </button>
                                    <button 
                                        onClick={() => handleModuleDeleted(module.id)} 
                                        className="text-sm px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors"
                                        title="Delete this module"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                            <ul className="mt-2 space-y-2 pl-4">
                                {module.chapters
                                    .sort((a, b) => (a.position || 0) - (b.position || 0))
                                    .map((chapter, index) => (
                                    <li key={chapter.id} className="flex justify-between items-center p-3 bg-surface rounded border border-border hover:border-primary/50 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-text-secondary font-mono bg-background px-2 py-0.5 rounded border border-border">
                                                    #{index + 1} (Pos: {chapter.position || 0})
                                                </span>
                                                <span className="text-sm font-semibold text-text-primary">{chapter.title}</span>
                                            </div>
                                            {chapter.description && <p className="text-xs text-text-secondary mt-1">{chapter.description}</p>}
                                            {chapter.downloads && chapter.downloads.length > 0 && (
                                                <p className="text-xs text-secondary mt-1 font-medium">📎 {chapter.downloads.length} download(s) linked</p>
                                            )}
                                            {(!chapter.downloads || chapter.downloads.length === 0) && (
                                                <p className="text-xs text-text-secondary mt-1 italic">No downloads linked yet</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button 
                                                onClick={() => { 
                                                    setEditingChapter(chapter); 
                                                    setSelectedModuleId(module.id);
                                                    setChapterModalOpen(true); 
                                                }} 
                                                className="text-xs px-3 py-1.5 bg-primary text-white rounded hover:bg-primary/90 font-medium transition-colors"
                                                title="Edit chapter details"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button 
                                                onClick={() => { 
                                                    setSelectedChapterForDownloads(chapter.id); 
                                                }} 
                                                className="text-xs px-3 py-1.5 bg-secondary text-white rounded hover:bg-secondary/90 font-medium transition-colors"
                                                title="Manage downloadable artifacts"
                                            >
                                                📎 Downloads ({chapter.downloads?.length || 0})
                                            </button>
                                            <button 
                                                onClick={() => handleChapterDeleted(chapter.id)} 
                                                className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors"
                                                title="Delete chapter"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            
            <Modal isOpen={isEditCourseModalOpen} onClose={() => setEditCourseModalOpen(false)} title="Edit Course">
                <EditCourseForm course={course} onCourseUpdated={handleCourseUpdated} />
            </Modal>
            
            <Modal isOpen={isModuleModalOpen} onClose={() => { setModuleModalOpen(false); setEditingModule(null); }} title={editingModule ? "Edit Module" : "Add New Module"}>
                <CreateModuleForm 
                    courseId={course.id} 
                    position={editingModule?.position || (course.modules || []).length} 
                    onModuleCreated={handleModuleCreated} 
                    editing={editingModule} 
                    onModuleUpdated={handleModuleUpdated}
                    onClose={() => { setModuleModalOpen(false); setEditingModule(null); }}
                />
            </Modal>
            
            <Modal isOpen={isChapterModalOpen} onClose={() => { 
                setChapterModalOpen(false); 
                setEditingChapter(null); 
                setSelectedModuleId(null); 
            }} title={editingChapter ? "Edit Chapter" : "Add New Chapter"}>
                {(selectedModuleId || editingChapter?.module_id) ? (
                    <CreateChapterForm 
                        moduleId={selectedModuleId || editingChapter?.module_id || ''} 
                        position={editingChapter?.position ?? (course.modules?.find(m => m.id === (selectedModuleId || editingChapter?.module_id))?.chapters.length || 0)} 
                        onChapterCreated={handleChapterCreated} 
                        editing={editingChapter} 
                        onChapterUpdated={() => {
                            handleChapterUpdated();
                            setChapterModalOpen(false);
                            setEditingChapter(null);
                            setSelectedModuleId(null);
                        }}
                        onClose={() => {
                            setChapterModalOpen(false);
                            setEditingChapter(null);
                            setSelectedModuleId(null);
                        }}
                    />
                ) : (
                    <div className="text-red-400">
                        <p>Error: Module ID is missing. Please close and try again.</p>
                        <p className="text-xs mt-2">Selected Module ID: {selectedModuleId || 'null'}</p>
                        <p className="text-xs">Available modules: {course.modules?.map(m => m.id).join(', ') || 'none'}</p>
                    </div>
                )}
            </Modal>

            {selectedChapterForDownloads && (
                <ChapterDownloadsModal chapterId={selectedChapterForDownloads} onClose={() => setSelectedChapterForDownloads(null)} onUpdated={fetchCourse} />
            )}
        </div>
    );
};

const CreateModuleForm: FC<{ 
    courseId: string, 
    position: number, 
    onModuleCreated: (module: Module) => void,
    editing?: Module | null,
    onModuleUpdated?: () => void,
    onClose: () => void
}> = ({ courseId, position, onModuleCreated, editing, onModuleUpdated, onClose }) => {
    const [title, setTitle] = useState(editing?.title || '');
    const [description, setDescription] = useState(editing?.description || '');
    const [positionValue, setPositionValue] = useState<number>(editing?.position ?? position);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editing) {
            setTitle(editing.title);
            setDescription(editing.description || '');
            setPositionValue(editing.position);
        } else {
            setTitle('');
            setDescription('');
            setPositionValue(position);
        }
    }, [editing, position]);
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (editing) {
                await updateModule(editing.id, { title, description, position: positionValue });
                onModuleUpdated?.();
            } else {
                const newModule = await createModule({ course_id: courseId, title, description, position: positionValue });
                onModuleCreated(newModule);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Module Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" />
            <textarea placeholder="Module Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" />
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Position (Sort Order)</label>
                <input 
                    type="number" 
                    min="0"
                    value={positionValue} 
                    onChange={e => setPositionValue(parseInt(e.target.value) || 0)} 
                    required
                    className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" 
                />
                <p className="text-xs text-text-secondary mt-1">Lower numbers appear first. Current position: {positionValue}</p>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-primary text-white rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors">
                    {loading ? 'Saving...' : (editing ? 'Update Module' : 'Add Module')}
                </button>
            </div>
        </form>
    );
};

const CreateChapterForm: FC<{ 
    moduleId: string, 
    position: number, 
    onChapterCreated: (chapter: Chapter) => void,
    editing?: Chapter | null,
    onChapterUpdated?: () => void,
    onClose: () => void
}> = ({ moduleId, position, onChapterCreated, editing, onChapterUpdated, onClose }) => {
    const [title, setTitle] = useState(editing?.title || '');
    const [description, setDescription] = useState(editing?.description || '');
    const [videoUrl, setVideoUrl] = useState(editing?.video_url || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editing) {
            setTitle(editing.title);
            setDescription(editing.description || '');
            setVideoUrl(editing.video_url || '');
        } else {
            setTitle('');
            setDescription('');
            setVideoUrl('');
        }
    }, [editing]);

    const [positionValue, setPositionValue] = useState<number>(editing?.position ?? position);

    useEffect(() => {
        if (editing) {
            setTitle(editing.title);
            setDescription(editing.description || '');
            setVideoUrl(editing.video_url || '');
            setPositionValue(editing.position);
        } else {
            setTitle('');
            setDescription('');
            setVideoUrl('');
            setPositionValue(position);
        }
    }, [editing, position]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) {
            setError('Chapter title is required');
            return;
        }
        
        if (!moduleId) {
            setError('Module ID is missing. Please try again.');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            if (editing) {
                await updateChapter(editing.id, { title, description, video_url: videoUrl, position: positionValue });
                onChapterUpdated?.();
            } else {
                if (!videoUrl.trim()) {
                    setError('Video URL is required for new chapters');
                    setLoading(false);
                    return;
                }
                const newChapter = await createChapter({ 
                    module_id: moduleId, 
                    title: title.trim(), 
                    description: description.trim() || '', 
                    video_url: videoUrl.trim(), 
                    position: positionValue 
                });
                console.log('Chapter created, calling onChapterCreated with:', newChapter);
                onChapterCreated(newChapter);
            }
        } catch(err: any) {
            console.error('Error in chapter form:', err);
            setError(err.message || 'Failed to save chapter. Please check console for details.');
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input 
                type="text" 
                placeholder="Chapter Title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
                className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" 
            />
            <textarea 
                placeholder="Chapter Description" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows={3} 
                className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" 
            />
            <input 
                type="text" 
                placeholder="YouTube Video URL or ID" 
                value={videoUrl} 
                onChange={e => setVideoUrl(e.target.value)} 
                required={!editing} 
                className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" 
            />
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Position (Sort Order)</label>
                <input 
                    type="number" 
                    min="0"
                    value={positionValue} 
                    onChange={e => setPositionValue(parseInt(e.target.value) || 0)} 
                    required
                    className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" 
                />
                <p className="text-xs text-text-secondary mt-1">Lower numbers appear first. Current position: {positionValue}</p>
            </div>
            
            {!editing && (
                <div className="bg-secondary/20 border-2 border-secondary/50 rounded-lg p-4">
                    <p className="text-sm text-text-primary font-medium mb-2">
                        📎 <strong>About Downloads:</strong>
                    </p>
                    <p className="text-sm text-text-secondary">
                        Downloads are linked <strong>after</strong> creating the chapter. Once you click "Add Chapter", a downloads management window will automatically open where you can link PDFs, ZIP files, Word documents, and other downloadable artifacts to this chapter.
                    </p>
                    <p className="text-xs text-text-secondary mt-2 italic">
                        💡 Tip: You can also manage downloads later by clicking the "Downloads" button next to any chapter in the list.
                    </p>
                </div>
            )}
            
            {editing && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                    <p className="text-sm text-text-secondary">
                        <strong className="text-text-primary">📎 Downloads:</strong> To manage downloadable artifacts for this chapter, close this form and click the <strong>"Downloads"</strong> button next to this chapter in the list.
                    </p>
                </div>
            )}
            
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 py-3 bg-primary text-white rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                    {loading ? 'Saving...' : (editing ? 'Update Chapter' : 'Add Chapter')}
                </button>
            </div>
        </form>
    );
};

// --- Edit Course Form ---
const EditCourseForm: FC<{ course: Course; onCourseUpdated: () => void }> = ({ course, onCourseUpdated }) => {
    const [title, setTitle] = useState(course.title);
    const [description, setDescription] = useState(course.description);
    const [syllabus, setSyllabus] = useState(course.syllabus || '');
    const [isPremium, setIsPremium] = useState(course.is_premium);
    const [communityId, setCommunityId] = useState<string | null>(course.primary_community_id || null);
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [communities, setCommunities] = useState<Community[]>([]);
    
    useEffect(() => {
        getCommunities()
            .then(setCommunities)
            .catch(err => {
                console.error("Failed to fetch communities for course form:", err);
                setError("Could not load communities. Please try again later.");
            });
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!title || !description) { setError('Title and description are required.'); return; }
        setLoading(true); setError('');
        try {
            await updateCourse(course.id, { title, description, syllabus, is_premium: isPremium, primary_community_id: communityId }, thumbnail || undefined);
            onCourseUpdated();
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Course Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" />
            <textarea placeholder="Short Description" value={description} onChange={e => setDescription(e.target.value)} required rows={3} className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" />
            <textarea placeholder="Syllabus (Markdown or HTML supported)" value={syllabus} onChange={e => setSyllabus(e.target.value)} rows={6} className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" />
            <select value={communityId || ''} onChange={e => setCommunityId(e.target.value || null)} className="w-full bg-background border border-border rounded-lg p-3 text-text-primary">
                <option value="">Link a Primary Community (Optional)</option>
                {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="file" accept="image/*" onChange={e => e.target.files && setThumbnail(e.target.files[0])} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90" />
            <p className="text-xs text-text-secondary">Leave empty to keep current thumbnail</p>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="isPremiumCourseEdit" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} />
                <label htmlFor="isPremiumCourseEdit">Premium Course</label>
            </div>
            {error && <p className="text-red-400">{error}</p>}
            <div className="flex gap-2">
                <button type="button" onClick={onCourseUpdated} className="flex-1 py-3 bg-gray-600 text-white font-semibold rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-primary text-white font-semibold rounded-lg disabled:bg-gray-500">{loading ? 'Updating...' : 'Update Course'}</button>
            </div>
        </form>
    );
};

// --- Chapter Downloads Modal ---
const ChapterDownloadsModal: FC<{ chapterId: string; onClose: () => void; onUpdated: () => void }> = ({ chapterId, onClose, onUpdated }) => {
    const [linkedDownloads, setLinkedDownloads] = useState<Download[]>([]);
    const [allDownloads, setAllDownloads] = useState<Download[]>([]);
    const [loading, setLoading] = useState(true);
    const [chapterTitle, setChapterTitle] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [downloads, all] = await Promise.all([
                    getChapterDownloads(chapterId),
                    getAllDownloads()
                ]);
                setLinkedDownloads(downloads);
                setAllDownloads(all);
                
                // Get chapter title
                const { data: chapterData } = await supabase
                    .from('chapters')
                    .select('title')
                    .eq('id', chapterId)
                    .single();
                if (chapterData) setChapterTitle(chapterData.title);
            } catch (error) {
                console.error("Failed to fetch downloads:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [chapterId]);

    const handleLink = async (downloadId: string) => {
        try {
            setLoading(true);
            await linkDownloadToChapter(chapterId, downloadId);
            const downloads = await getChapterDownloads(chapterId);
            setLinkedDownloads(downloads);
            onUpdated(); // Refresh course data
        } catch (error: any) {
            console.error('Failed to link download:', error);
            alert(`Failed to link download: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlink = async (downloadId: string) => {
        if (!confirm('Are you sure you want to unlink this download from the chapter?')) return;
        try {
            setLoading(true);
            await unlinkDownloadFromChapter(chapterId, downloadId);
            const downloads = await getChapterDownloads(chapterId);
            setLinkedDownloads(downloads);
            onUpdated(); // Refresh course data
        } catch (error: any) {
            console.error('Failed to unlink download:', error);
            alert(`Failed to unlink download: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const linkedIds = new Set(linkedDownloads.map(d => d.id));
    const availableDownloads = allDownloads.filter(d => !linkedIds.has(d.id));

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl border border-border max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-text-primary">📎 Link Downloads to Chapter</h3>
                        <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl leading-none">✕</button>
                    </div>
                    <p className="text-sm text-text-secondary mb-1">
                        <strong>Chapter:</strong> {chapterTitle || 'Loading...'}
                    </p>
                    <p className="text-xs text-text-secondary italic">
                        Select downloads from the list below to link them to this chapter. Students will be able to download these files when viewing this chapter.
                    </p>
                </header>
                <main className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold mb-3">Linked Downloads ({linkedDownloads.length})</h4>
                                {linkedDownloads.length === 0 ? (
                                    <p className="text-text-secondary text-sm">No downloads linked to this chapter</p>
                                ) : (
                                    <div className="space-y-2">
                                        {linkedDownloads.map(download => (
                                            <div key={download.id} className="p-3 bg-background rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{download.title}</p>
                                                    {download.description && <p className="text-sm text-text-secondary">{download.description}</p>}
                                                </div>
                                                <button onClick={() => handleUnlink(download.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded">Unlink</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold mb-3">Available Downloads ({availableDownloads.length})</h4>
                                {availableDownloads.length === 0 ? (
                                    <p className="text-text-secondary text-sm">All downloads are linked to this chapter</p>
                                ) : (
                                    <div className="space-y-2">
                                        {availableDownloads.map(download => (
                                            <div key={download.id} className="p-3 bg-background rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{download.title}</p>
                                                    {download.description && <p className="text-sm text-text-secondary">{download.description}</p>}
                                                </div>
                                                <button onClick={() => handleLink(download.id)} className="px-3 py-1 text-sm bg-primary text-white rounded">Link</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- Community Management View ---
const CommunityAdminView: FC<{ onBack: () => void }> = ({ onBack }) => {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

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
    useEffect(() => { fetchCommunities(); }, []);

    const filteredCommunities = communities.filter(c => 
        c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this community?')) return;
        try {
            await deleteCommunity(id);
            fetchCommunities();
        } catch (error: any) {
            alert(`Failed to delete: ${error.message}`);
        }
    };

    const CreateCommunityForm: FC<{ onCommunityCreated: () => void; editing?: Community | null }> = ({ onCommunityCreated, editing }) => {
        const [name, setName] = useState(editing?.name || '');
        const [description, setDescription] = useState(editing?.description || '');
        const [isPremium, setIsPremium] = useState(editing?.is_premium || false);
        const [imageFile, setImageFile] = useState<File | null>(null);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState('');

        useEffect(() => {
            if (editing) {
                setName(editing.name);
                setDescription(editing.description);
                setIsPremium(editing.is_premium);
            } else {
                setName('');
                setDescription('');
                setIsPremium(false);
                setImageFile(null);
            }
        }, [editing]);

        const handleSubmit = async (e: FormEvent) => {
            e.preventDefault();
            if (!name || !description) {
                setError('Name and description are required.'); return;
            }
            if (!editing && !imageFile) {
                setError('Image is required for new communities.'); return;
            }
            setLoading(true); setError('');
            try {
                if (editing) {
                    await updateCommunity(editing.id, { name, description, is_premium: isPremium }, imageFile || undefined);
                } else {
                    await createCommunity({ name, description, is_premium: isPremium }, imageFile!);
                }
                setName(''); setDescription(''); setIsPremium(false); setImageFile(null);
                setEditingCommunity(null);
                (e.target as HTMLFormElement).reset();
                onCommunityCreated();
            } catch (err: any) { setError(err.message); } 
            finally { setLoading(false); }
        };

        return (
            <div className="bg-surface p-6 rounded-xl border border-border">
                <h3 className="text-xl font-bold mb-4">{editing ? 'Edit Community' : 'Create New Community'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Community Name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" />
                    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" />
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Community Image {!editing && '(Required)'}</label>
                        <input type="file" accept="image/*" onChange={e => e.target.files && setImageFile(e.target.files[0])} required={!editing} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90" />
                        {editing && <p className="text-xs text-text-secondary mt-1">Leave empty to keep current image</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isPremium" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="isPremium">Premium Community</label>
                    </div>
                    {error && <p className="text-red-400">{error}</p>}
                    <div className="flex gap-2">
                        {editing && (
                            <button type="button" onClick={() => setEditingCommunity(null)} className="flex-1 py-3 bg-gray-600 text-white font-semibold rounded-lg">Cancel</button>
                        )}
                        <button type="submit" disabled={loading} className={`${editing ? 'flex-1' : 'w-full'} py-3 bg-primary text-white font-semibold rounded-lg disabled:bg-gray-500`}>
                            {loading ? <SpinnerIcon className="animate-spin mx-auto" /> : (editing ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    return (
        <div>
            <button onClick={onBack} className="mb-6 flex items-center gap-2 text-text-secondary hover:text-primary"><BackIcon /> Back to Admin Dashboard</button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <CreateCommunityForm onCommunityCreated={fetchCommunities} editing={editingCommunity} />
                </div>
                <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-border">
                    <div className="mb-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search communities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg p-3 pl-10 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                                <SearchIcon />
                            </div>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold mb-4">Existing Communities ({filteredCommunities.length})</h3>
                    {loading ? <p>Loading...</p> : (
                        <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {filteredCommunities.map(c => (
                                <li key={c.id} className="p-3 bg-background rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-md object-cover" />
                                        <div>
                                            <span className="font-semibold">{c.name}</span>
                                            <p className="text-xs text-text-secondary line-clamp-1">{c.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`capitalize px-2 py-1 rounded-md text-xs ${c.is_premium ? 'bg-secondary/20 text-secondary' : 'bg-gray-600/20 text-gray-300'}`}>{c.is_premium ? 'Premium' : 'Free'}</span>
                                        <button onClick={() => setEditingCommunity(c)} className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90">Edit</button>
                                        <button onClick={() => handleDelete(c.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Classroom Management View ---
const ClassroomAdminView: FC<{ onBack: () => void }> = ({ onBack }) => {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [classroomsData, coursesData, communitiesData] = await Promise.all([
                getClassrooms(),
                getCourses(),
                getCommunities()
            ]);
            setClassrooms(classroomsData);
            setCourses(coursesData);
            setCommunities(communitiesData);
        } catch (error) {
            console.error("Failed to fetch classroom admin data", error);
        }
        setLoading(false);
    };
    useEffect(() => { fetchData(); }, []);

    const CreateClassroomForm: FC<{ onClassroomCreated: () => void }> = ({ onClassroomCreated }) => {
        const [name, setName] = useState('');
        const [description, setDescription] = useState('');
        const [isPremium, setIsPremium] = useState(false);
        const [courseId, setCourseId] = useState('');
        const [communityId, setCommunityId] = useState('');
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState('');

        const handleSubmit = async (e: FormEvent) => {
            e.preventDefault();
            if (!name || !description || !courseId || !communityId) {
                setError('All fields are required.'); return;
            }
            setLoading(true); setError('');
            try {
                await createClassroom({ name, description, is_premium: isPremium, course_id: courseId, primary_community_id: communityId });
                setName(''); setDescription(''); setIsPremium(false); setCourseId(''); setCommunityId('');
                onClassroomCreated();
            } catch (err: any) { setError(err.message); }
            finally { setLoading(false); }
        };

        return (
            <div className="bg-surface p-6 rounded-xl border border-border">
                <h3 className="text-xl font-bold mb-4">Create New Classroom</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Classroom Name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3" />
                    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required rows={3} className="w-full bg-background border border-border rounded-lg p-3" />
                    <select value={courseId} onChange={e => setCourseId(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3">
                        <option value="">Select a Course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <select value={communityId} onChange={e => setCommunityId(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3">
                        <option value="">Select a Primary Community</option>
                        {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isPremiumClassroom" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="isPremiumClassroom">Premium Classroom</label>
                    </div>
                    {error && <p className="text-red-400">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-semibold rounded-lg disabled:bg-gray-500">
                        {loading ? <SpinnerIcon className="animate-spin mx-auto" /> : 'Create Classroom'}
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div>
            <button onClick={onBack} className="mb-6 flex items-center gap-2 text-text-secondary hover:text-primary"><BackIcon /> Back to Admin Dashboard</button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1"><CreateClassroomForm onClassroomCreated={fetchData} /></div>
                <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-border">
                    <h3 className="text-xl font-bold mb-4">Existing Classrooms ({classrooms.length})</h3>
                    {loading ? <p>Loading...</p> : (
                        <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {classrooms.map(c => (
                                <li key={c.id} className="p-3 bg-background rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{c.name}</p>
                                        <p className="text-xs text-text-secondary">Course: {c.course_title}</p>
                                    </div>
                                    <span className={`capitalize px-2 py-1 rounded-md text-xs ${c.is_premium ? 'bg-secondary/20 text-secondary' : 'bg-gray-600/20 text-gray-300'}`}>{c.is_premium ? 'Premium' : 'Free'}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Downloads Management View ---
const DownloadsAdminView: FC<{ onBack: () => void }> = ({ onBack }) => {
    const [downloads, setDownloads] = useState<Download[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingDownload, setEditingDownload] = useState<Download | null>(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const fetchDownloads = async () => {
        setLoading(true);
        try {
            const data = await getDownloads();
            setDownloads(data);
        } catch (error) { console.error("Failed to fetch downloads", error); }
        setLoading(false);
    };
    useEffect(() => { fetchDownloads(); }, []);

    const filteredDownloads = downloads.filter(d => 
        d.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    );

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this download?')) return;
        try {
            await deleteDownload(id);
            fetchDownloads();
        } catch (error: any) {
            alert(`Failed to delete: ${error.message}`);
        }
    };

    const CreateDownloadForm: FC<{ onDownloadCreated: () => void; editing?: Download | null }> = ({ onDownloadCreated, editing }) => {
        const [title, setTitle] = useState(editing?.title || '');
        const [description, setDescription] = useState(editing?.description || '');
        const [isPremium, setIsPremium] = useState(editing?.is_premium || false);
        const [file, setFile] = useState<File | null>(null);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState('');

        useEffect(() => {
            if (editing) {
                setTitle(editing.title);
                setDescription(editing.description || '');
                setIsPremium(editing.is_premium);
            } else {
                setTitle('');
                setDescription('');
                setIsPremium(false);
                setFile(null);
            }
        }, [editing]);

        const handleSubmit = async (e: FormEvent) => {
            e.preventDefault();
            if (!title || !description) { setError('Title and description are required.'); return; }
            if (!editing && !file) { setError('File is required for new downloads.'); return; }
            setLoading(true); setError('');
            try {
                if (editing) {
                    await updateDownload(editing.id, { title, description, is_premium: isPremium }, file || undefined);
                } else {
                    await createDownload({ title, description, is_premium: isPremium }, file!);
                }
                setTitle(''); setDescription(''); setIsPremium(false); setFile(null);
                setEditingDownload(null);
                (e.target as HTMLFormElement).reset();
                onDownloadCreated();
            } catch (err: any) { setError(err.message); } 
            finally { setLoading(false); }
        };

        return (
            <div className="bg-surface p-6 rounded-xl border border-border">
                <h3 className="text-xl font-bold mb-4">{editing ? 'Edit Download' : 'Add New Download'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Download Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" />
                    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required rows={3} className="w-full bg-background border border-border rounded-lg p-3 text-text-primary" />
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">File {!editing && '(Required)'}</label>
                        <input type="file" onChange={e => e.target.files && setFile(e.target.files[0])} required={!editing} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90" />
                        {editing && <p className="text-xs text-text-secondary mt-1">Leave empty to keep current file</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isPremiumDownload" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="isPremiumDownload">Premium Download</label>
                    </div>
                    {error && <p className="text-red-400">{error}</p>}
                    <div className="flex gap-2">
                        {editing && (
                            <button type="button" onClick={() => setEditingDownload(null)} className="flex-1 py-3 bg-gray-600 text-white font-semibold rounded-lg">Cancel</button>
                        )}
                        <button type="submit" disabled={loading} className={`${editing ? 'flex-1' : 'w-full'} py-3 bg-primary text-white font-semibold rounded-lg disabled:bg-gray-500`}>
                            {loading ? <SpinnerIcon className="animate-spin mx-auto" /> : (editing ? 'Update' : 'Add Download')}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    return (
        <div>
            <button onClick={onBack} className="mb-6 flex items-center gap-2 text-text-secondary hover:text-primary"><BackIcon /> Back to Admin Dashboard</button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <CreateDownloadForm onDownloadCreated={fetchDownloads} editing={editingDownload} />
                </div>
                <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-border">
                    <div className="mb-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search downloads..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg p-3 pl-10 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                                <SearchIcon />
                            </div>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold mb-4">Existing Downloads ({filteredDownloads.length})</h3>
                    {loading ? <p>Loading...</p> : (
                        <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {filteredDownloads.map(d => (
                                <li key={d.id} className="p-3 bg-background rounded-lg flex items-center justify-between">
                                    <div className="flex-1">
                                        <span className="font-semibold">{d.title}</span>
                                        {d.description && <p className="text-xs text-text-secondary line-clamp-1">{d.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`capitalize px-2 py-1 rounded-md text-xs ${d.is_premium ? 'bg-secondary/20 text-secondary' : 'bg-gray-600/20 text-gray-300'}`}>{d.is_premium ? 'Premium' : 'Free'}</span>
                                        <button onClick={() => setEditingDownload(d)} className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90">Edit</button>
                                        <button onClick={() => handleDelete(d.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Placeholder for other admin views ---
const PlaceholderAdminView: FC<{ title: string, onBack: () => void }> = ({ title, onBack }) => (
    <div>
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-text-secondary hover:text-primary"><BackIcon /> Back to Admin Dashboard</button>
        <div className="bg-surface p-8 rounded-xl border border-border text-center">
            <h2 className="text-2xl font-bold mb-2">{title} Management</h2>
            <p className="text-text-secondary">This section is under construction. Functionality to manage {title.toLowerCase()} will be added here soon.</p>
        </div>
    </div>
);

// --- Admin Dashboard Card ---
const AdminCard: FC<{ title: string; description: string; icon: FC<any>; onManage: () => void; }> = ({ title, description, icon: Icon, onManage }) => (
    <div className="bg-surface p-6 rounded-xl border border-border flex flex-col">
        <Icon className="w-10 h-10 text-primary mb-4" />
        <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-text-secondary text-sm flex-grow mb-6">{description}</p>
        <button onClick={onManage} className="mt-auto w-full py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors">Manage</button>
    </div>
);

// --- Admin Dashboard View ---
const AdminDashboard: FC<{ onNavigate: (view: AdminSubView) => void }> = ({ onNavigate }) => (
    <div>
        <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AdminCard title="Communities" description="Create and manage all user communities and set access levels (free/premium)." icon={CommunityIcon} onManage={() => onNavigate('community')} />
            <AdminCard title="Classrooms" description="Link courses with communities to create focused learning environments." icon={ClassroomFilledIcon} onManage={() => onNavigate('classroom')} />
            <AdminCard title="Courses" description="Add new courses, modules, chapters, and manage all course content." icon={ClassroomIcon} onManage={() => onNavigate('course')} />
            <AdminCard title="Downloads" description="Upload and manage all downloadable resources for courses and the main downloads section." icon={DownloadIcon} onManage={() => onNavigate('downloads')} />
            <AdminCard title="Users" description="View user profiles, assign roles (member/admin), and monitor user activity." icon={UsersIcon} onManage={() => onNavigate('user')} />
            <AdminCard title="Subscriptions" description="Monitor subscription statuses and manage plans. (Integrates with Stripe)." icon={SubscriptionIcon} onManage={() => onNavigate('subscription')} />
        </div>
    </div>
);

// --- Main AdminView Component (Router) ---
export const AdminView: FC<{ user: UserProfile }> = ({ user }) => {
    const [subView, setSubView] = useState<AdminSubView>('dashboard');

    if (user.role !== 'admin') {
        return <div className="text-center text-red-400">Access Denied. You must be an administrator to view this page.</div>;
    }

    const renderContent = () => {
        switch (subView) {
            case 'community': return <CommunityAdminView onBack={() => setSubView('dashboard')} />;
            case 'classroom': return <ClassroomAdminView onBack={() => setSubView('dashboard')} />;
            case 'downloads': return <DownloadsAdminView onBack={() => setSubView('dashboard')} />;
            case 'course': return <CourseAdminView onBack={() => setSubView('dashboard')} />;
            case 'user': return <PlaceholderAdminView title="Users" onBack={() => setSubView('dashboard')} />;
            case 'subscription': return <PlaceholderAdminView title="Subscriptions" onBack={() => setSubView('dashboard')} />;
            default: return <AdminDashboard onNavigate={setSubView} />;
        }
    };

    return <div>{renderContent()}</div>;
};