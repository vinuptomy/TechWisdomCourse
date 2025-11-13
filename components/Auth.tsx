import React, { useState, FC, useEffect } from 'react';
import { signIn, signUp } from '../services/apiService';
import { SpinnerIcon, CheckIcon, RocketIcon } from './icons';

const PasswordStrengthMeter: FC<{ strength: number }> = ({ strength }) => {
    const strengthLevels = [
        { label: 'Very Weak', color: 'bg-red-500' },
        { label: 'Weak', color: 'bg-orange-500' },
        { label: 'Fair', color: 'bg-yellow-500' },
        { label: 'Good', color: 'bg-lime-500' },
        { label: 'Strong', color: 'bg-green-500' },
    ];

    const level = strengthLevels[strength];

    return (
        <div className="flex items-center gap-2 mt-2">
            <div className="w-full bg-background rounded-full h-2">
                <div 
                    className={`h-2 rounded-full transition-all duration-300 ${level.color}`} 
                    style={{ width: `${((strength + 1) / 5) * 100}%` }}
                ></div>
            </div>
            <span className="text-xs text-text-secondary w-20 text-right">{level.label}</span>
        </div>
    );
};

const Captcha: FC<{ isVerified: boolean; onVerify: () => void; isVerifying: boolean;}> = ({ isVerified, onVerify, isVerifying }) => (
    <div 
        onClick={onVerify} 
        className={`flex items-center gap-4 p-3 bg-background rounded-lg border ${isVerified ? 'border-green-500' : 'border-border'} transition-colors cursor-pointer`}
    >
        <div className="w-6 h-6 rounded border-2 border-border flex items-center justify-center bg-surface flex-shrink-0">
            {isVerifying && <SpinnerIcon className="animate-spin" />}
            {isVerified && !isVerifying && <CheckIcon className="text-green-500" />}
        </div>
        <span className="text-text-primary">I'm not a robot</span>
    </div>
);

export const Auth: FC = () => {
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
    const [isVerifyingCaptcha, setIsVerifyingCaptcha] = useState(false);

    const resetAuthState = () => {
        setError('');
        setIsCaptchaVerified(false);
        setIsVerifyingCaptcha(false);
        setPasswordStrength(0);
        setEmail('');
        setPassword('');
        setName('');
    }
    
    useEffect(() => {
        resetAuthState();
    }, [isSigningUp]);

    const checkPasswordStrength = (pass: string) => {
        let score = 0;
        if (pass.length > 8) score++;
        if (/\d/.test(pass)) score++;
        if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score++;
        setPasswordStrength(score);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        if (isSigningUp) {
            checkPasswordStrength(newPassword);
        }
    };

    const handleCaptchaVerify = () => {
        if (isCaptchaVerified || isVerifyingCaptcha) return;
        setIsVerifyingCaptcha(true);
        setTimeout(() => {
            setIsCaptchaVerified(true);
            setIsVerifyingCaptcha(false);
        }, 1200);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isCaptchaVerified) {
            setError('Please complete the CAPTCHA verification.');
            return;
        }

        if (isSigningUp && passwordStrength < 4) {
            setError('Password is not strong enough. It must be over 8 characters and include uppercase, lowercase, a number, and a special character.');
            return;
        }

        setLoading(true);

        try {
            if (isSigningUp) {
                await signUp(email, password, name);
                setShowConfirmationMessage(true);
            } else {
                await signIn(email, password);
            }
        } catch (err: any) {
            resetAuthState();
            if (err.message.toLowerCase().includes('email not confirmed')) {
                 setError('Email not confirmed. Please check your inbox for a verification link.');
            } else if (err.message.toLowerCase().includes("could not find table 'public.profiles'")) {
                 setError("Critical Error: The user 'profiles' table is missing in the database. Please contact the administrator or follow the setup instructions.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };
    
     if (showConfirmationMessage) {
        return (
            <div className="w-full max-w-md p-8 text-center bg-surface rounded-2xl shadow-lg animate-fade-in-fast">
                <h1 className="text-3xl font-bold text-text-primary">Check Your Email</h1>
                <p className="mt-4 text-text-secondary">
                    We've sent a confirmation link to <span className="font-semibold text-text-primary">{email}</span>.
                    Please click the link in the email to activate your account.
                </p>
            </div>
        );
    }

    return (
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
                <div>
                    <input type="password" placeholder="Password" value={password} onChange={handlePasswordChange} required className="w-full bg-background border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition" />
                    {isSigningUp && <PasswordStrengthMeter strength={passwordStrength} />}
                </div>

                <Captcha 
                    isVerified={isCaptchaVerified}
                    isVerifying={isVerifyingCaptcha}
                    onVerify={handleCaptchaVerify}
                />
                
                <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed">
                    {loading ? 'Processing...' : isSigningUp ? 'Create Account' : 'Log In'}
                </button>
            </form>
            
            {isSigningUp ? (
                 <p className="text-center text-sm text-text-secondary">
                    Already have an account?
                    <button onClick={() => { setIsSigningUp(false); }} className="font-semibold text-primary hover:underline ml-1">
                        Log In
                    </button>
                </p>
            ) : (
                <div className="text-center mt-6 pt-4 border-t border-border">
                    <p className="text-text-secondary mb-3">New to Tech Wisdom?</p>
                    <button 
                        onClick={() => setIsSigningUp(true)} 
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-surface text-secondary font-semibold rounded-lg border border-secondary hover:bg-secondary/10 transition-all duration-200"
                    >
                       <RocketIcon className="w-5 h-5" />
                       Join the Launch Pad!
                    </button>
                </div>
            )}
        </div>
    );
};