const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const { v4: uuidv4 } = require('uuid');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

// ===== IN-MEMORY STORAGE =====
const rooms = {};
const users = {};
const privateChats = {};
const messageHistory = {};
const friendsList = {};
const waitingQueue = [];
const conversations = {};  // { convId: { id, participants: [guestId, guestId], messages: [], unread: { guestId: count }, lastMessage, lastActivity } }
const userRooms = {};      // { guestId: [roomId, ...] } - custom user-created rooms
const streams = {};        // For live streams later
const blockedUsers = {};   // { guestId: [blockedGuestId, ...] }

// Default rooms
const DEFAULT_ROOMS = [
    { id: 'general', name: '💬 General Chat', category: 'General', description: 'Talk about anything!', icon: '💬' },
    { id: 'gaming', name: '🎮 Gaming', category: 'Gaming', description: 'Gamers unite!', icon: '🎮' },
    { id: 'dating', name: '❤️ Dating & Romance', category: 'Social', description: 'Find your match', icon: '❤️' },
    { id: 'friendship', name: '🤝 Friendship', category: 'Social', description: 'Make new friends', icon: '🤝' },
    { id: 'india', name: '🇮🇳 India Chat', category: 'Regional', description: 'Desi vibes only', icon: '🇮🇳' },
    { id: 'usa', name: '🇺🇸 USA Chat', category: 'Regional', description: 'American conversations', icon: '🇺🇸' },
    { id: 'europe', name: '🇪🇺 Europe Chat', category: 'Regional', description: 'European community', icon: '🇪🇺' },
    { id: 'memes', name: '😂 Memes & Fun', category: 'Entertainment', description: 'Share the laughs', icon: '😂' },
    { id: 'music', name: '🎵 Music Lovers', category: 'Entertainment', description: 'Share your beats', icon: '🎵' },
    { id: 'movies', name: '🎬 Movies & TV', category: 'Entertainment', description: 'Discuss shows & films', icon: '🎬' },
    { id: 'tech', name: '💻 Tech Talk', category: 'Tech', description: 'Geek out on tech', icon: '💻' },
    { id: 'crypto', name: '₿ Crypto & Finance', category: 'Tech', description: 'Blockchain & trading', icon: '₿' },
    { id: 'art', name: '🎨 Art & Design', category: 'Creative', description: 'Creative minds', icon: '🎨' },
    { id: 'language', name: '🌍 Language Exchange', category: 'Education', description: 'Learn languages', icon: '🌍' },
    { id: 'sports', name: '⚽ Sports', category: 'Sports', description: 'Sports fans corner', icon: '⚽' },
    { id: 'anime', name: '🔥 Anime & Manga', category: 'Entertainment', description: 'Otaku paradise', icon: '🔥' },
    { id: 'nightowls', name: '🦉 Night Owls', category: 'Social', description: 'Late night chatters', icon: '🦉' },
    { id: 'confessions', name: '🤫 Confessions', category: 'Social', description: 'Share your secrets', icon: '🤫' },
    { id: 'fitness', name: '💪 Fitness & Health', category: 'Lifestyle', description: 'Stay fit together', icon: '💪' },
    { id: 'travel', name: '✈️ Travel', category: 'Lifestyle', description: 'Wanderlust stories', icon: '✈️' },
    { id: 'cooking', name: '🍳 Cooking', category: 'Lifestyle', description: 'Recipe sharing', icon: '🍳' },
    { id: 'philosophy', name: '🧠 Deep Thoughts', category: 'Education', description: 'Philosophical debates', icon: '🧠' },
    { id: 'adult', name: '🔞 18+ Only', category: '18+', description: 'Adults only', icon: '🔞', nsfw: true },
];

// Initialize default rooms
DEFAULT_ROOMS.forEach(room => {
    rooms[room.id] = { ...room, users: new Set(), messages: [], isDefault: true };
    messageHistory[room.id] = [];
});

// Purge old messages every hour
setInterval(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    Object.keys(messageHistory).forEach(roomId => {
        messageHistory[roomId] = messageHistory[roomId].filter(m => m.timestamp > cutoff);
    });
    // Purge old conversation messages too (keep last 200)
    Object.values(conversations).forEach(conv => {
        if (conv.messages.length > 200) conv.messages = conv.messages.slice(-200);
    });
}, 60 * 60 * 1000);

