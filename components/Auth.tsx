import React, { useState, FC, useEffect } from 'react';
import { signIn, signUp } from '../services/apiService';

const PasswordStrengthMeter: FC<{ strength: number }> = ({ strength }) => {
    const strengthLevels = [
        { label: 'Weak', color: 'bg-red-500' },
        { label: 'Fair', color: 'bg-orange-500' },
        { label: 'Good', color: 'bg-yellow-500' },
        { label: 'Strong', color: 'bg-green-500' },
    ];

    const level = strengthLevels[strength];

    return (
        <div className="flex items-center gap-2 mt-2">
            <div className="w-full bg-background rounded-full h-2">
                <div 
                    className={`h-2 rounded-full transition-all duration-300 ${level.color}`} 
                    style={{ width: `${((strength + 1) / 4) * 100}%` }}
                ></div>
            </div>
            <span className="text-xs text-text-secondary w-14 text-right">{level.label}</span>
        </div>
    );
};


export const Auth: FC = () => {
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: '' });

    const generateCaptcha = () => {
        setCaptcha({
            num1: Math.floor(Math.random() * 10) + 1,
            num2: Math.floor(Math.random() * 10) + 1,
            answer: ''
        });
    };
    
    useEffect(() => {
        generateCaptcha();
    }, [isSigningUp]);


    const checkPasswordStrength = (pass: string) => {
        let score = 0;
        if (pass.length > 7) score++;
        if (/\d/.test(pass)) score++;
        if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
        setPasswordStrength(score);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        if (isSigningUp) {
            checkPasswordStrength(newPassword);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (parseInt(captcha.answer, 10) !== captcha.num1 + captcha.num2) {
            setError('Incorrect CAPTCHA answer. Please try again.');
            generateCaptcha();
            return;
        }

        if (isSigningUp && passwordStrength < 2) {
            setError('Password is too weak. Please choose a stronger password.');
            return;
        }

        setLoading(true);

        try {
            if (isSigningUp) {
                await signUp(email, password, name);
                setShowConfirmationMessage(true);
            } else {
                await signIn(email, password);
                // The onAuthStateChange listener in App.tsx will handle the login
            }
        } catch (err: any) {
            if (err.message.toLowerCase().includes('email not confirmed')) {
                 setError('Email not confirmed. Please check your inbox for a verification link.');
            } else if (err.message.toLowerCase().includes("could not find table 'public.profiles'")) {
                 setError("Critical Error: The user 'profiles' table is missing in the database. Please contact the administrator or follow the setup instructions.");
            } else {
                setError(err.message);
            }
            generateCaptcha();
        } finally {
            setLoading(false);
        }
    };
    
     if (showConfirmationMessage) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-md p-8 text-center bg-surface rounded-2xl shadow-lg">
                    <h1 className="text-3xl font-bold text-text-primary">Check Your Email</h1>
                    <p className="mt-4 text-text-secondary">
                        We've sent a confirmation link to <span className="font-semibold text-text-primary">{email}</span>.
                        Please click the link in the email to activate your account.
                    </p>
                </div>
            </div>
        );
    }

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
                    <div>
                        <input type="password" placeholder="Password" value={password} onChange={handlePasswordChange} required className="w-full bg-background border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:outline-none transition" />
                        {isSigningUp && <PasswordStrengthMeter strength={passwordStrength} />}
                    </div>

                    <div className="flex items-center gap-4 p-3 bg-background rounded-lg border border-border">
                        <label htmlFor="captcha" className="text-text-secondary font-mono">
                           {captcha.num1} + {captcha.num2} = ?
                        </label>
                        <input
                            id="captcha"
                            type="number"
                            placeholder="Your answer"
                            value={captcha.answer}
                            onChange={e => setCaptcha({...captcha, answer: e.target.value})}
                            required
                            className="w-full bg-transparent text-text-primary placeholder-text-secondary focus:outline-none"
                         />
                    </div>
                    
                    <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed">
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