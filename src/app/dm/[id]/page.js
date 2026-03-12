'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const DirectChatPage = dynamic(() => import('@/components/Pages/DirectChatPage'), { ssr: false });

export default function DirectMessagePage({ params }) {
    const router = useRouter();
    const guestId = params.id;

    return (
        <DirectChatPage
            conversation={{
                participantGuestId: guestId,
                participantName: 'User', // Needs actual fetch
                participantGender: 'neutral',
            }}
            onBack={() => router.push('/discover')}
        />
    );
}
