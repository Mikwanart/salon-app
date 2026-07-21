import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { syncUserToBackend } from '../lib/api';

// Roles are now handled by the backend user sync

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
    roles: string[];
    isSalonOwner: boolean;
    isEmailVerified: boolean;
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
    const [roles, setRoles] = useState<string[]>([]);
    const [isSalonOwner, setIsSalonOwner] = useState(false);
    const [isSyncing, setIsSyncing] = useState(true);
    const [isEmailVerified, setIsEmailVerified] = useState(true);

    useEffect(() => {
        const syncUser = async () => {
            if (isAuthenticated && auth0User) {
                // Enforce email verification if email exists
                if (auth0User.email && auth0User.email_verified === false) {
                    setIsEmailVerified(false);
                    setUser(null);
                    setRoles([]);
                    setIsSalonOwner(false);
                    setIsSyncing(false);
                    return;
                }
                
                setIsEmailVerified(true);
                const newUser = {
                    name: auth0User.name || 'User',
                    email: auth0User.email || '',
                    avatar: auth0User.picture,
                };
                setUser(newUser);

                // Sync with backend
                try {
                    const token = await getAccessTokenSilently();
                    const syncedUser = await syncUserToBackend(newUser, token);
                    if (syncedUser?.role) {
                        setRoles([syncedUser.role]);
                        setIsSalonOwner(syncedUser.role === 'SALON_OWNER');
                    }
                } catch (error) {
                    console.error('Failed to sync user:', error);
                } finally {
                    setIsSyncing(false);
                }
            } else {
                setUser(null);
                setRoles([]);
                setIsSalonOwner(false);
                setIsSyncing(false);
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
        <AuthContext.Provider value={{ user, isLoggedIn: isAuthenticated, login, logout, isLoading: isLoading || isSyncing, roles, isSalonOwner, isEmailVerified }}>
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
