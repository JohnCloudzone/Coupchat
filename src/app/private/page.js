'use client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const PrivatePage = dynamic(() => import('@/components/Pages/PrivatePage'), { ssr: false });

export default function Private() {
    const router = useRouter();

    // The Layout wrapper manages call state, so the individual page 
    // just triggers events (to be rebuilt with Supabase later)
    return <PrivatePage onCall={() => { }} />;
}
