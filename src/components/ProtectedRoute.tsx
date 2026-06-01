import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isLoggedIn, login, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            login();
        }
    }, [isLoading, isLoggedIn, login]);

    if (isLoading || !isLoggedIn) {
        return <div style={{ textAlign: 'center', padding: '40px' }}>Redirecting to secure login...</div>;
    }

    return <>{children}</>;
}
