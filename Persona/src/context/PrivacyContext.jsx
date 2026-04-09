import { createContext, useContext, useState, useEffect } from 'react';

const PrivacyContext = createContext();

export function PrivacyProvider({ children }) {
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('persona-privacy');
        if (saved === 'true') setIsPrivacyMode(true);
    }, []);

    const togglePrivacy = () => {
        const newState = !isPrivacyMode;
        setIsPrivacyMode(newState);
        localStorage.setItem('persona-privacy', newState);
    };

    return (
        <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacy }}>
            {children}
        </PrivacyContext.Provider>
    );
}

export const usePrivacy = () => useContext(PrivacyContext);
