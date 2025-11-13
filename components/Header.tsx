import React, { FC } from 'react';
import type { UserProfile } from '../types';
import { signOut } from '../services/apiService';
import { MenuIcon, LogoutIcon } from './icons';

export const Header: FC<{ user: UserProfile; onLogout: () => void }> = ({ user, onLogout }) => {
    
    const handleSignOutClick = async () => {
        await signOut();
        onLogout();
    };

    return (
        <header className="bg-surface border-b border-border p-4 flex justify-between items-center fixed top-0 left-0 lg:left-64 right-0 z-30">
            <div>
                {/* Mobile Menu Button - for future use */}
                <button className="lg:hidden text-text-secondary">
                    <MenuIcon />
                </button>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-text-secondary hidden sm:block">Welcome, {user.name}</span>
                <div className="relative group">
                    <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full cursor-pointer" />
                    <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 z-50 hidden group-hover:block animate-fade-in-fast">
                        <a href="#" className="block px-4 py-2 text-sm text-text-primary hover:bg-background">Profile</a>
                        <button onClick={handleSignOutClick} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-background">
                           <LogoutIcon className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
