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
    login: (options?: any) => void;
    logout: () => void;
    isLoading: boolean;
    roles: string[];
    isSalonOwner: boolean;
    isAdmin: boolean;
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
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSyncing, setIsSyncing] = useState(true);
    const [isEmailVerified, setIsEmailVerified] = useState(true);

    useEffect(() => {
        const syncUser = async () => {
            if (isAuthenticated && auth0User) {
                const emailVerified = auth0User.email_verified !== false;
                setIsEmailVerified(emailVerified);

                const newUser = {
                    name: auth0User.name || auth0User.email || 'User',
                    email: auth0User.email || '',
                    avatar: auth0User.picture,
                };
                setUser(newUser);

                // Sync with backend
                try {
                    const token = await getAccessTokenSilently().catch(err => {
                        console.warn('Could not retrieve access token silently:', err);
                        return null;
                    });
                    
                    if (token) {
                        const syncedUser = await syncUserToBackend(newUser, token).catch(err => {
                            console.warn('Backend user sync failed:', err);
                            return null;
                        });
                        if (syncedUser?.role) {
                            const rawRole = String(syncedUser.role);
                            const upperRole = rawRole.toUpperCase();
                            const lowerRole = rawRole.toLowerCase();
                            setRoles([rawRole, upperRole, lowerRole]);
                            setIsSalonOwner(upperRole === 'SALON_OWNER');
                            setIsAdmin(upperRole === 'ADMIN');
                        }
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
                setIsAdmin(false);
                setIsSyncing(false);
            }
        };
        if (!isLoading) {
            syncUser();
        }
    }, [isAuthenticated, auth0User, getAccessTokenSilently, isLoading]);

    const login = (options?: any) => {
        loginWithRedirect(options);
    };

    const logout = () => {
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: isAuthenticated, login, logout, isLoading: isLoading || isSyncing, roles, isSalonOwner, isAdmin, isEmailVerified }}>
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
