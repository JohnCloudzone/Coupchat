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
    const [rooms, setRooms] = useState([
        // General
        { id: 'general', name: '💬 General Chat', category: 'General', description: 'Talk about anything!', icon: '💬', userCount: Math.floor(Math.random() * 40) + 15 },
        { id: 'chill', name: '🧊 Chill Lounge', category: 'General', description: 'Relax and vibe', icon: '🧊', userCount: Math.floor(Math.random() * 25) + 10 },
        { id: 'night-owls', name: '🦉 Night Owls', category: 'General', description: 'Late night conversations', icon: '🦉', userCount: Math.floor(Math.random() * 20) + 5 },
        // Social
        { id: 'dating', name: '❤️ Dating & Flirting', category: 'Social', description: 'Find your match', icon: '❤️', userCount: Math.floor(Math.random() * 50) + 20 },
        { id: 'confessions', name: '🤫 Confessions', category: 'Social', description: 'Share your secrets anonymously', icon: '🤫', userCount: Math.floor(Math.random() * 30) + 10 },
        { id: 'friendship', name: '🤝 Make Friends', category: 'Social', description: 'Find lifelong friends', icon: '🤝', userCount: Math.floor(Math.random() * 20) + 8 },
        // Gaming
        { id: 'gaming', name: '🎮 Gaming', category: 'Gaming', description: 'Gamers unite!', icon: '🎮', userCount: Math.floor(Math.random() * 35) + 12 },
        { id: 'valorant', name: '🔫 Valorant', category: 'Gaming', description: 'Talk strats and find teammates', icon: '🔫', userCount: Math.floor(Math.random() * 20) + 5 },
        { id: 'minecraft', name: '⛏️ Minecraft', category: 'Gaming', description: 'Build together', icon: '⛏️', userCount: Math.floor(Math.random() * 15) + 4 },
        // Regional
        { id: 'india', name: '🇮🇳 India Connect', category: 'Regional', description: 'Desi chat room', icon: '🇮🇳', userCount: Math.floor(Math.random() * 60) + 25 },
        { id: 'usa', name: '🇺🇸 USA Chat', category: 'Regional', description: 'American vibes', icon: '🇺🇸', userCount: Math.floor(Math.random() * 30) + 10 },
        { id: 'hindi', name: '🗣️ Hindi Chat', category: 'Regional', description: 'हिंदी में बात करो', icon: '🗣️', userCount: Math.floor(Math.random() * 40) + 15 },
        // Entertainment
        { id: 'anime', name: '🔥 Anime & Manga', category: 'Entertainment', description: 'Otaku paradise', icon: '🔥', userCount: Math.floor(Math.random() * 25) + 10 },
        { id: 'music', name: '🎵 Music Lovers', category: 'Entertainment', description: 'Share your playlists', icon: '🎵', userCount: Math.floor(Math.random() * 20) + 8 },
        { id: 'movies', name: '🎬 Movies & Shows', category: 'Entertainment', description: 'What are you watching?', icon: '🎬', userCount: Math.floor(Math.random() * 18) + 6 },
        { id: 'memes', name: '😂 Memes', category: 'Entertainment', description: 'Share the funniest memes', icon: '😂', userCount: Math.floor(Math.random() * 30) + 12 },
        // Tech
        { id: 'coding', name: '💻 Coding', category: 'Tech', description: 'Programming talk', icon: '💻', userCount: Math.floor(Math.random() * 15) + 5 },
        { id: 'tech-news', name: '📱 Tech News', category: 'Tech', description: 'Latest in technology', icon: '📱', userCount: Math.floor(Math.random() * 12) + 4 },
        // Creative
        { id: 'art', name: '🎨 Art & Design', category: 'Creative', description: 'Show off your creativity', icon: '🎨', userCount: Math.floor(Math.random() * 10) + 3 },
        { id: 'photography', name: '📸 Photography', category: 'Creative', description: 'Share your shots', icon: '📸', userCount: Math.floor(Math.random() * 8) + 2 },
        // Education
        { id: 'study', name: '📚 Study Group', category: 'Education', description: 'Study together', icon: '📚', userCount: Math.floor(Math.random() * 12) + 4 },
        { id: 'language', name: '🌍 Language Exchange', category: 'Education', description: 'Learn new languages', icon: '🌍', userCount: Math.floor(Math.random() * 10) + 3 },
        // Sports
        { id: 'cricket', name: '🏏 Cricket', category: 'Sports', description: 'IPL, World Cup & more', icon: '🏏', userCount: Math.floor(Math.random() * 25) + 10 },
        { id: 'football', name: '⚽ Football', category: 'Sports', description: 'The beautiful game', icon: '⚽', userCount: Math.floor(Math.random() * 20) + 8 },
        // Lifestyle
        { id: 'fitness', name: '💪 Fitness', category: 'Lifestyle', description: 'Health and workout tips', icon: '💪', userCount: Math.floor(Math.random() * 10) + 3 },
        { id: 'food', name: '🍕 Foodies', category: 'Lifestyle', description: 'Share recipes and food pics', icon: '🍕', userCount: Math.floor(Math.random() * 12) + 4 },
        // 18+
        { id: 'adults-only', name: '🔞 Adults Only', category: '18+', description: 'Age restricted chat', icon: '🔞', userCount: Math.floor(Math.random() * 35) + 15, nsfw: true },
        { id: 'roleplay', name: '🎭 Roleplay', category: '18+', description: 'Creative roleplay', icon: '🎭', userCount: Math.floor(Math.random() * 20) + 8, nsfw: true },
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

        const allBots = getBotProfiles();
        const botCount = allBots.length;

        globalChannel
            .on('presence', { event: 'sync' }, () => {
                const state = globalChannel.presenceState();
                const realCount = Object.keys(state).length;
                setOnlineCount((realCount > 0 ? realCount : 1) + botCount);

                // Merge real users with bot profiles
                const realUsers = Object.values(state).map(arr => arr[0]);
                const mergedUsers = [...realUsers, ...allBots];
                triggerEvent('online-users-list', { users: mergedUsers });
                triggerEvent('all-online-users', { users: mergedUsers });
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

        // Load conversations for registered users
        if (authUser) {
            const loadConversations = async () => {
                const { data, error } = await supabase
                    .from('conversations')
                    .select('*')
                    .or(`participant_a.eq.${authUser.id},participant_b.eq.${authUser.id}`)
                    .order('last_message_at', { ascending: false });
                if (!error && data) setConversations(data);
            };
            loadConversations();
        }

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
                    const realUsers = Object.values(state).map(arr => arr[0]);
                    const mergedUsers = [...realUsers, ...allBots];
                    triggerEvent(event === 'get-online-users' ? 'online-users-list' : 'all-online-users', { users: mergedUsers });
                    return;
                }

                if (event === 'search-users') {
                    const state = globalChannel.presenceState();
                    const q = (data.query || '').toLowerCase();
                    const realUsers = Object.values(state).map(arr => arr[0]);
                    const mergedUsers = [...realUsers, ...allBots];
                    const filtered = mergedUsers
                        .filter(u => u.name.toLowerCase().includes(q) && u.guestId !== guestId);
                    triggerEvent('search-results', { results: filtered });
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

                        // Save DM to database if conversationId exists
                        if (data.conversationId) {
                            supabase.from('dm_messages').insert({
                                conversation_id: data.conversationId,
                                sender_id: currentUser.guestId,
                                sender_name: currentUser.name,
                                text: data.text,
                                image_url: data.imageUrl,
                                type: data.type || 'text'
                            }).then(() => {
                                // Update last_message in conversation
                                supabase.from('conversations')
                                    .update({ last_message: data.text || '📷 Image', last_message_at: new Date().toISOString() })
                                    .eq('id', data.conversationId);
                            });
                        }
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
                    const targetId = data.targetGuestId;

                    // Try to find existing conversation
                    let { data: convo } = await supabase
                        .from('conversations')
                        .select('*')
                        .or(`and(participant_a.eq.${currentUser.guestId},participant_b.eq.${targetId}),and(participant_a.eq.${targetId},participant_b.eq.${currentUser.guestId})`)
                        .single();

                    if (!convo) {
                        // Create new conversation
                        const { data: newConvo } = await supabase
                            .from('conversations')
                            .insert({
                                participant_a: currentUser.guestId,
                                participant_b: targetId,
                                last_message: 'Started a conversation'
                            })
                            .select()
                            .single();
                        convo = newConvo;
                    }

                    if (convo) {
                        // Load messages
                        const { data: messages } = await supabase
                            .from('dm_messages')
                            .select('*')
                            .eq('conversation_id', convo.id)
                            .order('created_at', { ascending: false })
                            .limit(50);

                        const formattedMsgs = (messages || []).reverse().map(m => ({
                            id: m.id,
                            from: m.sender_name,
                            fromGuestId: m.sender_id,
                            text: m.text,
                            timestamp: new Date(m.created_at).getTime(),
                            type: m.type,
                            imageUrl: m.image_url
                        }));

                        triggerEvent('dm-started', {
                            conversation: {
                                id: convo.id,
                                participantGuestId: targetId,
                                messages: formattedMsgs
                            }
                        });
                    }
                } else if (event === 'join-room') {
                    const roomId = data || 'general';
                    const roomBots = getBotsForRoom(roomId, 8);
                    triggerEvent('system-message', { text: 'You joined the room', type: 'system' });

                    // Load message history from DB
                    const { data: history } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('room_id', roomId)
                        .order('created_at', { ascending: false })
                        .limit(50);

                    const formattedHistory = (history || []).reverse().map(m => ({
                        id: m.id,
                        from: m.sender_name,
                        fromGuestId: m.sender_id,
                        text: m.text,
                        timestamp: new Date(m.created_at).getTime(),
                        type: m.type,
                        imageUrl: m.image_url
                    }));

                    triggerEvent('message-history', { messages: formattedHistory });
                    triggerEvent('room-users', { users: [currentUser, ...roomBots] });
                    // Simulate a bot greeting after a short delay
                    setTimeout(() => {
                        const bot = roomBots[Math.floor(Math.random() * roomBots.length)];
                        triggerEvent('new-message', {
                            id: 'bot_' + Date.now(),
                            from: bot.name,
                            fromGuestId: bot.guestId,
                            text: `Hey ${currentUser.name}! Welcome to the room 👋`,
                            timestamp: Date.now(),
                            type: 'text',
                        });
                    }, 1500 + Math.random() * 2000);
                } else if (event === 'send-message') {
                    const msgData = {
                        id: Date.now().toString(),
                        from: currentUser.name,
                        fromGuestId: currentUser.guestId,
                        text: data.text,
                        timestamp: Date.now(),
                        type: data.type || 'text',
                        imageUrl: data.image
                    };

                    // Echo back the message locally so the sender sees it
                    triggerEvent('new-message', msgData);

                    // Save to DB
                    await supabase.from('messages').insert({
                        room_id: data.roomId || 'general',
                        sender_id: currentUser.guestId,
                        sender_name: currentUser.name,
                        text: data.text,
                        image_url: data.image,
                        type: data.type || 'text'
                    });

                    // Bot auto-reply after 2-5 seconds
                    const roomBots = getBotsForRoom(data.roomId || 'general', 8);
                    const replyDelay = 2000 + Math.random() * 3000;
                    setTimeout(() => {
                        const bot = roomBots[Math.floor(Math.random() * roomBots.length)];
                        triggerEvent('new-message', {
                            id: 'bot_reply_' + Date.now(),
                            from: bot.name,
                            fromGuestId: bot.guestId,
                            text: getRandomBotReply(),
                            timestamp: Date.now(),
                            type: 'text',
                        });
                    }, replyDelay);
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
