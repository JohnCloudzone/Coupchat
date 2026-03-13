export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/settings/', '/auth/'],
            },
        ],
        sitemap: 'https://coupchat.in/sitemap.xml',
    };
}
