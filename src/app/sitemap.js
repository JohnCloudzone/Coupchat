export default function sitemap() {
    const baseUrl = 'https://coupchat.in';

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        // We can add more static routes here if we create them later
        // {
        //     url: `${baseUrl}/rooms/gaming`,
        //     lastModified: new Date(),
        //     changeFrequency: 'always',
        //     priority: 0.8,
        // },
    ];
}
