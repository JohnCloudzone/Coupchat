import { supabase } from '@/lib/supabaseClient';

export default async function sitemap() {
    const baseUrl = 'https://coupchat.in';

    // Static routes
    const staticRoutes = [
        '',
        '/rooms',
        '/friends',
        '/games',
        '/auth',
        '/settings',
        '/policy',
        '/terms',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic room routes from Supabase
    let roomRoutes = [];
    try {
        const { data: rooms } = await supabase
            .from('rooms')
            .select('id, created_at');

        if (rooms) {
            roomRoutes = rooms.map((room) => ({
                url: `${baseUrl}/rooms/${room.id}`,
                lastModified: new Date(room.created_at),
                changeFrequency: 'weekly',
                priority: 0.6,
            }));
        }
    } catch (error) {
        console.error('Error generating sitemap rooms:', error);
    }

    return [...staticRoutes, ...roomRoutes];
}
