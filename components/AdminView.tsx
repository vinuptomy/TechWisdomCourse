import React, { useState, useEffect, FC, FormEvent } from 'react';
import type { UserProfile, Community, Download, Course, Classroom } from '../types';
import { getCommunities, createCommunity, createDownload, getDownloads, getCourses, createClassroom, getClassrooms } from '../services/apiService';
import { SpinnerIcon, CommunityIcon, UsersIcon, SubscriptionIcon, BackIcon, DownloadIcon, ClassroomFilledIcon } from './icons';

type AdminSubView = 'dashboard' | 'community' | 'course' | 'classroom' | 'user' | 'subscription' | 'downloads';

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
            <AdminCard title="Courses" description="Add new courses, chapters, and manage course content, and premium status." icon={CommunityIcon} onManage={() => onNavigate('course')} />
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
            case 'course': return <PlaceholderAdminView title="Courses" onBack={() => setSubView('dashboard')} />;
            case 'user': return <PlaceholderAdminView title="Users" onBack={() => setSubView('dashboard')} />;
            case 'subscription': return <PlaceholderAdminView title="Subscriptions" onBack={() => setSubView('dashboard')} />;
            default: return <AdminDashboard onNavigate={setSubView} />;
        }
    };

    return <div>{renderContent()}</div>;
};