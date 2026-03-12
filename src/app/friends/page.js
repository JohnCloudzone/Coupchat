import dynamic from 'next/dynamic';
const FriendsPage = dynamic(() => import('@/components/Pages/FriendsPage'), { ssr: false });

export const metadata = {
    title: 'My Friends | CoupChat',
    description: 'View and manage your friends list on CoupChat. See who is online to voice or video call.',
};

export default function Friends() {
    return <FriendsPage />;
}


