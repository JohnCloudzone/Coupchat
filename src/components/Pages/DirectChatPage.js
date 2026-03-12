'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import MessageFeed from '@/components/Chat/MessageFeed';
import MessageInput from '@/components/Chat/MessageInput';
import { useCallContext } from '@/app/ClientLayout';

export default function DirectChatPage({ conversation, onBack, onViewProfile }) {
    const { socket, user } = useSocket();
    const { setCallState } = useCallContext();
    const [messages, setMessages] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const [partnerOnline, setPartnerOnline] = useState(conversation?.participantOnline || false);
    const convIdRef = useRef(conversation?.id);

    useEffect(() => {
        if (!socket || !conversation) return;

        // Start DM and get messages
        socket.emit('start-dm', { targetGuestId: conversation.participantGuestId });

        const onDmStarted = (data) => {
            convIdRef.current = data.conversation.id;
            setMessages(data.messages || []);
            setPartnerOnline(data.conversation.participantOnline);
            // Mark as read
            socket.emit('mark-read', { conversationId: data.conversation.id });
        };

        const onNewMessage = (data) => {
            if (data.conversationId === convIdRef.current) {
                setMessages(prev => [...prev, data.message]);
                // Auto-mark read since user is viewing
                socket.emit('mark-read', { conversationId: data.conversationId });
            }
        };

        const onTyping = (data) => {
            if (data.conversationId === convIdRef.current) setTypingUser(data.userName);
        };
        const onStopTyping = (data) => {
            if (data.conversationId === convIdRef.current) setTypingUser(null);
        };
        const onStatusChange = (data) => {
            if (data.guestId === conversation.participantGuestId) setPartnerOnline(data.online);
        };
        const onReadReceipt = (data) => {
            if (data.conversationId === convIdRef.current) {
                setMessages(prev => prev.map(m => ({ ...m, readBy: [...(m.readBy || []), data.reader] })));
            }
        };

        socket.on('dm-started', onDmStarted);
        socket.on('dm-new-message', onNewMessage);
        socket.on('dm-user-typing', onTyping);
        socket.on('dm-user-stop-typing', onStopTyping);
        socket.on('user-status-change', onStatusChange);
        socket.on('read-receipt', onReadReceipt);

        return () => {
            socket.off('dm-started', onDmStarted);
            socket.off('dm-new-message', onNewMessage);
            socket.off('dm-user-typing', onTyping);
            socket.off('dm-user-stop-typing', onStopTyping);
            socket.off('user-status-change', onStatusChange);
            socket.off('read-receipt', onReadReceipt);
        };
    }, [socket, conversation]);

    const sendMessage = useCallback((text, image) => {
        if (!socket || !convIdRef.current) return;
        socket.emit('dm-message', {
            conversationId: convIdRef.current,
            text, image,
            type: image ? 'image' : 'text',
        });
        socket.emit('dm-stop-typing', { conversationId: convIdRef.current });
    }, [socket]);

    const handleTyping = useCallback(() => {
        if (!socket || !convIdRef.current) return;
        socket.emit('dm-typing', { conversationId: convIdRef.current });
    }, [socket]);

    // Transform messages for MessageFeed (expects userId format)
    const feedMessages = messages.map(m => ({
        ...m,
        userId: m.senderId === user?.guestId ? socket?.id : 'other',
        userName: m.senderName,
        guestId: m.senderId,
    }));

    const lastMsg = messages[messages.length - 1];
    const isRead = lastMsg?.senderId === user?.guestId && lastMsg?.readBy?.length > 1;

    return (
        <div className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] glass flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                        style={{ color: 'var(--text-secondary)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <button onClick={() => onViewProfile?.({
                        guestId: conversation.participantGuestId,
                        name: conversation.participantName,
                        gender: conversation.participantGender,
                        age: conversation.participantAge,
                        online: partnerOnline,
                    })}
                        className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:scale-110 transition-transform relative"
                        style={{ background: 'var(--bg-secondary)' }}>
                        <img
                            src={conversation.participantGender === 'female'
                                ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${conversation.participantName}&hairprobability=100&hair=long01,long02,long03,long04`
                                : conversation.participantGender === 'male'
                                    ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${conversation.participantName}&hairprobability=100&hair=short01,short02,short03`
                                    : `https://api.dicebear.com/7.x/bottts/svg?seed=${conversation.participantGuestId}`
                            }
                            alt={conversation.participantName}
                            className="w-full h-full object-cover"
                        />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-primary)] ${partnerOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                    </button>
                    <button onClick={() => onViewProfile?.({
                        guestId: conversation.participantGuestId,
                        name: conversation.participantName,
                        gender: conversation.participantGender,
                        age: conversation.participantAge,
                        online: partnerOnline,
                    })} className="text-left">
                        <h3 className="font-semibold text-sm hover:underline" style={{ color: 'var(--text-primary)' }}>
                            {conversation.participantName}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px]" style={{ color: partnerOnline ? '#22c55e' : 'var(--text-muted)' }}>
                                {partnerOnline ? 'Online' : 'Offline'}
                            </span>
                            {isRead && (
                                <span className="text-[10px] flex items-center gap-1" style={{ color: '#3b82f6' }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                    Read
                                </span>
                            )}
                        </div>
                    </button>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setCallState({ type: 'audio', isCaller: true, partner: conversation.participantGuestId })}
                        className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setCallState({ type: 'video', isCaller: true, partner: conversation.participantGuestId })}
                        className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <MessageFeed
                messages={feedMessages}
                currentUserId={socket?.id}
                typingUsers={typingUser ? [{ userName: typingUser }] : []}
            />
            <MessageInput onSend={sendMessage} onTyping={handleTyping} />
        </div>
    );
}
