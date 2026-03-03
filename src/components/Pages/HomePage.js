'use client';
import { useSocket } from '@/context/SocketContext';
import { useState, useEffect } from 'react';

export default function HomePage({ onNavigate, onViewProfile, onStartDM }) {
    const { socket, onlineCount, user } = useSocket();
    const [animatedCount, setAnimatedCount] = useState(0);
    const [showOnlinePanel, setShowOnlinePanel] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        const target = onlineCount || 0;
        const duration = 2000;
        const step = Math.ceil(target / (duration / 16));
        let current = 0;
        const timer = setInterval(() => {
            current += step;
            if (current >= target) { current = target; clearInterval(timer); }
            setAnimatedCount(current);
        }, 16);
        return () => clearInterval(timer);
    }, [onlineCount]);

    const handleOnlineClick = () => {
        if (!socket) return;
        setShowOnlinePanel(true);
        setLoadingUsers(true);
        socket.emit('get-all-online-users');
        socket.once('all-online-users', (data) => {
            setOnlineUsers(data.users || []);
            setLoadingUsers(false);
        });
    };

    return (
        <div className="h-full overflow-y-auto pb-20 md:pb-4">
            {/* Hero Section */}
            <div className="relative min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
                {/* Floating Bubbles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="floating-bubble animate-float"
                            style={{
                                width: `${20 + Math.random() * 60}px`, height: `${20 + Math.random() * 60}px`,
                                left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 6}s`, animationDuration: `${6 + Math.random() * 4}s`
                            }} />
                    ))}
                </div>

                <div className="relative z-10 text-center max-w-3xl mx-auto">
                    {/* Logo */}
                    <div className="mb-6 animate-bounce-in">
                        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl glass mb-6">
                            <img src="/logo.png" alt="CoupChat" className="w-12 h-12 rounded-xl object-cover" />
                            <span className="font-display font-bold text-2xl gradient-text">CoupChat</span>
                        </div>
                    </div>

                    <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl leading-tight mb-4 animate-fade-in">
                        <span className="gradient-text">Chat with Strangers</span><br />
                        <span style={{ color: 'var(--text-primary)' }}>Worldwide</span>
                    </h1>

                    <p className="text-lg md:text-xl mb-2 animate-fade-in"
                        style={{ color: 'var(--text-secondary)', animationDelay: '0.2s' }}>
                        Free, Anonymous, No Signup Required!
                    </p>

                    {/* Clickable Live Counter */}
                    <button onClick={handleOnlineClick}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass glass-hover mb-8 animate-fade-in cursor-pointer hover:scale-105 transition-transform"
                        style={{ animationDelay: '0.3s' }}>
                        <div className="pulse-dot" />
                        <span className="font-display font-bold text-lg gradient-text">
                            {animatedCount.toLocaleString()}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }} className="text-sm">
                            people online now
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>

                    {/* Quick Join Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 animate-fade-in"
                        style={{ animationDelay: '0.5s' }}>
                        <button onClick={() => onNavigate('private')}
                            className="btn-glow w-full sm:w-auto flex items-center justify-center gap-3 text-lg py-4 px-8 rounded-2xl animate-pulse-glow">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>
                            Random Chat
                        </button>
                        <button onClick={() => onNavigate('rooms')}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 text-lg py-4 px-8 rounded-2xl glass glass-hover font-semibold transition-all duration-300 hover:scale-105"
                            style={{ color: 'var(--text-primary)' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            Group Rooms
                        </button>
                        <button onClick={() => onNavigate('private')}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 text-lg py-4 px-8 rounded-2xl glass glass-hover font-semibold transition-all duration-300 hover:scale-105"
                            style={{ color: 'var(--text-primary)' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                            Video Call
                        </button>
                    </div>

                    {user && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm animate-fade-in"
                            style={{ animationDelay: '0.7s', color: 'var(--text-muted)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            Chatting as <strong style={{ color: 'var(--accent)' }}>{user.name}</strong>
                        </div>
                    )}
                </div>

                {/* Features Grid */}
                <div className="relative z-10 w-full max-w-5xl mx-auto mt-16 px-4">
                    <h2 className="font-display font-bold text-2xl text-center mb-8 gradient-text">Why CoupChat?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                title: 'Fully Anonymous', desc: 'No signup, no tracking. Your privacy matters.',
                                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            },
                            {
                                title: 'Instant Connect', desc: 'Jump into chats in under 2 seconds.',
                                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                            },
                            {
                                title: 'Voice & Video', desc: 'HD calls with screen sharing support.',
                                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                            },
                            {
                                title: 'Global Community', desc: '20+ themed rooms for every interest.',
                                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                            },
                        ].map((f, i) => (
                            <div key={i} className="glass glass-hover rounded-2xl p-5 text-center group cursor-default animate-slide-up"
                                style={{ animationDelay: `${0.8 + i * 0.1}s` }}>
                                <div className="mb-3 flex justify-center group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                                <h3 className="font-display font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trending Rooms */}
                <div className="relative z-10 w-full max-w-5xl mx-auto mt-16 px-4 pb-8">
                    <h2 className="font-display font-bold text-2xl text-center mb-8 gradient-text">Trending Rooms</h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        {[{ icon: '🎮', name: 'Gaming' }, { icon: '❤️', name: 'Dating' }, { icon: '😂', name: 'Memes' },
                        { icon: '🇮🇳', name: 'India' }, { icon: '🎵', name: 'Music' }, { icon: '🔥', name: 'Anime' },
                        { icon: '💻', name: 'Tech' }, { icon: '🌍', name: 'Language' }].map((room, i) => (
                            <button key={i} onClick={() => onNavigate('rooms')}
                                className="glass glass-hover rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 hover:scale-105 animate-fade-in flex items-center gap-2"
                                style={{ color: 'var(--text-primary)', animationDelay: `${1.2 + i * 0.05}s` }}>
                                <span>{room.icon}</span><span>{room.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Online Users Panel */}
            {showOnlinePanel && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowOnlinePanel(false)}>
                    <div className="glass rounded-3xl p-6 mx-4 max-w-md w-full max-h-[80vh] flex flex-col animate-bounce-in shadow-2xl"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-display font-bold text-xl gradient-text flex items-center gap-2">
                                <div className="pulse-dot" />
                                {onlineUsers.length} Online Users
                            </h2>
                            <button onClick={() => setShowOnlinePanel(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]"
                                style={{ color: 'var(--text-muted)' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1">
                            {loadingUsers ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 rounded-full border-3 border-[var(--accent)] border-t-transparent animate-spin" />
                                </div>
                            ) : onlineUsers.length === 0 ? (
                                <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No other users online</p>
                            ) : (
                                onlineUsers.map((u, i) => (
                                    <div key={u.guestId}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors animate-slide-up"
                                        style={{ animationDelay: `${i * 0.03}s` }}>
                                        <button onClick={() => { setShowOnlinePanel(false); onViewProfile?.(u); }}
                                            className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 hover:scale-110 transition-transform relative"
                                            style={{ background: 'var(--bg-secondary)' }}>
                                            <img
                                                src={u.gender === 'female'
                                                    ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.name}&hairprobability=100&hair=long01,long02,long03,long04`
                                                    : u.gender === 'male'
                                                        ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.name}&hairprobability=100&hair=short01,short02,short03`
                                                        : `https://api.dicebear.com/7.x/bottts/svg?seed=${u.guestId}`
                                                }
                                                alt={u.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[var(--bg-primary)]" />
                                        </button>
                                        <button onClick={() => { setShowOnlinePanel(false); onViewProfile?.(u); }}
                                            className="flex-1 min-w-0 text-left">
                                            <p className="text-sm font-medium truncate hover:underline" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                                {u.gender === 'male' ? '♂ Male' : u.gender === 'female' ? '♀ Female' : ''}
                                                {u.age ? ` · ${u.age}y` : ''} · Online
                                            </p>
                                        </button>
                                        <button onClick={() => {
                                            setShowOnlinePanel(false);
                                            onStartDM?.({ participantGuestId: u.guestId, participantName: u.name, participantGender: u.gender, participantAge: u.age, participantOnline: true });
                                        }}
                                            className="px-3 py-1.5 rounded-lg glass glass-hover text-xs font-medium flex items-center gap-1.5"
                                            style={{ color: 'var(--accent)' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                            Chat
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
