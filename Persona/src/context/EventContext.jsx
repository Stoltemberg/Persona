import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const EventContext = createContext();

export function EventProvider({ children }) {
    const { user } = useAuth();
    const [isEventMode, setIsEventMode] = useState(false);
    const [activeEvent, setActiveEvent] = useState(null);
    const [events, setEvents] = useState([]);

    // For MVP, "Events" are just Wallets with a specific type or metadata, OR we simulate it.
    // Let's assume we use a specific Wallet as an Event container for now to avoid schema changes.
    // Or we create a local state structure if we can't persist easily yet.
    // "Travel Mode" -> Filters everything to show ONLY transactions from "Travel Wallet".

    // Better: Allow user to select a "Context Wallet".
    // Default: All Wallets.
    // Event Mode: Only "Trip to Disney" Wallet.

    useEffect(() => {
        const storedMode = localStorage.getItem('persona_event_mode');
        if (storedMode === 'true') setIsEventMode(true);

        const storedEventId = localStorage.getItem('persona_active_event_id');
        if (storedEventId) setActiveEvent(storedEventId);
    }, []);

    const toggleEventMode = (enable) => {
        setIsEventMode(enable);
        localStorage.setItem('persona_event_mode', enable);
    };

    const setEvent = (eventId) => {
        setActiveEvent(eventId);
        localStorage.setItem('persona_active_event_id', eventId);
    };

    return (
        <EventContext.Provider value={{ isEventMode, toggleEventMode, activeEvent, setEvent }}>
            {children}
        </EventContext.Provider>
    );
}

export function useEvent() {
    return useContext(EventContext);
}
