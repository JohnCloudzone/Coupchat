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
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import AuthPage from '@/app/auth/page';

export const CallContext = createContext();
export const useCallContext = () => useContext(CallContext);

export const NavigationContext = createContext();
export const useNavigation = () => useContext(NavigationContext);

export default function ClientLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { authReady, authLoading, isGuest, authUser } = useAuth();

    // Determine logical "currentPage" from URL pathname
    const currentPage = pathname === '/' ? 'home'
        : pathname.startsWith('/rooms/') ? 'room-chat'
            : pathname.startsWith('/rooms') ? 'rooms'
                : pathname.startsWith('/discover') ? 'chat'
                    : pathname.startsWith('/settings') ? 'settings'
                        : pathname.startsWith('/friends') ? 'friends'
                            : pathname.startsWith('/live') ? 'live'
                                : pathname.startsWith('/dm/') ? 'dm'
                                    : pathname.startsWith('/games') ? 'games'
                                        : 'home';

    const [callState, setCallState] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showProfile, setShowProfile] = useState(null);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [zoomImage, setZoomImage] = useState(null);
    const [mounted, setMounted] = useState(false);

    const { socket, user, notifications, dismissNotification, updateProfile } = useSocket();

    useEffect(() => {
        setMounted(true);
        // Only show welcome modal for guests who haven't set up profile
        if (isGuest) {
            try {
                const profile = JSON.parse(localStorage.getItem('coupchat-profile') || 'null');
                if (!profile?.name || !profile?.gender || !profile?.age) {
                    setShowWelcome(true);
                }
            } catch (e) {
                setShowWelcome(true);
            }
        }
    }, [isGuest]);

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
            router.push('/private');
        } else if (page === 'games') {
            router.push('/games');
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
        return <div className="flex h-[100dvh] w-[100dvw] bg-[var(--bg-primary)]"></div>;
    }

    // Show loading while checking auth state
    if (authLoading) {
        return (
            <div className="flex h-[100dvh] w-[100dvw] items-center justify-center" style={{ background: 'var(--gradient-bg)' }}>
                <div className="text-center animate-bounce-in">
                    <img src="/logo.png" alt="CoupChat" className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover shadow-2xl" />
                    <div className="w-8 h-8 rounded-full border-3 border-[var(--accent)] border-t-transparent animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    // Show auth page if user hasn't logged in (neither guest nor registered)
    if (!authReady && !isGuest && !authUser) {
        return <AuthPage />;
    }

    if (showWelcome) {
        return <WelcomeModal onComplete={handleWelcomeComplete} />;
    }

    return (
        <NavigationContext.Provider value={{ onNavigate: navigateTo, onZoom: (url) => setZoomImage(url || user?.avatar || '') }}>
            <div className="flex h-[100dvh] w-[100dvw] overflow-hidden">
                <Sidebar
                    currentPage={currentPage}
                    onNavigate={navigateTo}
                    onMenuToggle={() => setShowMenu(true)}
                    onZoom={() => setZoomImage(user?.avatar || '')}
                />

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

                {zoomImage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setZoomImage(null)}>
                        <div className="relative max-w-full max-h-full animate-bounce-in" onClick={e => e.stopPropagation()}>
                            <img src={zoomImage} alt="Zoom" className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl border-4 border-[var(--accent)]" />
                            <button onClick={() => setZoomImage(null)} className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                    </div>
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
        </NavigationContext.Provider>
    );
}
