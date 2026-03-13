'use client';
import dynamic from 'next/dynamic';
const GamesPage = dynamic(() => import('@/components/Pages/GamesPage'), { ssr: false });
export default function GamesRoute() { return <GamesPage />; }
