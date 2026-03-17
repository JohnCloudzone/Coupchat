'use client';
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';

export default function CallPanel({ callState, onEnd }) {
    const { user, spendTokens, addNotification } = useSocket();
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [trialEnded, setTrialEnded] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const timerRef = useRef(null);
    const deductionRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const TRIAL_SECONDS = 90; // 1.5 mins
    const COST_PER_MINUTE = 10;

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setDuration(prev => {
                const newDuration = prev + 1;

                // Alert at 60 seconds (trial ending soon)
                if (newDuration === 60) {
                    addNotification({
                        title: 'Trial Ending Soon',
                        body: 'Your 1.5 minute free trial will end in 30 seconds.',
                        type: 'system'
                    });
                }

                // Check trial end at 90 seconds
                if (newDuration === TRIAL_SECONDS) {
                    setTrialEnded(true);
                    handleTrialEnd();
                }

                return newDuration;
            });
        }, 1000);

        // Initialize local stream for preview
        if (callState?.type === 'video') {
            navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                })
                .catch(() => { });
        }

        return () => {
            clearInterval(timerRef.current);
            if (deductionRef.current) clearInterval(deductionRef.current);
            if (localVideoRef.current?.srcObject) {
                localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
            }
        };
    }, [callState]);

    const handleTrialEnd = async () => {
        // If current user is the one paying (the one who initiated or whoever we decide is the customer)
        if (!user || user.tokens < COST_PER_MINUTE) {
            addNotification({
                title: 'Call Ended',
                body: 'Insufficient tokens to continue the call after the trial.',
                type: 'error'
            });
            handleEnd();
            return;
        }

        // Start periodic deduction
        setIsPaying(true);
        startDeduction();
    };

    const startDeduction = () => {
        const deduct = async () => {
            const success = await spendTokens(
                COST_PER_MINUTE,
                callState.fromGuestId || callState.targetGuestId, // Receiver
                'call_payment',
                'Payment for ongoing video call'
            );

            if (!success) {
                addNotification({
                    title: 'Call Terminated',
                    body: 'Your token balance is empty. Please recharge.',
                    type: 'error'
                });
                handleEnd();
            }
        };

        // First deduction immediate
        deduct();
        // Subsequent deductions every 60 seconds
        deductionRef.current = setInterval(deduct, 60000);
    };

    const formatDuration = (s) => {
        const mins = Math.floor(s / 60).toString().padStart(2, '0');
        const secs = (s % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const handleEnd = () => {
        if (localVideoRef.current?.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }
        onEnd();
    };

    if (isMinimized) {
        return (
            <div className="fixed bottom-24 right-4 z-50 animate-bounce-in">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-2xl animate-pulse-glow"
                    style={{ background: 'var(--gradient-primary)' }}
                >
                    <span className="text-sm">{callState?.type === 'video' ? '📹' : '📞'}</span>
                    <span className="text-sm font-medium text-white">{formatDuration(duration)}</span>
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="call-panel rounded-3xl p-6 w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-white/70">
                            {callState?.type === 'video' ? 'Video Call' : 'Voice Call'}
                        </span>
                    </div>
                    <button onClick={() => setIsMinimized(true)} className="text-white/50 hover:text-white text-sm">
                        ─
                    </button>
                </div>

                {/* Video / Profile Area */}
                <div className="relative mb-6">
                    {callState?.type === 'video' ? (
                        <div className="relative rounded-2xl overflow-hidden bg-gray-900" style={{ height: '280px' }}>
                            {/* Remote video (placeholder) */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-bold"
                                        style={{ background: 'var(--gradient-primary)' }}>
                                        {callState?.roomName?.[0] || '?'}
                                    </div>
                                    <p className="text-white/60 text-sm">Connecting...</p>
                                </div>
                            </div>
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

                            {/* Local video pip */}
                            <div className="absolute bottom-3 right-3 w-24 h-32 rounded-xl overflow-hidden border-2 border-white/20 bg-gray-800">
                                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                {isCameraOff && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                        <span className="text-2xl">📷</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8">
                            <div className="w-24 h-24 rounded-full mb-4 flex items-center justify-center text-4xl font-bold animate-pulse-glow"
                                style={{ background: 'var(--gradient-primary)' }}>
                                {callState?.roomName?.[0] || '📞'}
                            </div>
                            <h3 className="text-white font-display font-semibold text-lg">
                                {callState?.roomName || 'Voice Call'}
                            </h3>
                        </div>
                    )}
                </div>

                {/* Duration */}
                <div className="text-center mb-6">
                    <span className="text-2xl font-mono text-white font-medium">
                        {formatDuration(duration)}
                    </span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all duration-200
              ${isMuted ? 'bg-red-500/30 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isMuted ? '🔇' : '🎙️'}
                    </button>

                    {callState?.type === 'video' && (
                        <button
                            onClick={() => setIsCameraOff(!isCameraOff)}
                            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all duration-200
                ${isCameraOff ? 'bg-red-500/30 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            {isCameraOff ? '📷' : '📹'}
                        </button>
                    )}

                    <button
                        className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                        🖥️
                    </button>

                    <button
                        onClick={handleEnd}
                        className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-red-600 text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/30"
                    >
                        📞
                    </button>
                </div>
            </div>
        </div>
    );
}
