import './globals.css';
import Script from 'next/script';
import dynamic from 'next/dynamic';

const ThemeProvider = dynamic(() => import('@/context/ThemeContext').then(mod => mod.ThemeProvider), { ssr: false });

const SocketProvider = dynamic(() => import('@/context/SocketContext').then(mod => mod.SocketProvider), { ssr: false });
const ClientLayout = dynamic(() => import('./ClientLayout'), { ssr: false });

export const metadata = {
    title: 'CoupChat – Free Anonymous Chat | Talk to Strangers',
    description: 'Chat with strangers worldwide for free. No signup required. Random chat, group rooms, voice & video calls, image sharing. Join 1000s online now!',
    keywords: 'anonymous chat, random chat, talk to strangers, free chat, online chat rooms, video call strangers, omegle alternative no login, talk to strangers online free video call',
    manifest: '/manifest.json',
    openGraph: {
        title: 'CoupChat – Free Anonymous Chat',
        description: 'Chat with strangers worldwide for free. No signup required. Random chat, group rooms, voice & video calls. Join 1000s online now!',
        url: 'https://coupchat.in',
        siteName: 'CoupChat',
        images: [
            {
                url: 'https://coupchat.in/logo.png', // Replace with a larger proper OG image 1200x630
                width: 512,
                height: 512,
                alt: 'CoupChat Logo',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'CoupChat – Free Anonymous Chat',
        description: 'Chat with strangers worldwide for free. No signup required. Random chat, group rooms, voice & video calls.',
        images: ['https://coupchat.in/logo.png'],
    },
    alternates: {
        canonical: 'https://coupchat.in',
    },
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#8b5cf6',
};



export default function RootLayout({ children }) {
    return (
        <html lang="en" data-theme="cyberpunk" suppressHydrationWarning>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#8b5cf6" />
                <link rel="icon" type="image/png" href="/icon-192.png" />
                <link rel="shortcut icon" type="image/png" href="/icon-192.png" />
                <link rel="apple-touch-icon" href="/icon-192.png" />

                {/* Google AdSense Verification Tag */}
                <meta name="google-adsense-account" content="ca-pub-5491152751655483" />

                {/* Google AdSense Integration */}
                <Script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5491152751655483"
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />
            </head>
            <body className="antialiased">
                <ThemeProvider>
                    <SocketProvider>
                        <ClientLayout>
                            {children}
                        </ClientLayout>
                    </SocketProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
