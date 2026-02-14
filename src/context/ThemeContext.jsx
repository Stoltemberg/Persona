import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark'); // 'dark', 'light', 'system'

    useEffect(() => {
        // Load saved theme
        const saved = localStorage.getItem('persona-theme') || 'dark';
        setTheme(saved);
        applyTheme(saved);
    }, []);

    const applyTheme = (t) => {
        const root = window.document.documentElement;
        // Remove all theme classes first
        root.classList.remove('dark', 'light');

        if (t === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(t);
        }
    };

    const changeTheme = (t) => {
        setTheme(t);
        localStorage.setItem('persona-theme', t);
        applyTheme(t);
    };

    return (
        <ThemeContext.Provider value={{ theme, changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
