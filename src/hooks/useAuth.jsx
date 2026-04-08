import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const getPayloadProfileId = (payload, key = 'profile_id') => payload?.new?.[key] || payload?.old?.[key] || null;
const REALTIME_DEDUP_WINDOW_MS = 750;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);
    const [role, setRole] = useState('user');
    const [planTier, setPlanTier] = useState('free');
    const [partnerProfile, setPartnerProfile] = useState(null);
    const [incomingRequest, setIncomingRequest] = useState(null);
    const [outgoingRequest, setOutgoingRequest] = useState(null);
    const [lastPartnerUpdate, setLastPartnerUpdate] = useState(localStorage.getItem('last_partner_update') || null);
    const [lastViewedTransactions, setLastViewedTransactions] = useState(localStorage.getItem('last_viewed_transactions') || null);
    const recentRealtimeDispatches = useRef(new Map());

    const shouldSkipDuplicateRealtime = (signature) => {
        const now = Date.now();
        const lastSeen = recentRealtimeDispatches.current.get(signature) || 0;

        if (now - lastSeen < REALTIME_DEDUP_WINDOW_MS) {
            return true;
        }

        recentRealtimeDispatches.current.set(signature, now);

        if (recentRealtimeDispatches.current.size > 64) {
            for (const [key, timestamp] of recentRealtimeDispatches.current.entries()) {
                if (now - timestamp >= REALTIME_DEDUP_WINDOW_MS) {
                    recentRealtimeDispatches.current.delete(key);
                }
            }
        }

        return false;
    };

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

    useEffect(() => {
        if (!user) return;

        // Ensure partner data is freshly fetched if app is re-focused
        const handleFocus = () => {
            fetchProfile(user.id);
        };
        window.addEventListener('focus', handleFocus);

        const handleRealtimePayload = (payload) => {
            const table = payload?.table;
            const eventType = payload?.eventType;
            const rowId = payload?.new?.id || payload?.old?.id || 'unknown';
            const changeFingerprint = JSON.stringify(payload?.new || payload?.old || {});
            const signature = `${table}:${eventType}:${rowId}:${changeFingerprint}`;

            if (shouldSkipDuplicateRealtime(signature)) {
                return;
            }

            const payloadProfileId = getPayloadProfileId(payload);
            const isRelevantProfile = payloadProfileId === user.id || payloadProfileId === profile?.partner_id;

            if (!isRelevantProfile) {
                return;
            }

            if (payload.eventType === 'INSERT' && payload.table === 'transactions') {
                if (payload.new?.profile_id === profile?.partner_id) {
                    const now = new Date().toISOString();
                    setLastPartnerUpdate(now);
                    localStorage.setItem('last_partner_update', now);
                }
                window.dispatchEvent(new CustomEvent('transaction-inserted', { detail: { id: payload.new?.id } }));
            }

            window.dispatchEvent(new CustomEvent('supabase-sync', { detail: payload }));
        };

        const channel = supabase.channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, handleRealtimePayload)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, handleRealtimePayload)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, handleRealtimePayload)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, handleRealtimePayload)
            .subscribe();

        return () => {
            window.removeEventListener('focus', handleFocus);
            supabase.removeChannel(channel);
        };
    }, [user, profile?.partner_id]);

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
                setIsPro(finalData.plan_tier === 'complete' || finalData.plan_tier === 'intermediate');

                if (finalData.partner_id) {
                    const { data: pData } = await supabase
                        .from('profiles')
                        .select('nickname, discriminator, full_name, avatar_url')
                        .eq('id', finalData.partner_id)
                        .single();
                    if (pData) setPartnerProfile(pData);
                    setIncomingRequest(null);
                    setOutgoingRequest(null);
                } else {
                    setPartnerProfile(null);
                    
                    if (finalData.pending_partner_id) {
                        // Someone invited me
                        const { data: incData } = await supabase
                            .from('profiles')
                            .select('nickname, discriminator, full_name, avatar_url')
                            .eq('id', finalData.pending_partner_id)
                            .maybeSingle();
                        setIncomingRequest(incData || null);
                        setOutgoingRequest(null);
                    } else {
                        setIncomingRequest(null);
                        // I invited someone
                        const { data: outData } = await supabase
                            .from('profiles')
                            .select('nickname, discriminator, full_name, avatar_url')
                            .eq('pending_partner_id', userId)
                            .maybeSingle();
                        setOutgoingRequest(outData || null);
                    }
                }
            }

            const { data: isProData, error: proError } = await supabase.rpc('is_pro');
            if (!proError) {
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

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error during sign out:', error);
        }
    };

    const markTransactionsAsRead = () => {
        const now = new Date().toISOString();
        setLastViewedTransactions(now);
        localStorage.setItem('last_viewed_transactions', now);
    };

    const hasNewPartnerUpdates = lastPartnerUpdate && (!lastViewedTransactions || lastPartnerUpdate > lastViewedTransactions);

    return (
        <AuthContext.Provider value={{ 
            user, profile, isPro, role, planTier, partnerProfile, 
            incomingRequest, outgoingRequest,
            signUp, signIn, signOut, loading, fetchProfile,
            lastPartnerUpdate, lastViewedTransactions, markTransactionsAsRead, hasNewPartnerUpdates
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
