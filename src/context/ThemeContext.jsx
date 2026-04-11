import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const lightVars = {
    '--bg-deep': '#F2F2F7',
    '--bg-card': '#FFFFFF',
    '--color-brand': '#007AFF',
    '--color-accent': '#E9F2FF',
    '--glass-bg': 'rgba(255, 255, 255, 0.78)',
    '--glass-border': 'rgba(60, 60, 67, 0.06)',
    '--glass-border-highlight': 'rgba(60, 60, 67, 0.12)',
    '--glass-shadow': '0 4px 18px rgba(0, 0, 0, 0.06)',
    '--glass-panel-bg': '#FFFFFF',
    '--text-main': '#000000',
    '--text-secondary': 'rgba(60, 60, 67, 0.6)',
    '--text-muted': 'rgba(60, 60, 67, 0.3)',
    '--btn-primary-bg': '#007AFF',
    '--btn-primary-text': '#FFFFFF',
    '--btn-primary-hover-bg': '#006AE0',
    '--btn-ghost-bg': 'rgba(0, 0, 0, 0.04)',
    '--btn-ghost-bg-hover': 'rgba(0, 0, 0, 0.08)',
    '--btn-ghost-text': '#111111',
    '--input-bg': 'rgba(118, 118, 128, 0.12)',
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
    '--btn-primary-bg': '#D4AF37',
    '--btn-primary-text': '#0A0A0A',
    '--btn-primary-hover-bg': 'color-mix(in srgb, #D4AF37 88%, white 12%)',
    '--btn-ghost-bg': 'rgba(255, 255, 255, 0.02)',
    '--btn-ghost-bg-hover': 'rgba(212, 175, 55, 0.08)',
    '--btn-ghost-text': '#F3EFEA',
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

