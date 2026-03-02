'use client';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';

export default function Header({ currentPage, room, onMenuToggle }) {
    const { onlineCount, connected, totalUnread } = useSocket();
    const { theme, setTheme, themes } = useTheme();

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

    return (
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
            </div>
        </header>
    );
}
