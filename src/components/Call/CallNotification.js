'use client';
import { useEffect, useRef } from 'react';

export default function CallNotification({ call, onAccept, onReject }) {
    const audioRef = useRef(null);

    useEffect(() => {
        // Play ringtone sound
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 440;
            gainNode.gain.value = 0.1;
            oscillator.start();

            const interval = setInterval(() => {
                oscillator.frequency.value = oscillator.frequency.value === 440 ? 520 : 440;
            }, 500);

            audioRef.current = { oscillator, audioCtx, interval };

            return () => {
                clearInterval(interval);
                oscillator.stop();
                audioCtx.close();
            };
        } catch (e) { }
    }, []);

    const stopRinger = () => {
        if (audioRef.current) {
            clearInterval(audioRef.current.interval);
            audioRef.current.oscillator.stop();
            audioRef.current.audioCtx.close();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="glass rounded-3xl p-8 mx-4 max-w-sm w-full text-center animate-bounce-in shadow-2xl">
                {/* Caller Avatar */}
                <div className="relative mx-auto mb-4">
                    <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold animate-pulse-glow"
                        style={{ background: 'var(--gradient-primary)' }}>
                        {call?.callerName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs animate-pulse">
                        {call?.type === 'video' ? '📹' : '📞'}
                    </div>
                </div>

                {/* Caller Info */}
                <h3 className="font-display font-bold text-xl mb-1" style={{ color: 'var(--text-primary)' }}>
                    {call?.callerName || 'Someone'}
                </h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                    Incoming {call?.type === 'video' ? 'video' : 'voice'} call...
                </p>

                {/* Actions */}
                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={() => { stopRinger(); onReject(); }}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-red-600/40 transition-all hover:scale-110"
                    >
                        ✕
                    </button>
                    <button
                        onClick={() => { stopRinger(); onAccept({ ...call, type: call?.type }); }}
                        className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-green-600/40 transition-all hover:scale-110 animate-pulse"
                    >
                        {call?.type === 'video' ? '📹' : '📞'}
                    </button>
                </div>
            </div>
        </div>
    );
}
