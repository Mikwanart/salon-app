import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { syncUserToBackend } from '../lib/api';
import RolePickerModal from '../components/RolePickerModal';
import type { LoginMode } from '../components/RolePickerModal';

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
    /** Opens the role-picker modal (login mode) before redirecting to Auth0 */
    openRolePicker: () => void;
    /** Opens the role-picker modal in sign-up mode before redirecting to Auth0 */
    openSignupPicker: () => void;
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
    const [rolePickerOpen, setRolePickerOpen] = useState(false);
    const [rolePickerMode, setRolePickerMode] = useState<LoginMode>('login');

    useEffect(() => {
        const syncUser = async () => {
            if (isAuthenticated && auth0User) {
                const emailVerified = auth0User.email_verified !== false;
                setIsEmailVerified(emailVerified);

                // Auth0 sets name = email for email/password accounts.
                // Prefer given_name + family_name, then name if it differs from email,
                // otherwise derive a friendly name from the email local-part.
                const email = auth0User.email || '';
                let displayName: string;
                if (auth0User.given_name || auth0User.family_name) {
                    displayName = [auth0User.given_name, auth0User.family_name].filter(Boolean).join(' ');
                } else if (auth0User.name && auth0User.name !== email) {
                    displayName = auth0User.name;
                } else {
                    // Derive from email local-part: "john.doe_123" → "John Doe"
                    const localPart = email.split('@')[0] || 'User';
                    displayName = localPart
                        .replace(/[._\-]+/g, ' ')
                        .replace(/\d+$/, '')
                        .trim()
                        .split(' ')
                        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                        .join(' ') || 'User';
                }

                const newUser = {
                    name: displayName,
                    email,
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

    const openRolePicker = () => {
        setRolePickerMode('login');
        setRolePickerOpen(true);
    };

    const openSignupPicker = () => {
        setRolePickerMode('signup');
        setRolePickerOpen(true);
    };

    const handleRoleConfirm = (role: string, mode: LoginMode) => {
        // Persist intended role so the backend sync / onboarding can use it
        localStorage.setItem('intended_role', role);
        setRolePickerOpen(false);
        const screenHint = mode === 'signup' ? 'signup' : 'login';
        loginWithRedirect({
            authorizationParams: { screen_hint: screenHint },
            appState: { intended_role: role },
        });
    };

    const logout = () => {
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: isAuthenticated, login, openRolePicker, openSignupPicker, logout, isLoading: isLoading || isSyncing, roles, isSalonOwner, isAdmin, isEmailVerified }}>
            {children}
            <RolePickerModal
                isOpen={rolePickerOpen}
                mode={rolePickerMode}
                onClose={() => setRolePickerOpen(false)}
                onConfirm={handleRoleConfirm}
            />
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
