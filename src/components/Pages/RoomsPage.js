'use client';
import { useSocket } from '@/context/SocketContext';
import { useState, useMemo } from 'react';

const CATEGORIES = ['All', 'General', 'Social', 'Regional', 'Entertainment', 'Tech', 'Creative', 'Education', 'Sports', 'Lifestyle', '18+'];

export default function RoomsPage({ onNavigate }) {
    const { rooms } = useSocket();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            const matchesCategory = selectedCategory === 'All' || room.category === selectedCategory;
            const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.description?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [rooms, selectedCategory, searchQuery]);

    return (
        <div className="h-full overflow-y-auto pb-20 md:pb-4">
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="font-display font-bold text-3xl gradient-text mb-2">Chat Rooms</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Join a room and start chatting instantly</p>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <div className="chat-input-area flex items-center gap-3 px-4 py-3">
                        <span className="text-lg">🔍</span>
                        <input
                            type="text"
                            placeholder="Search rooms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-sm"
                            style={{ color: 'var(--text-primary)' }}
                        />
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex-shrink-0
                ${selectedCategory === cat
                                    ? 'text-white'
                                    : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                            style={selectedCategory === cat ? { background: 'var(--gradient-primary)' } : {}}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Rooms Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredRooms.map((room, i) => (
                        <button
                            key={room.id}
                            onClick={() => onNavigate('room', room)}
                            className="room-card glass rounded-2xl p-5 text-left group animate-slide-up"
                            style={{ animationDelay: `${i * 0.05}s` }}
                        >
                            {/* Room Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                                    {room.icon}
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        {room.userCount || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Room Info */}
                            <h3 className="font-display font-semibold mb-1 group-hover:text-[var(--accent)] transition-colors"
                                style={{ color: 'var(--text-primary)' }}>
                                {room.name?.replace(room.icon, '').trim()}
                            </h3>
                            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                                {room.description}
                            </p>

                            {/* Last Message */}
                            {room.lastMessage && (
                                <div className="text-xs truncate px-2 py-1.5 rounded-lg bg-[var(--bg-tertiary)]"
                                    style={{ color: 'var(--text-muted)' }}>
                                    <strong style={{ color: 'var(--text-secondary)' }}>{room.lastMessage.userName}:</strong>{' '}
                                    {room.lastMessage.text?.slice(0, 40)}
                                </div>
                            )}

                            {/* Join Indicator */}
                            <div className="mt-3 flex items-center gap-2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent)]">
                                <span>Join Room →</span>
                            </div>

                            {/* NSFW badge */}
                            {room.nsfw && (
                                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400">
                                    18+
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {filteredRooms.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">🔍</div>
                        <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>No rooms found</p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Try a different category or search</p>
                    </div>
                )}
            </div>
        </div>
    );
}
