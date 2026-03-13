'use client';
import { useRef, useEffect, useState } from 'react';

const EMOJI_REACTIONS = ['❤️', '😂', '👍', '😮', '😢', '🔥'];

export default function MessageFeed({ messages, currentUserId, typingUsers = [], onReaction }) {
    const bottomRef = useRef(null);
    const containerRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [hoveredMsg, setHoveredMsg] = useState(null);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);

    useEffect(() => {
        if (autoScroll && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, autoScroll]);

    const handleScroll = () => {
        const el = containerRef.current;
        if (el) {
            const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
            setAutoScroll(isNearBottom);
        }
    };

    const formatTime = (ts) => {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex-1 overflow-y-auto px-4 py-3 relative" ref={containerRef} onScroll={handleScroll}>
            {/* Welcome message */}
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-5xl mb-4 animate-bounce-in">💬</div>
                    <p className="font-display font-semibold text-lg" style={{ color: 'var(--text-secondary)' }}>
                        Start the conversation!
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        Send a message, share an image, or just say hi 👋
                    </p>
                </div>
            )}

            {/* Messages */}
            <div className="space-y-2">
                {messages.map((msg, idx) => {
                    if (msg.type === 'system') {
                        return (
                            <div key={msg.id || idx} className="text-center py-2 animate-fade-in">
                                <span className="text-xs px-3 py-1 rounded-full bg-[var(--bg-tertiary)]"
                                    style={{ color: 'var(--text-muted)' }}>
                                    {msg.text}
                                </span>
                            </div>
                        );
                    }

                    const isSent = msg.fromGuestId === currentUserId;

                    return (
                        <div
                            key={msg.id || idx}
                            className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-slide-up`}
                            onMouseEnter={() => setHoveredMsg(msg.id)}
                            onMouseLeave={() => { setHoveredMsg(null); setShowReactionPicker(null); }}
                        >
                            <div className={`max-w-[75%] sm:max-w-[60%] relative group`}>
                                {/* Username */}
                                {!isSent && (
                                    <div className="text-xs font-medium mb-0.5 ml-3" style={{ color: 'var(--accent)' }}>
                                        {msg.userName}
                                    </div>
                                )}

                                {/* Message Bubble */}
                                <div className={`${isSent ? 'msg-sent' : 'msg-received'} px-4 py-2.5 relative`}>
                                    {/* Image */}
                                    {msg.image && (
                                        <div className="mb-2">
                                            <img
                                                src={msg.image}
                                                alt="Shared"
                                                className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                                style={{ maxHeight: '250px', objectFit: 'cover' }}
                                                onClick={() => setLightboxImage(msg.image)}
                                            />
                                        </div>
                                    )}

                                    {/* Text */}
                                    {msg.text && (
                                        <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--text-primary)' }}>
                                            {msg.text}
                                        </p>
                                    )}

                                    {/* Time */}
                                    <div className={`text-[10px] mt-1 ${isSent ? 'text-right' : 'text-left'}`}
                                        style={{ color: 'var(--text-muted)' }}>
                                        {formatTime(msg.timestamp)}
                                    </div>
                                </div>

                                {/* Reactions */}
                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                    <div className={`flex flex-wrap gap-1 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                                            users.length > 0 && (
                                                <button
                                                    key={emoji}
                                                    onClick={() => onReaction?.(msg.id, emoji)}
                                                    className="px-1.5 py-0.5 rounded-full text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--accent)]/20 transition-colors"
                                                    style={{ border: '1px solid var(--border)' }}
                                                >
                                                    {emoji} {users.length}
                                                </button>
                                            )
                                        ))}
                                    </div>
                                )}

                                {/* Reaction picker trigger */}
                                {hoveredMsg === msg.id && onReaction && (
                                    <div className={`absolute top-0 ${isSent ? '-left-8' : '-right-8'}`}>
                                        <button
                                            onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                                            className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs hover:scale-110 transition-transform"
                                            style={{ border: '1px solid var(--border)' }}
                                        >
                                            😊
                                        </button>
                                    </div>
                                )}

                                {/* Reaction picker */}
                                {showReactionPicker === msg.id && (
                                    <div className={`absolute -top-10 ${isSent ? 'right-0' : 'left-0'} flex gap-1 px-2 py-1.5 rounded-xl glass shadow-lg animate-bounce-in z-10`}>
                                        {EMOJI_REACTIONS.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => {
                                                    onReaction?.(msg.id, emoji);
                                                    setShowReactionPicker(null);
                                                }}
                                                className="text-lg hover:scale-125 transition-transform"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 py-2 animate-fade-in">
                        <div className="px-4 py-2 rounded-2xl bg-[var(--bg-tertiary)]" style={{ border: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {typingUsers.map(u => u.userName).join(', ')}
                                </span>
                                <div className="flex gap-0.5 ml-1">
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Scroll to bottom button */}
            {!autoScroll && (
                <button
                    onClick={() => {
                        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                        setAutoScroll(true);
                    }}
                    className="fixed bottom-24 md:bottom-20 right-6 w-10 h-10 rounded-full flex items-center justify-center shadow-lg animate-bounce-in z-20"
                    style={{ background: 'var(--gradient-primary)', color: 'white' }}
                >
                    ↓
                </button>
            )}

            {/* Image Lightbox */}
            {lightboxImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setLightboxImage(null)}>
                    <div className="relative max-w-[90vw] max-h-[90vh] animate-bounce-in">
                        <img src={lightboxImage} alt="Full size" className="max-w-full max-h-[90vh] rounded-2xl object-contain" />
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
