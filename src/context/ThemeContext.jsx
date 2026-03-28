import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const lightVars = {
    '--bg-deep': '#ffffff',
    '--bg-card': '#f8f8f8',
    '--color-brand': '#000000',
    '--color-accent': '#e5e5e5',
    '--glass-bg': '#ffffff',
    '--glass-border': '#e5e5e5',
    '--glass-border-highlight': '#d1d1d1',
    '--glass-shadow': '0 2px 10px rgba(0, 0, 0, 0.05)',
    '--glass-panel-bg': '#ffffff',
    '--text-main': '#000000',
    '--text-secondary': 'rgba(0, 0, 0, 0.6)',
    '--text-muted': 'rgba(0, 0, 0, 0.4)',
    '--input-bg': '#f5f5f5',
};

const darkVars = {
    '--bg-deep': '#050505',
    '--bg-card': '#0A0A0A',
    '--color-brand': '#D4AF37',
    '--color-accent': '#141414',
    '--color-success': '#285E4D',
    '--color-danger': '#8B2C2C',
    '--color-warning': '#B07D35',
    '--color-info': '#3E5A74',
    '--color-purple': '#5A445D',
    '--glass-bg': 'rgba(10, 10, 10, 0.6)',
    '--glass-border': 'rgba(212, 175, 55, 0.15)',
    '--glass-border-highlight': 'rgba(212, 175, 55, 0.3)',
    '--glass-shadow': '0 4px 20px rgba(0, 0, 0, 0.4)',
    '--glass-panel-bg': '#0A0A0A',
    '--text-main': '#F3EFEA',
    '--text-secondary': '#9E988F',
    '--text-muted': '#5C5853',
    '--input-bg': 'rgba(255, 255, 255, 0.03)',
};

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

        let resolvedTheme = t;
        if (t === 'system') {
            resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        root.classList.add(resolvedTheme);

        // Apply CSS variables directly via JavaScript
        const vars = resolvedTheme === 'light' ? lightVars : darkVars;
        Object.entries(vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
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

