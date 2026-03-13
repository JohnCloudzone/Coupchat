'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useNavigation } from '@/app/ClientLayout';
import MessageFeed from '@/components/Chat/MessageFeed';
import MessageInput from '@/components/Chat/MessageInput';

export default function FriendsPage({ onNavigate: propNavigate, onStartDM, onViewProfile }) {
    const { onNavigate: contextNavigate } = useNavigation();
    const onNavigate = propNavigate || contextNavigate;
    const { socket, user, conversations } = useSocket();
    const [friends, setFriends] = useState([]);
    const [friendId, setFriendId] = useState('');
    const [notification, setNotification] = useState('');
    const [activeChat, setActiveChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const [friendProfiles, setFriendProfiles] = useState({});

    useEffect(() => {
        if (!socket) return;
        socket.emit('get-friends');

        const onFriendsUpdated = (data) => {
            setFriends(data.friends || []);
            (data.friends || []).forEach(fId => {
                socket.emit('get-user-profile', { targetGuestId: fId });
            });
        };

        const onFriendRequest = (data) => {
            setNotification(`${data.from} added you as a friend!`);
            setTimeout(() => setNotification(''), 5000);
        };

        const onFriendChatStarted = (data) => {
            const { chatId, friendGuestId } = data;
            setActiveChat(prev => {
                if (prev && prev.guestId === friendGuestId) return { ...prev, chatId };
                return prev;
            });
        };

        const onPrivateMessageHistory = (data) => {
            if (data.chatId && data.messages) setChatMessages(data.messages);
        };

        const onPrivateNewMessage = (data) => {
            if (data.chatId && activeChat?.chatId === data.chatId) {
                setChatMessages(prev => [...prev, data.message]);
            }
        };

        const onPrivateTyping = (data) => setTypingUser(data.userName);
        const onPrivateStopTyping = () => setTypingUser(null);

        const onUserProfile = (data) => {
            if (data.guestId) setFriendProfiles(prev => ({ ...prev, [data.guestId]: data }));
        };

        socket.on('friends-updated', onFriendsUpdated);
        socket.on('friend-request', onFriendRequest);
        socket.on('friend-chat-started', onFriendChatStarted);
        socket.on('private-message-history', onPrivateMessageHistory);
        socket.on('private-new-message', onPrivateNewMessage);
        socket.on('private-user-typing', onPrivateTyping);
        socket.on('private-user-stop-typing', onPrivateStopTyping);
        socket.on('user-profile', onUserProfile);

        return () => {
            socket.off('friends-updated', onFriendsUpdated);
            socket.off('friend-request', onFriendRequest);
            socket.off('friend-chat-started', onFriendChatStarted);
            socket.off('private-message-history', onPrivateMessageHistory);
            socket.off('private-new-message', onPrivateNewMessage);
            socket.off('private-user-typing', onPrivateTyping);
            socket.off('private-user-stop-typing', onPrivateStopTyping);
            socket.off('user-profile', onUserProfile);
        };
    }, [socket, activeChat]);

    const addFriend = () => {
        if (!socket || !friendId.trim()) return;
        socket.emit('add-friend', { targetGuestId: friendId.trim() });
        setFriendId('');
        setNotification('Friend request sent!');
        setTimeout(() => setNotification(''), 3000);
    };

    const startFriendChat = useCallback((fId, name) => {
        // Use the new DM system if onStartDM exists
        if (onStartDM) {
            const profile = friendProfiles[fId];
            onStartDM({
                participantGuestId: fId,
                participantName: name || profile?.name || fId,
                participantGender: profile?.gender || '',
                participantAge: profile?.age || 0,
                participantOnline: profile?.online || false,
            });
            return;
        }
        // Legacy: in-page chat
        if (!socket) return;
        socket.emit('start-friend-chat', { targetGuestId: fId });
        setActiveChat({ guestId: fId, name: name || friendProfiles[fId]?.name || fId, chatId: null });
        setChatMessages([]);
    }, [socket, friendProfiles, onStartDM]);

    const handleViewProfile = useCallback((fId) => {
        const profile = friendProfiles[fId];
        if (onViewProfile) {
            onViewProfile(profile || { guestId: fId, name: fId, gender: '', age: 0, online: false });
        }
    }, [friendProfiles, onViewProfile]);

    const sendMessage = useCallback((text, image) => {
        if (!socket || !activeChat?.chatId) return;
        socket.emit('private-message', { chatId: activeChat.chatId, text, image, type: image ? 'image' : 'text' });
        socket.emit('private-stop-typing', { chatId: activeChat.chatId });
    }, [socket, activeChat]);

    const handleTyping = useCallback(() => {
        if (!socket || !activeChat?.chatId) return;
        socket.emit('private-typing', { chatId: activeChat.chatId });
    }, [socket, activeChat]);

    const closeChat = () => { setActiveChat(null); setTypingUser(null); setChatMessages([]); };

    // Recent conversations from DM system (replaces old chatHistory)
    const recentConvs = conversations
        .sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0))
        .slice(0, 10);

    // Active chat view (legacy in-page)
    if (activeChat) {
        return (
            <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] glass flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={closeChat} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                            style={{ color: 'var(--text-secondary)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                        <button onClick={() => handleViewProfile(activeChat.guestId)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:scale-110 transition-transform"
                            style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                            {activeChat.name?.[0]?.toUpperCase() || '?'}
                        </button>
                        <button onClick={() => handleViewProfile(activeChat.guestId)} className="text-left">
                            <h3 className="font-semibold text-sm hover:underline" style={{ color: 'var(--text-primary)' }}>{activeChat.name}</h3>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Click to view profile</span>
                        </button>
                    </div>
                </div>
                {!activeChat.chatId ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin mx-auto mb-4" />
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Connecting...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <MessageFeed messages={chatMessages} currentUserId={socket?.id} typingUsers={typingUser ? [{ userName: typingUser }] : []} />
                        <MessageInput onSend={sendMessage} onTyping={handleTyping} />
                    </>
                )}
            </div>
        );
    }

    // Friends list view
    return (
        <div className="h-full overflow-y-auto pb-20 md:pb-4">
            <div className="max-w-2xl mx-auto px-4 py-6">
                <h1 className="font-display font-bold text-3xl gradient-text mb-2">People</h1>
                <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Add friends and chat anytime</p>

                {notification && (
                    <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium animate-slide-up"
                        style={{ background: 'var(--gradient-primary)', color: 'white' }}>{notification}</div>
                )}

                {/* Your ID */}
                <div className="glass rounded-2xl p-5 mb-4">
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="12" r="2" /><path d="M15 10h2" /><path d="M15 14h2" /></svg>
                        Your Friend ID
                    </h3>
                    <div className="flex items-center gap-3">
                        <code className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-sm font-mono" style={{ color: 'var(--accent)' }}>
                            {user?.guestId || 'Loading...'}
                        </code>
                        <button onClick={() => { navigator.clipboard.writeText(user?.guestId || ''); setNotification('ID copied!'); setTimeout(() => setNotification(''), 2000); }}
                            className="px-4 py-2.5 rounded-xl glass glass-hover text-sm font-medium flex items-center gap-2"
                            style={{ color: 'var(--text-primary)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                            Copy
                        </button>
                    </div>
                </div>

                {/* Add Friend */}
                <div className="glass rounded-2xl p-5 mb-4">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                        Add Friend by ID
                    </h3>
                    <div className="flex items-center gap-3">
                        <input type="text" placeholder="Enter friend's ID..." value={friendId}
                            onChange={(e) => setFriendId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addFriend()}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] outline-none text-sm"
                            style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                        <button onClick={addFriend} className="btn-glow px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Add
                        </button>
                    </div>
                </div>

                {/* Friends List */}
                <div className="glass rounded-2xl p-5 mb-4">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        Your Friends ({friends.length})
                    </h3>
                    {friends.length === 0 ? (
                        <div className="text-center py-12">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" className="mx-auto mb-4 opacity-40">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No friends yet. Share your ID or add someone!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {friends.map((fId, i) => {
                                const profile = friendProfiles[fId];
                                const displayName = profile?.name || fId;
                                return (
                                    <div key={fId} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors animate-slide-up"
                                        style={{ animationDelay: `${i * 0.05}s` }}>
                                        <button onClick={() => handleViewProfile(fId)} className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 relative"
                                                style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                                                {displayName[0]?.toUpperCase()}
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-primary)] ${profile?.online ? 'bg-green-500' : 'bg-gray-500'}`} />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-sm font-medium truncate hover:underline" style={{ color: 'var(--text-primary)' }}>{displayName}</p>
                                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                                    {profile?.online ? 'Online' : 'Offline'}
                                                    {profile?.gender ? ` · ${profile.gender}` : ''}
                                                    {profile?.age ? ` · ${profile.age}y` : ''}
                                                </span>
                                            </div>
                                        </button>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => startFriendChat(fId, displayName)}
                                                className="p-2 rounded-lg hover:bg-[var(--accent)]/20 transition-colors" title="Chat">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                            </button>
                                            <button className="p-2 rounded-lg hover:bg-green-500/20 transition-colors" title="Voice Call">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                            </button>
                                            <button className="p-2 rounded-lg hover:bg-blue-500/20 transition-colors" title="Video Call">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Conversations from DM system */}
                <div className="glass rounded-2xl p-5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        Recent Conversations
                    </h3>
                    {recentConvs.length === 0 ? (
                        <div className="text-center py-8">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" className="mx-auto mb-3 opacity-40">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No conversations yet. Start chatting with a friend!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentConvs.map(conv => (
                                <button key={conv.id}
                                    onClick={() => onStartDM ? onStartDM(conv) : startFriendChat(conv.participantGuestId, conv.participantName)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-left">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 relative"
                                        style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                                        {(conv.participantName || '?')[0]?.toUpperCase()}
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-primary)] ${conv.participantOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm truncate ${conv.unread > 0 ? 'font-bold' : 'font-medium'}`} style={{ color: 'var(--text-primary)' }}>
                                                {conv.participantName}
                                            </span>
                                            <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                                                {conv.lastMessage?.timestamp ? new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                            {conv.lastMessage?.text || 'Start chatting'}
                                        </p>
                                    </div>
                                    {conv.unread > 0 && (
                                        <span className="notification-badge text-[10px]">{conv.unread}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
