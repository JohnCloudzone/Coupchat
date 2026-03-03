'use client';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';

const NAV_ITEMS = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'chat', label: 'Chats', icon: 'chat' },
    { id: 'rooms', label: 'Rooms', icon: 'rooms' },
    { id: 'private', label: 'Random', icon: 'random' },
    { id: 'friends', label: 'People', icon: 'friends' },
    { id: 'live', label: 'Live', icon: 'live' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
];

const ICONS = {
    home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    chat: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    rooms: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
    random: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>,
    friends: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    live: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>,
    settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
};

export default function Sidebar({ currentPage, onNavigate, onMenuToggle }) {
    const { onlineCount, user, totalUnread, notifications } = useSocket();
    const { theme } = useTheme();
    const friendNotifCount = notifications.filter(n => n.type === 'friend-request').length;

    return (
        <aside className="sidebar-desktop w-[72px] lg:w-[220px] h-full flex flex-col glass border-r border-[var(--border)]">
            {/* Logo */}
            <div className="p-3 lg:p-4 flex items-center justify-center lg:justify-start gap-3 border-b border-[var(--border)]">
                <button onClick={onMenuToggle} className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors lg:hidden"
                    style={{ color: 'var(--text-secondary)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <img src="/logo.png" alt="CoupChat" className="w-10 h-10 rounded-xl object-cover hidden lg:block" />
                <div className="hidden lg:block">
                    <h1 className="font-display font-bold text-lg gradient-text">CoupChat</h1>
                    <div className="flex items-center gap-1.5">
                        <div className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{onlineCount.toLocaleString()} online</span>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map(item => (
                    <button key={item.id} onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                              ${currentPage === item.id || (currentPage === 'room-chat' && item.id === 'rooms') || (currentPage === 'dm' && item.id === 'chat')
                                ? 'bg-[var(--accent)] bg-opacity-20 text-[var(--accent)]'
                                : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
                        <span className="flex-shrink-0">{ICONS[item.icon]}</span>
                        <span className="hidden lg:block text-sm font-medium">{item.label}</span>
                        {currentPage === item.id && <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />}
                        {item.id === 'chat' && totalUnread > 0 && (
                            <span className="absolute -top-1 -right-1 lg:static lg:ml-auto notification-badge animate-bounce-in text-[9px]">{totalUnread}</span>
                        )}
                        {item.id === 'friends' && friendNotifCount > 0 && (
                            <span className="absolute -top-1 -right-1 lg:static lg:ml-auto notification-badge animate-bounce-in text-[9px]">{friendNotifCount}</span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Logged in as */}
            {user && (
                <div className="px-3 py-2 border-t border-[var(--border)]">
                    <button onClick={onMenuToggle} className="w-full flex items-center gap-2 px-2 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border)] transition-colors">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                            style={{ background: 'var(--bg-secondary)' }}>
                            <img
                                src={user.gender === 'female'
                                    ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}&hairprobability=100&hair=long01,long02,long03,long04`
                                    : user.gender === 'male'
                                        ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}&hairprobability=100&hair=short01,short02,short03`
                                        : `https://api.dicebear.com/7.x/bottts/svg?seed=${user.guestId}`
                                }
                                alt={user.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="hidden lg:block min-w-0 flex-1 text-left">
                            <p className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Logged in as</p>
                            <p className="text-xs font-bold truncate" style={{ color: 'var(--accent)' }}>{user.name}</p>
                        </div>
                    </button>
                </div>
            )}
        </aside>
    );
}
