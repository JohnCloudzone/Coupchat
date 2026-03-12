import dynamic from 'next/dynamic';
const SettingsPage = dynamic(() => import('@/components/Pages/SettingsPage'), { ssr: false });

export const metadata = {
    title: 'Settings | CoupChat',
    description: 'Manage your profile, theme, and application settings securely.',
};

export default function Settings() {
    return <SettingsPage />;
}


