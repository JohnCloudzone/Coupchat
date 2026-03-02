'use client';
import { useState, useMemo } from 'react';

const EMOJI_DATA = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😶', '🫥', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥'],
    'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🫶', '👐', '🤲', '🙏', '💪'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🐲', '🦋', '🐙'],
    'Food': ['🍎', '🍕', '🍔', '🌮', '🍣', '🍜', '🍰', '🎂', '🍩', '🍪', '☕', '🍵', '🧃', '🍺', '🍷', '🥂', '🧁', '🍫', '🍿', '🥤'],
    'Activities': ['⚽', '🏀', '🏈', '🎮', '🎯', '🎲', '🎭', '🎨', '🎬', '🎵', '🎸', '🎹', '🎤', '🏆', '🥇', '🏅', '🎪', '🎫', '🎟️', '🎰'],
    'Symbols': ['💯', '🔥', '⭐', '✨', '💫', '🌟', '⚡', '💥', '🎉', '🎊', '❗', '❓', '💤', '💨', '🕊️', '🏳️‍🌈', '⚠️', '☮️', '♾️', '🔔'],
};

export default function EmojiPicker({ onSelect, onClose }) {
    const [activeCategory, setActiveCategory] = useState('Smileys');
    const [search, setSearch] = useState('');

    const categories = useMemo(() => Object.keys(EMOJI_DATA), []);

    const filteredEmojis = useMemo(() => {
        if (search) {
            return Object.values(EMOJI_DATA).flat();
        }
        return EMOJI_DATA[activeCategory] || [];
    }, [activeCategory, search]);

    return (
        <div className="glass rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
            style={{ width: '320px', maxHeight: '350px' }}>
            {/* Search */}
            <div className="p-2 border-b border-[var(--border)]">
                <input
                    type="text"
                    placeholder="Search emoji..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] outline-none text-sm"
                    style={{ color: 'var(--text-primary)' }}
                    autoFocus
                />
            </div>

            {/* Category Tabs */}
            {!search && (
                <div className="flex overflow-x-auto px-2 py-1 gap-1 border-b border-[var(--border)]">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                ${activeCategory === cat
                                    ? 'bg-[var(--accent)] bg-opacity-20 text-[var(--accent)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Emoji Grid */}
            <div className="p-2 overflow-y-auto" style={{ maxHeight: '220px' }}>
                <div className="grid grid-cols-8 gap-0.5">
                    {filteredEmojis.map((emoji, i) => (
                        <button
                            key={`${emoji}-${i}`}
                            onClick={() => onSelect(emoji)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-lg hover:scale-125 duration-150"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
