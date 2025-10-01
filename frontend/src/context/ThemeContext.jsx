import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // 1. Initial State: Check localStorage or default to 'light'
    const [theme, setTheme] = useState(
        localStorage.getItem('theme') || 'light'
    );

    // 2. Effect to apply the class to the document root (HTML tag)
    useEffect(() => {
        const root = window.document.documentElement;
        
        // Remove both classes first
        root.classList.remove('light', 'dark'); 
        
        // Add the current theme class
        root.classList.add(theme);

        // Save preference to local storage
        localStorage.setItem('theme', theme);
    }, [theme]);

    // 3. Toggle Function
    const toggleTheme = () => {
        setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);