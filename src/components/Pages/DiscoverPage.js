'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useNavigation } from '@/app/ClientLayout';

export default function DiscoverPage({ onNavigate: propNavigate, onStartDM, onViewProfile }) {
    const { onNavigate: contextNavigate } = useNavigation();
    const onNavigate = propNavigate || contextNavigate;
    const { socket, user, rooms, onlineCount, conversations, totalUnread } = useSocket();
    const [tab, setTab] = useState('all');
    const [search, setSearch] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchMode, setSearchMode] = useState(false);

    useEffect(() => {
        if (!socket) return;
        socket.emit('get-online-users');
        const onUsers = (data) => setOnlineUsers(data.users || []);
        const onSearch = (data) => setSearchResults(data.results || []);
        socket.on('online-users-list', onUsers);
        socket.on('search-results', onSearch);
        return () => { socket.off('online-users-list', onUsers); socket.off('search-results', onSearch); };
    }, [socket]);

    useEffect(() => {
        if (!socket || search.length < 2) { setSearchMode(false); setSearchResults([]); return; }
        setSearchMode(true);
        const t = setTimeout(() => socket.emit('search-users', { query: search }), 300);
        return () => clearTimeout(t);
    }, [search, socket]);

    const unreadConvs = conversations.filter(c => c.unread > 0);
    const sortedConvs = [...conversations].sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));

    const filteredRooms = rooms.filter(r =>
        !search || r.name?.toLowerCase().includes(search.toLowerCase())
    );

    const TABS = [
        { id: 'all', label: 'All' },
        { id: 'people', label: 'People' },
        { id: 'rooms', label: 'Rooms' },
        { id: 'unread', label: 'Unread', badge: totalUnread },
    ];

    const renderConversation = (conv, i) => (
        <button key={conv.id}
            onClick={() => onStartDM?.(conv)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors animate-slide-up"
            style={{ animationDelay: `${i * 0.03}s` }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 relative"
                style={{ background: 'var(--bg-secondary)' }}>
                <img
                    src={conv.participantGender === 'female'
                        ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${conv.participantName}&hairprobability=100&hair=long01,long02,long03,long04`
                        : conv.participantGender === 'male'
                            ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${conv.participantName}&hairprobability=100&hair=short01,short02,short03`
                            : `https://api.dicebear.com/7.x/bottts/svg?seed=${conv.participantGuestId}`
                    }
                    alt={conv.participantName}
                    className="w-full h-full object-cover"
                />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-primary)] ${conv.participantOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
            </div>
            <div className="flex-1 text-left min-w-0">
                <p className={`text-sm truncate ${conv.unread > 0 ? 'font-bold' : 'font-medium'}`}
                    style={{ color: 'var(--text-primary)' }}>
                    {conv.participantName}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {conv.participantGender ? (conv.participantGender === 'male' ? 'M' : 'F') + ' · ' : ''}
                    {conv.lastMessage?.text || 'Start chatting'}
                </p>
            </div>
            <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {conv.lastMessage?.timestamp ? formatTime(conv.lastMessage.timestamp) : ''}
                </p>
                {conv.unread > 0 && (
                    <span className="notification-badge text-[10px]" style={{ minWidth: '18px', height: '18px' }}>
                        {conv.unread}
                    </span>
                )}
            </div>
        </button>
    );

    const renderUserCard = (u, i) => (
        <div key={u.guestId}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors animate-slide-up"
            style={{ animationDelay: `${i * 0.03}s` }}>
            <button onClick={() => onViewProfile?.(u)}
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
            <button onClick={() => onViewProfile?.(u)} className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate hover:underline" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {u.gender === 'male' ? 'M' : u.gender === 'female' ? 'F' : ''}
                    {u.age ? ` · ${u.age}y` : ''} · Online
                </p>
            </button>
            <button onClick={() => onStartDM?.({ participantGuestId: u.guestId, participantName: u.name, participantGender: u.gender, participantAge: u.age, participantOnline: true })}
                className="px-3 py-1.5 rounded-lg glass glass-hover text-xs font-medium flex items-center gap-1.5"
                style={{ color: 'var(--accent)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                Chat
            </button>
        </div>
    );

    return (
        <div className="h-full overflow-y-auto pb-20 md:pb-4">
            <div className="max-w-2xl mx-auto">
                {/* Profile Banner */}
                <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-[var(--border)]">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden relative"
                        style={{ background: 'var(--bg-secondary)' }}>
                        <img
                            src={user?.avatar || (user?.gender === 'female'
                                ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.name}&hairprobability=100&hair=long01,long02,long03,long04`
                                : user?.gender === 'male'
                                    ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.name}&hairprobability=100&hair=short01,short02,short03`
                                    : `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.guestId}`)
                            }
                            alt={user?.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[var(--bg-primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</h2>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {user?.gender === 'male' ? '♂ Male' : user?.gender === 'female' ? '♀ Female' : ''}
                            {user?.age ? ` · ${user.age}y` : ''} · Online
                        </p>
                    </div>
                    <button onClick={() => onNavigate('settings')} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 py-3">
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text-primary)' }} />
                        {search && (
                            <button onClick={() => { setSearch(''); setSearchMode(false); }} style={{ color: 'var(--text-muted)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Results */}
                {searchMode && (
                    <div className="px-4 pb-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                            Search Results ({searchResults.length})
                        </h3>
                        {searchResults.length === 0 ? (
                            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No users found</p>
                        ) : (
                            <div className="space-y-1">{searchResults.map((u, i) => renderUserCard({ ...u, online: true }, i))}</div>
                        )}
                    </div>
                )}

                {/* Tabs */}
                {!searchMode && (
                    <>
                        <div className="flex border-b border-[var(--border)] px-4">
                            {TABS.map(t => (
                                <button key={t.id} onClick={() => setTab(t.id)}
                                    className={`px-4 py-2.5 text-sm font-semibold transition-all relative flex items-center gap-1.5
                          ${tab === t.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                                    {t.label}
                                    {t.badge > 0 && (
                                        <span className="notification-badge text-[9px]" style={{ minWidth: '16px', height: '16px' }}>
                                            {t.badge}
                                        </span>
                                    )}
                                    {tab === t.id && (
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full" style={{ background: 'var(--accent)' }} />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="px-4 py-3">
                            {/* ALL / PEOPLE: Random User + Conversations */}
                            {(tab === 'all' || tab === 'people') && (
                                <>
                                    <button onClick={() => onNavigate('private')}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 mb-3 rounded-2xl glass glass-hover transition-all hover:scale-[1.01]">
                                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                                            style={{ background: 'linear-gradient(135deg, #22c55e, #06b6d4)', color: 'white' }}>RAN</div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Random User</p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>m or f · tap to chat</p>
                                        </div>
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-medium">{onlineCount} online</span>
                                    </button>

                                    {sortedConvs.length > 0 && (
                                        <>
                                            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 mt-1" style={{ color: 'var(--text-muted)' }}>Your Conversations</h3>
                                            <div className="space-y-0.5">{sortedConvs.map((c, i) => renderConversation(c, i))}</div>
                                        </>
                                    )}

                                    {tab === 'people' && onlineUsers.length > 0 && (
                                        <>
                                            <div className="border-t border-[var(--border)] my-4" />
                                            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Online People ({onlineUsers.length})</h3>
                                            <div className="space-y-0.5">{onlineUsers.slice(0, 30).map((u, i) => renderUserCard({ ...u, online: true }, i))}</div>
                                        </>
                                    )}
                                </>
                            )}

                            {/* UNREAD */}
                            {tab === 'unread' && (
                                unreadConvs.length === 0 ? (
                                    <div className="text-center py-16">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" className="mx-auto mb-3 opacity-30">
                                            <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>All caught up!</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No unread messages</p>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5">{unreadConvs.map((c, i) => renderConversation(c, i))}</div>
                                )
                            )}

                            {/* ROOMS */}
                            {tab === 'rooms' && (
                                <>
                                    <button onClick={() => onNavigate('create-room')}
                                        className="w-full btn-glow py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 mb-4">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        Create My Room
                                    </button>
                                    <div className="space-y-0.5">
                                        {filteredRooms.map(room => (
                                            <button key={room.id} onClick={() => onNavigate('room', room)}
                                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
                                                <div className="w-10 h-10 rounded-full glass flex items-center justify-center text-lg flex-shrink-0">{room.icon}</div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{room.name?.replace(room.icon, '').trim()}</p>
                                                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{room.description || 'Tap to join'}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />{room.userCount || 0}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function formatTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
