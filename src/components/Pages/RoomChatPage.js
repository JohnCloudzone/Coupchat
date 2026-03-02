'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import MessageFeed from '@/components/Chat/MessageFeed';
import MessageInput from '@/components/Chat/MessageInput';
import DrawingBoard from '@/components/Chat/DrawingBoard';

export default function RoomChatPage({ room, onBack, onCall }) {
    const { socket, user } = useSocket();
    const [messages, setMessages] = useState([]);
    const [roomUsers, setRoomUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [showUsers, setShowUsers] = useState(false);
    const [showDrawing, setShowDrawing] = useState(false);
    const typingTimeouts = useRef({});

    useEffect(() => {
        if (!socket || !room) return;

        socket.emit('join-room', room.id);

        socket.on('message-history', (data) => {
            if (data.roomId === room.id) setMessages(data.messages);
        });

        socket.on('new-message', (data) => {
            if (data.roomId === room.id) {
                setMessages(prev => [...prev, data.message]);
            }
        });

        socket.on('system-message', (data) => {
            if (data.roomId === room.id) {
                setMessages(prev => [...prev, { ...data, type: 'system', id: Date.now().toString() }]);
            }
        });

        socket.on('room-users', (data) => {
            if (data.roomId === room.id) setRoomUsers(data.users);
        });

        socket.on('user-typing', (data) => {
            if (data.roomId === room.id) {
                setTypingUsers(prev => {
                    if (prev.find(u => u.userId === data.userId)) return prev;
                    return [...prev, data];
                });
            }
        });

        socket.on('user-stop-typing', (data) => {
            if (data.roomId === room.id) {
                setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
            }
        });

        socket.on('message-reaction', (data) => {
            if (data.roomId === room.id) {
                setMessages(prev => prev.map(m =>
                    m.id === data.messageId ? { ...m, reactions: data.reactions } : m
                ));
            }
        });

        return () => {
            socket.emit('leave-room', room.id);
            socket.off('message-history');
            socket.off('new-message');
            socket.off('system-message');
            socket.off('room-users');
            socket.off('user-typing');
            socket.off('user-stop-typing');
            socket.off('message-reaction');
        };
    }, [socket, room]);

    const sendMessage = useCallback((text, image) => {
        if (!socket || !room) return;
        socket.emit('send-message', {
            roomId: room.id,
            text,
            image,
            type: image ? 'image' : 'text',
        });
        socket.emit('stop-typing', { roomId: room.id });
    }, [socket, room]);

    const handleTyping = useCallback(() => {
        if (!socket || !room) return;
        socket.emit('typing', { roomId: room.id });
        clearTimeout(typingTimeouts.current.typing);
        typingTimeouts.current.typing = setTimeout(() => {
            socket.emit('stop-typing', { roomId: room.id });
        }, 2000);
    }, [socket, room]);

    const handleReaction = useCallback((messageId, emoji) => {
        if (!socket || !room) return;
        socket.emit('react-message', { roomId: room.id, messageId, emoji });
    }, [socket, room]);

    const handleDrawingSend = useCallback((imageData) => {
        sendMessage('🎨 Drawing', imageData);
        setShowDrawing(false);
    }, [sendMessage]);

    if (!room) return null;

    return (
        <div className="h-full flex flex-col">
            {/* Room Header Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] glass flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors md:hidden"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <span className="text-xl">{room.icon}</span>
                    <div>
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {room.name?.replace(room.icon, '').trim()}
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {roomUsers.length} online
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowDrawing(!showDrawing)}
                        className={`p-2 rounded-lg transition-colors ${showDrawing ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'hover:bg-[var(--bg-tertiary)]'}`}
                        title="Drawing Board"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onCall && onCall({ type: 'voice', roomId: room.id, roomName: room.name })}
                        className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                        title="Voice Call"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onCall && onCall({ type: 'video', roomId: room.id, roomName: room.name })}
                        className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                        title="Video Call"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setShowUsers(!showUsers)}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-1
              ${showUsers ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'hover:bg-[var(--bg-tertiary)]'}`}
                        title="Users"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span className="text-xs font-medium">{roomUsers.length}</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex min-h-0">
                {/* Messages */}
                <div className="flex-1 flex flex-col min-w-0">
                    {showDrawing && (
                        <DrawingBoard onSend={handleDrawingSend} onClose={() => setShowDrawing(false)} />
                    )}
                    <MessageFeed
                        messages={messages}
                        currentUserId={socket?.id}
                        typingUsers={typingUsers}
                        onReaction={handleReaction}
                    />
                    <MessageInput
                        onSend={sendMessage}
                        onTyping={handleTyping}
                    />
                </div>

                {/* Users Panel */}
                {showUsers && (
                    <div className="w-56 border-l border-[var(--border)] glass overflow-y-auto hidden md:block">
                        <div className="p-3">
                            <h4 className="font-semibold text-xs uppercase mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                                <div className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                                Online — {roomUsers.length}
                            </h4>
                            <div className="space-y-1.5">
                                {roomUsers.map(u => (
                                    <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                                            {u.name?.[0]?.toUpperCase()}
                                        </div>
                                        <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                            {u.name}
                                            {u.id === socket?.id && (
                                                <span className="text-[var(--accent)] ml-1">(you)</span>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
