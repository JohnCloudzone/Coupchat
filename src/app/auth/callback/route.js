import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key';
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        await supabase.auth.exchangeCodeForSession(code);
    }

    // Redirect to the home page after OAuth callback
    return NextResponse.redirect(new URL('/', request.url));
}
