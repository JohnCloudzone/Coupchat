'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import { useMemo } from 'react';

const RoomChatPage = dynamic(() => import('@/components/Pages/RoomChatPage'), { ssr: false });

export default function RoomPage({ params }) {
    const router = useRouter();
    const { rooms } = useSocket();
    const roomId = params.id;

    const room = useMemo(() => {
        return rooms.find(r => r.id === roomId) || { id: roomId, name: roomId, icon: '🏠' };
    }, [rooms, roomId]);

    return (
        <RoomChatPage
            room={room}
            onBack={() => router.push('/rooms')}
            onCall={() => { }}
        />
    );
}
