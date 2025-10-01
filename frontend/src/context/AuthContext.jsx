// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null); // Will store user details later
    const isLoggedIn = !!token;
    const navigate = useNavigate(); // Assuming you use react-router-dom

    // 💡 Function to save token on successful login/signup
    const login = (jwtToken) => {
        localStorage.setItem('token', jwtToken);
        setToken(jwtToken);
        // Optionally, decode the token to set user details
    };

    // 💡 Function to log out
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    // 💡 Use an effect to check the token on mount
    useEffect(() => {
        if (token) {
            // Future step: Validate token against the backend if needed
            // For now, just setting the token is enough to show logged in status
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{ isLoggedIn, token, user, login, logout, setToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);