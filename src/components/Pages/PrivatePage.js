'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import MessageFeed from '@/components/Chat/MessageFeed';
import MessageInput from '@/components/Chat/MessageInput';

export default function PrivatePage({ onCall }) {
    const { socket, user } = useSocket();
    const [status, setStatus] = useState('idle'); // idle, searching, matched
    const [partner, setPartner] = useState(null);
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const typingTimeout = useRef(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('waiting-match', () => setStatus('searching'));

        socket.on('match-found', (data) => {
            setStatus('matched');
            setPartner(data.partner);
            setChatId(data.chatId);
            setMessages([]);
        });

        socket.on('private-new-message', (data) => {
            if (data.chatId) {
                setMessages(prev => [...prev, data.message]);
            }
        });

        socket.on('private-user-typing', (data) => {
            setTypingUser(data.userName);
        });

        socket.on('private-user-stop-typing', () => {
            setTypingUser(null);
        });

        socket.on('private-chat-ended', (data) => {
            setStatus('idle');
            setPartner(null);
            setChatId(null);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                type: 'system',
                text: data.reason || 'Chat ended',
                timestamp: Date.now(),
            }]);
        });

        return () => {
            socket.off('waiting-match');
            socket.off('match-found');
            socket.off('private-new-message');
            socket.off('private-user-typing');
            socket.off('private-user-stop-typing');
            socket.off('private-chat-ended');
        };
    }, [socket]);

    const startSearch = useCallback(() => {
        if (!socket) return;
        setStatus('searching');
        setMessages([]);
        socket.emit('find-random', {});
    }, [socket]);

    const cancelSearch = useCallback(() => {
        if (!socket) return;
        setStatus('idle');
        socket.emit('cancel-random');
    }, [socket]);

    const endChat = useCallback(() => {
        if (!socket || !chatId) return;
        socket.emit('end-private-chat', { chatId });
        setStatus('idle');
        setPartner(null);
        setChatId(null);
    }, [socket, chatId]);

    const sendMessage = useCallback((text, image) => {
        if (!socket || !chatId) return;
        socket.emit('private-message', { chatId, text, image, type: image ? 'image' : 'text' });
        socket.emit('private-stop-typing', { chatId });
    }, [socket, chatId]);

    const handleTyping = useCallback(() => {
        if (!socket || !chatId) return;
        socket.emit('private-typing', { chatId });
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            socket.emit('private-stop-typing', { chatId });
        }, 2000);
    }, [socket, chatId]);

    const newChat = useCallback(() => {
        endChat();
        setTimeout(() => startSearch(), 300);
    }, [endChat, startSearch]);

    // Idle state
    if (status === 'idle') {
        return (
            <div className="h-full flex flex-col items-center justify-center px-4 pb-20 md:pb-4">
                <div className="max-w-md text-center">
                    <div className="mb-6 animate-bounce-in">
                        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                            <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                            <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
                            <line x1="4" y1="4" x2="9" y2="9" />
                        </svg>
                    </div>
                    <h2 className="font-display font-bold text-3xl gradient-text mb-3">
                        Random Chat
                    </h2>
                    <p className="text-base mb-8" style={{ color: 'var(--text-secondary)' }}>
                        Get matched with a random stranger. Chat anonymously, share images, or start a call!
                    </p>
                    <button
                        onClick={startSearch}
                        className="btn-glow text-lg py-4 px-10 rounded-2xl animate-pulse-glow flex items-center gap-3 mx-auto"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                            <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
                            <line x1="4" y1="4" x2="9" y2="9" />
                        </svg>
                        Start Random Chat
                    </button>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {[
                            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>, text: 'Global' },
                            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, text: 'Text' },
                            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>, text: 'Video' },
                            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>, text: 'Private' },
                        ].map((tag, i) => (
                            <span key={i} className="px-3 py-1 rounded-full glass text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                {tag.icon}
                                {tag.text}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Searching state
    if (status === 'searching') {
        return (
            <div className="h-full flex flex-col items-center justify-center px-4 pb-20 md:pb-4">
                <div className="max-w-md text-center">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin mx-auto" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
                        Finding your match...
                    </h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                        Looking for someone to chat with
                    </p>
                    <button
                        onClick={cancelSearch}
                        className="px-6 py-2.5 rounded-xl glass glass-hover font-medium text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    // Matched state — Chat UI
    return (
        <div className="h-full flex flex-col">
            {/* Partner Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] glass flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                        {partner?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {partner?.name || 'Stranger'}
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onCall && onCall({ type: 'voice', partnerId: socket?.id })}
                        className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" title="Voice Call"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onCall && onCall({ type: 'video', partnerId: socket?.id })}
                        className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" title="Video Call"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                    </button>
                    <button
                        onClick={newChat}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                        style={{ background: 'var(--gradient-primary)', color: 'white' }}
                    >
                        Next
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                    <button
                        onClick={endChat}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        title="End Chat"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <MessageFeed
                messages={messages}
                currentUserId={socket?.id}
                typingUsers={typingUser ? [{ userName: typingUser }] : []}
            />
            <MessageInput onSend={sendMessage} onTyping={handleTyping} />
        </div>
    );
}
