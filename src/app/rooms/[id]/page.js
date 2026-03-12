'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const RoomChatPage = dynamic(() => import('@/components/Pages/RoomChatPage'), { ssr: false });

export default function RoomPage({ params }) {
    const router = useRouter();
    const roomId = params.id;

    return (
        <RoomChatPage
            room={{ id: roomId, name: roomId }} // Mocking room object until real data fetch
            onBack={() => router.push('/rooms')}
            onCall={() => { }} // Handled by Layout context now
        />
    );
}
