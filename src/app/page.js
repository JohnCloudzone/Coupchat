'use client';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import MobileNav from '@/components/Layout/MobileNav';
import Header from '@/components/Layout/Header';
import HamburgerMenu from '@/components/Layout/HamburgerMenu';
import HomePage from '@/components/Pages/HomePage';
import DiscoverPage from '@/components/Pages/DiscoverPage';
import RoomsPage from '@/components/Pages/RoomsPage';
import RoomChatPage from '@/components/Pages/RoomChatPage';
import PrivatePage from '@/components/Pages/PrivatePage';
import FriendsPage from '@/components/Pages/FriendsPage';
import SettingsPage from '@/components/Pages/SettingsPage';
import DirectChatPage from '@/components/Pages/DirectChatPage';
import LivePage from '@/components/Pages/LivePage';
import ProfileModal from '@/components/ProfileModal';
import CreateRoomModal from '@/components/CreateRoomModal';
import CallPanel from '@/components/Call/CallPanel';
import CallNotification from '@/components/Call/CallNotification';
import WelcomeModal from '@/components/WelcomeModal';
import NotificationToast from '@/components/NotificationToast';
import { useSocket } from '@/context/SocketContext';

export default function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [currentRoom, setCurrentRoom] = useState(null);
    const [callState, setCallState] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [showWelcome, setShowWelcome] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [showProfile, setShowProfile] = useState(null);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [activeConversation, setActiveConversation] = useState(null);
    const { socket, notifications, dismissNotification, updateProfile } = useSocket();

    useEffect(() => {
        try {
            const profile = JSON.parse(localStorage.getItem('coupchat-profile') || 'null');
            if (profile?.name && profile?.gender && profile?.age) setShowWelcome(false);
        } catch (e) { }
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
            setCurrentRoom(data);
            setCurrentPage('room-chat');
        } else if (page === 'create-room') {
            setShowCreateRoom(true);
        } else if (page === 'dm' && data) {
            setActiveConversation(data);
            setCurrentPage('dm');
        } else {
            setCurrentPage(page);
            setCurrentRoom(null);
            if (page !== 'dm') setActiveConversation(null);
        }
    }, []);

    const handleStartDM = useCallback((conv) => {
        setActiveConversation(conv);
        setCurrentPage('dm');
    }, []);

    const handleViewProfile = useCallback((profile) => {
        setShowProfile(profile);
    }, []);

    const handleChatFromProfile = useCallback((profile) => {
        handleStartDM({
            participantGuestId: profile.guestId,
            participantName: profile.name,
            participantGender: profile.gender,
            participantAge: profile.age,
            participantOnline: profile.online,
        });
    }, [handleStartDM]);

    const renderPage = () => {
        switch (currentPage) {
            case 'home': return <HomePage onNavigate={navigateTo} onViewProfile={handleViewProfile} onStartDM={handleStartDM} />;
            case 'chat': return <DiscoverPage onNavigate={navigateTo} onStartDM={handleStartDM} onViewProfile={handleViewProfile} />;
            case 'rooms': return <RoomsPage onNavigate={navigateTo} />;
            case 'room-chat': return <RoomChatPage room={currentRoom} onBack={() => navigateTo('rooms')} onCall={setCallState} />;
            case 'private': return <PrivatePage onCall={setCallState} />;
            case 'friends': return <FriendsPage onNavigate={navigateTo} onStartDM={handleStartDM} onViewProfile={handleViewProfile} />;
            case 'settings': return <SettingsPage />;
            case 'dm': return activeConversation ? (
                <DirectChatPage
                    conversation={activeConversation}
                    onBack={() => navigateTo('chat')}
                    onViewProfile={handleViewProfile}
                />
            ) : <DiscoverPage onNavigate={navigateTo} onStartDM={handleStartDM} onViewProfile={handleViewProfile} />;
            case 'live': return <LivePage />;
            case 'unread': return <DiscoverPage onNavigate={navigateTo} onStartDM={handleStartDM} onViewProfile={handleViewProfile} />;
            default: return <HomePage onNavigate={navigateTo} />;
        }
    };

    if (showWelcome) {
        return <WelcomeModal onComplete={handleWelcomeComplete} />;
    }

    return (
        <div className="flex h-[100dvh] w-[100dvw] overflow-hidden">
            <Sidebar currentPage={currentPage} onNavigate={navigateTo} onMenuToggle={() => setShowMenu(true)} />

            <div className="flex-1 flex flex-col min-w-0 h-full">
                <Header currentPage={currentPage} room={currentRoom} onMenuToggle={() => setShowMenu(true)} />
                <main className="flex-1 overflow-hidden">
                    {renderPage()}
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
                    onCreated={(room) => navigateTo('room', room)}
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
