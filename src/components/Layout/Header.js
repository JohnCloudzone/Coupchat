'use client';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';
import { useNavigation } from '@/app/ClientLayout';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function Header({ currentPage, room, onMenuToggle }) {
    const { onlineCount, connected, totalUnread, user } = useSocket();
    const { onNavigate } = useNavigation();
    const { theme, setTheme, themes } = useTheme();
    const { signOut, authUser, isGuest } = useAuth();
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

    const getTitle = () => {
        switch (currentPage) {
            case 'home': return 'CoupChat';
            case 'chat': return 'Chats';
            case 'rooms': return 'Chat Rooms';
            case 'room-chat': return room?.name || 'Chat Room';
            case 'private': return 'Random Chat';
            case 'friends': return 'People';
            case 'settings': return 'Profile';
            case 'dm': return 'Direct Message';
            case 'live': return 'Live';
            case 'unread': return 'Chats';
            default: return 'CoupChat';
        }
    };

    const handleSignOut = async () => {
        await signOut();
        window.location.reload();
    };

    return (
        <>
        <header className="h-14 flex items-center justify-between px-4 glass border-b border-[var(--border)] flex-shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={onMenuToggle} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors md:hidden"
                    style={{ color: 'var(--text-secondary)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                {currentPage === 'home' && (
                    <img src="/logo.png" alt="CoupChat" className="w-8 h-8 rounded-lg object-cover" />
                )}
                <h2 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                    {getTitle()}
                </h2>
                {totalUnread > 0 && (currentPage === 'chat' || currentPage === 'unread') && (
                    <span className="notification-badge text-[10px]">{totalUnread}</span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Token Balance */}
                <button
                    onClick={() => onNavigate('recharge')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass glass-hover border border-[var(--border)] transition-all hover:scale-105"
                >
                    <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{user?.tokens || 0}</span>
                    <span className="text-[10px]">🪙</span>
                </button>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-tertiary)]">
                        <div className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{onlineCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-tertiary)]">
                        {themes.map(t => (
                            <button key={t.id} onClick={() => setTheme(t.id)}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200
                          ${theme === t.id ? 'scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                                title={t.name}>
                                <div className={`w-4 h-4 rounded-full border-2 ${theme === t.id ? 'border-white' : 'border-transparent'}`}
                                    style={{ background: t.color }} />
                            </button>
                        ))}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
                        title={connected ? 'Connected' : 'Disconnected'} />

                    {/* Sign Out Button */}
                    <button
                        onClick={() => setShowSignOutConfirm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-red-500/20 transition-all"
                        title="Sign Out"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span className="hidden sm:inline text-xs font-medium">Sign Out</span>
                    </button>
                </div>
            </div>
        </header>

        {/* Sign Out Confirmation Modal */}
        {showSignOutConfirm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={() => setShowSignOutConfirm(false)}>
                <div className="glass rounded-3xl p-6 mx-4 max-w-sm w-full animate-bounce-in shadow-2xl"
                    onClick={e => e.stopPropagation()}>
                    <div className="text-center">
                        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                            style={{ background: 'rgba(239, 68, 68, 0.2)' }}>🚪</div>
                        <h3 className="font-display font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Sign Out?</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                            {authUser ? `You are logged in as ${user?.name || 'User'}. Are you sure you want to sign out?` : 'Are you sure you want to leave?'}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSignOutConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl glass glass-hover text-sm font-medium"
                                style={{ color: 'var(--text-secondary)' }}>Cancel</button>
                            <button onClick={handleSignOut}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                                style={{ background: '#ef4444' }}>Sign Out</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
