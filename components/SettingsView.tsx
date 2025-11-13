import React, { FC } from 'react';
import type { UserProfile } from '../types';

export const SettingsView: FC<{ user: UserProfile; onUpgrade: () => void }> = ({ user, onUpgrade }) => (
    <div className="bg-surface p-8 rounded-xl border border-border max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
        <div className="space-y-4">
            <p><span className="font-semibold text-text-secondary">Name:</span> {user.name}</p>
            <p><span className="font-semibold text-text-secondary">Email:</span> {user.email}</p>
            <p>
                <span className="font-semibold text-text-secondary">Current Plan:</span> 
                <span className={`capitalize ml-2 px-2 py-1 rounded-md text-sm ${
                    user.plan === 'premium' 
                    ? 'bg-secondary/20 text-secondary' 
                    : 'bg-gray-600/20 text-gray-300'
                }`}>
                    {user.plan}
                </span>
            </p>
        </div>
        {user.plan === 'free' && (
             <div className="mt-8 pt-6 border-t border-border">
                 <h3 className="text-xl font-bold">Upgrade to Premium</h3>
                 <p className="text-text-secondary mt-2 mb-4">Unlock all courses, exclusive content, and digital downloads.</p>
                 <button onClick={onUpgrade} className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
                     Upgrade for $29/month
                 </button>
             </div>
        )}
         {user.plan === 'premium' && (
             <div className="mt-8 pt-6 border-t border-border text-center">
                 <h3 className="text-xl font-bold text-secondary">You have a Premium Account!</h3>
                 <p className="text-text-secondary mt-2">You have access to all features. Thank you for your support!</p>
             </div>
        )}
    </div>
);
