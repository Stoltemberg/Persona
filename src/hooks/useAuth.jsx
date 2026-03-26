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
    const [partnerProfile, setPartnerProfile] = useState(null);

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
                setPartnerProfile(null);
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
                let finalData = data;
                
                // Auto-generate nickname and discriminator if not present
                if (!data.nickname || !data.discriminator) {
                    const { data: { user } } = await supabase.auth.getUser();
                    const baseNickname = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || `user${Math.floor(Math.random()*1000)}`;
                    const newNickname = baseNickname.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
                    const newDiscriminator = Math.floor(1000 + Math.random() * 9000).toString();
                    
                    const { data: updated, error: updateErr } = await supabase
                        .from('profiles')
                        .update({ nickname: newNickname, discriminator: newDiscriminator })
                        .eq('id', userId)
                        .select()
                        .single();
                        
                    if (!updateErr && updated) {
                        finalData = updated;
                    }
                }

                setProfile(finalData);
                if (finalData.role) setRole(finalData.role);
                if (finalData.plan_tier) setPlanTier(finalData.plan_tier);

                // Keep compatibility with isPro boolean
                if (finalData.plan_tier === 'complete' || finalData.plan_tier === 'intermediate') {
                    setIsPro(true);
                }

                // Fetch partner profile if exists
                if (finalData.partner_id) {
                    const { data: pData } = await supabase
                        .from('profiles')
                        .select('nickname, discriminator, full_name, avatar_url')
                        .eq('id', finalData.partner_id)
                        .single();
                    if (pData) setPartnerProfile(pData);
                } else {
                    setPartnerProfile(null);
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
        <AuthContext.Provider value={{ user, profile, isPro, role, planTier, partnerProfile, signUp, signIn, signOut, loading, fetchProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
