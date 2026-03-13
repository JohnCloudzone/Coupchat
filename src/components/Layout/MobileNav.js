'use client';
import { useSocket } from '@/context/SocketContext';

const NAV_ITEMS = [
    { id: 'chat', label: 'Chats', icon: 'chat' },
    { id: 'rooms', label: 'Rooms', icon: 'rooms' },
    { id: 'games', label: 'Games', icon: 'games' },
    { id: 'live', label: 'Live', icon: 'live' },
    { id: 'settings', label: 'Profile', icon: 'profile' },
];

const ICONS = {
    chat: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    rooms: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
    games: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="11" x2="10" y2="11" /><line x1="8" y1="9" x2="8" y2="13" /><line x1="15" y1="12" x2="15.01" y2="12" /><line x1="18" y1="10" x2="18.01" y2="10" /><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" /></svg>,
    live: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>,
    profile: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
};

export default function MobileNav({ currentPage, onNavigate }) {
    const { totalUnread } = useSocket();

    return (
        <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-40 glass border-t border-[var(--border)]">
            <div className="flex items-center justify-around h-16 px-1">
                {NAV_ITEMS.map(item => (
                    <button key={item.id} onClick={() => onNavigate(item.id)}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative
                    ${currentPage === item.id || (item.id === 'chat' && currentPage === 'dm')
                                ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                        {ICONS[item.icon]}
                        <span className="text-[10px] font-medium">{item.label}</span>
                        {currentPage === item.id && (
                            <div className="absolute -top-0.5 w-6 h-1 rounded-full" style={{ background: 'var(--accent)' }} />
                        )}
                        {item.id === 'unread' && totalUnread > 0 && (
                            <span className="absolute -top-1 -right-1 notification-badge text-[9px]" style={{ minWidth: '14px', height: '14px' }}>
                                {totalUnread}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </nav>
    );
}
