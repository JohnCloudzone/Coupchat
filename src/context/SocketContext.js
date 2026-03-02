'use client';
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const SocketContext = createContext();

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [user, setUser] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [totalUnread, setTotalUnread] = useState(0);
    const socketRef = useRef(null);
    const addNotifRef = useRef(null);

    const addNotification = useCallback((notif) => {
        const id = Date.now().toString() + Math.random();
        const n = { ...notif, id, timestamp: Date.now() };
        setNotifications(prev => [...prev, n]);
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.frequency.value = 800; gain.gain.value = 0.08;
            osc.start();
            setTimeout(() => { osc.frequency.value = 1000; setTimeout(() => { osc.stop(); audioCtx.close(); }, 100); }, 100);
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
            guestId = `guest_${uuidv4().slice(0, 8)}`;
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

        const s = io(window.location.origin, {
            query: {
                guestId,
                guestName: profile?.name || guestName,
                gender: profile?.gender || '',
                age: profile?.age?.toString() || '',
            },
            transports: ['websocket', 'polling'],
        });

        s.on('connect', () => setConnected(true));
        s.on('disconnect', () => setConnected(false));

        s.on('init', (data) => {
            setUser({ ...data.user, gender: profile?.gender, age: profile?.age });
            setOnlineCount(data.onlineCount);
            setRooms(data.rooms || []);
            setConversations(data.conversations || []);
            const unread = (data.conversations || []).reduce((sum, c) => sum + (c.unread || 0), 0);
            setTotalUnread(unread);
        });

        s.on('online-count', (count) => setOnlineCount(count));
        s.on('room-update', (data) => {
            setRooms(prev => prev.map(r => r.id === data.roomId ? { ...r, userCount: data.userCount, lastMessage: data.lastMessage || r.lastMessage } : r));
        });
        s.on('rooms-list-update', (data) => {
            if (data.rooms) setRooms(data.rooms);
        });

        // DM notifications
        s.on('dm-notification', (data) => {
            addNotifRef.current?.({
                title: `New message`,
                body: `${data.from}: ${data.text || '📷 Image'}`,
                from: data.from,
                fromGuestId: data.fromGuestId,
                type: 'message',
                conversationId: data.conversationId,
            });
        });

        // Unread updates
        s.on('unread-update', (data) => {
            setConversations(prev => {
                const updated = prev.map(c =>
                    c.id === data.conversationId ? { ...c, unread: data.unread, lastMessage: data.lastMessage } : c
                );
                // If conv doesn't exist yet, add it
                if (!updated.find(c => c.id === data.conversationId)) {
                    updated.unshift({
                        id: data.conversationId,
                        participantGuestId: data.fromGuestId,
                        participantName: data.from,
                        unread: data.unread,
                        lastMessage: data.lastMessage,
                        lastActivity: Date.now(),
                        participantOnline: true,
                    });
                }
                const newTotal = updated.reduce((sum, c) => sum + (c.unread || 0), 0);
                setTotalUnread(newTotal);
                return updated;
            });
        });

        s.on('unread-cleared', (data) => {
            setConversations(prev => {
                const updated = prev.map(c => c.id === data.conversationId ? { ...c, unread: 0 } : c);
                setTotalUnread(updated.reduce((sum, c) => sum + (c.unread || 0), 0));
                return updated;
            });
        });

        s.on('conversations-list', (data) => {
            setConversations(data.conversations || []);
            setTotalUnread((data.conversations || []).reduce((sum, c) => sum + (c.unread || 0), 0));
        });

        // Friend notifications
        s.on('friend-request', (data) => {
            addNotifRef.current?.({
                title: 'New Friend Request!',
                body: `${data.from} added you as a friend!`,
                from: data.from,
                type: 'friend-request',
            });
        });

        // User online/offline
        s.on('user-status-change', (data) => {
            setConversations(prev => prev.map(c =>
                c.participantGuestId === data.guestId ? { ...c, participantOnline: data.online, participantName: data.name || c.participantName } : c
            ));
        });

        socketRef.current = s;
        setSocket(s);
        return () => { s.disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateName = useCallback((newName) => {
        localStorage.setItem('coupchat-guestName', newName);
        setUser(prev => prev ? { ...prev, name: newName } : prev);
    }, []);

    const updateProfile = useCallback((p) => {
        localStorage.setItem('coupchat-profile', JSON.stringify(p));
        localStorage.setItem('coupchat-guestName', p.name);
        setUser(prev => prev ? { ...prev, name: p.name, gender: p.gender, age: p.age } : prev);
        // CRITICAL: Tell server about the name change immediately
        if (socketRef.current) {
            socketRef.current.emit('update-profile', { name: p.name, gender: p.gender, age: p.age });
        }
    }, []);

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
