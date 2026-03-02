'use client';

export default function NotificationToast({ notifications, onDismiss, onOpenChat }) {
    return (
        <div className="fixed top-16 right-4 z-[80] space-y-2 max-w-sm">
            {notifications.map((notif) => (
                <div
                    key={notif.id}
                    className="glass rounded-2xl shadow-2xl p-4 animate-slide-in-right cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => {
                        if (notif.type === 'message' && notif.conversationId && onOpenChat) {
                            onOpenChat({
                                id: notif.conversationId,
                                participantGuestId: notif.fromGuestId,
                                participantName: notif.from,
                                participantOnline: true,
                            });
                        }
                        onDismiss(notif.id);
                    }}
                    style={{ borderLeft: `3px solid ${notif.type === 'message' ? 'var(--accent)' : '#22c55e'}` }}
                >
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                            {notif.type === 'message' ? '💬' : notif.type === 'friend-request' ? '👋' : notif.from?.[0]?.toUpperCase() || '!'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                    {notif.title}
                                </p>
                                <button onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
                                    className="text-xs opacity-50 hover:opacity-100 flex-shrink-0">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                                {notif.body}
                            </p>
                            {notif.type === 'message' && (
                                <p className="text-[10px] mt-1" style={{ color: 'var(--accent)' }}>Tap to open chat →</p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
