'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEMES = [
    { id: 'cyberpunk', name: 'Neon Cyberpunk', icon: '⚡', color: '#8b5cf6' },
    { id: 'sunset', name: 'Gradient Sunset', icon: '🌅', color: '#f97316' },
    { id: 'cosmic', name: 'Dark Cosmic', icon: '🌌', color: '#3b82f6' },
    { id: 'pastel', name: 'Pastel Vibe', icon: '🌸', color: '#a855f7' },
];

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('cyberpunk');

    useEffect(() => {
        const saved = localStorage.getItem('coupchat-theme');
        if (saved) setTheme(saved);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('coupchat-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
