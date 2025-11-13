import React, { useState, FC } from 'react';
import { signIn, signUp } from '../services/apiService';

export const Auth: FC = () => {
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSigningUp) {
                await signUp(email, password, name);
                // The onAuthStateChange listener in App.tsx will handle the login
            } else {
                await signIn(email, password);
                // The onAuthStateChange listener in App.tsx will handle the login
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-2xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                        {isSigningUp ? 'Create an Account' : 'Welcome Back'}
                    </h1>
                    <p className="mt-2 text-text-secondary">
                        {isSigningUp ? 'Join our community to start learning.' : 'Log in to continue your journey.'}
                    </p>
                </div>
                {error && <p className="text-center text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</p>}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {isSigningUp && (
                        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition" />
                    )}
                    <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition" />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition" />
                    
                    <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-all duration-200 disabled:bg-gray-500">
                        {loading ? 'Processing...' : isSigningUp ? 'Sign Up' : 'Log In'}
                    </button>
                </form>
                <p className="text-center text-sm text-text-secondary">
                    {isSigningUp ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => { setIsSigningUp(!isSigningUp); setError(''); }} className="font-semibold text-primary hover:underline ml-1">
                        {isSigningUp ? 'Log In' : 'Sign Up'}
                    </button>
                </p>
                 <div className="text-center text-xs text-text-secondary pt-4 border-t border-border">
                    <p>For demo purposes:</p>
                    <p>Premium: <span className="font-mono">premium@example.com</span> / <span className="font-mono">password</span></p>
                    <p>Free: <span className="font-mono">free@example.com</span> / <span className="font-mono">password</span></p>
                </div>
            </div>
        </div>
    );
};
