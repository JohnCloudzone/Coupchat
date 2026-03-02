'use client';

export default function ProfileModal({ profile, onClose, onChat, onAddFriend, onBlock }) {
    if (!profile) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}>
            <div className="glass rounded-3xl p-6 mx-4 max-w-sm w-full animate-bounce-in shadow-2xl"
                onClick={e => e.stopPropagation()}>
                {/* Avatar */}
                <div className="flex flex-col items-center mb-5">
                    <div className="w-20 h-20 rounded-full mb-3 flex items-center justify-center text-3xl font-bold"
                        style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                        {profile.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <h3 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                        {profile.name || profile.guestId}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${profile.online ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <span className="text-xs font-medium" style={{ color: profile.online ? '#22c55e' : 'var(--text-muted)' }}>
                            {profile.online ? 'Online now' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="space-y-2 mb-5">
                    <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)]">
                        <span className="text-xs font-medium flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="12" r="2" /><path d="M15 10h2" /><path d="M15 14h2" /></svg>
                            Guest ID
                        </span>
                        <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{profile.guestId}</span>
                    </div>
                    {profile.gender && (
                        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)]">
                            <span className="text-xs font-medium flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                                {profile.gender === 'male' ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="10" cy="14" r="6" /><line x1="22" y1="2" x2="14" y2="10" /><polyline points="22 8 22 2 16 2" /></svg>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><circle cx="12" cy="8" r="6" /><line x1="12" y1="14" x2="12" y2="22" /><line x1="9" y1="19" x2="15" y2="19" /></svg>
                                )}
                                Gender
                            </span>
                            <span className="text-xs font-medium capitalize" style={{ color: profile.gender === 'male' ? '#3b82f6' : '#ec4899' }}>
                                {profile.gender}
                            </span>
                        </div>
                    )}
                    {profile.age > 0 && (
                        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)]">
                            <span className="text-xs font-medium flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                Age
                            </span>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{profile.age}y</span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button onClick={() => { onChat?.(profile); onClose(); }}
                        className="flex-1 btn-glow py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Chat
                    </button>
                    <button onClick={() => { onAddFriend?.(profile.guestId); }}
                        className="px-4 py-2.5 rounded-xl glass glass-hover text-sm font-medium flex items-center gap-2"
                        style={{ color: '#22c55e' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                        Add
                    </button>
                    <button onClick={() => { onBlock?.(profile.guestId); onClose(); }}
                        className="px-4 py-2.5 rounded-xl glass glass-hover text-sm font-medium flex items-center gap-2"
                        style={{ color: '#ef4444' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                        Block
                    </button>
                </div>

                {/* Close */}
                <button onClick={onClose}
                    className="w-full mt-3 py-2 rounded-xl text-xs font-medium text-center"
                    style={{ color: 'var(--text-muted)' }}>
                    Close
                </button>
            </div>
        </div>
    );
}
