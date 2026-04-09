'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light'); // default to Light (notebook style)

    useEffect(() => {
        const saved = localStorage.getItem('studyhub-theme');
        if (saved === 'dark') {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (theme === 'light') {
            setTheme('dark');
            localStorage.setItem('studyhub-theme', 'dark');
            document.documentElement.classList.add('dark');
        } else {
            setTheme('light');
            localStorage.setItem('studyhub-theme', 'light');
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
