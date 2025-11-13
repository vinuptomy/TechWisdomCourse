import React from 'react';
import { Auth } from './Auth';
import { RocketIcon } from './icons';

export const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col lg:flex-row">
            {/* Left/Top Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-gradient-to-br from-surface to-background">
                <div className="max-w-md text-center lg:text-left">
                     <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                        <RocketIcon className="w-10 h-10 text-secondary"/>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tighter">
                            Tech Wisdom
                        </h1>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-6">
                        Your Launch Pad to the Future of AI.
                    </h2>
                    <p className="text-text-secondary mb-8">
                        Join an exclusive community of innovators and creators. Access cutting-edge courses, collaborate on groundbreaking projects, and accelerate your journey in the world of artificial intelligence.
                    </p>
                    <div className="flex items-center justify-center lg:justify-start gap-4">
                        <img 
                            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=300&auto=format&fit=crop" 
                            alt="Creator"
                            className="w-16 h-16 rounded-full border-2 border-primary"
                        />
                        <div>
                            <p className="font-semibold text-text-primary">Alex Johnson</p>
                            <p className="text-sm text-text-secondary">Creator of Tech Wisdom</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right/Bottom Section - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
                <Auth />
            </div>
        </div>
    );
};
