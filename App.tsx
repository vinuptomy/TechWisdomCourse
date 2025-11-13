import React, { useState, useCallback, useEffect, FC } from 'react';
import type { UserProfile, Course, View } from './types';
import { getSession, onAuthStateChange } from './services/apiService';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Auth } from './components/Auth';
import { CommunityView } from './components/CommunityView';
import { ClassroomView } from './components/ClassroomView';
import { CourseDetailView } from './components/CourseDetailView';
import { DownloadsView } from './components/DownloadsView';
import { SettingsView } from './components/SettingsView';
import { AiAssistant } from './components/AiAssistant';
import { AiIcon } from './components/icons';

export default function App() {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const [currentView, setView] = useState<View>('community');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isAiAssistantOpen, setAiAssistantOpen] = useState(false);

    // Effect to check for active session on initial load
    useEffect(() => {
        const checkSession = async () => {
            const user = await getSession();
            setCurrentUser(user);
            setLoadingSession(false);
        };
        checkSession();

        // Listen for auth changes (login/logout)
        const unsubscribe = onAuthStateChange((user) => {
            setCurrentUser(user);
             if (!user) {
                // Reset view on logout
                setView('community');
                setSelectedCourse(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        // The onAuthStateChange listener will handle setting currentUser to null and resetting state
    };

    const renderContent = () => {
        if (!currentUser) return null;

        if (selectedCourse) {
            return <CourseDetailView course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
        }

        switch (currentView) {
            case 'community':
                return <CommunityView currentUser={currentUser} />;
            case 'classroom':
                return <ClassroomView currentUser={currentUser} onSelectCourse={setSelectedCourse} />;
            case 'downloads':
                return <DownloadsView />;
            case 'settings':
                 return <SettingsView user={currentUser} />;
            default:
                return <CommunityView currentUser={currentUser}/>;
        }
    };

    if (loadingSession) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-text-secondary">Loading CourseSphere...</p>
            </div>
        );
    }
    
    if (!currentUser) {
        return <Auth />;
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar currentView={currentView} setView={setView} />
            <div className="lg:pl-64">
                <Header user={currentUser} onLogout={handleLogout} />
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