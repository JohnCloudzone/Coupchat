'use client';
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getBotProfiles, getBotsForRoom, getRandomBotReply } from '@/lib/botProfiles';
import { useAuth } from '@/context/AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
    const { authUser, profile: authProfile } = useAuth();
    // Keeps "socket" name for compatibility with all the existing components
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [user, setUser] = useState(null);
    const [rooms, setRooms] = useState([]);
    const defaultRooms = [
        // General
        { id: 'general', name: '💬 General Chat', category: 'General', description: 'Talk about anything!', icon: '💬', userCount: 15 },
        { id: 'chill', name: '🧊 Chill Lounge', category: 'General', description: 'Relax and vibe', icon: '🧊', userCount: 10 },
        { id: 'night-owls', name: '🦉 Night Owls', category: 'General', description: 'Late night conversations', icon: '🦉', userCount: 5 },
        // Social
        { id: 'dating', name: '❤️ Dating & Flirting', category: 'Social', description: 'Find your match', icon: '❤️', userCount: 20 },
        { id: 'confessions', name: '🤫 Confessions', category: 'Social', description: 'Share your secrets anonymously', icon: '🤫', userCount: 10 },
        { id: 'friendship', name: '🤝 Make Friends', category: 'Social', description: 'Find lifelong friends', icon: '🤝', userCount: 8 },
        // Gaming
        { id: 'gaming', name: '🎮 Gaming', category: 'Gaming', description: 'Gamers unite!', icon: '🎮', userCount: 12 },
        { id: 'valorant', name: '🔫 Valorant', category: 'Gaming', description: 'Talk strats and find teammates', icon: '🔫', userCount: 5 },
        { id: 'minecraft', name: '⛏️ Minecraft', category: 'Gaming', description: 'Build together', icon: '⛏️', userCount: 4 },
        // Regional
        { id: 'india', name: '🇮🇳 India Connect', category: 'Regional', description: 'Desi chat room', icon: '🇮🇳', userCount: 25 },
        { id: 'hindi', name: '🗣️ Hindi Chat', category: 'Regional', description: 'हिंदी में बात करो', icon: '🗣️', userCount: 15 },
        // Entertainment
        { id: 'anime', name: '🔥 Anime & Manga', category: 'Entertainment', description: 'Otaku paradise', icon: '🔥', userCount: 10 },
        { id: 'music', name: '🎵 Music Lovers', category: 'Entertainment', description: 'Share your playlists', icon: '🎵', userCount: 8 },
        { id: 'memes', name: '😂 Memes', category: 'Entertainment', description: 'Share the funniest memes', icon: '😂', userCount: 12 },
        // 18+
        { id: 'adults-only', name: '🔞 Adults Only', category: '18+', description: 'Age restricted chat', icon: '🔞', userCount: 15, nsfw: true },
        { id: 'roleplay', name: '🎭 Roleplay', category: '18+', description: 'Creative roleplay', icon: '🎭', userCount: 8, nsfw: true },
    ];
    const [notifications, setNotifications] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [totalUnread, setTotalUnread] = useState(0);

    const channelRef = useRef(null);
    const addNotifRef = useRef(null);
    const eventEmitterRef = useRef({});
    const userRef = useRef(null);

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

    const triggerEvent = useCallback((eventName, payload) => {
        if (eventEmitterRef.current[eventName]) {
            eventEmitterRef.current[eventName].forEach(cb => cb(payload));
        }
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

        const currentUser = {
            guestId,
            name: profile?.name || guestName,
            gender: profile?.gender || '',
            age: profile?.age || '',
            avatar: profile?.avatar || ''
        };
        setUser(currentUser);
        userRef.current = currentUser;

        // 1. Supabase Global Presence Channel
        const globalChannel = supabase.channel('global:presence', {
            config: { presence: { key: guestId } }
        });
        channelRef.current = globalChannel;

        const allBots = getBotProfiles();
        const botCount = allBots.length;

        globalChannel
            .on('presence', { event: 'sync' }, () => {
                const state = globalChannel.presenceState();
                const realCount = Object.keys(state).length;
                setOnlineCount((realCount > 0 ? realCount : 1) + botCount);

                const realUsers = Object.values(state).map(arr => arr[0]);
                const mergedUsers = [...realUsers, ...allBots];
                triggerEvent('online-users-list', { users: mergedUsers });
                triggerEvent('all-online-users', { users: mergedUsers });

                const activeStreams = realUsers.filter(u => u.stream).map(u => ({
                    ...u.stream,
                    streamerId: u.guestId,
                    streamerName: u.name,
                    viewerCount: u.stream.viewerCount || 0
                }));
                const mockStreams = allBots.slice(0, 3).map((b, i) => ({
                    id: `mock_stream_${b.guestId}`,
                    title: `${b.name} is live!`,
                    category: ['Chat', 'Music', 'Gaming'][i],
                    streamerId: b.guestId,
                    streamerName: b.name,
                    viewerCount: 25 + i * 12
                }));
                triggerEvent('stream-list-update', { streams: [...activeStreams, ...mockStreams] });
            })
            .on('broadcast', { event: 'global-event' }, (payload) => {
                const { type, data, targetGuestId } = payload.payload;
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
                
                if (type === 'viewer-joined' && userRef.current.stream?.id === data.streamId) {
                    userRef.current.stream.viewerCount = (userRef.current.stream.viewerCount || 0) + 1;
                    channelRef.current.track(userRef.current);
                    channelRef.current.send({
                        type: 'broadcast', event: 'global-event', payload: {
                            type: 'stream-viewer-count',
                            data: { streamId: data.streamId, count: userRef.current.stream.viewerCount }
                        }
                    });
                    triggerEvent('stream-viewer-count', { streamId: data.streamId, count: userRef.current.stream.viewerCount });
                }
                if (type === 'viewer-left' && userRef.current.stream?.id === data.streamId) {
                    userRef.current.stream.viewerCount = Math.max(0, (userRef.current.stream.viewerCount || 0) - 1);
                    channelRef.current.track(userRef.current);
                    channelRef.current.send({
                        type: 'broadcast', event: 'global-event', payload: {
                            type: 'stream-viewer-count',
                            data: { streamId: data.streamId, count: userRef.current.stream.viewerCount }
                        }
                    });
                    triggerEvent('stream-viewer-count', { streamId: data.streamId, count: userRef.current.stream.viewerCount });
                }
                if (type === 'stream-chat') {
                    triggerEvent('stream-new-chat', data);
                }
                if (type === 'stream-viewer-count') {
                    triggerEvent('stream-viewer-count', data);
                }
                if (type === 'stream-ended') {
                    triggerEvent('stream-ended', data);
                }

                triggerEvent(type, data);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    setConnected(true);
                    await globalChannel.track(userRef.current);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    setConnected(false);
                }
            });

        // 2. Mock Socket Definition
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
                const channel = channelRef.current;
                if (!channel) return;

                const bots = getBotProfiles();
                if (event === 'create-room') {
                    const roomId = `${data.name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
                    const newRoom = {
                        id: roomId,
                        name: data.name,
                        category: 'Custom',
                        description: data.topic,
                        icon: '🏠',
                        creator_id: userRef.current.guestId,
                        is_private: data.isPrivate,
                        max_users: data.maxUsers
                    };

                    const { error } = await supabase.from('rooms').insert(newRoom);
                    if (!error) {
                        setRooms(prev => [newRoom, ...prev]);
                        triggerEvent('room-created', { room: newRoom });
                    } else {
                        triggerEvent('room-create-error', { error: 'Failed to create room in database' });
                    }
                } else if (event === 'get-all-online-users' || event === 'get-online-users') {
                    const state = channel.presenceState();
                    const realUsers = Object.values(state).map(arr => arr[0]);
                    const mergedUsers = [...realUsers, ...bots];
                    triggerEvent(event === 'get-online-users' ? 'online-users-list' : 'all-online-users', { users: mergedUsers });
                } else if (event === 'search-users') {
                    const state = channel.presenceState();
                    const q = (data.query || '').toLowerCase();
                    const realUsers = Object.values(state).map(arr => arr[0]);
                    const mergedUsers = [...realUsers, ...bots];
                    const filtered = mergedUsers.filter(u => u.name.toLowerCase().includes(q) && u.guestId !== userRef.current.guestId);
                    triggerEvent('search-results', { results: filtered });
                } else if (event === 'start-stream') {
                    const streamId = `stream_${Date.now()}`;
                    const newStream = { id: streamId, title: data.title, category: data.category, startedAt: Date.now(), viewerCount: 0 };
                    userRef.current.stream = newStream;
                    channel.track(userRef.current);
                    setTimeout(() => triggerEvent('stream-started', { stream: { ...newStream, streamerName: userRef.current.name } }), 100);
                } else if (event === 'stop-stream') {
                    if (userRef.current.stream) {
                        const streamId = userRef.current.stream.id;
                        userRef.current.stream = null;
                        channel.track(userRef.current);
                        channel.send({ type: 'broadcast', event: 'global-event', payload: { type: 'stream-ended', data: { streamId: streamId } } });
                    }
                } else if (event === 'join-stream') {
                    channel.send({ type: 'broadcast', event: 'global-event', payload: { type: 'viewer-joined', data: { streamId: data.streamId } } });
                    const state = channel.presenceState();
                    const realUsers = Object.values(state).map(arr => arr[0]);
                    const streamer = realUsers.find(u => u.stream?.id === data.streamId);
                    
                    if (streamer) {
                        setTimeout(() => triggerEvent('stream-joined', { 
                            stream: { ...streamer.stream, streamerName: streamer.name, streamerId: streamer.guestId }, messages: [] 
                        }), 100);
                    } else if (data.streamId.startsWith('mock_stream_')) {
                        const botGuestId = data.streamId.replace('mock_stream_', '');
                        const bot = bots.find(b => b.guestId === botGuestId);
                        if (bot) {
                            setTimeout(() => triggerEvent('stream-joined', { 
                                stream: { id: data.streamId, title: `${bot.name} is live!`, category: 'Chat', streamerName: bot.name, streamerId: bot.guestId, viewerCount: 25 }, messages: [] 
                            }), 100);
                        }
                    }
                } else if (event === 'leave-stream') {
                    channel.send({ type: 'broadcast', event: 'global-event', payload: { type: 'viewer-left', data: { streamId: data.streamId } } });
                } else if (event === 'stream-chat') {
                    const chatMsg = { streamId: data.streamId, message: { user: userRef.current.name, text: data.text, isGift: data.type === 'gift' } };
                    channel.send({ type: 'broadcast', event: 'global-event', payload: { type: 'stream-chat', data: chatMsg } });
                    triggerEvent('stream-new-chat', chatMsg);
                    
                    if (data.streamId.startsWith('mock_stream_')) {
                        setTimeout(() => {
                            const botGuestId = data.streamId.replace('mock_stream_', '');
                            const bot = bots.find(b => b.guestId === botGuestId);
                            triggerEvent('stream-new-chat', { streamId: data.streamId, message: { user: bot?.name || 'Streamer', text: 'Thanks for the message!', isGift: false } });
                        }, 1500);
                    }
                } else if (event === 'get-streams') {
                    const state = channel.presenceState();
                    const realUsers = Object.values(state).map(arr => arr[0]);
                    const activeStreams = realUsers.filter(u => u.stream).map(u => ({ ...u.stream, streamerId: u.guestId, streamerName: u.name, viewerCount: u.stream.viewerCount || 0 }));
                    const mockStreams = bots.slice(0, 3).map((b, i) => ({ id: `mock_stream_${b.guestId}`, title: `${b.name} is live!`, category: ['Chat', 'Music', 'Gaming'][i], streamerId: b.guestId, streamerName: b.name, viewerCount: 25 + i * 12 }));
                    setTimeout(() => triggerEvent('stream-list-update', { streams: [...activeStreams, ...mockStreams] }), 100);
                } else if (['call-incoming', 'call-ended', 'call-offer', 'call-answer', 'ice-candidate', 'dm-message', 'dm-typing', 'dm-stop-typing', 'private-typing', 'private-stop-typing', 'private-chat-ended', 'find-random', 'cancel-random', 'room-users', 'user-typing', 'user-stop-typing'].includes(event)) {
                    channel.send({
                        type: 'broadcast',
                        event: 'global-event',
                        payload: { type: event, data: data, targetGuestId: data?.targetGuestId || data?.to }
                    });
                    if (event === 'dm-message' && data.conversationId) {
                        triggerEvent('dm-new-message', data);
                        triggerEvent('private-new-message', data);
                        supabase.from('dm_messages').insert({
                            conversation_id: data.conversationId,
                            sender_id: userRef.current.guestId,
                            sender_name: userRef.current.name,
                            text: data.text,
                            image_url: data.imageUrl,
                            type: data.type || 'text'
                        }).then(() => {
                            supabase.from('conversations').update({ last_message: data.text || '📷 Image', last_message_at: new Date().toISOString() }).eq('id', data.conversationId);
                        });
                    }
                } else if (event === 'join-room') {
                    const roomId = (data?.id || data) || 'general';
                    const roomBots = getBotsForRoom(roomId, 8);
                    triggerEvent('system-message', { text: 'You joined the room', type: 'system', roomId });
                    const { data: history, error: historyError } = await supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(50);
                    if (historyError) {
                        console.error('[CoupChat] Failed to fetch room history:', historyError);
                    }
                    const formattedHistory = (history || []).reverse().map(m => ({
                        id: m.id, from: m.sender_name, fromGuestId: m.sender_id, text: m.text, timestamp: new Date(m.created_at).getTime(), type: m.type, imageUrl: m.image_url
                    }));
                    triggerEvent('message-history', { roomId, messages: formattedHistory });
                    triggerEvent('room-users', { roomId, users: [userRef.current, ...roomBots] });
                    setTimeout(() => {
                        const bot = roomBots[Math.floor(Math.random() * roomBots.length)];
                        triggerEvent('new-message', { roomId, message: { id: 'bot_' + Date.now(), from: bot.name, fromGuestId: bot.guestId, text: `Hey ${userRef.current.name}! Welcome to the room 👋`, timestamp: Date.now(), type: 'text' } });
                    }, 1500);
                } else if (event === 'send-message') {
                    const imageUrl = data.image || data.imageUrl; // Support both sent by UI
                    const msgData = { id: Date.now().toString(), from: userRef.current.name, fromGuestId: userRef.current.guestId, text: data.text, timestamp: Date.now(), type: (data.type || (imageUrl ? 'image' : 'text')), imageUrl: imageUrl };
                    const fullPayload = { roomId: data.roomId || 'general', message: msgData };
                    triggerEvent('new-message', fullPayload);
                    const { error: insertError } = await supabase.from('messages').insert({ room_id: data.roomId || 'general', sender_id: userRef.current.guestId, sender_name: userRef.current.name, text: data.text, image_url: imageUrl || null, type: (data.type || (imageUrl ? 'image' : 'text')) });
                    if (insertError) {
                        console.error('[CoupChat] Failed to save message:', insertError);
                    }
                    const roomBots = getBotsForRoom(data.roomId || 'general', 8);
                    setTimeout(() => {
                        const bot = roomBots[Math.floor(Math.random() * roomBots.length)];
                        triggerEvent('new-message', { roomId: data.roomId || 'general', message: { id: 'bot_reply_' + Date.now(), from: bot.name, fromGuestId: bot.guestId, text: getRandomBotReply(), timestamp: Date.now(), type: 'text' } });
                    }, 2000 + Math.random() * 2000);
                    channel.send({ type: 'broadcast', event: 'global-event', payload: { type: 'new-message', data: fullPayload } });
                }
            }
        };
        setSocket(mockSocket);

        const loadRooms = async () => {
            const { data } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
            setRooms([...defaultRooms, ...(data || [])]);
        };
        loadRooms();

        return () => {
            supabase.removeChannel(globalChannel);
        };
    }, [triggerEvent]);

    // Effect to sync socket user with AuthContext profile
    useEffect(() => {
        if (!authProfile && !authUser) return;

        // AuthContext profile uses: display_name, avatar_url, gender, age
        // localStorage profile uses: name, avatar, gender, age
        const lsProfile = (() => { try { return JSON.parse(localStorage.getItem('coupchat-profile') || '{}'); } catch (e) { return {}; } })();

        const updatedUser = {
            guestId: localStorage.getItem('coupchat-guestId') || user?.guestId,
            name: authProfile?.display_name || authProfile?.name || lsProfile?.name || authUser?.email?.split('@')[0] || user?.name,
            gender: authProfile?.gender || lsProfile?.gender || user?.gender || '',
            age: authProfile?.age || lsProfile?.age || user?.age || '',
            avatar: authProfile?.avatar_url || authProfile?.avatar || lsProfile?.avatar || user?.avatar || '',
            tokens: authProfile?.tokens || 0
        };

        setUser(updatedUser);
        userRef.current = updatedUser;

        // Re-track presence with updated info
        if (channelRef.current && channelRef.current.state === 'joined') {
            channelRef.current.track(updatedUser);
        }
    }, [authProfile, authUser]);

    // Load DM conversations for registered users
    useEffect(() => {
        if (!authUser || !user) return;
        const loadConversations = async () => {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .or(`participant_a.eq.${user.guestId},participant_b.eq.${user.guestId}`)
                .order('last_message_at', { ascending: false });
            if (!error && data) setConversations(data);
        };
        loadConversations();
    }, [authUser, user]);

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
        const newUser = { ...user, name: p.name, gender: p.gender, age: p.age, avatar: p.avatar, tokens: p.tokens || user?.tokens || 0 };
        setUser(newUser);
        if (channelRef.current && channelRef.current.state === 'joined') {
            channelRef.current.track(newUser);
        }
    }, [user]);

    const spendTokens = useCallback(async (amount, receiverId, type = 'call_payment', description = '') => {
        if (!user || user.tokens < amount) return false;

        try {
            // 1. Update sender's tokens in DB
            const { error: senderError } = await supabase
                .from('profiles')
                .update({ tokens: user.tokens - amount })
                .eq('guest_id', user.guestId);

            if (senderError) throw senderError;

            // 2. Update receiver's tokens in DB (earnings)
            // Note: In a real app, this should be a database function/RPC for atomicity
            const { data: receiverData } = await supabase
                .from('profiles')
                .select('tokens')
                .eq('guest_id', receiverId)
                .single();

            if (receiverData) {
                await supabase
                    .from('profiles')
                    .update({ tokens: (receiverData.tokens || 0) + amount })
                    .eq('guest_id', receiverId);
            }

            // 3. Log transaction
            await supabase.from('token_transactions').insert({
                user_id: authUser?.id,
                sender_id: user.guestId,
                receiver_id: receiverId,
                amount: amount,
                type: type,
                description: description
            });

            // 4. Update local state
            const newUser = { ...user, tokens: user.tokens - amount };
            setUser(newUser);
            userRef.current = newUser;

            return true;
        } catch (err) {
            console.error('Failed to spend tokens:', err);
            return false;
        }
    }, [user, authUser]);

    return (
        <SocketContext.Provider value={{
            socket, connected, onlineCount, user, rooms, setRooms,
            updateName, updateProfile, spendTokens,
            notifications, addNotification, dismissNotification,
            conversations, setConversations, totalUnread, setTotalUnread,
        }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);
