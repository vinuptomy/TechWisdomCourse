import React, { FC } from 'react';
import type { View, UserProfile } from '../types';
import { CommunityIcon, ClassroomIcon, DownloadIcon, SettingsIcon, AdminIcon } from './icons';

export const Sidebar: FC<{ currentView: View; setView: (view: View) => void; user: UserProfile }> = ({ currentView, setView, user }) => {
    const navItems: { view: View; label: string; icon: FC<any>; adminOnly?: boolean }[] = [
        { view: 'community', label: 'Community', icon: CommunityIcon },
        { view: 'courses', label: 'Courses', icon: ClassroomIcon },
        { view: 'classroom', label: 'Classroom', icon: ClassroomIcon },
        { view: 'downloads', label: 'Downloads', icon: DownloadIcon },
        { view: 'settings', label: 'Settings', icon: SettingsIcon },
        { view: 'admin', label: 'Admin Panel', icon: AdminIcon, adminOnly: true },
    ];

    const visibleNavItems = navItems.filter(item => {
        if (item.adminOnly) {
            return user.role === 'admin';
        }
        return true;
    });

    return (
        <aside className="bg-surface w-64 p-6 fixed top-0 left-0 h-full border-r border-border hidden lg:flex flex-col z-40">
            <h1 className="text-2xl font-bold text-text-primary mb-12">Tech Wisdom</h1>
            <nav className="flex flex-col gap-2">
                {visibleNavItems.map(item => (
                    <button
                        key={item.view}
                        onClick={() => setView(item.view)}
                        className={`flex items-center gap-4 p-3 rounded-lg text-lg transition-colors ${
                            currentView === item.view ? 'bg-primary text-white' : 'text-text-secondary hover:bg-background hover:text-text-primary'
                        }`}
                        aria-current={currentView === item.view ? 'page' : undefined}
                    >
                        <item.icon className="w-6 h-6" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
};