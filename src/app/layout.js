import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { SocketProvider } from '@/context/SocketContext';

export const metadata = {
    title: 'CoupChat – Free Anonymous Chat | Talk to Strangers',
    description: 'Chat with strangers worldwide for free. No signup required. Random chat, group rooms, voice & video calls, image sharing. Join 1000s online now!',
    keywords: 'anonymous chat, random chat, talk to strangers, free chat, online chat rooms, video call strangers',
    manifest: '/manifest.json',
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
            </head>
            <body className="antialiased">
                <ThemeProvider>
                    <SocketProvider>
                        {children}
                    </SocketProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
