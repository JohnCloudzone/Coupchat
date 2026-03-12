'use client';

import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Layout/Sidebar';
import MobileNav from '@/components/Layout/MobileNav';
import Header from '@/components/Layout/Header';
import HamburgerMenu from '@/components/Layout/HamburgerMenu';
import ProfileModal from '@/components/ProfileModal';
import CreateRoomModal from '@/components/CreateRoomModal';
import CallPanel from '@/components/Call/CallPanel';
import CallNotification from '@/components/Call/CallNotification';
import WelcomeModal from '@/components/WelcomeModal';
import NotificationToast from '@/components/NotificationToast';
import { useSocket } from '@/context/SocketContext'; // Will be replaced by RealtimeContext later

export const CallContext = createContext();
export const useCallContext = () => useContext(CallContext);

export default function ClientLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    // Determine logical "currentPage" from URL pathname
    const currentPage = pathname === '/' ? 'home'
        : pathname.startsWith('/rooms/') ? 'room-chat'
            : pathname.startsWith('/rooms') ? 'rooms'
                : pathname.startsWith('/discover') ? 'chat'
                    : pathname.startsWith('/settings') ? 'settings'
                        : pathname.startsWith('/friends') ? 'friends'
                            : pathname.startsWith('/live') ? 'live'
                                : pathname.startsWith('/dm/') ? 'dm'
                                    : 'home';

    const [callState, setCallState] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false); // Initially false to avoid hydration mismatch, true after mount if no profile
    const [showMenu, setShowMenu] = useState(false);
    const [showProfile, setShowProfile] = useState(null);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { socket, notifications, dismissNotification, updateProfile } = useSocket();

    useEffect(() => {
        setMounted(true);
        try {
            const profile = JSON.parse(localStorage.getItem('coupchat-profile') || 'null');
            if (!profile?.name || !profile?.gender || !profile?.age) {
                setShowWelcome(true);
            }
        } catch (e) {
            setShowWelcome(true);
        }
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('call-incoming', (data) => setIncomingCall(data));
        socket.on('call-ended', () => setCallState(null));
        return () => { socket.off('call-incoming'); socket.off('call-ended'); };
    }, [socket]);

    const handleWelcomeComplete = useCallback((profile) => {
        updateProfile(profile);
        setShowWelcome(false);
    }, [updateProfile]);

    const navigateTo = useCallback((page, data) => {
        if (page === 'room' && data) {
            router.push(`/rooms/${data.id}`);
        } else if (page === 'create-room') {
            setShowCreateRoom(true);
        } else if (page === 'dm' && data?.participantGuestId) {
            // Encode minimal data in URL or use query params. For now, rely on dynamic route
            router.push(`/dm/${data.participantGuestId}`);
        } else if (page === 'home') {
            router.push('/');
        } else if (page === 'chat') {
            router.push('/discover');
        } else if (page === 'rooms') {
            router.push('/rooms');
        } else if (page === 'settings') {
            router.push('/settings');
        } else if (page === 'friends') {
            router.push('/friends');
        } else if (page === 'live') {
            router.push('/live');
        } else if (page === 'private') {
            // We need a specific route for the random stranger matching pool
            router.push('/private');
        }
    }, [router]);

    const handleStartDM = useCallback((conv) => {
        router.push(`/dm/${conv.participantGuestId}`);
    }, [router]);

    const handleViewProfile = useCallback((profile) => {
        setShowProfile(profile);
    }, []);

    const handleChatFromProfile = useCallback((profile) => {
        router.push(`/dm/${profile.guestId}`);
    }, [router]);

    if (!mounted) {
        return <div className="flex h-[100dvh] w-[100dvw] bg-[var(--bg-primary)]"></div>; // Prevent hydration mismatch Flash
    }

    if (showWelcome) {
        return <WelcomeModal onComplete={handleWelcomeComplete} />;
    }

    return (
        <div className="flex h-[100dvh] w-[100dvw] overflow-hidden">
            <Sidebar currentPage={currentPage} onNavigate={navigateTo} onMenuToggle={() => setShowMenu(true)} />

            <div className="flex-1 flex flex-col min-w-0 h-full">
                <Header currentPage={currentPage} room={null} onMenuToggle={() => setShowMenu(true)} />
                <main className="flex-1 overflow-hidden">
                    <CallContext.Provider value={{ setCallState }}>
                        {children}
                    </CallContext.Provider>
                </main>
            </div>

            <div className={`block md:hidden ${['dm', 'room-chat'].includes(currentPage) ? 'hidden' : ''}`}>
                <MobileNav currentPage={currentPage} onNavigate={navigateTo} />
            </div>

            <NotificationToast notifications={notifications} onDismiss={dismissNotification} onOpenChat={handleStartDM} />
            <HamburgerMenu isOpen={showMenu} onClose={() => setShowMenu(false)} onNavigate={navigateTo} />

            {showProfile && (
                <ProfileModal
                    profile={showProfile}
                    onClose={() => setShowProfile(null)}
                    onChat={handleChatFromProfile}
                    onAddFriend={(guestId) => socket?.emit('add-friend', { targetGuestId: guestId })}
                    onBlock={(guestId) => socket?.emit('block-user', { targetGuestId: guestId })}
                />
            )}

            {showCreateRoom && (
                <CreateRoomModal
                    onClose={() => setShowCreateRoom(false)}
                    onCreated={(room) => router.push(`/rooms/${room.id}`)}
                />
            )}

            {callState && <CallPanel callState={callState} onEnd={() => setCallState(null)} />}
            {incomingCall && (
                <CallNotification
                    call={incomingCall}
                    onAccept={(data) => { setCallState(data); setIncomingCall(null); }}
                    onReject={() => setIncomingCall(null)}
                />
            )}
        </div>
    );
}
