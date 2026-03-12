import dynamic from 'next/dynamic';
const RoomsPage = dynamic(() => import('@/components/Pages/RoomsPage'), { ssr: false });

export const metadata = {
    title: 'Rooms | CoupChat – Free Group Chat',
    description: 'Join thousands of online users in free public group chat rooms based on your interests. No signup required.',
};

export default function Rooms() {
    return <RoomsPage />;
}


