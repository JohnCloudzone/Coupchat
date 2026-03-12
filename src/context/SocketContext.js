'use client';
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const SocketContext = createContext();

export function SocketProvider({ children }) {
    // Keeps "socket" name for compatibility with all the existing components
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [user, setUser] = useState(null);
    const [rooms, setRooms] = useState([
        { id: 'general', name: '💬 General Chat', category: 'General', description: 'Talk about anything!', icon: '💬', userCount: 0 },
        { id: 'gaming', name: '🎮 Gaming', category: 'Gaming', description: 'Gamers unite!', icon: '🎮', userCount: 0 },
        { id: 'dating', name: '❤️ Dating & Flirting', category: 'Social', description: 'Find your match', icon: '❤️', userCount: 0 },
        { id: 'india', name: '🇮🇳 India Connect', category: 'Regional', description: 'Desi chat room', icon: '🇮🇳', userCount: 0 },
    ]);
    const [notifications, setNotifications] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [totalUnread, setTotalUnread] = useState(0);

    const channelRef = useRef(null);
    const addNotifRef = useRef(null);
    const eventEmitterRef = useRef({});

    const addNotification = useCallback((notif) => {
        const id = Date.now().toString() + Math.random();
        const n = { ...notif, id, timestamp: Date.now() };
        setNotifications(prev => [...prev, n]);
        try {
            if (typeof window !== 'undefined') {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') audioCtx.resume();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.frequency.value = 800; gain.gain.value = 0.08;
                osc.start();
                setTimeout(() => { osc.frequency.value = 1000; setTimeout(() => { osc.stop(); audioCtx.close(); }, 100); }, 100);
            }
        } catch (e) { }
        setTimeout(() => setNotifications(prev => prev.filter(n2 => n2.id !== id)), 6000);
    }, []);

    addNotifRef.current = addNotification;

    const dismissNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    useEffect(() => {
        let guestId = localStorage.getItem('coupchat-guestId');
        let guestName = localStorage.getItem('coupchat-guestName');
        let profile = null;
        try { profile = JSON.parse(localStorage.getItem('coupchat-profile') || 'null'); } catch (e) { }

        if (!guestId) {
            guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
            localStorage.setItem('coupchat-guestId', guestId);
        }
        if (!guestName) {
            if (profile?.name) { guestName = profile.name; }
            else {
                const adj = ['Cool', 'Happy', 'Swift', 'Brave', 'Chill', 'Wild', 'Neon', 'Dark', 'Zen', 'Epic'];
                const nouns = ['Fox', 'Wolf', 'Cat', 'Bear', 'Hawk', 'Panda', 'Tiger', 'Dragon', 'Phoenix', 'Ninja'];
                guestName = `${adj[Math.floor(Math.random() * adj.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 99)}`;
            }
            localStorage.setItem('coupchat-guestName', guestName);
        }

        const currentUser = { guestId, name: profile?.name || guestName, gender: profile?.gender || '', age: profile?.age || '' };
        setUser(currentUser);

        // Supabase Global Presence Channel
        const globalChannel = supabase.channel('global:presence', {
            config: { presence: { key: guestId } }
        });

        const triggerEvent = (eventName, payload) => {
            if (eventEmitterRef.current[eventName]) {
                eventEmitterRef.current[eventName].forEach(cb => cb(payload));
            }
        };

        globalChannel
            .on('presence', { event: 'sync' }, () => {
                const state = globalChannel.presenceState();
                const count = Object.keys(state).length;
                setOnlineCount(count > 0 ? count : 1);

                // Map presence state to a list of online users
                const usersList = Object.values(state).map(arr => arr[0]);
                triggerEvent('online-users-list', { users: usersList });
                triggerEvent('all-online-users', { users: usersList });
            })
            .on('broadcast', { event: 'global-event' }, (payload) => {
                const { type, data, targetGuestId } = payload.payload;

                // If this event is targeted to a specific user, ensure it matches
                if (targetGuestId && targetGuestId !== guestId) return;

                if (type === 'dm-notification') {
                    addNotifRef.current?.({
                        title: `New message`,
                        body: `${data.from}: ${data.text || '📷 Image'}`,
                        from: data.from,
                        fromGuestId: data.fromGuestId,
                        type: 'message',
                        conversationId: data.conversationId,
                    });
                }

                // Pass the event directly to the listener router
                triggerEvent(type, data);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    setConnected(true);
                    await globalChannel.track(currentUser);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    setConnected(false);
                }
            });

        channelRef.current = globalChannel;

        // The Mock Socket wraps Supabase to prevent breaking 25+ components
        const mockSocket = {
            id: guestId,
            on: (event, callback) => {
                if (!eventEmitterRef.current[event]) eventEmitterRef.current[event] = [];
                eventEmitterRef.current[event].push(callback);
            },
            off: (event, callback) => {
                if (!eventEmitterRef.current[event]) return;
                if (callback) {
                    eventEmitterRef.current[event] = eventEmitterRef.current[event].filter(cb => cb !== callback);
                } else {
                    delete eventEmitterRef.current[event];
                }
            },
            once: (event, callback) => {
                const onceWrapper = (data) => {
                    callback(data);
                    mockSocket.off(event, onceWrapper);
                };
                mockSocket.on(event, onceWrapper);
            },
            emit: async (event, data) => {
                // Determine how to route the emitted event

                // --- 1. Purely Local App State Requests ---
                if (event === 'get-all-online-users' || event === 'get-online-users') {
                    const state = globalChannel.presenceState();
                    const usersList = Object.values(state).map(arr => arr[0]);
                    triggerEvent(event === 'get-online-users' ? 'online-users-list' : 'all-online-users', { users: usersList });
                    return;
                }

                if (event === 'search-users') {
                    const state = globalChannel.presenceState();
                    const q = (data.query || '').toLowerCase();
                    const usersList = Object.values(state)
                        .map(arr => arr[0])
                        .filter(u => u.name.toLowerCase().includes(q) && u.guestId !== guestId);
                    triggerEvent('search-results', { results: usersList });
                    return;
                }

                // --- 2. Ephemeral Broadcasts (Call Signaling, Typing Indicators) ---
                const broadcastEvents = [
                    'call-incoming', 'call-ended', 'call-offer', 'call-answer', 'ice-candidate',
                    'dm-message', 'dm-typing', 'dm-stop-typing',
                    'private-typing', 'private-stop-typing', 'private-chat-ended',
                    'find-random', 'cancel-random', 'room-users', 'user-typing', 'user-stop-typing'
                ];

                if (broadcastEvents.includes(event)) {
                    // Send to all connected clients over the global channel
                    globalChannel.send({
                        type: 'broadcast',
                        event: 'global-event',
                        payload: { type: event, data: data, targetGuestId: data?.targetGuestId || data?.to }
                    });

                    // Bounce back message history updates locally to trick the sender UI into updating
                    if (event === 'dm-message') {
                        triggerEvent('dm-new-message', data);
                        triggerEvent('private-new-message', data);
                    }
                    return;
                }

                // --- 3. Persistent Database Events (To be implemented with Supabase DB later) ---
                // For now, we simulate success for DB features so the frontend doesn't hang
                if (event === 'create-room') {
                    const newRoom = { id: data.name.toLowerCase().replace(/\s+/g, '-'), ...data, userCount: 1 };
                    setRooms(prev => [...prev, newRoom]);
                    triggerEvent('room-created', { room: newRoom });
                } else if (event === 'start-dm') {
                    triggerEvent('dm-started', { conversation: { id: `dm_${data.targetGuestId}`, participantGuestId: data.targetGuestId, messages: [] } });
                } else if (event === 'join-room') {
                    triggerEvent('system-message', { text: 'You joined the room', type: 'system' });
                    triggerEvent('message-history', { messages: [] });
                } else if (event === 'send-message') {
                    // Echo back the message locally so the sender sees it
                    triggerEvent('new-message', {
                        id: Date.now().toString(),
                        from: currentUser.name,
                        fromGuestId: currentUser.guestId,
                        text: data.text,
                        timestamp: Date.now(),
                        type: data.type || 'text',
                        imageUrl: data.image
                    });
                    // And broadcast to others
                    globalChannel.send({
                        type: 'broadcast',
                        event: 'global-event',
                        payload: { type: 'new-message', data: { ...data, from: currentUser.name, fromGuestId: currentUser.guestId } }
                    });
                } else if (event === 'get-friends') {
                    triggerEvent('friends-updated', { friends: [] });
                }
            }
        };

        setSocket(mockSocket);

        return () => {
            supabase.removeChannel(globalChannel);
        };
    }, []);

    const updateName = useCallback((newName) => {
        localStorage.setItem('coupchat-guestName', newName);
        setUser(prev => prev ? { ...prev, name: newName } : prev);
        if (channelRef.current && channelRef.current.state === 'joined') {
            channelRef.current.track({ ...user, name: newName });
        }
    }, [user]);

    const updateProfile = useCallback((p) => {
        localStorage.setItem('coupchat-profile', JSON.stringify(p));
        localStorage.setItem('coupchat-guestName', p.name);
        const newUser = { ...user, name: p.name, gender: p.gender, age: p.age };
        setUser(newUser);
        if (channelRef.current && channelRef.current.state === 'joined') {
            channelRef.current.track(newUser);
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{
            socket, connected, onlineCount, user, rooms, setRooms,
            updateName, updateProfile,
            notifications, addNotification, dismissNotification,
            conversations, setConversations, totalUnread, setTotalUnread,
        }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);
