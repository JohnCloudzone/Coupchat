'use client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const HomePage = dynamic(() => import('@/components/Pages/HomePage'), { ssr: false });

export default function Home() {
    const router = useRouter();

    const handleNavigate = (page) => {
        if (page === 'rooms') router.push('/rooms');
        if (page === 'private') router.push('/private');
    };

    const handleViewProfile = (profile) => {
        // Will be handled by layout context in future steps
        console.log('View profile', profile);
    };

    const handleStartDM = (conv) => {
        router.push(`/dm/${conv.participantGuestId}`);
    };

    return (
        <HomePage
            onNavigate={handleNavigate}
            onViewProfile={handleViewProfile}
            onStartDM={handleStartDM}
        />
    );
}
