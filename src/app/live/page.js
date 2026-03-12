import dynamic from 'next/dynamic';
const LivePage = dynamic(() => import('@/components/Pages/LivePage'), { ssr: false });

export const metadata = {
    title: 'Live Streams | CoupChat',
    description: 'Watch public live streams or start your own on CoupChat.',
};

export default function Live() {
    return <LivePage />;
}


