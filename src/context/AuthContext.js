'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [authUser, setAuthUser] = useState(null);       // Supabase auth user (null for guests)
    const [profile, setProfile] = useState(null);         // Profile from DB
    const [isGuest, setIsGuest] = useState(false);        // Guest mode flag
    const [authLoading, setAuthLoading] = useState(true); // Loading state
    const [authReady, setAuthReady] = useState(false);    // True once we know auth state

    // Check if user has chosen guest or registered login
    useEffect(() => {
        const checkAuth = async () => {
            // Check for guest mode
            const guestMode = localStorage.getItem('coupchat-auth-mode');
            if (guestMode === 'guest') {
                setIsGuest(true);
                setAuthReady(true);
                setAuthLoading(false);
                return;
            }

            // Check Supabase auth session
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setAuthUser(session.user);
                await loadProfile(session.user.id);
                setAuthReady(true);
            }
            setAuthLoading(false);
        };

        checkAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setAuthUser(session.user);
                setIsGuest(false);
                localStorage.setItem('coupchat-auth-mode', 'registered');
                // Clean up guest data that might interfere
                localStorage.removeItem('coupchat-guestName');
                localStorage.removeItem('coupchat-profile');
                await loadProfile(session.user.id);
                setAuthReady(true);
            } else if (event === 'SIGNED_OUT') {
                setAuthUser(null);
                setProfile(null);
                setIsGuest(false);
                localStorage.removeItem('coupchat-auth-mode');
                setAuthReady(false);
            }
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load or create a profile from Supabase
    const loadProfile = async (authId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('auth_id', authId)
                .single();

            if (data) {
                setProfile(data);
                // Sync to localStorage for SocketContext compatibility
                localStorage.setItem('coupchat-guestId', data.guest_id || `user_${authId.substring(0, 8)}`);
                localStorage.setItem('coupchat-guestName', data.display_name || 'User');
                localStorage.setItem('coupchat-profile', JSON.stringify({
                    name: data.display_name,
                    gender: data.gender || '',
                    age: data.age || '',
                    avatar: data.avatar_url || '',
                }));
            } else {
                // Create a new profile for this auth user
                const guestId = `user_${authId.substring(0, 8)}`;
                const { data: newProfile } = await supabase
                    .from('profiles')
                    .insert({
                        auth_id: authId,
                        guest_id: guestId,
                        display_name: 'New User',
                        is_guest: false,
                    })
                    .select()
                    .single();
                setProfile(newProfile);
                localStorage.setItem('coupchat-guestId', guestId);
                localStorage.setItem('coupchat-guestName', 'New User');
            }
        } catch (e) {
            console.error('Error loading profile:', e);
        }
    };

    // Sign up with email/password
    const signUpWithEmail = useCallback(async (email, password, displayName) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
            // Create profile
            const guestId = `user_${data.user.id.substring(0, 8)}`;
            await supabase.from('profiles').insert({
                auth_id: data.user.id,
                guest_id: guestId,
                username: email,
                display_name: displayName || email.split('@')[0],
                is_guest: false,
            });
        }
        return data;
    }, []);

    // Sign in with email/password
    const signInWithEmail = useCallback(async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }, []);

    // Sign in with Google
    const signInWithGoogle = useCallback(async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
            }
        });
        if (error) throw error;
        return data;
    }, []);

    // Continue as guest
    const continueAsGuest = useCallback(() => {
        localStorage.setItem('coupchat-auth-mode', 'guest');
        setIsGuest(true);
        setAuthReady(true);
        setAuthLoading(false);
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setAuthUser(null);
        setProfile(null);
        setIsGuest(false);
        localStorage.removeItem('coupchat-auth-mode');
        localStorage.removeItem('coupchat-profile');
        localStorage.removeItem('coupchat-guestId');
        localStorage.removeItem('coupchat-guestName');
        setAuthReady(false);
    }, []);

    // Update profile in Supabase
    const updateProfileData = useCallback(async (updates) => {
        if (!authUser) return;
        const { data, error } = await supabase
            .from('profiles')
            .update({
                display_name: updates.name,
                gender: updates.gender,
                age: updates.age,
                avatar_url: updates.avatar,
                bio: updates.bio,
                updated_at: new Date().toISOString(),
            })
            .eq('auth_id', authUser.id)
            .select()
            .single();
        if (!error && data) setProfile(data);
        return { data, error };
    }, [authUser]);

    // Upload avatar image
    const uploadAvatar = useCallback(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${authUser?.id || 'guest'}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // Update profile with new avatar URL
        if (authUser) {
            await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('auth_id', authUser.id);
            setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
        }

        // Also update localStorage
        const existing = JSON.parse(localStorage.getItem('coupchat-profile') || '{}');
        existing.avatar = publicUrl;
        localStorage.setItem('coupchat-profile', JSON.stringify(existing));

        return publicUrl;
    }, [authUser]);

    return (
        <AuthContext.Provider value={{
            authUser, profile, isGuest, authLoading, authReady,
            signUpWithEmail, signInWithEmail, signInWithGoogle,
            continueAsGuest, signOut, updateProfileData, uploadAvatar,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
