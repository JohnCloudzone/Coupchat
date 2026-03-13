'use client';
import { useState, useEffect } from 'react';

export default function WelcomeModal({ onComplete }) {
    const [name, setName] = useState('');
    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('');

    useEffect(() => {
        // Check if already onboarded
        const profile = localStorage.getItem('coupchat-profile');
        if (profile) {
            try {
                const parsed = JSON.parse(profile);
                if (parsed.name && parsed.gender && parsed.age) {
                    onComplete(parsed);
                }
            } catch (e) { }
        }
    }, [onComplete]);

    const handleSubmit = () => {
        if (!name.trim()) { setError('Please enter your name'); return; }
        if (name.trim().length < 2) { setError('Name must be at least 2 characters'); return; }
        if (!gender) { setError('Please select your gender'); return; }
        if (!age || parseInt(age) < 13 || parseInt(age) > 100) { setError('Please enter a valid age (13-100)'); return; }

        const profile = {
            name: name.trim(),
            gender,
            age: parseInt(age),
            avatar: selectedAvatar,
        };

        localStorage.setItem('coupchat-profile', JSON.stringify(profile));
        localStorage.setItem('coupchat-guestName', profile.name);
        onComplete(profile);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'var(--gradient-bg)' }}>
            {/* Background bubbles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) => (
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
                <div className="text-center mb-8 animate-bounce-in">
                    <img src="/logo.png" alt="CoupChat" className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover shadow-2xl" />
                    <h1 className="font-display font-black text-3xl gradient-text">CoupChat</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        Chat with Strangers Worldwide
                    </p>
                </div>

                {/* Form Card */}
                <div className="glass rounded-3xl p-6 shadow-2xl animate-slide-up">
                    <h2 className="font-display font-bold text-xl mb-1 text-center" style={{ color: 'var(--text-primary)' }}>
                        Welcome! Tell us about yourself
                    </h2>
                    <p className="text-xs text-center mb-6" style={{ color: 'var(--text-muted)' }}>
                        This info helps match you with the right people
                    </p>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 px-4 py-2.5 rounded-xl text-sm animate-shake"
                            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div className="mb-4">
                        <label className="block text-xs font-semibold mb-1.5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                            Display Name
                        </label>
                        <input
                            type="text"
                            placeholder="Enter your name..."
                            value={name}
                            onChange={(e) => { setName(e.target.value); setError(''); }}
                            maxLength={20}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] outline-none text-sm font-medium transition-all"
                            style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                            autoFocus
                        />
                    </div>

                    {/* Gender */}
                    <div className="mb-4">
                        <label className="block text-xs font-semibold mb-1.5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 2v10l4.3-4.3" />
                            </svg>
                            Gender
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { setGender('male'); setError(''); }}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${gender === 'male'
                                        ? 'bg-blue-500/20 border-blue-500 text-blue-400 scale-[1.02]'
                                        : 'bg-[var(--bg-tertiary)] border-[var(--border)] hover:border-blue-500/50'
                                    }`}
                                style={{ border: `2px solid ${gender === 'male' ? '#3b82f6' : 'var(--border)'}` }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="10" cy="14" r="6" /><line x1="22" y1="2" x2="14" y2="10" /><polyline points="22 8 22 2 16 2" />
                                </svg>
                                Male
                            </button>
                            <button
                                onClick={() => { setGender('female'); setError(''); }}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${gender === 'female'
                                        ? 'bg-pink-500/20 border-pink-500 text-pink-400 scale-[1.02]'
                                        : 'bg-[var(--bg-tertiary)] border-[var(--border)] hover:border-pink-500/50'
                                    }`}
                                style={{ border: `2px solid ${gender === 'female' ? '#ec4899' : 'var(--border)'}` }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="8" r="6" /><line x1="12" y1="14" x2="12" y2="22" /><line x1="9" y1="19" x2="15" y2="19" />
                                </svg>
                                Female
                            </button>
                        </div>
                    </div>

                    {/* Age */}
                    <div className="mb-6">
                        <label className="block text-xs font-semibold mb-1.5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Age
                        </label>
                        <input
                            type="number"
                            placeholder="Enter your age..."
                            value={age}
                            onChange={(e) => { setAge(e.target.value); setError(''); }}
                            min="13" max="100"
                            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] outline-none text-sm font-medium transition-all"
                            style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>

                    {/* Avatar Selection */}
                    <div className="mb-6">
                        <label className="block text-xs font-semibold mb-1.5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                            </svg>
                            Choose Your Avatar
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {[...Array(8)].map((_, i) => {
                                const seed = name ? `${name}${i}` : `avatar${i}`;
                                const avatarUrl = gender === 'female'
                                    ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&hairprobability=100&hair=long01,long02,long03,long04`
                                    : gender === 'male'
                                        ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&hairprobability=100&hair=short01,short02,short03`
                                        : `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSelectedAvatar(avatarUrl)}
                                        className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${selectedAvatar === avatarUrl ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] ring-opacity-30 scale-105' : 'border-[var(--border)]'}`}
                                    >
                                        <img src={avatarUrl} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover bg-[var(--bg-tertiary)]" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        className="w-full btn-glow py-3.5 rounded-xl text-lg font-semibold flex items-center justify-center gap-2"
                    >
                        Start Chatting
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>

                    <p className="text-[10px] text-center mt-4" style={{ color: 'var(--text-muted)' }}>
                        Your info is stored locally and never shared with anyone.
                    </p>
                </div>
            </div>
        </div>
    );
}
