'use client';
import { useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { supabase } from '@/lib/supabaseClient';

const PLANS = [
    { id: 'bronze', tokens: 100, price: '₹99', color: '#cd7f32' },
    { id: 'silver', tokens: 500, price: '₹399', color: '#c0c0c0', popular: true },
    { id: 'gold', tokens: 1200, price: '₹799', color: '#ffd700' },
    { id: 'platinum', tokens: 3000, price: '₹1799', color: '#e5e4e2' },
];

export default function RechargeModal({ onClose }) {
    const { user, updateProfile, addNotification } = useSocket();
    const [loading, setLoading] = useState(null);

    const handlePurchase = async (plan) => {
        if (!user) {
            addNotification({ title: 'Error', body: 'Please login to buy tokens', type: 'error' });
            return;
        }

        setLoading(plan.id);
        try {
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const newTotal = (user.tokens || 0) + plan.tokens;

            // 1. Update profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ tokens: newTotal })
                .eq('guest_id', user.guestId);

            if (profileError) throw profileError;

            // 2. Log transaction
            await supabase.from('token_transactions').insert({
                sender_id: 'SYSTEM',
                receiver_id: user.guestId,
                amount: plan.tokens,
                type: 'recharge',
                description: `Purchased ${plan.id} pack`
            });

            // 3. Update local state
            updateProfile({ ...user, tokens: newTotal });

            addNotification({
                title: 'Success!',
                body: `Successfully added ${plan.tokens} tokens to your account.`,
                type: 'success'
            });
            onClose();
        } catch (err) {
            console.error('Purchase failed:', err);
            addNotification({ title: 'Error', body: 'Payment failed. Please try again.', type: 'error' });
        }
        setLoading(null);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass rounded-3xl p-6 w-full max-w-md shadow-2xl animate-bounce-in relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--accent)] opacity-10 blur-3xl rounded-full" />

                <div className="relative">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="font-display font-bold text-2xl gradient-text">Recharge Tokens</h2>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Get tokens for private video calls & gifts</p>
                        </div>
                        <button onClick={onClose} className="p-2 glass glass-hover rounded-xl transition-all">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {PLANS.map(plan => (
                            <button
                                key={plan.id}
                                onClick={() => handlePurchase(plan)}
                                disabled={loading}
                                className={`relative p-4 rounded-2xl border transition-all text-center
                                    ${plan.popular ? 'border-[var(--accent)] bg-[var(--accent)] bg-opacity-5' : 'border-[var(--border)] glass glass-hover'}
                                    ${loading === plan.id ? 'opacity-50' : 'hover:scale-[1.02]'}`}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[var(--accent)] text-[8px] font-bold text-white uppercase tracking-wider">
                                        Best Value
                                    </span>
                                )}
                                <div className="text-2xl mb-1" style={{ color: plan.color }}>🪙</div>
                                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{plan.tokens}</div>
                                <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Tokens</div>
                                <div className="mt-2 font-bold text-[var(--accent)]">{plan.price}</div>

                                {loading === plan.id && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="glass p-4 rounded-2xl border border-[var(--border)] bg-opacity-30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Current Balance</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{user?.tokens || 0}</span>
                                <span className="text-xs">🪙</span>
                            </div>
                        </div>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            * Tokens are non-refundable and used for premium services like video calls with broadcasters.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
