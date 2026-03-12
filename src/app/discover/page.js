import dynamic from 'next/dynamic';
const DiscoverPage = dynamic(() => import('@/components/Pages/DiscoverPage'), { ssr: false });

export const metadata = {
    title: 'Discover Friends | CoupChat – Find People Online',
    description: 'Discover and meet new friends near you. Chat with strangers online instantly and securely.',
};

export default function Discover() {
    return <DiscoverPage />;
}


