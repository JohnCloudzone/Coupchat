'use client';
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
    const { user, updateName } = useSocket();
    const { theme, setTheme, themes } = useTheme();
    const { authUser, isGuest, uploadAvatar, signOut } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [saved, setSaved] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [autoAcceptCalls, setAutoAcceptCalls] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) setDisplayName(user.name);
    }, [user]);

    useEffect(() => {
        setNotifications(localStorage.getItem('coupchat-notifications') !== 'false');
        setSoundEnabled(localStorage.getItem('coupchat-sound') !== 'false');
        setAutoAcceptCalls(localStorage.getItem('coupchat-autoAccept') === 'true');
        try {
            const profile = JSON.parse(localStorage.getItem('coupchat-profile') || '{}');
            if (profile.avatar) setAvatarUrl(profile.avatar);
        } catch (e) { }
    }, []);

    const saveName = () => {
        if (displayName.trim()) {
            updateName(displayName.trim());
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB');
            return;
        }
        setUploading(true);
        try {
            const url = await uploadAvatar(file);
            setAvatarUrl(url);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Upload failed. Please try again.');
        }
        setUploading(false);
    };

    const toggleSetting = (key, value, setter) => {
        setter(value);
        localStorage.setItem(`coupchat-${key}`, value.toString());
    };

    const getDefaultAvatar = () => {
        if (!user) return '';
        return user.gender === 'female'
            ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}&hairprobability=100&hair=long01,long02,long03,long04`
            : user.gender === 'male'
                ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}&hairprobability=100&hair=short01,short02,short03`
                : `https://api.dicebear.com/7.x/bottts/svg?seed=${user.guestId}`;
    };

    return (
        <div className="h-full overflow-y-auto pb-20 md:pb-4">
            <div className="max-w-2xl mx-auto px-4 py-6">
                <h1 className="font-display font-bold text-3xl gradient-text mb-6">Settings</h1>

                {/* Profile Image */}
                <section className="glass rounded-2xl p-5 mb-4">
                    <h2 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                        📸 Profile Photo
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-3 border-[var(--accent)]"
                                style={{ background: 'var(--bg-secondary)' }}>
                                <img
                                    src={avatarUrl || getDefaultAvatar()}
                                    alt={user?.name || 'Avatar'}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="btn-glow px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Uploading...</>
                                ) : (
                                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> Upload Photo</>
                                )}
                            </button>
                            <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>JPG, PNG under 5MB</p>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </div>
                </section>

                {/* Profile */}
                <section className="glass rounded-2xl p-5 mb-4">
                    <h2 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                        👤 Profile
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                Display Name
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text" value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] outline-none text-sm"
                                    style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                                    maxLength={20}
                                />
                                <button onClick={saveName} className="btn-glow px-5 py-2.5 rounded-xl text-sm">
                                    {saved ? '✓ Saved' : 'Save'}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                Account Type
                            </label>
                            <div className="px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-sm flex items-center gap-2"
                                style={{ color: 'var(--accent)' }}>
                                {isGuest ? '👻 Guest Account' : `✅ Registered (${authUser?.email || 'Google'})`}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                Guest ID
                            </label>
                            <div className="px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-sm font-mono"
                                style={{ color: 'var(--accent)' }}>
                                {user?.guestId || 'Loading...'}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Themes */}
                <section className="glass rounded-2xl p-5 mb-4">
                    <h2 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                        🎨 Theme
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {themes.map(t => (
                            <button key={t.id} onClick={() => setTheme(t.id)}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300
                  ${theme === t.id ? 'border-[var(--accent)] bg-[var(--accent)]/10 scale-[1.02]' : 'border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
                                <span className="text-2xl">{t.icon}</span>
                                <div className="text-left">
                                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                                    <div className="flex gap-1.5 mt-1">
                                        <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                                        <div className="w-3 h-3 rounded-full opacity-60" style={{ background: t.color }} />
                                        <div className="w-3 h-3 rounded-full opacity-30" style={{ background: t.color }} />
                                    </div>
                                </div>
                                {theme === t.id && <span className="ml-auto text-[var(--accent)]">✓</span>}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Preferences */}
                <section className="glass rounded-2xl p-5 mb-4">
                    <h2 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                        ⚙️ Preferences
                    </h2>
                    <div className="space-y-3">
                        {[
                            { key: 'notifications', label: 'Push Notifications', desc: 'Get notified of new messages', value: notifications, setter: setNotifications },
                            { key: 'sound', label: 'Sound Effects', desc: 'Play sound on new messages', value: soundEnabled, setter: setSoundEnabled },
                            { key: 'autoAccept', label: 'Auto-Accept Calls', desc: 'Automatically accept incoming calls', value: autoAcceptCalls, setter: setAutoAcceptCalls },
                        ].map(setting => (
                            <div key={setting.key} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
                                <div>
                                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{setting.label}</div>
                                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{setting.desc}</div>
                                </div>
                                <button onClick={() => toggleSetting(setting.key, !setting.value, setting.setter)}
                                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${setting.value ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'}`}
                                    style={{ border: '1px solid var(--border)' }}>
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 absolute top-0.5 ${setting.value ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sign Out */}
                {!isGuest && (
                    <section className="glass rounded-2xl p-5 mb-4">
                        <button onClick={signOut}
                            className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            🚪 Sign Out
                        </button>
                    </section>
                )}

                {/* About */}
                <section className="glass rounded-2xl p-5">
                    <h2 className="font-display font-semibold text-lg mb-3" style={{ color: 'var(--text-primary)' }}>
                        ℹ️ About CoupChat
                    </h2>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                        CoupChat is a free, anonymous chat platform. No registration required.
                        Chat with strangers, join topic rooms, share images, and make video calls.
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Version 2.0.0 · Made with ❤️
                    </p>
                </section>
            </div>
        </div>
    );
}
