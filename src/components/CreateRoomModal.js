'use client';
import { useState } from 'react';
import { useSocket } from '@/context/SocketContext';

export default function CreateRoomModal({ onClose, onCreated }) {
    const { socket } = useSocket();
    const [name, setName] = useState('');
    const [topic, setTopic] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [maxUsers, setMaxUsers] = useState(50);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = () => {
        if (!name.trim() || name.trim().length < 2) {
            setError('Room name must be at least 2 characters');
            return;
        }
        if (!socket) return;
        setCreating(true);
        setError('');

        socket.emit('create-room', { name: name.trim(), topic: topic.trim(), isPrivate, maxUsers });

        socket.once('room-created', (data) => {
            setCreating(false);
            onCreated?.(data.room);
            onClose();
        });

        socket.once('room-create-error', (data) => {
            setCreating(false);
            setError(data.error);
        });

        setTimeout(() => setCreating(false), 5000);
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}>
            <div className="glass rounded-3xl p-6 mx-4 max-w-md w-full animate-bounce-in shadow-2xl"
                onClick={e => e.stopPropagation()}>
                <h2 className="font-display font-bold text-xl mb-1 gradient-text">Create My Room</h2>
                <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Create a custom chat room for your community</p>

                {error && (
                    <div className="mb-4 px-3 py-2 rounded-xl text-xs font-medium animate-shake" style={{ background: '#ef444420', color: '#ef4444' }}>
                        {error}
                    </div>
                )}

                {/* Room Name */}
                <label className="block mb-4">
                    <span className="text-xs font-medium mb-1.5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        Room Name *
                    </span>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={40}
                        placeholder="e.g. Coding Buddies" className="w-full mt-1 px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-sm outline-none"
                        style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                </label>

                {/* Topic */}
                <label className="block mb-4">
                    <span className="text-xs font-medium mb-1.5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        Topic / Description
                    </span>
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} maxLength={100}
                        placeholder="What's this room about?" className="w-full mt-1 px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-sm outline-none"
                        style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                </label>

                {/* Privacy */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-medium flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        Privacy
                    </span>
                    <div className="flex gap-2 ml-auto">
                        <button onClick={() => setIsPrivate(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!isPrivate ? 'btn-glow' : 'glass glass-hover'}`}
                            style={isPrivate ? { color: 'var(--text-secondary)' } : {}}>
                            🌐 Public
                        </button>
                        <button onClick={() => setIsPrivate(true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isPrivate ? 'btn-glow' : 'glass glass-hover'}`}
                            style={!isPrivate ? { color: 'var(--text-secondary)' } : {}}>
                            🔒 Private
                        </button>
                    </div>
                </div>

                {/* Max Users */}
                <label className="block mb-6">
                    <span className="text-xs font-medium mb-1.5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        Max Users: {maxUsers}
                    </span>
                    <input type="range" min="2" max="200" value={maxUsers} onChange={e => setMaxUsers(parseInt(e.target.value))}
                        className="w-full mt-2 accent-[var(--accent)]" />
                </label>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button onClick={handleCreate} disabled={creating}
                        className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                        {creating ? (
                            <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Creating...</>
                        ) : (
                            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Create Room</>
                        )}
                    </button>
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl glass glass-hover text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
