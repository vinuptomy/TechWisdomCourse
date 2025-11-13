import React, { FC, useState, useRef, useEffect } from 'react';
import type { UserProfile } from '../types';
import { signOut } from '../services/apiService';
import { MenuIcon, LogoutIcon } from './icons';

export const Header: FC<{ user: UserProfile; onLogout: () => void }> = ({ user, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleSignOutClick = async () => {
        await signOut();
        onLogout();
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

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
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-haspopup="true" aria-expanded={isMenuOpen} className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface">
                        <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 z-50 animate-fade-in-fast border border-border" role="menu">
                            <a href="#" className="block px-4 py-2 text-sm text-text-primary hover:bg-background" role="menuitem">Profile</a>
                            <button onClick={handleSignOutClick} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-background" role="menuitem">
                               <LogoutIcon className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};