import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { syncUserToBackend } from '../lib/api';

interface User {
    name: string;
    email: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    login: () => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const {
        user: auth0User,
        isAuthenticated,
        isLoading,
        loginWithRedirect,
        logout: auth0Logout,
        getAccessTokenSilently,
    } = useAuth0();

    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const syncUser = async () => {
            if (isAuthenticated && auth0User) {
                const newUser = {
                    name: auth0User.name || 'User',
                    email: auth0User.email || '',
                    avatar: auth0User.picture,
                };
                setUser(newUser);

                // Sync with backend
                try {
                    const token = await getAccessTokenSilently();
                    await syncUserToBackend(newUser, token);
                } catch (error) {
                    console.error('Failed to sync user:', error);
                }
            } else {
                setUser(null);
            }
        };
        if (!isLoading) {
            syncUser();
        }
    }, [isAuthenticated, auth0User, getAccessTokenSilently, isLoading]);

    const login = () => {
        loginWithRedirect();
    };

    const logout = () => {
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: isAuthenticated, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
