// Login_react/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // user 里至少有 { id, userName, email }
    const [user, setUser] = useState(null);

    // 启动时从 localStorage 恢复会话
    useEffect(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.id) setUser(parsed);
            }
        } catch { }
    }, []);

    // 统一入口：登录成功后调用
    const login = (userData) => {
        // 包含 id
        if (!userData?.id) {
            console.warn('AuthContext.login: userData.id is required');
            return;
        }
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userId', userData.id);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        setUser(null);
    };

    // 便捷工具随处可拿到 userId
    const userId = user?.id ?? localStorage.getItem('userId') ?? null;
    const isAuthenticated = !!userId;

    const value = useMemo(() => ({
        user,
        userId,
        isAuthenticated,
        login,
        logout
    }), [user, userId, isAuthenticated]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