// Helper: find socket by guestId
function findSocketByGuestId(guestId) {
    return Object.entries(users).find(([, u]) => u.guestId === guestId);
}

// Helper: get or create conversation between two guests
function getOrCreateConversation(guestId1, guestId2) {
    // Find existing
    const existing = Object.values(conversations).find(c =>
        c.participants.includes(guestId1) && c.participants.includes(guestId2)
    );
    if (existing) return existing;

    // Create new
    const convId = `conv_${uuidv4().slice(0, 10)}`;
    conversations[convId] = {
        id: convId,
        participants: [guestId1, guestId2],
        messages: [],
        unread: { [guestId1]: 0, [guestId2]: 0 },
        lastMessage: null,
        lastActivity: Date.now(),
    };
    return conversations[convId];
}

app.prepare().then(() => {
    const server = express();
    const httpServer = createServer(server);

    const io = new Server(httpServer, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
        maxHttpBufferSize: 5e6,
    });

    let onlineCount = 0;

    function getPublicStreams() {
        return Object.values(streams)
            .filter(s => s.isLive)
            .map(s => ({
                id: s.id,
                streamerName: s.streamerName,
                streamerGuestId: s.streamerGuestId,
                title: s.title,
                category: s.category,
                viewerCount: s.viewerCount || 0,
                startedAt: s.startedAt,
                isLive: true,
            }));
    }

    io.on('connection', (socket) => {
        onlineCount++;
        const guestId = socket.handshake.query.guestId || `guest_${uuidv4().slice(0, 8)}`;
        const guestName = socket.handshake.query.guestName || `User_${Math.floor(Math.random() * 9999)}`;
        const gender = socket.handshake.query.gender || '';
        const age = parseInt(socket.handshake.query.age) || 0;

        users[socket.id] = {
            id: socket.id,
            guestId,
            name: guestName,
            gender,
            age,
            avatar: socket.handshake.query.avatar || null,
            joinedAt: Date.now(),
            currentRoom: null,
        };

        if (!friendsList[guestId]) friendsList[guestId] = [];
        if (!blockedUsers[guestId]) blockedUsers[guestId] = [];

        // Join all conversation rooms this user is part of
        Object.values(conversations).forEach(conv => {
            if (conv.participants.includes(guestId)) {
                socket.join(`conv_${conv.id}`);
            }
        });

        // Build initial conversations list for this user
        const userConvs = Object.values(conversations)
            .filter(c => c.participants.includes(guestId))
            .map(c => {
                const otherGuestId = c.participants.find(p => p !== guestId);
                const otherUser = Object.values(users).find(u => u.guestId === otherGuestId);
                return {
                    id: c.id,
                    participantGuestId: otherGuestId,
                    participantName: otherUser?.name || otherGuestId,
                    participantGender: otherUser?.gender || '',
                    participantAge: otherUser?.age || 0,
                    participantOnline: !!otherUser,
                    lastMessage: c.lastMessage,
                    lastActivity: c.lastActivity,
                    unread: c.unread[guestId] || 0,
                };
            })
            .sort((a, b) => b.lastActivity - a.lastActivity);

        // Send initial data
        socket.emit('init', {
            user: users[socket.id],
            onlineCount,
            rooms: [...DEFAULT_ROOMS, ...Object.values(rooms).filter(r => !r.isDefault)].map(r => ({
                ...r,
                users: undefined,
                messages: undefined,
                userCount: r.users ? r.users.size : 0,
                lastMessage: messageHistory[r.id] ? messageHistory[r.id].slice(-1)[0] : null,
            })),
            conversations: userConvs,
            friends: friendsList[guestId] || [],
        });

        io.emit('online-count', onlineCount);

        // Notify friends this user is online
        (friendsList[guestId] || []).forEach(friendGId => {
            const friendEntry = findSocketByGuestId(friendGId);
            if (friendEntry) {
                io.to(friendEntry[0]).emit('user-status-change', { guestId, online: true, name: guestName });
            }
        });

        // ===== UPDATE PROFILE (fixes name mismatch) =====
        socket.on('update-profile', (data) => {
            const user = users[socket.id];
            if (!user) return;
            if (data.name) user.name = data.name;
            if (data.gender !== undefined) user.gender = data.gender;
            if (data.age !== undefined) user.age = parseInt(data.age) || 0;
            socket.emit('profile-updated', { user });
            // Notify friends of name change
            (friendsList[user.guestId] || []).forEach(friendGId => {
                const friendEntry = findSocketByGuestId(friendGId);
                if (friendEntry) {
                    io.to(friendEntry[0]).emit('user-status-change', { guestId: user.guestId, online: true, name: user.name });
                }
            });
        });

        // ===== GET ALL ONLINE USERS (for online counter click) =====
        socket.on('get-all-online-users', () => {
            const userList = Object.values(users)
                .map(u => ({ guestId: u.guestId, name: u.name, gender: u.gender || '', age: u.age || 0, online: true }));
            socket.emit('all-online-users', { users: userList, total: userList.length });
        });

        // ===== LIVE STREAMING =====
        socket.on('start-stream', (data) => {
            const user = users[socket.id];
            if (!user) return;
            const streamId = `stream_${uuidv4().slice(0, 8)}`;
            streams[streamId] = {
                id: streamId,
                streamerId: socket.id,
                streamerGuestId: user.guestId,
                streamerName: user.name,
                title: data.title || `${user.name}'s Live`,
                category: data.category || 'Chat',
                viewers: new Set(),
                viewerCount: 0,
                messages: [],
                startedAt: Date.now(),
                isLive: true,
            };
            socket.join(`stream_${streamId}`);
            socket.emit('stream-started', { stream: { ...streams[streamId], viewers: undefined } });
            // Broadcast to all
            io.emit('stream-list-update', { streams: getPublicStreams() });
        });

        socket.on('stop-stream', (data) => {
            const stream = streams[data.streamId];
            if (!stream || stream.streamerId !== socket.id) return;
            stream.isLive = false;
            io.to(`stream_${data.streamId}`).emit('stream-ended', { streamId: data.streamId });
            delete streams[data.streamId];
            io.emit('stream-list-update', { streams: getPublicStreams() });
        });

        socket.on('join-stream', (data) => {
            const stream = streams[data.streamId];
            if (!stream) return;
            socket.join(`stream_${data.streamId}`);
            stream.viewers.add(socket.id);
            stream.viewerCount = stream.viewers.size;
            io.to(`stream_${data.streamId}`).emit('stream-viewer-count', { streamId: data.streamId, count: stream.viewerCount });
            socket.emit('stream-joined', { stream: { ...stream, viewers: undefined }, messages: stream.messages.slice(-50) });
            io.emit('stream-list-update', { streams: getPublicStreams() });
        });

        socket.on('leave-stream', (data) => {
            const stream = streams[data.streamId];
            if (!stream) return;
            socket.leave(`stream_${data.streamId}`);
            stream.viewers.delete(socket.id);
            stream.viewerCount = stream.viewers.size;
            io.to(`stream_${data.streamId}`).emit('stream-viewer-count', { streamId: data.streamId, count: stream.viewerCount });
            io.emit('stream-list-update', { streams: getPublicStreams() });
        });

        socket.on('stream-chat', (data) => {
            const { streamId, text } = data;
            const stream = streams[streamId];
            const user = users[socket.id];
            if (!stream || !user || !text) return;
            const msg = { user: user.name, guestId: user.guestId, text, timestamp: Date.now() };
            stream.messages.push(msg);
            if (stream.messages.length > 200) stream.messages = stream.messages.slice(-100);
            io.to(`stream_${streamId}`).emit('stream-new-chat', { streamId, message: msg });
        });

        socket.on('get-streams', () => {
            socket.emit('stream-list-update', { streams: getPublicStreams() });
        });

        // Stream WebRTC signaling
        socket.on('stream-offer', (data) => {
            io.to(`stream_${data.streamId}`).emit('stream-offer', { streamId: data.streamId, offer: data.offer, streamerId: socket.id });
        });

        socket.on('stream-answer', (data) => {
            io.to(data.to).emit('stream-answer', { from: socket.id, answer: data.answer });
        });

        socket.on('stream-ice', (data) => {
            if (data.to) io.to(data.to).emit('stream-ice', { from: socket.id, candidate: data.candidate });
            else io.to(`stream_${data.streamId}`).emit('stream-ice', { from: socket.id, candidate: data.candidate });
        });

        // ===== USER SEARCH =====
        socket.on('search-users', (data) => {
            const { query } = data;
            if (!query || query.length < 2) return;
            const results = Object.values(users)
                .filter(u => u.id !== socket.id && u.name.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 20)
                .map(u => ({
                    guestId: u.guestId,
                    name: u.name,
                    gender: u.gender || '',
                    age: u.age || 0,
                    online: true,
                }));
            socket.emit('search-results', { results });
        });

        // ===== GET ONLINE USERS =====
        socket.on('get-online-users', () => {
            const userList = Object.values(users)
                .filter(u => u.id !== socket.id)
                .map(u => ({ guestId: u.guestId, name: u.name, gender: u.gender || '', age: u.age || 0 }));
            socket.emit('online-users-list', { users: userList });
        });

        // ===== DM / CONVERSATIONS =====
        socket.on('start-dm', (data) => {
            const { targetGuestId } = data;
            const user = users[socket.id];
            if (!user) return;

            // Check if blocked
            if (blockedUsers[user.guestId]?.includes(targetGuestId) ||
                blockedUsers[targetGuestId]?.includes(user.guestId)) {
                socket.emit('dm-error', { error: 'Cannot message this user' });
                return;
            }

            const conv = getOrCreateConversation(user.guestId, targetGuestId);
            socket.join(`conv_${conv.id}`);

            // Join target too if online
            const targetEntry = findSocketByGuestId(targetGuestId);
            if (targetEntry) {
                io.sockets.sockets.get(targetEntry[0])?.join(`conv_${conv.id}`);
            }

            const otherUser = Object.values(users).find(u => u.guestId === targetGuestId);
            socket.emit('dm-started', {
                conversation: {
                    id: conv.id,
                    participantGuestId: targetGuestId,
                    participantName: otherUser?.name || targetGuestId,
                    participantGender: otherUser?.gender || '',
                    participantAge: otherUser?.age || 0,
                    participantOnline: !!otherUser,
                    lastMessage: conv.lastMessage,
                    lastActivity: conv.lastActivity,
                    unread: 0,
                },
                messages: conv.messages.slice(-100),
            });
        });

        socket.on('dm-message', (data) => {
            const { conversationId, text, image, type = 'text' } = data;
            const user = users[socket.id];
            const conv = conversations[conversationId];
            if (!user || !conv) return;

            const message = {
                id: uuidv4(),
                senderId: user.guestId,
                senderName: user.name,
                text,
                image,
                type,
                timestamp: Date.now(),
                readBy: [user.guestId],
            };

            conv.messages.push(message);
            conv.lastMessage = { text: text || (image ? '📷 Image' : ''), sender: user.name, timestamp: message.timestamp };
            conv.lastActivity = message.timestamp;

            // Update unread for OTHER participants
            conv.participants.forEach(pGuestId => {
                if (pGuestId !== user.guestId) {
                    conv.unread[pGuestId] = (conv.unread[pGuestId] || 0) + 1;
                }
            });

            // Emit to conversation room
            io.to(`conv_${conv.id}`).emit('dm-new-message', { conversationId: conv.id, message });

            // Notify other participants with unread update
            conv.participants.forEach(pGuestId => {
                if (pGuestId !== user.guestId) {
                    const pEntry = findSocketByGuestId(pGuestId);
                    if (pEntry) {
                        io.to(pEntry[0]).emit('unread-update', {
                            conversationId: conv.id,
                            unread: conv.unread[pGuestId],
                            lastMessage: conv.lastMessage,
                            from: user.name,
                            fromGuestId: user.guestId,
                        });
                        // Also send notification
                        io.to(pEntry[0]).emit('dm-notification', {
                            conversationId: conv.id,
                            from: user.name,
                            fromGuestId: user.guestId,
                            text: text || (image ? '📷 Image' : ''),
                            timestamp: message.timestamp,
                        });
                    }
                }
            });
        });

        socket.on('mark-read', (data) => {
            const { conversationId } = data;
            const user = users[socket.id];
            const conv = conversations[conversationId];
            if (!user || !conv) return;

            conv.unread[user.guestId] = 0;
            // Mark all messages as read by this user
            conv.messages.forEach(msg => {
                if (!msg.readBy.includes(user.guestId)) {
                    msg.readBy.push(user.guestId);
                }
            });

            socket.emit('unread-cleared', { conversationId: conv.id });

            // Notify sender about read receipt
            conv.participants.forEach(pGuestId => {
                if (pGuestId !== user.guestId) {
                    const pEntry = findSocketByGuestId(pGuestId);
                    if (pEntry) {
                        io.to(pEntry[0]).emit('read-receipt', {
                            conversationId: conv.id,
                            reader: user.guestId,
                            readerName: user.name,
                        });
                    }
                }
            });
        });

        socket.on('get-conversations', () => {
            const user = users[socket.id];
            if (!user) return;
            const convs = Object.values(conversations)
                .filter(c => c.participants.includes(user.guestId))
                .map(c => {
                    const otherGuestId = c.participants.find(p => p !== user.guestId);
                    const otherUser = Object.values(users).find(u => u.guestId === otherGuestId);
                    return {
                        id: c.id,
                        participantGuestId: otherGuestId,
                        participantName: otherUser?.name || otherGuestId,
                        participantGender: otherUser?.gender || '',
                        participantAge: otherUser?.age || 0,
                        participantOnline: !!otherUser,
                        lastMessage: c.lastMessage,
                        lastActivity: c.lastActivity,
                        unread: c.unread[user.guestId] || 0,
                    };
                })
                .sort((a, b) => b.lastActivity - a.lastActivity);
            socket.emit('conversations-list', { conversations: convs });
        });

        socket.on('dm-typing', (data) => {
            const { conversationId } = data;
            const user = users[socket.id];
            if (user && conversations[conversationId]) {
                socket.to(`conv_${conversationId}`).emit('dm-user-typing', { conversationId, userName: user.name, guestId: user.guestId });
            }
        });

        socket.on('dm-stop-typing', (data) => {
            const { conversationId } = data;
            if (conversations[conversationId]) {
                socket.to(`conv_${conversationId}`).emit('dm-user-stop-typing', { conversationId });
            }
        });

        // ===== ROOM EVENTS =====
        socket.on('join-room', (roomId) => {
            if (!rooms[roomId]) return;

            if (users[socket.id]?.currentRoom) {
                const oldRoom = users[socket.id].currentRoom;
                socket.leave(oldRoom);
                rooms[oldRoom]?.users.delete(socket.id);
                io.to(oldRoom).emit('room-users', {
                    roomId: oldRoom,
                    users: Array.from(rooms[oldRoom]?.users || []).map(id => users[id]).filter(Boolean),
                    count: rooms[oldRoom]?.users.size || 0,
                });
            }

            socket.join(roomId);
            rooms[roomId].users.add(socket.id);
            users[socket.id].currentRoom = roomId;

            socket.emit('message-history', { roomId, messages: messageHistory[roomId]?.slice(-100) || [] });

            io.to(roomId).emit('room-users', {
                roomId,
                users: Array.from(rooms[roomId].users).map(id => users[id]).filter(Boolean),
                count: rooms[roomId].users.size,
            });

            io.to(roomId).emit('system-message', {
                roomId,
                text: `${users[socket.id].name} joined the room`,
                timestamp: Date.now(),
            });

            io.emit('room-update', {
                roomId,
                userCount: rooms[roomId].users.size,
                lastMessage: messageHistory[roomId]?.slice(-1)[0] || null,
            });
        });

        socket.on('leave-room', (roomId) => {
            if (!rooms[roomId]) return;
            socket.leave(roomId);
            rooms[roomId].users.delete(socket.id);
            if (users[socket.id]) users[socket.id].currentRoom = null;

            io.to(roomId).emit('room-users', {
                roomId,
                users: Array.from(rooms[roomId].users).map(id => users[id]).filter(Boolean),
                count: rooms[roomId].users.size,
            });
            io.to(roomId).emit('system-message', {
                roomId,
                text: `${users[socket.id]?.name || 'A user'} left the room`,
                timestamp: Date.now(),
            });
            io.emit('room-update', {
                roomId,
                userCount: rooms[roomId].users.size,
                lastMessage: messageHistory[roomId]?.slice(-1)[0] || null,
            });
        });

        // ===== ROOM MESSAGING =====
        socket.on('send-message', (data) => {
            const { roomId, text, image, type = 'text' } = data;
            const user = users[socket.id];
            if (!user) return;

            const message = {
                id: uuidv4(),
                userId: socket.id,
                guestId: user.guestId,
                userName: user.name,
                text, image, type,
                timestamp: Date.now(),
                reactions: {},
            };

            if (roomId && messageHistory[roomId]) {
                messageHistory[roomId].push(message);
                io.to(roomId).emit('new-message', { roomId, message });
                io.emit('room-update', { roomId, userCount: rooms[roomId]?.users.size || 0, lastMessage: message });
            }
        });

        socket.on('typing', (data) => {
            const user = users[socket.id];
            if (user && data.roomId) socket.to(data.roomId).emit('user-typing', { roomId: data.roomId, userId: socket.id, userName: user.name });
        });

        socket.on('stop-typing', (data) => {
            if (data.roomId) socket.to(data.roomId).emit('user-stop-typing', { roomId: data.roomId, userId: socket.id });
        });

        socket.on('react-message', (data) => {
            const { roomId, messageId, emoji } = data;
            const user = users[socket.id];
            if (!user || !roomId || !messageHistory[roomId]) return;
            const msg = messageHistory[roomId].find(m => m.id === messageId);
            if (msg) {
                if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
                const idx = msg.reactions[emoji].indexOf(user.guestId);
                idx > -1 ? msg.reactions[emoji].splice(idx, 1) : msg.reactions[emoji].push(user.guestId);
                io.to(roomId).emit('message-reaction', { roomId, messageId, reactions: msg.reactions });
            }
        });

        // ===== CREATE ROOM =====
        socket.on('create-room', (data) => {
            const user = users[socket.id];
            if (!user) return;
            const { name, topic, isPrivate, maxUsers } = data;
            if (!name || name.trim().length < 2) {
                socket.emit('room-create-error', { error: 'Room name must be at least 2 characters' });
                return;
            }
            const roomId = `user_${uuidv4().slice(0, 8)}`;
            const icon = isPrivate ? '🔒' : '🏠';
            rooms[roomId] = {
                id: roomId,
                name: `${icon} ${name.trim()}`,
                icon,
                category: 'User Created',
                description: topic || 'A custom chat room',
                users: new Set(),
                messages: [],
                isDefault: false,
                isPrivate: !!isPrivate,
                maxUsers: maxUsers || 50,
                creator: user.guestId,
                creatorName: user.name,
                createdAt: Date.now(),
            };
            messageHistory[roomId] = [];
            if (!userRooms[user.guestId]) userRooms[user.guestId] = [];
            userRooms[user.guestId].push(roomId);

            socket.emit('room-created', {
                room: {
                    ...rooms[roomId],
                    users: undefined, messages: undefined,
                    userCount: 0,
                    link: `${roomId}`,
                },
            });

            // Broadcast updated rooms list
            io.emit('rooms-list-update', {
                rooms: [...DEFAULT_ROOMS, ...Object.values(rooms).filter(r => !r.isDefault)].map(r => ({
                    ...r, users: undefined, messages: undefined,
                    userCount: r.users ? r.users.size : 0,
                    lastMessage: messageHistory[r.id] ? messageHistory[r.id].slice(-1)[0] : null,
                })),
            });
        });

        // ===== RANDOM MATCH =====
        socket.on('find-random', (filters) => {
            const user = users[socket.id];
            if (!user) return;
            const existingIdx = waitingQueue.findIndex(w => w.socketId === socket.id);
            if (existingIdx > -1) return;

            const matchIdx = waitingQueue.findIndex(w => w.socketId !== socket.id);
            if (matchIdx > -1) {
                const partner = waitingQueue.splice(matchIdx, 1)[0];
                const chatId = `private_${uuidv4().slice(0, 8)}`;
                privateChats[chatId] = { id: chatId, users: [socket.id, partner.socketId], messages: [], createdAt: Date.now() };

                socket.join(chatId);
                io.sockets.sockets.get(partner.socketId)?.join(chatId);

                socket.emit('match-found', { chatId, partner: { name: users[partner.socketId]?.name, guestId: users[partner.socketId]?.guestId } });
                io.to(partner.socketId).emit('match-found', { chatId, partner: { name: user.name, guestId: user.guestId } });
            } else {
                waitingQueue.push({ socketId: socket.id, filters, timestamp: Date.now() });
                socket.emit('waiting-match');
            }
        });

        socket.on('cancel-random', () => {
            const idx = waitingQueue.findIndex(w => w.socketId === socket.id);
            if (idx > -1) waitingQueue.splice(idx, 1);
        });

        socket.on('private-message', (data) => {
            const { chatId, text, image, type = 'text' } = data;
            const user = users[socket.id];
            if (!user || !privateChats[chatId]) return;

            const message = {
                id: uuidv4(), userId: socket.id, guestId: user.guestId, userName: user.name,
                text, image, type, timestamp: Date.now(), reactions: {}, readBy: [user.guestId],
            };
            privateChats[chatId].messages.push(message);
            io.to(chatId).emit('private-new-message', { chatId, message });
        });

        socket.on('private-typing', (data) => {
            const user = users[socket.id];
            if (user && privateChats[data.chatId]) socket.to(data.chatId).emit('private-user-typing', { chatId: data.chatId, userName: user.name });
        });

        socket.on('private-stop-typing', (data) => {
            if (privateChats[data.chatId]) socket.to(data.chatId).emit('private-user-stop-typing', { chatId: data.chatId });
        });

        socket.on('end-private-chat', (data) => {
            if (privateChats[data.chatId]) {
                io.to(data.chatId).emit('private-chat-ended', { chatId: data.chatId });
                privateChats[data.chatId].users.forEach(sid => io.sockets.sockets.get(sid)?.leave(data.chatId));
                delete privateChats[data.chatId];
            }
        });

        // ===== WEBRTC SIGNALING =====
        socket.on('call-offer', (data) => {
            const user = users[socket.id];
            io.to(data.to).emit('call-incoming', { from: socket.id, callerName: user?.name, offer: data.offer, type: data.type });
        });
        socket.on('call-answer', (data) => io.to(data.to).emit('call-answered', { from: socket.id, answer: data.answer }));
        socket.on('ice-candidate', (data) => io.to(data.to).emit('ice-candidate', { from: socket.id, candidate: data.candidate }));
        socket.on('call-end', (data) => io.to(data.to).emit('call-ended', { from: socket.id }));

        // ===== FRIENDS =====
        socket.on('add-friend', (data) => {
            const { targetGuestId } = data;
            const user = users[socket.id];
            if (!user) return;

            if (!friendsList[user.guestId]) friendsList[user.guestId] = [];
            if (!friendsList[user.guestId].includes(targetGuestId)) friendsList[user.guestId].push(targetGuestId);
            if (!friendsList[targetGuestId]) friendsList[targetGuestId] = [];
            if (!friendsList[targetGuestId].includes(user.guestId)) friendsList[targetGuestId].push(user.guestId);

            socket.emit('friends-updated', { friends: friendsList[user.guestId] });

            const targetEntry = findSocketByGuestId(targetGuestId);
            if (targetEntry) {
                io.to(targetEntry[0]).emit('friends-updated', { friends: friendsList[targetGuestId] });
                io.to(targetEntry[0]).emit('friend-request', { from: user.name, guestId: user.guestId });
            }
        });

        socket.on('get-friends', () => {
            const user = users[socket.id];
            if (user) socket.emit('friends-updated', { friends: friendsList[user.guestId] || [] });
        });

        // ===== BLOCK USER =====
        socket.on('block-user', (data) => {
            const user = users[socket.id];
            if (!user) return;
            if (!blockedUsers[user.guestId]) blockedUsers[user.guestId] = [];
            if (!blockedUsers[user.guestId].includes(data.targetGuestId)) {
                blockedUsers[user.guestId].push(data.targetGuestId);
            }
            // Remove from friends
            if (friendsList[user.guestId]) {
                friendsList[user.guestId] = friendsList[user.guestId].filter(f => f !== data.targetGuestId);
            }
            socket.emit('user-blocked', { guestId: data.targetGuestId });
            socket.emit('friends-updated', { friends: friendsList[user.guestId] || [] });
        });

        // ===== USER PROFILE =====
        socket.on('get-user-profile', (data) => {
            const targetEntry = findSocketByGuestId(data.targetGuestId);
            if (targetEntry) {
                const [, targetUser] = targetEntry;
                socket.emit('user-profile', {
                    guestId: targetUser.guestId, name: targetUser.name,
                    gender: targetUser.gender || '', age: targetUser.age || 0,
                    online: true, joinedAt: targetUser.joinedAt,
                });
            } else {
                socket.emit('user-profile', {
                    guestId: data.targetGuestId, name: data.targetGuestId,
                    gender: '', age: 0, online: false,
                });
            }
        });

        // ===== IMAGE UPLOAD =====
        socket.on('upload-image', (data, callback) => {
            if (!data.imageData || data.imageData.length > 5 * 1024 * 1024) {
                callback?.({ error: 'Image too large (max 5MB)' });
                return;
            }
            callback?.({ success: true, imageId: uuidv4(), imageUrl: data.imageData });
        });

        // ===== DISCONNECT =====
        socket.on('disconnect', () => {
            onlineCount = Math.max(0, onlineCount - 1);
            const user = users[socket.id];

            if (user) {
                // Room cleanup
                if (user.currentRoom && rooms[user.currentRoom]) {
                    rooms[user.currentRoom].users.delete(socket.id);
                    io.to(user.currentRoom).emit('room-users', {
                        roomId: user.currentRoom,
                        users: Array.from(rooms[user.currentRoom].users).map(id => users[id]).filter(Boolean),
                        count: rooms[user.currentRoom].users.size,
                    });
                    io.emit('room-update', { roomId: user.currentRoom, userCount: rooms[user.currentRoom].users.size });
                }

                // Queue cleanup
                const qIdx = waitingQueue.findIndex(w => w.socketId === socket.id);
                if (qIdx > -1) waitingQueue.splice(qIdx, 1);

                // Private chat cleanup (non-friend chats)
                Object.keys(privateChats).forEach(chatId => {
                    if (privateChats[chatId].users.includes(socket.id) && !privateChats[chatId].isFriendChat) {
                        io.to(chatId).emit('private-chat-ended', { chatId, reason: 'Partner disconnected' });
                        delete privateChats[chatId];
                    }
                });

                // Stream cleanup — end streams from this user
                Object.keys(streams).forEach(streamId => {
                    const stream = streams[streamId];
                    if (stream.streamerId === socket.id) {
                        io.to(`stream_${streamId}`).emit('stream-ended', { streamId });
                        delete streams[streamId];
                    } else {
                        stream.viewers?.delete(socket.id);
                        if (stream.viewers) stream.viewerCount = stream.viewers.size;
                    }
                });
                io.emit('stream-list-update', { streams: getPublicStreams() });

                // Notify friends this user went offline
                (friendsList[user.guestId] || []).forEach(friendGId => {
                    const friendEntry = findSocketByGuestId(friendGId);
                    if (friendEntry) {
                        io.to(friendEntry[0]).emit('user-status-change', { guestId: user.guestId, online: false, name: user.name });
                    }
                });
            }

            delete users[socket.id];
            io.emit('online-count', onlineCount);
        });
    });

    server.all('*', (req, res) => handle(req, res));

    httpServer.listen(PORT, () => {
        console.log(`
╔══════════════════════════════════════╗
║        🚀 CoupChat Server           ║
║     Running on port ${PORT}             ║
║     http://localhost:${PORT}            ║
╚══════════════════════════════════════╝
    `);
    });
});
