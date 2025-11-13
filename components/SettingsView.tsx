import React, { FC } from 'react';
import type { UserProfile } from '../types';

export const SettingsView: FC<{ user: UserProfile }> = ({ user }) => (
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
    </div>
);