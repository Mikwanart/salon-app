import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { syncUserToBackend } from '../lib/api';

// The namespace used in the Auth0 Action for custom claims
const ROLES_CLAIM = 'https://salon-api/roles';

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
        getIdTokenClaims,
    } = useAuth0();

    const [user, setUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<string[]>([]);

    useEffect(() => {
        const syncUser = async () => {
            if (isAuthenticated && auth0User) {
                const newUser = {
                    name: auth0User.name || 'User',
                    email: auth0User.email || '',
                    avatar: auth0User.picture,
                };
                setUser(newUser);

                // Extract roles from the ID token custom claim
                try {
                    const claims = await getIdTokenClaims();
                    const userRoles: string[] = (claims as any)?.[ROLES_CLAIM] ?? [];
                    setRoles(userRoles);
                } catch (error) {
                    console.error('Failed to fetch ID token claims:', error);
                    setRoles([]);
                }

                // Sync with backend
                try {
                    const token = await getAccessTokenSilently();
                    await syncUserToBackend(newUser, token);
                } catch (error) {
                    console.error('Failed to sync user:', error);
                }
            } else {
                setUser(null);
                setRoles([]);
            }
        };
        if (!isLoading) {
            syncUser();
        }
    }, [isAuthenticated, auth0User, getAccessTokenSilently, getIdTokenClaims, isLoading]);

    const login = () => {
        loginWithRedirect();
    };

    const logout = () => {
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    };

    const isSalonOwner = roles.includes('salon_owner');

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: isAuthenticated, login, logout, isLoading, roles, isSalonOwner }}>
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
