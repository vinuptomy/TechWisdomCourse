import React, { useState, useCallback, useEffect, FC } from 'react';
import type { UserProfile, View, Classroom } from './types';
import { getSession, onAuthStateChange } from './services/apiService';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { CommunityView } from './components/CommunityView';
import { CoursesView } from './components/CoursesView';
import { CourseDetailView } from './components/CourseDetailView';
import { DownloadsView } from './components/DownloadsView';
import { SettingsView } from './components/SettingsView';
import { AdminView } from './components/AdminView';
import { AiAssistant } from './components/AiAssistant';
import { AiIcon } from './components/icons';
import { ClassroomsView } from './components/ClassroomsView';
import { ClassroomDetailView } from './components/ClassroomDetailView';

export default function App() {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const [currentView, setView] = useState<View>('community');
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
    const [isAiAssistantOpen, setAiAssistantOpen] = useState(false);

    // Effect to check for active session on initial load
    useEffect(() => {
        let isMounted = true;
        const checkSession = async () => {
            try {
                // Add timeout to prevent infinite loading
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Session check timeout')), 10000)
                );
                
                const sessionPromise = getSession();
                const user = await Promise.race([sessionPromise, timeoutPromise]) as UserProfile | null;
                
                if (isMounted) {
                    setCurrentUser(user);
                }
            } catch (error) {
                console.error("Failed to check session on initial load:", error);
                if (isMounted) {
                    setCurrentUser(null);
                }
            } finally {
                if (isMounted) {
                    setLoadingSession(false);
                }
            }
        };
        checkSession();

        // Listen for auth changes (login/logout)
        const unsubscribe = onAuthStateChange((user) => {
            if (isMounted) {
                setCurrentUser(user);
                if (!user) {
                    // Reset view on logout
                    setView('community');
                    setSelectedCourseId(null);
                    setSelectedClassroomId(null);
                }
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const handleSetView = (view: View) => {
        setView(view);
        setSelectedCourseId(null);
        setSelectedClassroomId(null);
    }

    const renderContent = () => {
        if (!currentUser) return null;

        if (selectedCourseId) {
            return <CourseDetailView courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />;
        }
        
        if (selectedClassroomId) {
            return <ClassroomDetailView classroomId={selectedClassroomId} currentUser={currentUser} onBack={() => setSelectedClassroomId(null)} />;
        }

        switch (currentView) {
            case 'community':
                return <CommunityView currentUser={currentUser} />;
            case 'courses':
                return <CoursesView currentUser={currentUser} onSelectCourse={(course) => setSelectedCourseId(course.id)} />;
            case 'classroom':
                return <ClassroomsView currentUser={currentUser} onSelectClassroom={(classroom) => setSelectedClassroomId(classroom.id)} />;
            case 'downloads':
                return <DownloadsView currentUser={currentUser} />;
            case 'settings':
                 return <SettingsView user={currentUser} />;
            case 'admin':
                 return <AdminView user={currentUser} />;
            default:
                return <CommunityView currentUser={currentUser}/>;
        }
    };

    if (loadingSession) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-text-secondary mb-4">Loading Tech Wisdom...</p>
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-text-secondary mt-4">Checking connection...</p>
                </div>
            </div>
        );
    }
    
    if (!currentUser) {
        return <LandingPage />;
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar currentView={currentView} setView={handleSetView} user={currentUser} />
            <div className="lg:pl-64">
                <Header user={currentUser} />
                <main className="p-6 pt-24">
                    {renderContent()}
                </main>
            </div>
            <button onClick={() => setAiAssistantOpen(true)} className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-secondary p-4 rounded-full text-white shadow-lg hover:scale-110 transition-transform z-40">
                <AiIcon className="w-8 h-8"/>
            </button>
            <AiAssistant isOpen={isAiAssistantOpen} onClose={() => setAiAssistantOpen(false)} />
        </div>
    );
}