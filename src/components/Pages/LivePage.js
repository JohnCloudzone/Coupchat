'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';

const CATEGORIES = ['All', 'Popular', 'Chat', 'Gaming', 'Music', 'Lifestyle', 'Creative', 'Tech'];

export default function LivePage() {
    const { socket, user } = useSocket();
    const [verified, setVerified] = useState(false);
    const [category, setCategory] = useState('All');
    const [liveStreams, setLiveStreams] = useState([]);
    const [activeStream, setActiveStream] = useState(null);
    const [streamChat, setStreamChat] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [myStream, setMyStream] = useState(null);
    const [showGoLiveModal, setShowGoLiveModal] = useState(false);
    const [streamTitle, setStreamTitle] = useState('');
    const [streamCategory, setStreamCategory] = useState('Chat');
    const [viewerCount, setViewerCount] = useState(0);
    const [streamDuration, setStreamDuration] = useState(0);
    const videoRef = useRef(null);
    const localStreamRef = useRef(null);
    const durationRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        try {
            if (localStorage.getItem('coupchat-age-verified') === 'true') setVerified(true);
        } catch (e) { }
    }, []);

    // Fetch live streams
    useEffect(() => {
        if (!socket || !verified) return;
        socket.emit('get-streams');

        const onStreamList = (data) => setLiveStreams(data.streams || []);
        const onStreamChat = (data) => {
            if (data.streamId === activeStream?.id || data.streamId === myStream?.id) {
                setStreamChat(prev => [...prev, data.message]);
            }
        };
        const onStreamViewerCount = (data) => {
            if (data.streamId === activeStream?.id || data.streamId === myStream?.id) {
                setViewerCount(data.count);
            }
        };
        const onStreamEnded = (data) => {
            if (data.streamId === activeStream?.id) {
                setActiveStream(null);
                setStreamChat([]);
            }
        };

        socket.on('stream-list-update', onStreamList);
        socket.on('stream-new-chat', onStreamChat);
        socket.on('stream-viewer-count', onStreamViewerCount);
        socket.on('stream-ended', onStreamEnded);

        return () => {
            socket.off('stream-list-update', onStreamList);
            socket.off('stream-new-chat', onStreamChat);
            socket.off('stream-viewer-count', onStreamViewerCount);
            socket.off('stream-ended', onStreamEnded);
        };
    }, [socket, verified, activeStream, myStream]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [streamChat]);

    // Set video source for broadcaster
    useEffect(() => {
        if (isStreaming && myStream && videoRef.current && localStreamRef.current) {
            videoRef.current.srcObject = localStreamRef.current;
        }
    }, [isStreaming, myStream]);

    const handleVerify = () => {
        localStorage.setItem('coupchat-age-verified', 'true');
        setVerified(true);
    };

    // Start streaming (real camera/screen)
    const handleGoLive = useCallback(async (type) => {
        if (!socket) return;
        try {
            let stream;
            if (type === 'camera') {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } else {
                stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            }
            localStreamRef.current = stream;

            socket.emit('start-stream', {
                title: streamTitle || `${user?.name}'s Live`,
                category: streamCategory,
            });

            socket.once('stream-started', (data) => {
                setMyStream(data.stream);
                setIsStreaming(true);
                setShowGoLiveModal(false);
                setStreamChat([]);
                setViewerCount(0);
                // Start duration counter
                durationRef.current = setInterval(() => setStreamDuration(prev => prev + 1), 1000);
            });
        } catch (err) {
            console.error('Failed to start stream:', err);
            alert('Could not access camera/screen. Please allow permissions.');
        }
    }, [socket, user, streamTitle, streamCategory]);

    // Stop streaming
    const handleStopStream = useCallback(() => {
        if (!socket || !myStream) return;
        socket.emit('stop-stream', { streamId: myStream.id });
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        setIsStreaming(false);
        setMyStream(null);
        setStreamChat([]);
        if (durationRef.current) clearInterval(durationRef.current);
        setStreamDuration(0);
    }, [socket, myStream]);

    // Join a stream as viewer
    const handleJoinStream = useCallback((stream) => {
        if (!socket) return;
        socket.emit('join-stream', { streamId: stream.id });
        socket.once('stream-joined', (data) => {
            setActiveStream(data.stream);
            setStreamChat(data.messages || []);
            setViewerCount(data.stream.viewerCount || 0);
        });
    }, [socket]);

    // Leave stream
    const handleLeaveStream = useCallback(() => {
        if (!socket || !activeStream) return;
        socket.emit('leave-stream', { streamId: activeStream.id });
        setActiveStream(null);
        setStreamChat([]);
    }, [socket, activeStream]);

    // Send chat message
    const sendStreamChat = () => {
        if (!chatInput.trim() || !socket) return;
        const streamId = activeStream?.id || myStream?.id;
        if (!streamId) return;
        socket.emit('stream-chat', { streamId, text: chatInput.trim() });
        setChatInput('');
    };

    const formatDuration = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const filteredStreams = category === 'All'
        ? [...liveStreams].sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0))
        : category === 'Popular'
            ? [...liveStreams].sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0)).slice(0, 6)
            : liveStreams.filter(s => s.category === category);

    // Age verification gate
    if (!verified) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <div className="glass rounded-3xl p-8 max-w-sm w-full text-center animate-bounce-in shadow-2xl">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
                        style={{ background: 'var(--gradient-primary)' }}>🔞</div>
                    <h2 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>Age Verification</h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                        This section contains content for adults only. You must be 18 years or older to continue.
                    </p>
                    <button onClick={handleVerify}
                        className="w-full btn-glow py-3 rounded-xl text-sm font-semibold mb-3">I am 18+ years old — Enter</button>
                    <button onClick={() => window.history.back()}
                        className="w-full py-3 rounded-xl glass glass-hover text-sm font-medium"
                        style={{ color: 'var(--text-secondary)' }}>Go Back</button>
                </div>
            </div>
        );
    }

    // Go Live Modal
    if (showGoLiveModal) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <div className="glass rounded-3xl p-6 max-w-md w-full animate-bounce-in shadow-2xl">
                    <h2 className="font-display font-bold text-xl gradient-text mb-1">Go Live</h2>
                    <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Start broadcasting to everyone on CoupChat</p>

                    <label className="block mb-4">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Stream Title</span>
                        <input type="text" value={streamTitle} onChange={e => setStreamTitle(e.target.value)} maxLength={60}
                            placeholder={`${user?.name}'s Live`}
                            className="w-full mt-1 px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-sm outline-none"
                            style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                    </label>

                    <label className="block mb-5">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Category</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {['Chat', 'Gaming', 'Music', 'Lifestyle', 'Creative', 'Tech'].map(cat => (
                                <button key={cat} onClick={() => setStreamCategory(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${streamCategory === cat ? 'btn-glow' : 'glass glass-hover'}`}
                                    style={streamCategory !== cat ? { color: 'var(--text-secondary)' } : {}}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </label>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button onClick={() => handleGoLive('camera')}
                            className="btn-glow py-3 rounded-xl text-sm font-semibold flex flex-col items-center gap-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                            Camera
                        </button>
                        <button onClick={() => handleGoLive('screen')}
                            className="py-3 rounded-xl text-sm font-semibold flex flex-col items-center gap-2 glass glass-hover"
                            style={{ color: 'var(--text-primary)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                            Screen Share
                        </button>
                    </div>

                    <button onClick={() => setShowGoLiveModal(false)}
                        className="w-full py-2.5 rounded-xl text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                </div>
            </div>
        );
    }

    // Active streaming (broadcaster view)
    if (isStreaming && myStream) {
        return (
            <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] glass flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600 text-white text-xs font-bold">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{myStream.title}</h3>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                👁 {viewerCount} viewers · ⏱ {formatDuration(streamDuration)}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleStopStream}
                        className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                        style={{ background: '#ef4444', color: 'white' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                        End Stream
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row">
                    <div className="flex-1 bg-black flex items-center justify-center relative">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-contain"
                            style={{ maxHeight: '60vh' }} />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px]">👁 {viewerCount}</span>
                        </div>
                    </div>
                    {/* Chat sidebar */}
                    <div className="w-full md:w-80 flex flex-col border-l border-[var(--border)] max-h-[35vh] md:max-h-none">
                        <div className="px-3 py-2 border-b border-[var(--border)]">
                            <h4 className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Live Chat</h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {streamChat.length === 0 && <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>Say hello! 👋</p>}
                            {streamChat.map((msg, i) => (
                                <div key={i} className="text-xs"><span className="font-bold" style={{ color: 'var(--accent)' }}>{msg.user}: </span>
                                    <span style={{ color: 'var(--text-primary)' }}>{msg.text}</span></div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-2 border-t border-[var(--border)] flex gap-2">
                            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendStreamChat()}
                                placeholder="Type..." className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-xs outline-none"
                                style={{ color: 'var(--text-primary)' }} />
                            <button onClick={sendStreamChat} className="px-3 py-2 rounded-lg btn-glow text-xs">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Watching a stream (viewer)
    if (activeStream) {
        return (
            <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] glass flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={handleLeaveStream} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]" style={{ color: 'var(--text-secondary)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                        <div>
                            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{activeStream.title}</h3>
                            <p className="text-[10px] flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE</span>
                                <span>👁 {viewerCount}</span>
                                <span>by {activeStream.streamerName}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row">
                    <div className="flex-1 bg-black flex items-center justify-center min-h-[200px]">
                        <div className="text-center p-8">
                            <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold"
                                style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                                {activeStream.streamerName?.[0]?.toUpperCase() || '?'}
                            </div>
                            <p className="text-white text-lg font-semibold mb-1">{activeStream.title}</p>
                            <p className="text-gray-400 text-sm">by {activeStream.streamerName}</p>
                            <div className="flex items-center justify-center gap-1 mt-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-red-400 text-xs font-bold">LIVE</span>
                                <span className="text-gray-500 text-xs ml-2">· {activeStream.category}</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-80 flex flex-col border-l border-[var(--border)] max-h-[35vh] md:max-h-none">
                        <div className="px-3 py-2 border-b border-[var(--border)]">
                            <h4 className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Live Chat</h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {streamChat.length === 0 && <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>Say hello! 👋</p>}
                            {streamChat.map((msg, i) => (
                                <div key={i} className="text-xs"><span className="font-bold" style={{ color: 'var(--accent)' }}>{msg.user}: </span>
                                    <span style={{ color: 'var(--text-primary)' }}>{msg.text}</span></div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-2 border-t border-[var(--border)] flex gap-2">
                            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendStreamChat()}
                                placeholder="Type..." className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-xs outline-none"
                                style={{ color: 'var(--text-primary)' }} />
                            <button onClick={sendStreamChat} className="px-3 py-2 rounded-lg btn-glow text-xs">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Streams grid
    return (
        <div className="h-full overflow-y-auto pb-20 md:pb-4">
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="font-display font-bold text-2xl gradient-text">Live</h1>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Watch and broadcast live streams</p>
                    </div>
                    <button onClick={() => setShowGoLiveModal(true)}
                        className="btn-glow px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Go Live
                    </button>
                </div>

                {/* Categories */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                      ${category === cat ? 'btn-glow' : 'glass glass-hover'}`}
                            style={category !== cat ? { color: 'var(--text-secondary)' } : {}}>
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Live Streams */}
                {filteredStreams.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl glass">📡</div>
                        <h3 className="font-display font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No Live Streams</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Be the first to go live!</p>
                        <button onClick={() => setShowGoLiveModal(true)}
                            className="btn-glow px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mx-auto">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            Start Streaming
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredStreams.map(stream => (
                            <button key={stream.id} onClick={() => handleJoinStream(stream)}
                                className="group rounded-2xl overflow-hidden glass hover:scale-[1.02] transition-all text-left">
                                <div className="aspect-video bg-[var(--bg-tertiary)] flex items-center justify-center relative">
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform"
                                        style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                                        {stream.streamerName?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-bold">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                                    </div>
                                    <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px]">
                                        👁 {stream.viewerCount || 0}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{stream.title}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{stream.streamerName}</p>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)]" style={{ color: 'var(--text-muted)' }}>
                                            {stream.category}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
