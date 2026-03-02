'use client';
import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsPage() {
    const { user, updateName } = useSocket();
    const { theme, setTheme, themes } = useTheme();
    const [displayName, setDisplayName] = useState('');
    const [saved, setSaved] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [autoAcceptCalls, setAutoAcceptCalls] = useState(false);

    useEffect(() => {
        if (user) setDisplayName(user.name);
    }, [user]);

    useEffect(() => {
        setNotifications(localStorage.getItem('coupchat-notifications') !== 'false');
        setSoundEnabled(localStorage.getItem('coupchat-sound') !== 'false');
        setAutoAcceptCalls(localStorage.getItem('coupchat-autoAccept') === 'true');
    }, []);

    const saveName = () => {
        if (displayName.trim()) {
            updateName(displayName.trim());
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const toggleSetting = (key, value, setter) => {
        setter(value);
        localStorage.setItem(`coupchat-${key}`, value.toString());
    };

    return (
        <div className="h-full overflow-y-auto pb-20 md:pb-4">
            <div className="max-w-2xl mx-auto px-4 py-6">
                <h1 className="font-display font-bold text-3xl gradient-text mb-6">Settings</h1>

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
                                    type="text"
                                    value={displayName}
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
                            <button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300
                  ${theme === t.id
                                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 scale-[1.02]'
                                        : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                                    }`}
                            >
                                <span className="text-2xl">{t.icon}</span>
                                <div className="text-left">
                                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {t.name}
                                    </div>
                                    <div className="flex gap-1.5 mt-1">
                                        <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                                        <div className="w-3 h-3 rounded-full opacity-60" style={{ background: t.color }} />
                                        <div className="w-3 h-3 rounded-full opacity-30" style={{ background: t.color }} />
                                    </div>
                                </div>
                                {theme === t.id && (
                                    <span className="ml-auto text-[var(--accent)]">✓</span>
                                )}
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
                                <button
                                    onClick={() => toggleSetting(setting.key, !setting.value, setting.setter)}
                                    className={`w-12 h-6 rounded-full transition-all duration-300 relative
                    ${setting.value ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'}`}
                                    style={{ border: '1px solid var(--border)' }}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 absolute top-0.5
                    ${setting.value ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

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
                        Version 1.0.0 · Made with ❤️
                    </p>
                </section>
            </div>
        </div>
    );
}
