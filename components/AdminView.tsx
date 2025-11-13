import React, { useState, useEffect, FC, FormEvent } from 'react';
import type { UserProfile, Community, Download, Course, Classroom, Module, Chapter } from '../types';
import { 
    getCommunities, createCommunity, createDownload, getDownloads, getCourses, 
    createClassroom, getClassrooms, createCourse, getCourseDetails, createModule, createChapter 
} from '../services/apiService';
import { SpinnerIcon, CommunityIcon, UsersIcon, SubscriptionIcon, BackIcon, DownloadIcon, ClassroomFilledIcon, ChevronDownIcon } from './icons';

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

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const data = await getCourses();
            setCourses(data);
        } catch (error) { console.error("Failed to fetch courses", error); }
        setLoading(false);
    };

    useEffect(() => { fetchCourses(); }, []);
    
    const handleCourseCreated = (newCourse: Course) => {
        setCourses(prev => [newCourse, ...prev]);
        setCreateModalOpen(false);
        setSelectedCourse(newCourse); // Automatically open the new course for editing
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
            <div className="bg-surface p-6 rounded-xl border border-border">
                {loading ? <p>Loading courses...</p> : courses.map(course => (
                    <div key={course.id} className="p-3 bg-background rounded-lg flex items-center justify-between mb-2">
                        <span>{course.title}</span>
                        <button onClick={() => setSelectedCourse(course)} className="text-sm text-primary font-semibold">Edit</button>
                    </div>
                ))}
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
    
    useEffect(() => { getCommunities().then(setCommunities); }, []);

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
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

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
    };
    
    const handleChapterCreated = (newChapter: Chapter) => {
        setCourse(prev => prev ? ({
            ...prev,
            modules: (prev.modules || []).map(m => 
                m.id === newChapter.module_id 
                ? { ...m, chapters: [...m.chapters, newChapter] } 
                : m
            )
        }) : null);
        setChapterModalOpen(false);
        setSelectedModuleId(null);
    };

    if (loading) return <p>Loading course editor...</p>;
    if (!course) return <p>Course not found.</p>;

    return (
        <div>
            <button onClick={onBack} className="mb-6 flex items-center gap-2 text-text-secondary hover:text-primary"><BackIcon /> Back to Courses List</button>
            <h2 className="text-2xl font-bold mb-4">{course.title}</h2>
            <div className="bg-surface p-6 rounded-xl border border-border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Modules & Chapters</h3>
                    <button onClick={() => setModuleModalOpen(true)} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg">Add Module</button>
                </div>
                <div className="space-y-4">
                    {(course.modules || []).map(module => (
                        <div key={module.id} className="p-4 bg-background rounded-lg">
                            <div className="flex justify-between items-center">
                                <p className="font-bold">{module.title}</p>
                                <button onClick={() => { setSelectedModuleId(module.id); setChapterModalOpen(true); }} className="text-sm text-primary font-semibold">Add Chapter</button>
                            </div>
                            <ul className="mt-2 space-y-1 pl-4">
                                {module.chapters.map(chapter => (
                                    <li key={chapter.id} className="text-sm text-text-secondary">{chapter.title}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            
            <Modal isOpen={isModuleModalOpen} onClose={() => setModuleModalOpen(false)} title="Add New Module">
                <CreateModuleForm courseId={course.id} position={(course.modules || []).length} onModuleCreated={handleModuleCreated} />
            </Modal>
            
            <Modal isOpen={isChapterModalOpen} onClose={() => setChapterModalOpen(false)} title="Add New Chapter">
                {selectedModuleId && <CreateChapterForm moduleId={selectedModuleId} position={(course.modules?.find(m => m.id === selectedModuleId)?.chapters.length || 0)} onChapterCreated={handleChapterCreated} />}
            </Modal>
        </div>
    );
};

const CreateModuleForm: FC<{ courseId: string, position: number, onModuleCreated: (module: Module) => void }> = ({ courseId, position, onModuleCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault(); setLoading(true);
        const newModule = await createModule({ course_id: courseId, title, description, position });
        onModuleCreated(newModule);
        setLoading(false);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Module Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3" />
            <textarea placeholder="Module Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-lg p-3" />
            <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white rounded-lg">{loading ? 'Adding...' : 'Add Module'}</button>
        </form>
    );
};

const CreateChapterForm: FC<{ moduleId: string, position: number, onChapterCreated: (chapter: Chapter) => void }> = ({ moduleId, position, onChapterCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault(); setLoading(true);
        const newChapter = await createChapter({ module_id: moduleId, title, description, video_url: videoUrl, position });
        onChapterCreated(newChapter);
        setLoading(false);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Chapter Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3" />
            <textarea placeholder="Chapter Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-lg p-3" />
            <input type="text" placeholder="YouTube Video URL or ID" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3" />
            <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white rounded-lg">{loading ? 'Adding...' : 'Add Chapter'}</button>
        </form>
    );
};

// --- Community Management View ---
const CommunityAdminView: FC<{ onBack: () => void }> = ({ onBack }) => {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);

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

    const CreateCommunityForm: FC<{ onCommunityCreated: () => void }> = ({ onCommunityCreated }) => {
        const [name, setName] = useState('');
        const [description, setDescription] = useState('');
        const [isPremium, setIsPremium] = useState(false);
        const [imageFile, setImageFile] = useState<File | null>(null);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState('');

        const handleSubmit = async (e: FormEvent) => {
            e.preventDefault();
            if (!name || !description || !imageFile) {
                setError('All fields are required.'); return;
            }
            setLoading(true); setError('');
            try {
                await createCommunity({ name, description, is_premium: isPremium }, imageFile);
                setName(''); setDescription(''); setIsPremium(false); setImageFile(null);
                (e.target as HTMLFormElement).reset();
                onCommunityCreated();
            } catch (err: any) { setError(err.message); } 
            finally { setLoading(false); }
        };

        return (
            <div className="bg-surface p-6 rounded-xl border border-border">
                <h3 className="text-xl font-bold mb-4">Create New Community</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Community Name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3" />
                    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="w-full bg-background border border-border rounded-lg p-3" />
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Community Image</label>
                        <input type="file" accept="image/*" onChange={e => e.target.files && setImageFile(e.target.files[0])} required className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isPremium" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="isPremium">Premium Community</label>
                    </div>
                    {error && <p className="text-red-400">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-semibold rounded-lg disabled:bg-gray-500">
                        {loading ? <SpinnerIcon className="animate-spin mx-auto" /> : 'Create Community'}
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div>
            <button onClick={onBack} className="mb-6 flex items-center gap-2 text-text-secondary hover:text-primary"><BackIcon /> Back to Admin Dashboard</button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1"><CreateCommunityForm onCommunityCreated={fetchCommunities} /></div>
                <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-border">
                    <h3 className="text-xl font-bold mb-4">Existing Communities ({communities.length})</h3>
                    {loading ? <p>Loading...</p> : (
                        <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {communities.map(c => (
                                <li key={c.id} className="p-3 bg-background rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-md object-cover" />
                                        <span>{c.name}</span>
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

    const fetchDownloads = async () => {
        setLoading(true);
        try {
            const data = await getDownloads();
            setDownloads(data);
        } catch (error) { console.error("Failed to fetch downloads", error); }
        setLoading(false);
    };
    useEffect(() => { fetchDownloads(); }, []);

    const CreateDownloadForm: FC<{ onDownloadCreated: () => void }> = ({ onDownloadCreated }) => {
        const [title, setTitle] = useState('');
        const [description, setDescription] = useState('');
        const [isPremium, setIsPremium] = useState(false);
        const [file, setFile] = useState<File | null>(null);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState('');

        const handleSubmit = async (e: FormEvent) => {
            e.preventDefault();
            if (!title || !description || !file) { setError('All fields are required.'); return; }
            setLoading(true); setError('');
            try {
                await createDownload({ title, description, is_premium: isPremium }, file);
                setTitle(''); setDescription(''); setIsPremium(false); setFile(null);
                (e.target as HTMLFormElement).reset();
                onDownloadCreated();
            } catch (err: any) { setError(err.message); } 
            finally { setLoading(false); }
        };

        return (
            <div className="bg-surface p-6 rounded-xl border border-border">
                <h3 className="text-xl font-bold mb-4">Add New Download</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Download Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3" />
                    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required rows={3} className="w-full bg-background border border-border rounded-lg p-3" />
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">File</label>
                        <input type="file" onChange={e => e.target.files && setFile(e.target.files[0])} required className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isPremiumDownload" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="isPremiumDownload">Premium Download</label>
                    </div>
                    {error && <p className="text-red-400">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-semibold rounded-lg disabled:bg-gray-500">
                        {loading ? <SpinnerIcon className="animate-spin mx-auto" /> : 'Add Download'}
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div>
            <button onClick={onBack} className="mb-6 flex items-center gap-2 text-text-secondary hover:text-primary"><BackIcon /> Back to Admin Dashboard</button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1"><CreateDownloadForm onDownloadCreated={fetchDownloads} /></div>
                <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-border">
                    <h3 className="text-xl font-bold mb-4">Existing Downloads ({downloads.length})</h3>
                    {loading ? <p>Loading...</p> : (
                        <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {downloads.map(d => (
                                <li key={d.id} className="p-3 bg-background rounded-lg flex items-center justify-between">
                                    <span className="font-semibold">{d.title}</span>
                                    <span className={`capitalize px-2 py-1 rounded-md text-xs ${d.is_premium ? 'bg-secondary/20 text-secondary' : 'bg-gray-600/20 text-gray-300'}`}>{d.is_premium ? 'Premium' : 'Free'}</span>
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
            <AdminCard title="Courses" description="Add new courses, modules, chapters, and manage all course content." icon={CommunityIcon} onManage={() => onNavigate('course')} />
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