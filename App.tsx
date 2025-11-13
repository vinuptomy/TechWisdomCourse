import React, { useState, useCallback, useEffect, FC } from 'react';
import type { UserProfile, Course, View } from './types';
import { getSession, onAuthStateChange, updateUserPlan } from './services/apiService';
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

// In a real app, this would be your Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51BTUDGJAJfZb9HEBwDgAbpr3k1tF2vJIsQCK1V2g3B4aRMOd2Xo58a1AnKn2Uplm5cMvPZGxQD3c3Iwy3ANglsY200tg2Ipf2C';
// In a real app, this would come from your server/Stripe Dashboard
const STRIPE_PREMIUM_PRICE_ID = 'price_1L3YQGJAJfZb9HEBf6Nru9gS'; 

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

    const handleStripeCheckout = async () => {
        if (!currentUser) return;

        const stripe = (window as any).Stripe(STRIPE_PUBLISHABLE_KEY);
        if (!stripe) {
            alert("Stripe.js has not loaded. Please check your internet connection.");
            return;
        }

        const { error } = await stripe.redirectToCheckout({
            lineItems: [{ price: STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
            mode: 'subscription',
            successUrl: `${window.location.origin}?payment=success&user_id=${currentUser.id}`,
            cancelUrl: window.location.origin,
            customerEmail: currentUser.email,
        });

        if (error) {
            console.error("Stripe Checkout error:", error);
            alert(`An error occurred: ${error.message}`);
        }
    };
    
    // Effect to handle successful payment redirect from Stripe
    useEffect(() => {
        const handleSuccessfulPayment = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('payment') === 'success') {
                const userId = urlParams.get('user_id');
                // The onAuthStateChange listener will eventually update the user,
                // but we can call updateUserPlan for a more immediate UI update.
                if (userId && currentUser?.id === userId && currentUser.plan === 'free') {
                    const updatedUser = await updateUserPlan(userId, 'premium');
                    if(updatedUser) {
                        setCurrentUser(updatedUser); // Immediately refresh user state with premium plan
                        alert("Payment successful! Your account has been upgraded to Premium.");
                    }
                }
                // Clean up the URL
                window.history.replaceState(null, '', window.location.pathname);
            }
        };

        if(currentUser) {
            handleSuccessfulPayment();
        }
    }, [currentUser]);


    const renderContent = () => {
        if (!currentUser) return null;

        if (selectedCourse) {
            return <CourseDetailView course={selectedCourse} userPlan={currentUser.plan} onBack={() => setSelectedCourse(null)} />;
        }

        switch (currentView) {
            case 'community':
                return <CommunityView currentUser={currentUser} />;
            case 'classroom':
                return <ClassroomView onSelectCourse={setSelectedCourse} />;
            case 'downloads':
                return <DownloadsView userPlan={currentUser.plan} />;
            case 'settings':
                 return <SettingsView user={currentUser} onUpgrade={handleStripeCheckout} />;
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
