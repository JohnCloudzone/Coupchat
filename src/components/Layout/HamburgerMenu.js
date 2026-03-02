'use client';
import { useState, useRef, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';

export default function HamburgerMenu({ onNavigate, onClose, isOpen }) {
    const { user, onlineCount } = useSocket();
    const { theme, setTheme, themes } = useTheme();
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const menuItems = [
        { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>, label: 'My Profile', action: () => { onNavigate('settings'); onClose(); } },
        { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, label: 'Friends', action: () => { onNavigate('friends'); onClose(); } },
        { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>, label: 'Chat Rooms', action: () => { onNavigate('rooms'); onClose(); } },
        { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>, label: 'About CoupChat', action: () => { onNavigate('settings'); onClose(); } },
        { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>, label: 'Share App', action: () => { if (navigator.share) { navigator.share({ title: 'CoupChat', text: 'Chat with strangers!', url: window.location.href }); } onClose(); } },
    ];

    return (
        <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm animate-fade-in">
            <div ref={menuRef}
                className="absolute top-0 left-0 h-full w-72 md:w-80 glass shadow-2xl animate-slide-in-left flex flex-col"
                style={{ borderRight: '1px solid var(--border)' }}>

                {/* Profile Header */}
                <div className="p-5 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
                            style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                            {user?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</h3>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tap the pencil to edit...</p>
                        </div>
                        <button onClick={() => { onNavigate('settings'); onClose(); }}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                            style={{ color: 'var(--text-secondary)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Online
                        </span>
                        {user?.gender && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)]">
                                {user.gender === 'male' ? '♂ Male' : '♀ Female'}
                            </span>
                        )}
                        {user?.age && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)]">
                                {user.age}y
                            </span>
                        )}
                    </div>
                </div>

                {/* Menu Items */}
                <div className="flex-1 py-2">
                    {menuItems.map((item, i) => (
                        <button key={i} onClick={item.action}
                            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg-tertiary)] transition-colors"
                            style={{ color: 'var(--text-primary)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{item.icon}</span>
                            <span className="text-sm font-medium">{item.label}</span>
                        </button>
                    ))}

                    {/* Dark Theme Toggle */}
                    <div className="px-5 py-3.5 flex items-center gap-4">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                        <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>Theme</span>
                        <div className="flex gap-1.5">
                            {themes.map(t => (
                                <button key={t.id} onClick={() => setTheme(t.id)}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${theme === t.id ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
                                    style={{ background: t.color }} title={t.name} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            CoupChat v1.0
                        </span>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <div className="pulse-dot" style={{ width: '5px', height: '5px' }} />
                            {onlineCount.toLocaleString()} online
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
