'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            if (code) {
                await supabase.auth.exchangeCodeForSession(code);
            }
            router.push('/');
        };

        handleCallback();
    }, [searchParams, router]);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-primary)]">
            <div className="w-12 h-12 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin mb-4" />
            <p className="text-[var(--text-secondary)] font-medium">Signing you in...</p>
        </div>
    );
}
