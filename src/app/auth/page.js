'use client';
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AuthPage() {
    const { signUpWithEmail, signInWithEmail, signInWithGoogle, continueAsGuest } = useAuth();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [captcha] = useState(() => {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        return { a, b, answer: a + b };
    });

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'register') {
                if (!displayName.trim()) throw new Error('Display name is required');
                if (displayName.trim().length < 2) throw new Error('Name must be at least 2 characters');
                if (!email.trim()) throw new Error('Email is required');
                if (password.length < 6) throw new Error('Password must be at least 6 characters');
                if (password !== confirmPassword) throw new Error('Passwords do not match');
                if (parseInt(captchaAnswer) !== captcha.answer) throw new Error('Captcha answer is incorrect');
                await signUpWithEmail(email, password, displayName.trim());
            } else {
                if (!email.trim()) throw new Error('Email is required');
                if (!password) throw new Error('Password is required');
                await signInWithEmail(email, password);
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [mode, email, password, confirmPassword, displayName, captchaAnswer, captcha, signUpWithEmail, signInWithEmail]);

    const handleGoogleLogin = useCallback(async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
        } catch (err) {
            setError(err.message || 'Google login failed');
            setLoading(false);
        }
    }, [signInWithGoogle]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'var(--gradient-bg)' }}>
            {/* Background bubbles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="floating-bubble animate-float"
                        style={{
                            width: `${30 + Math.random() * 50}px`, height: `${30 + Math.random() * 50}px`,
                            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 6}s`, animationDuration: `${5 + Math.random() * 4}s`,
                        }} />
                ))}
            </div>

            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Logo */}
                <div className="text-center mb-6 animate-bounce-in">
                    <img src="/logo.png" alt="CoupChat" className="w-16 h-16 rounded-2xl mx-auto mb-3 object-cover shadow-2xl" />
                    <h1 className="font-display font-black text-3xl gradient-text">CoupChat</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        Chat with Strangers Worldwide
                    </p>
                </div>

                {/* Auth Card */}
                <div className="glass rounded-3xl p-6 shadow-2xl animate-slide-up">
                    {/* Tab Switch */}
                    <div className="flex rounded-xl bg-[var(--bg-tertiary)] p-1 mb-5">
                        <button
                            onClick={() => { setMode('login'); setError(''); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'login' ? 'text-white shadow-md' : ''}`}
                            style={mode === 'login' ? { background: 'var(--gradient-primary)' } : { color: 'var(--text-secondary)' }}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setMode('register'); setError(''); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'register' ? 'text-white shadow-md' : ''}`}
                            style={mode === 'register' ? { background: 'var(--gradient-primary)' } : { color: 'var(--text-secondary)' }}
                        >
                            Register
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 px-4 py-2.5 rounded-xl text-sm animate-shake"
                            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Display Name (Register only) */}
                        {mode === 'register' && (
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                    Display Name
                                </label>
                                <input
                                    type="text" placeholder="Your display name..."
                                    value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                                    maxLength={20}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] outline-none text-sm font-medium"
                                    style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                                />
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Email
                            </label>
                            <input
                                type="email" placeholder="your@email.com"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] outline-none text-sm font-medium"
                                style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Password
                            </label>
                            <input
                                type="password" placeholder="••••••••"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] outline-none text-sm font-medium"
                                style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                            />
                        </div>

                        {/* Confirm Password (Register only) */}
                        {mode === 'register' && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                        Retype Password
                                    </label>
                                    <input
                                        type="password" placeholder="••••••••"
                                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] outline-none text-sm font-medium"
                                        style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                                    />
                                </div>

                                {/* Captcha */}
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                        🤖 Verify: What is {captcha.a} + {captcha.b}?
                                    </label>
                                    <input
                                        type="number" placeholder="Answer..."
                                        value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] outline-none text-sm font-medium"
                                        style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                                    />
                                </div>
                            </>
                        )}

                        {/* Submit */}
                        <button
                            type="submit" disabled={loading}
                            className="w-full btn-glow py-3.5 rounded-xl text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            ) : mode === 'register' ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
                        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    </div>

                    {/* Google Login */}
                    <button
                        onClick={handleGoogleLogin} disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 mb-3"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Guest Login Divider */}
                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>or skip</span>
                        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    </div>

                    {/* Guest Login */}
                    <button
                        onClick={continueAsGuest}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                        style={{ color: 'var(--text-muted)', border: '1px dashed var(--border)' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        Continue as Guest (No Account)
                    </button>

                    <p className="text-[10px] text-center mt-4" style={{ color: 'var(--text-muted)' }}>
                        Guest accounts don't save chat history or profile data.
                    </p>
                </div>
            </div>
        </div>
    );
}
