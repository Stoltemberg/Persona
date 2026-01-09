import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);
    const [role, setRole] = useState('user');
    const [planTier, setPlanTier] = useState('free');

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setIsPro(false);
                setRole('user');
                setPlanTier('free');
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setProfile(data);
                if (data.role) setRole(data.role);
                if (data.plan_tier) setPlanTier(data.plan_tier);

                // Keep compatibility with isPro boolean
                if (data.plan_tier === 'complete' || data.plan_tier === 'intermediate') {
                    setIsPro(true);
                }
            }

            // Optional: Still check DB function if needed, but local profile data is faster usually
            // Check subscription status (Legacy check or extra validation)
            const { data: isProData, error: proError } = await supabase.rpc('is_pro');
            if (!proError) {
                // If the RPC says pro, ensure we mark as pro (handling legacy subscriptions)
                if (isProData) setIsPro(true);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }, // Supabase metadata
            },
        });
        if (error) throw error;
        return data;
    };

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };
    // Actually signIn code in previous file:
    /*
    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };
    */
    // I should only replace the top part properly.

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, profile, isPro, role, planTier, signUp, signIn, signOut, loading, fetchProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
